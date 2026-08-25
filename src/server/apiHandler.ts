import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import { AppNotification, JobApplication, ApplicationStatus } from '../types';
import { formatToIST } from '../utils/istTime';
import { INITIAL_APPLICATIONS } from '../data/mockJobs';

dotenv.config();

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const oauth2Client = new OAuth2Client(googleClientId, googleClientSecret);

interface StoredServerUser {
  id: string;
  role: 'candidate' | 'seeker' | 'recruiter' | 'admin';
  name: string;
  email: string;
  avatarUrl?: string;
  avatar_url?: string;
  google_id?: string;
  title?: string;
  company?: string;
  auth_provider?: string;
  email_verified?: boolean;
}

let storedUsers: StoredServerUser[] = [
  {
    id: 'admin_user',
    role: 'admin',
    name: 'David Vance',
    email: 'admin@gmail.com',
    title: 'Super Admin & Platform Director',
    auth_provider: 'local',
  },
  {
    id: 'recruiter_user',
    role: 'recruiter',
    name: 'Sarah Jenkins',
    email: 'recruiter@gmail.com',
    company: 'Stripeflow Payments',
    title: 'Lead Technical Recruiter',
    auth_provider: 'local',
  },
  {
    id: 'candidate_user',
    role: 'candidate',
    name: 'Alex Morgan',
    email: 'candidate@gmail.com',
    title: 'Senior CS Candidate (IIT Bombay)',
    auth_provider: 'local',
  },
];

// In-memory data store on server side for real sync across roles
let storedNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    senderRole: 'admin',
    senderName: 'David Vance',
    senderCompany: 'HireHub Platform Admin',
    targetType: 'all',
    title: 'Platform Maintenance & IST Window Updates',
    message: 'Welcome to HireHub! Please ensure your academic CGPA and skills profile are up to date. Verified campus recruitment drives are now active with Indian Standard Time application deadlines.',
    sentAt: '24 Aug 2026, 09:30 AM IST',
    createdAtMs: Date.now() - 1000 * 60 * 60 * 12,
    readBy: [],
  },
  {
    id: 'notif-2',
    senderRole: 'recruiter',
    senderName: 'Sarah Jenkins',
    senderCompany: 'Stripeflow Payments',
    targetType: 'specific',
    targetCandidateEmails: ['candidate@gmail.com', 'alex.morgan@iitb.ac.in', 'alex.morgan@berkeley.edu'],
    targetCandidateNames: ['Alex Morgan'],
    jobTitle: 'Senior Frontend Engineer (React & TypeScript)',
    jobId: 'job-1',
    title: 'Interview Stage Advanced: Stripeflow Payments',
    message: 'Hello Alex, thank you for applying to the Senior Frontend Engineer position. Your profile has advanced to Round 1 Technical Assessment. Please review the pipeline details in your tracker.',
    sentAt: '24 Aug 2026, 11:15 AM IST',
    createdAtMs: Date.now() - 1000 * 60 * 60 * 4,
    readBy: [],
  },
];

let storedApplications: JobApplication[] = [...INITIAL_APPLICATIONS];

export const getStoredNotifications = () => storedNotifications;
export const getStoredApplications = () => storedApplications;
export const getStoredUsers = () => storedUsers;

// Helper: Verify Google OAuth ID Token via google-auth-library OAuth2Client
async function verifyGoogleIdToken(token: string): Promise<{
  valid: boolean;
  payload?: any;
  error?: string;
}> {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return { valid: false, error: 'Missing or empty OAuth credential token.' };
  }

  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token.trim(),
      audience: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload) {
      return { valid: false, error: 'No payload returned from Google ID token verification.' };
    }
    if (!payload.email) {
      return { valid: false, error: 'Google account has no associated email address.' };
    }
    if (!payload.email_verified) {
      return { valid: false, error: 'Google email address is not verified.' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    console.error('Google OAuth2Client.verifyIdToken error:', err?.message || err);
    return {
      valid: false,
      error: err?.message || 'Google token verification failed. Invalid or expired token.',
    };
  }
}

export async function handleApiRequest(
  url: string,
  method: string,
  bodyText: string
): Promise<{ status: number; data: any }> {
  const urlObj = new URL(url, 'http://localhost:3000');
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  let body: any = {};
  if (bodyText) {
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = {};
    }
  }

  // 0. POST /auth/google or POST /api/auth/google (Real Google OAuth Verification)
  if ((pathname === '/api/auth/google' || pathname === '/auth/google') && method === 'POST') {
    const rawToken = body.credential || body.idToken || body.id_token || body.token;

    if (!rawToken) {
      return {
        status: 400,
        data: {
          success: false,
          error: 'Missing Google OAuth credential token. Please provide "credential" or "idToken".',
        },
      };
    }

    // Verify Google ID token against Google servers using OAuth2Client
    const verification = await verifyGoogleIdToken(rawToken);

    if (!verification.valid || !verification.payload) {
      return {
        status: 401,
        data: {
          success: false,
          error: verification.error || 'Google token verification failed. Unauthorized.',
        },
      };
    }

    const { email, email_verified, name, picture, sub, given_name, family_name } = verification.payload;

    if (!email_verified) {
      return {
        status: 401,
        data: {
          success: false,
          error: 'Google email address is not verified.',
        },
      };
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up user by verified email
    let user = storedUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (user) {
      // Existing user found - log into existing account
      if (picture && !user.avatar_url && !user.avatarUrl) {
        user.avatar_url = picture;
        user.avatarUrl = picture;
      }
      if (sub && !user.google_id) {
        user.google_id = sub;
      }
    } else {
      // Create new candidate account if none exists
      const displayName =
        name || `${given_name || ''} ${family_name || ''}`.trim() || normalizedEmail.split('@')[0];
      user = {
        id: `cand_${sub || Date.now()}`,
        role: 'candidate',
        name: displayName,
        email: normalizedEmail,
        avatar_url: picture,
        avatarUrl: picture,
        google_id: sub,
        title: 'Candidate',
        auth_provider: 'google',
        email_verified: true,
      };
      storedUsers.push(user);
    }

    // Issue the app's normal session token
    const sessionToken = `hh_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const userPayload = {
      id: user.id,
      role: user.role === 'seeker' ? 'candidate' : user.role,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url || user.avatarUrl,
      avatarUrl: user.avatar_url || user.avatarUrl,
      title:
        user.title ||
        (user.role === 'admin'
          ? 'Super Admin & Platform Director'
          : user.role === 'recruiter'
          ? 'Lead Technical Recruiter'
          : 'Candidate'),
      company: user.company,
      auth_provider: user.auth_provider || 'google',
      email_verified: true,
    };

    return {
      status: 200,
      data: {
        success: true,
        message: 'Google authentication verified successfully.',
        token: sessionToken,
        user: userPayload,
      },
    };
  }

  // 0b. POST /auth/login or POST /api/auth/login
  if ((pathname === '/api/auth/login' || pathname === '/auth/login') && method === 'POST') {
    const { email } = body;
    const normalizedEmail = (email || '').toLowerCase().trim();
    const user = storedUsers.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return { status: 401, data: { success: false, error: 'Invalid credentials.' } };
    }

    const sessionToken = `hh_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    return {
      status: 200,
      data: {
        success: true,
        message: 'Login successful.',
        token: sessionToken,
        user: {
          id: user.id,
          role: user.role === 'seeker' ? 'candidate' : user.role,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url || user.avatarUrl,
          avatarUrl: user.avatar_url || user.avatarUrl,
          title: user.title,
          company: user.company,
          auth_provider: user.auth_provider,
        },
      },
    };
  }

  // 0c. POST /auth/signup or POST /api/auth/signup
  if ((pathname === '/api/auth/signup' || pathname === '/auth/signup') && method === 'POST') {
    const { name, email, role } = body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    if (role && role !== 'candidate' && role !== 'seeker') {
      return { status: 400, data: { success: false, error: 'Public signup is restricted to candidates' } };
    }

    let existing = storedUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return { status: 409, data: { success: false, error: 'Email already registered' } };
    }

    const newUser: StoredServerUser = {
      id: `cand_${Date.now()}`,
      role: 'candidate',
      name: name || 'Candidate',
      email: normalizedEmail,
      title: 'Candidate',
      auth_provider: 'local',
      email_verified: true,
    };
    storedUsers.push(newUser);

    const sessionToken = `hh_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    return {
      status: 201,
      data: {
        success: true,
        message: 'User created successfully',
        token: sessionToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          auth_provider: newUser.auth_provider,
        },
      },
    };
  }

  // 1. POST /api/notifications/send
  if (pathname === '/api/notifications/send' && method === 'POST') {
    const {
      senderRole,
      senderName,
      senderCompany,
      targetType,
      targetCandidateEmails,
      targetCandidateNames,
      message,
      title,
      jobTitle,
      jobId,
    } = body;

    if (!message || !message.trim()) {
      return { status: 400, data: { success: false, error: 'Message content is required.' } };
    }

    const newNotification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderRole: senderRole || 'admin',
      senderName: senderName || 'Platform Administrator',
      senderCompany: senderCompany || (senderRole === 'admin' ? 'HireHub Admin' : 'Recruitment Partner'),
      targetType: targetType || 'all',
      targetCandidateEmails: Array.isArray(targetCandidateEmails) ? targetCandidateEmails : [],
      targetCandidateNames: Array.isArray(targetCandidateNames) ? targetCandidateNames : [],
      message: message.trim(),
      title: title || (jobTitle ? `Update for ${jobTitle}` : `Notice from ${senderCompany || senderName}`),
      jobTitle,
      jobId,
      sentAt: formatToIST(new Date()),
      createdAtMs: Date.now(),
      readBy: [],
    };

    storedNotifications = [newNotification, ...storedNotifications];
    return {
      status: 200,
      data: {
        success: true,
        message: 'Notification dispatched successfully to target candidate(s).',
        notification: newNotification,
      },
    };
  }

  // 2. GET /api/notifications
  if (pathname === '/api/notifications' && method === 'GET') {
    const candidateEmail = searchParams.get('candidateEmail')?.toLowerCase();
    const candidateName = searchParams.get('candidateName')?.toLowerCase();

    if (!candidateEmail && !candidateName) {
      return { status: 200, data: { success: true, notifications: storedNotifications } };
    }

    const filtered = storedNotifications.filter((n) => {
      if (n.targetType === 'all') return true;
      if (
        candidateEmail &&
        n.targetCandidateEmails?.some((e) => e.toLowerCase() === candidateEmail)
      ) {
        return true;
      }
      if (
        candidateName &&
        n.targetCandidateNames?.some((name) => name.toLowerCase() === candidateName)
      ) {
        return true;
      }
      return false;
    });

    return { status: 200, data: { success: true, notifications: filtered } };
  }

  // 3. POST /api/notifications/:id/read
  const readMatch = pathname.match(/^\/api\/notifications\/([^\/]+)\/read$/);
  if (readMatch && method === 'POST') {
    const notifId = readMatch[1];
    const candidateIdentifier = (body.candidateEmail || body.candidateId || 'candidate_user').toLowerCase();

    storedNotifications = storedNotifications.map((n) => {
      if (n.id === notifId) {
        if (!n.readBy.includes(candidateIdentifier)) {
          return { ...n, readBy: [...n.readBy, candidateIdentifier] };
        }
      }
      return n;
    });

    return { status: 200, data: { success: true, message: 'Notification marked as read.' } };
  }

  // 4. POST /api/notifications/mark-all-read
  if (pathname === '/api/notifications/mark-all-read' && method === 'POST') {
    const candidateIdentifier = (body.candidateEmail || body.candidateId || 'candidate_user').toLowerCase();

    storedNotifications = storedNotifications.map((n) => {
      if (!n.readBy.includes(candidateIdentifier)) {
        return { ...n, readBy: [...n.readBy, candidateIdentifier] };
      }
      return n;
    });

    return { status: 200, data: { success: true, message: 'All notifications marked as read.' } };
  }

  // 5. GET /api/candidate/stats
  if (pathname === '/api/candidate/stats' && method === 'GET') {
    const candidateEmail = (searchParams.get('email') || 'candidate@gmail.com').toLowerCase();
    const candidateName = searchParams.get('name')?.toLowerCase();

    const candidateApps = storedApplications.filter((app) => {
      const emailMatch =
        app.candidateEmail &&
        (app.candidateEmail.toLowerCase() === candidateEmail ||
          candidateEmail.includes(app.candidateEmail.toLowerCase()) ||
          app.candidateEmail.toLowerCase().includes('candidate@gmail.com') ||
          app.candidateEmail.toLowerCase().includes('alex.morgan'));
      const nameMatch =
        candidateName && app.candidateName && app.candidateName.toLowerCase().includes(candidateName);
      return emailMatch || nameMatch || true; // Fallback to user applications
    });

    const totalApplied = candidateApps.length;
    const interviewing = candidateApps.filter((a) => a.status === 'Interviewing').length;
    const offered = candidateApps.filter((a) => a.status === 'Offered').length;
    const rejected = candidateApps.filter((a) => a.status === 'Rejected').length;

    return {
      status: 200,
      data: {
        success: true,
        stats: {
          totalApplied,
          interviewing,
          offered,
          rejected,
        },
        applications: candidateApps,
      },
    };
  }

  // 6. GET /api/applications
  if (pathname === '/api/applications' && method === 'GET') {
    return { status: 200, data: { success: true, applications: storedApplications } };
  }

  // 7. POST /api/applications
  if (pathname === '/api/applications' && method === 'POST') {
    const newApp: JobApplication = body;
    if (!newApp.id) {
      newApp.id = `app-${Date.now()}`;
    }
    storedApplications = [newApp, ...storedApplications.filter((a) => a.id !== newApp.id)];
    return { status: 200, data: { success: true, application: newApp } };
  }

  // 8. PUT /api/applications/:id/status
  const statusMatch = pathname.match(/^\/api\/applications\/([^\/]+)\/status$/);
  if (statusMatch && method === 'PUT') {
    const appId = statusMatch[1];
    const newStatus: ApplicationStatus = body.status;
    const currentIst = formatToIST(new Date());

    storedApplications = storedApplications.map((app) =>
      app.id === appId
        ? { ...app, status: newStatus, lastUpdatedDate: currentIst, daysInactive: 0 }
        : app
    );

    // Auto-generate candidate notification if status changed to Offered or Interviewing or Rejected
    const matchedApp = storedApplications.find((a) => a.id === appId);
    if (matchedApp) {
      let statusNotice = '';
      if (newStatus === 'Offered') {
        statusNotice = `Congratulations! You have received an employment offer for ${matchedApp.role} at ${matchedApp.company}!`;
      } else if (newStatus === 'Interviewing') {
        statusNotice = `Your application for ${matchedApp.role} at ${matchedApp.company} has advanced to the Interviewing stage.`;
      } else if (newStatus === 'Rejected') {
        statusNotice = `Application status update: ${matchedApp.role} at ${matchedApp.company} has been archived.`;
      }

      if (statusNotice) {
        const autoNotif: AppNotification = {
          id: `notif-${Date.now()}`,
          senderRole: 'recruiter',
          senderName: 'Talent Acquisition Team',
          senderCompany: matchedApp.company,
          targetType: 'specific',
          targetCandidateEmails: matchedApp.candidateEmail ? [matchedApp.candidateEmail] : ['candidate@gmail.com'],
          targetCandidateNames: matchedApp.candidateName ? [matchedApp.candidateName] : ['Alex Morgan'],
          title: `Application Status Update: ${matchedApp.role}`,
          message: statusNotice,
          jobTitle: matchedApp.role,
          jobId: matchedApp.jobId,
          sentAt: currentIst,
          createdAtMs: Date.now(),
          readBy: [],
        };
        storedNotifications = [autoNotif, ...storedNotifications];
      }
    }

    return {
      status: 200,
      data: {
        success: true,
        message: `Application status updated to "${newStatus}".`,
        applications: storedApplications,
      },
    };
  }

  // 9. DELETE /api/applications/:id
  const deleteMatch = pathname.match(/^\/api\/applications\/([^\/]+)$/);
  if (deleteMatch && method === 'DELETE') {
    const appId = deleteMatch[1];
    storedApplications = storedApplications.filter((a) => a.id !== appId);
    return { status: 200, data: { success: true, message: 'Application deleted.' } };
  }

  // 10. GET /api/candidates
  if (pathname === '/api/candidates' && method === 'GET') {
    const company = searchParams.get('company')?.toLowerCase();
    
    // Extract unique candidate options from applications and registered candidate profiles
    const candidatesMap = new Map<string, any>();

    storedApplications.forEach((app) => {
      const email = app.candidateEmail || 'candidate@gmail.com';
      if (!candidatesMap.has(email)) {
        candidatesMap.set(email, {
          id: app.id,
          name: app.candidateName || 'Alex Morgan',
          email: email,
          college: app.candidateCollege || 'IIT Bombay',
          cgpa: app.candidateCgpa ?? 8.4,
          roleApplied: app.role,
          companyApplied: app.company,
        });
      }
    });

    // Also include standard registered candidate
    if (!candidatesMap.has('candidate@gmail.com')) {
      candidatesMap.set('candidate@gmail.com', {
        id: 'candidate_user',
        name: 'Alex Morgan',
        email: 'candidate@gmail.com',
        college: 'IIT Bombay',
        cgpa: 8.4,
        roleApplied: 'Senior Frontend Engineer',
        companyApplied: 'Stripeflow Payments',
      });
    }

    // Additional mock candidates for rich multi-select
    const extraCandidates = [
      {
        id: 'cand-samantha',
        name: 'Samantha Zhao',
        email: 'samantha.z@pilani.bits-pilani.ac.in',
        college: 'BITS Pilani',
        cgpa: 8.8,
        roleApplied: 'Fullstack Systems Engineer',
        companyApplied: 'Stripeflow Payments',
      },
      {
        id: 'cand-rohan',
        name: 'Rohan Deshmukh',
        email: 'rohan.d@iitd.ac.in',
        college: 'IIT Delhi',
        cgpa: 9.1,
        roleApplied: 'Distributed Infrastructure Lead',
        companyApplied: 'Datamesh Cloud',
      },
      {
        id: 'cand-elena',
        name: 'Elena Rostova',
        email: 'elena.rostova@berkeley.edu',
        college: 'UC Berkeley',
        cgpa: 8.6,
        roleApplied: 'Senior Frontend Engineer',
        companyApplied: 'Stripeflow Payments',
      },
      {
        id: 'cand-priya',
        name: 'Priya Sharma',
        email: 'priya.s@iitk.ac.in',
        college: 'IIT Kanpur',
        cgpa: 8.9,
        roleApplied: 'AI Research Engineer',
        companyApplied: 'Nexus AI Labs',
      },
    ];

    extraCandidates.forEach((c) => {
      if (!candidatesMap.has(c.email)) {
        candidatesMap.set(c.email, c);
      }
    });

    let candidatesList = Array.from(candidatesMap.values());

    // If company specified (recruiter mode), filter to only candidates who applied to this recruiter's company
    if (company) {
      candidatesList = candidatesList.filter(
        (c) =>
          c.companyApplied &&
          (c.companyApplied.toLowerCase().includes(company) || company.includes(c.companyApplied.toLowerCase()))
      );
    }

    return { status: 200, data: { success: true, candidates: candidatesList } };
  }

  return { status: 404, data: { error: 'API route not found' } };
}
