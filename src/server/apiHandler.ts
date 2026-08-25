import { AppNotification, JobApplication, ApplicationStatus } from '../types';
import { formatToIST } from '../utils/istTime';
import { INITIAL_APPLICATIONS } from '../data/mockJobs';

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

// Helper: Verify Google OAuth Token (ID Token or Access Token) via Google's official endpoints
async function verifyGoogleToken(token: string): Promise<{
  valid: boolean;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  error?: string;
}> {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return { valid: false, error: 'Missing or empty OAuth token.' };
  }

  const trimmedToken = token.trim();
  const isJwt = trimmedToken.split('.').length === 3;

  // 1. Try Google TokenInfo endpoint (for ID Tokens)
  if (isJwt) {
    try {
      const googleRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(trimmedToken)}`
      );
      if (googleRes.ok) {
        const data: any = await googleRes.json();
        if (data.email) {
          const isVerified = data.email_verified === 'true' || data.email_verified === true;
          if (!isVerified) {
            return { valid: false, error: 'Google email address is not verified.' };
          }
          return {
            valid: true,
            sub: data.sub || data.user_id,
            email: data.email,
            email_verified: true,
            name: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim() || data.email.split('@')[0],
            picture: data.picture,
          };
        }
      } else {
        const errJson: any = await googleRes.json().catch(() => ({}));
        const errMsg = errJson.error_description || errJson.error || 'Token rejected by Google identity service.';
        return { valid: false, error: errMsg };
      }
    } catch (err: any) {
      console.warn('Google tokeninfo fetch error:', err);
    }
  }

  // 2. Try Google UserInfo endpoint with Bearer token (for Access Tokens)
  try {
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${trimmedToken}` },
    });
    if (googleRes.ok) {
      const data: any = await googleRes.json();
      if (data.email) {
        const isVerified = data.email_verified === true || data.email_verified === 'true';
        if (!isVerified) {
          return { valid: false, error: 'Google email address is not verified.' };
        }
        return {
          valid: true,
          sub: data.sub,
          email: data.email,
          email_verified: true,
          name: data.name || `${data.given_name || ''} ${data.family_name || ''}`.trim() || data.email.split('@')[0],
          picture: data.picture,
        };
      }
    } else {
      // 3. Fallback: try access_token on tokeninfo
      const tokenInfoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(trimmedToken)}`
      );
      if (tokenInfoRes.ok) {
        const data: any = await tokenInfoRes.json();
        if (data.email) {
          return {
            valid: true,
            sub: data.sub || data.user_id,
            email: data.email,
            email_verified: data.email_verified === 'true' || data.email_verified === true,
            name: data.email.split('@')[0],
          };
        }
      }
      const errJson: any = await googleRes.json().catch(() => ({}));
      const errMsg = errJson.error_description || errJson.error || 'Access token rejected by Google.';
      return { valid: false, error: errMsg };
    }
  } catch (err: any) {
    console.warn('Google userinfo fetch error:', err);
  }

  return { valid: false, error: 'Google OAuth verification failed. Invalid or expired token.' };
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

  // 0. POST /api/auth/google or POST /auth/google (Real Google Token Verification)
  if ((pathname === '/api/auth/google' || pathname === '/auth/google') && method === 'POST') {
    const rawToken = body.token || body.credential || body.access_token || body.id_token;
    const requestedRole = (body.role as 'seeker' | 'recruiter' | 'admin') || 'seeker';

    if (!rawToken) {
      return {
        status: 400,
        data: {
          success: false,
          error: 'Missing Google OAuth token. Please complete the Google sign-in dialog.',
        },
      };
    }

    // Verify token directly against Google identity server
    const verification = await verifyGoogleToken(rawToken);

    if (!verification.valid || !verification.email) {
      return {
        status: 401,
        data: {
          success: false,
          error: verification.error || 'Google token verification failed. Unauthorized.',
        },
      };
    }

    // Create session payload with real Google details verified by backend
    const sessionToken = `hh_session_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const verifiedUser = {
      id: `google_${verification.sub || Date.now()}`,
      role: requestedRole,
      name: verification.name || 'Candidate',
      email: verification.email.toLowerCase(),
      avatarUrl: verification.picture,
      emailVerified: true,
      title:
        requestedRole === 'seeker'
          ? 'Candidate'
          : requestedRole === 'recruiter'
          ? 'Lead Technical Recruiter'
          : 'Super Admin & Platform Director',
      company: requestedRole === 'recruiter' ? 'Stripeflow Payments' : undefined,
    };

    return {
      status: 200,
      data: {
        success: true,
        message: 'Google authentication verified successfully.',
        token: sessionToken,
        user: verifiedUser,
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
