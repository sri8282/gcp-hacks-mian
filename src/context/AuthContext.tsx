import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  SeekerProfile,
  Job,
  JobApplication,
  ApplicationStatus,
  ApplicationAnswer,
  BroadcastMessage,
  AdminRecruiterUser,
  AppNotification,
  CandidateApplicationStats,
} from '../types';
import { INITIAL_MOCK_JOBS, INITIAL_APPLICATIONS } from '../data/mockJobs';
import { INITIAL_ADMIN_RECRUITERS } from '../data/mockAdminData';
import { formatToIST } from '../utils/istTime';
import { api, SendNotificationPayload } from '../utils/api';

export interface StoredAccount {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  pass: string;
  company?: string;
  title?: string;
  avatarUrl?: string;
  joinedDate?: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, id?: string, pass?: string) => boolean;
  loginWithVerifiedSession: (session: { token: string; user: User }) => boolean;
  registerNewUser: (
    role: UserRole,
    details: { name: string; email: string; id: string; pass: string; company?: string }
  ) => boolean;
  createAccountByAdmin: (details: {
    role: 'admin' | 'recruiter';
    name: string;
    email: string;
    pass: string;
    company?: string;
  }) => { success: boolean; message: string; account?: StoredAccount };
  accounts: StoredAccount[];
  recruiters: AdminRecruiterUser[];
  setRecruiters: React.Dispatch<React.SetStateAction<AdminRecruiterUser[]>>;
  logout: () => void;
  seekerProfile: SeekerProfile | null;
  updateSeekerProfile: (profile: Partial<SeekerProfile>) => void;
  completeSeekerOnboarding: (profile: SeekerProfile) => void;
  // Jobs data & actions
  jobs: Job[];
  addJob: (newJob: Omit<Job, 'id' | 'postedDate' | 'isClosed'> & { isClosed?: boolean; id?: string }) => void;
  updateJob: (jobId: string, updatedJob: Partial<Job>) => void;
  deleteJob: (jobId: string) => void;
  toggleJobStatus: (jobId: string) => void;
  setJobAdminOverride: (jobId: string, override: 'auto' | 'open' | 'closed') => void;
  // Applications data & actions
  applications: JobApplication[];
  addApplication: (
    job: Job,
    applicationData?: { resumeFileName?: string; answers?: ApplicationAnswer[] }
  ) => { success: boolean; message: string };
  updateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  updateApplicationNotes: (id: string, notes: string) => void;
  deleteApplication: (id: string) => void;
  // Broadcast Messages
  broadcastMessages: BroadcastMessage[];
  sendBroadcastMessage: (msg: Omit<BroadcastMessage, 'id' | 'sentAt'>) => void;
  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  sendNotification: (payload: SendNotificationPayload) => Promise<{ success: boolean; message: string }>;
  markNotificationAsRead: (notifId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  // Live Candidate Stats
  candidateStats: CandidateApplicationStats;
  refreshCandidateStats: () => Promise<void>;
}


const DEFAULT_SEEKER_PROFILE: SeekerProfile = {
  fullName: 'Alex Morgan',
  collegeName: 'IIT Bombay',
  cgpa: 8.4,
  certifications: ['AWS Certified Cloud Practitioner', 'Meta Frontend Developer', 'PostgreSQL Associate'],
  passingYear: '2025',
  interestedRoles: ['Frontend', 'Fullstack', 'AI / ML', 'DevOps'],
  linkedInUrl: 'https://linkedin.com/in/alexmorgan-dev',
  portfolioUrl: 'https://alexmorgan.design',
  skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'GraphQL', 'State Management'],
  isOnboarded: true,
};

const INITIAL_ACCOUNTS: StoredAccount[] = [
  {
    id: 'admin_user',
    role: 'admin',
    name: 'David Vance',
    email: 'admin@gmail.com',
    pass: '12345',
    title: 'Super Admin & Platform Director',
    joinedDate: '01 Jan 2026',
  },
  {
    id: 'recruiter_user',
    role: 'recruiter',
    name: 'Sarah Jenkins',
    email: 'recruiter@gmail.com',
    pass: '12345',
    company: 'Stripeflow Payments',
    title: 'Lead Technical Recruiter',
    joinedDate: '15 Jan 2026',
  },
  {
    id: 'candidate_user',
    role: 'seeker',
    name: 'Alex Morgan',
    email: 'candidate@gmail.com',
    pass: '12345',
    title: 'Senior CS Candidate (IIT Bombay)',
    joinedDate: '15 Aug 2026',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Stored system accounts for login verification
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => {
    const saved = sessionStorage.getItem('hirehub_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_ACCOUNTS;
  });

  // Global Recruiters List
  const [recruiters, setRecruiters] = useState<AdminRecruiterUser[]>(() => {
    const saved = sessionStorage.getItem('hirehub_admin_recruiters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_ADMIN_RECRUITERS;
  });

  // Current logged in user
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('hirehub_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [seekerProfile, setSeekerProfile] = useState<SeekerProfile | null>(() => {
    const saved = sessionStorage.getItem('hirehub_seeker_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_SEEKER_PROFILE;
      }
    }
    return DEFAULT_SEEKER_PROFILE;
  });

  // Helper to sanitize any raw job
  const sanitizeJob = (rawJob: any): Job => {
    const company = rawJob.company || 'Tech Systems';
    const initials =
      rawJob.companyInitials ||
      company
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() ||
      'TS';
    const minLpa = typeof rawJob.minLpa === 'number' ? rawJob.minLpa : 12;
    const maxLpa = typeof rawJob.maxLpa === 'number' ? rawJob.maxLpa : 20;
    const payRange = rawJob.payRange || `₹${minLpa} - ₹${maxLpa} LPA`;
    const minCgpa = typeof rawJob.minCgpa === 'number' ? rawJob.minCgpa : 7.0;
    const skills =
      Array.isArray(rawJob.skills) && rawJob.skills.length > 0
        ? rawJob.skills
        : ['React', 'TypeScript', 'Node.js'];
    const responsibilities =
      Array.isArray(rawJob.responsibilities) && rawJob.responsibilities.length > 0
        ? rawJob.responsibilities
        : [
            'Design and implement resilient, high-performance software modules.',
            'Collaborate with cross-functional product and engineering teams in agile sprints.',
            'Maintain strict accessibility, documentation, and automated test coverage.',
          ];
    const interviewRounds =
      Array.isArray(rawJob.interviewRounds) && rawJob.interviewRounds.length > 0
        ? rawJob.interviewRounds
        : [
            { name: 'Round 1: Online Technical Assessment', date: 'Upcoming in IST', format: '60-min Coding Test' },
            { name: 'Round 2: Domain Architecture & System Design', date: 'Upcoming in IST', format: '45-min Technical Review' },
            { name: 'Round 3: Engineering Culture & Offer Discussion', date: 'Upcoming in IST', format: '30-min Video Call' },
          ];
    const customQuestions =
      Array.isArray(rawJob.customQuestions) && rawJob.customQuestions.length > 0
        ? rawJob.customQuestions
        : [
            'What core technical experience makes you a strong fit for this position?',
            'Describe a technical challenge you recently solved.',
          ];

    return {
      ...rawJob,
      id: rawJob.id || `job-${Date.now()}`,
      title: rawJob.title || 'Software Engineer',
      company,
      companyInitials: initials,
      companyColor: rawJob.companyColor || 'bg-neutral-800 text-neutral-200 border-neutral-700',
      companyLinkedInUrl:
        rawJob.companyLinkedInUrl ||
        `https://linkedin.com/company/${company.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      minLpa,
      maxLpa,
      payRange,
      workplaceType: rawJob.workplaceType || 'Remote',
      location: rawJob.location || 'Bengaluru, KA (Remote)',
      category: rawJob.category || 'Engineering',
      minCgpa,
      openFrom: rawJob.openFrom || '2026-08-15T09:00:00',
      closeOn: rawJob.closeOn || '2026-09-30T23:59:00',
      openFromText: rawJob.openFromText || '15 Aug 2026, 09:00 AM IST',
      closeOnText: rawJob.closeOnText || '30 Sep 2026, 11:59 PM IST',
      deadlineText: rawJob.deadlineText || '30 Sep 2026, 11:59 PM IST',
      isClosed: Boolean(rawJob.isClosed),
      adminForceStatus: rawJob.adminForceStatus || 'auto',
      postedDate: rawJob.postedDate || '23 Aug 2026, 10:00 AM IST',
      description:
        rawJob.description ||
        'Exciting engineering role working on scalable systems with a collaborative product engineering team.',
      responsibilities,
      skills,
      interviewRounds,
      customQuestions,
    };
  };

  // Global Jobs state
  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = sessionStorage.getItem('hirehub_jobs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((j) => sanitizeJob(j));
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_MOCK_JOBS.map((j) => sanitizeJob(j));
  });

  // Global Applications state
  const [applications, setApplications] = useState<JobApplication[]>(() => {
    const saved = sessionStorage.getItem('hirehub_applications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_APPLICATIONS;
  });

  // Broadcast Messages state
  const [broadcastMessages, setBroadcastMessages] = useState<BroadcastMessage[]>(() => {
    const saved = sessionStorage.getItem('hirehub_broadcast_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'bm-1',
        jobId: 'job-1',
        jobTitle: 'Senior Frontend Engineer (React & TypeScript)',
        company: 'Stripeflow Payments',
        recipientCount: 3,
        recipientNames: ['Alex Morgan', 'Elena Rostova', 'Rohan Deshmukh'],
        subject: 'Round 1 Assessment & Interview Details for Stripeflow Payments',
        body: 'Dear Candidates, thank you for applying to the Senior Frontend Engineer role. Please check your candidate portal for scheduled technical assessments taking place this week in IST.',
        sentAt: '23 Aug 2026, 05:45 PM IST',
      },
    ];
  });

  // Global Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = sessionStorage.getItem('hirehub_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [
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
  });

  // Sync to session storage
  useEffect(() => {
    sessionStorage.setItem('hirehub_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    sessionStorage.setItem('hirehub_admin_recruiters', JSON.stringify(recruiters));
  }, [recruiters]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('hirehub_auth_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('hirehub_auth_user');
    }
  }, [user]);

  useEffect(() => {
    if (seekerProfile) {
      sessionStorage.setItem('hirehub_seeker_profile', JSON.stringify(seekerProfile));
    }
  }, [seekerProfile]);

  useEffect(() => {
    sessionStorage.setItem('hirehub_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    sessionStorage.setItem('hirehub_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    sessionStorage.setItem('hirehub_broadcast_messages', JSON.stringify(broadcastMessages));
  }, [broadcastMessages]);

  useEffect(() => {
    sessionStorage.setItem('hirehub_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Periodically or on load, poll / sync notifications & stats from backend API
  const refreshCandidateStats = async () => {
    try {
      const email = user?.email || 'candidate@gmail.com';
      const name = user?.name || seekerProfile?.fullName;
      const [statsRes, notifs] = await Promise.all([
        api.getCandidateStats(email, name),
        api.getNotifications(email, name),
      ]);
      if (notifs && notifs.length > 0) {
        setNotifications((prev) => {
          // Merge unique notifications
          const map = new Map<string, AppNotification>();
          prev.forEach((n) => map.set(n.id, n));
          notifs.forEach((n) => {
            if (!map.has(n.id)) {
              map.set(n.id, n);
            }
          });
          return Array.from(map.values()).sort((a, b) => b.createdAtMs - a.createdAtMs);
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshCandidateStats();
  }, [user?.email]);

  // Compute live candidate application stats from single source of truth
  const candidateStats: CandidateApplicationStats = {
    totalApplied: applications.length,
    interviewing: applications.filter((a) => a.status === 'Interviewing').length,
    offered: applications.filter((a) => a.status === 'Offered').length,
    rejected: applications.filter((a) => a.status === 'Rejected').length,
  };

  // Compute visible notifications for current user
  const userEmail = (user?.email || 'candidate@gmail.com').toLowerCase();
  const userName = (user?.name || seekerProfile?.fullName || 'Alex Morgan').toLowerCase();

  const candidateNotifications = notifications.filter((n) => {
    if (n.targetType === 'all') return true;
    if (n.targetCandidateEmails?.some((e) => e.toLowerCase() === userEmail || userEmail.includes(e.toLowerCase()))) {
      return true;
    }
    if (n.targetCandidateNames?.some((nm) => nm.toLowerCase() === userName || userName.includes(nm.toLowerCase()))) {
      return true;
    }
    return false;
  });

  const unreadNotificationCount = candidateNotifications.filter(
    (n) => !n.readBy.includes(userEmail) && !n.readBy.includes('candidate_user')
  ).length;

  const sendNotification = async (payload: SendNotificationPayload): Promise<{ success: boolean; message: string }> => {
    const currentIst = formatToIST(new Date());
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderRole: payload.senderRole,
      senderName: payload.senderName || (payload.senderRole === 'admin' ? 'David Vance' : 'Recruitment Partner'),
      senderCompany: payload.senderCompany || (payload.senderRole === 'admin' ? 'HireHub Admin' : 'Talent Acquisition Team'),
      targetType: payload.targetType,
      targetCandidateEmails: payload.targetCandidateEmails || [],
      targetCandidateNames: payload.targetCandidateNames || [],
      title: payload.title || (payload.jobTitle ? `Update on ${payload.jobTitle}` : `Announcement from ${payload.senderCompany || 'Admin'}`),
      message: payload.message,
      jobTitle: payload.jobTitle,
      jobId: payload.jobId,
      sentAt: currentIst,
      createdAtMs: Date.now(),
      readBy: [],
    };

    // Update local state immediately
    setNotifications((prev) => [newNotif, ...prev]);

    // Send to backend API
    try {
      await api.sendNotification(payload);
    } catch {
      // offline fallback
    }

    return {
      success: true,
      message: `Notification successfully sent to ${
        payload.targetType === 'all'
          ? 'all candidate(s)'
          : `${payload.targetCandidateEmails?.length || 1} targeted candidate(s)`
      }.`,
    };
  };

  const markNotificationAsRead = async (notifId: string): Promise<void> => {
    const candidateId = userEmail;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notifId) {
          if (!n.readBy.includes(candidateId)) {
            return { ...n, readBy: [...n.readBy, candidateId] };
          }
        }
        return n;
      })
    );
    try {
      await api.markNotificationAsRead(notifId, candidateId);
    } catch {
      // ignore
    }
  };

  const markAllNotificationsAsRead = async (): Promise<void> => {
    const candidateId = userEmail;
    setNotifications((prev) =>
      prev.map((n) => {
        if (!n.readBy.includes(candidateId)) {
          return { ...n, readBy: [...n.readBy, candidateId] };
        }
        return n;
      })
    );
    try {
      await api.markAllNotificationsAsRead(candidateId);
    } catch {
      // ignore
    }
  };


  const login = (role: UserRole, id?: string, pass?: string): boolean => {
    const inputEmail = (id || '').trim().toLowerCase();
    const inputPass = (pass || '').trim();

    // 1. Match against stored accounts
    const matchingAccount = accounts.find(
      (acc) => acc.role === role && acc.email.toLowerCase() === inputEmail && acc.pass === inputPass
    );

    if (matchingAccount) {
      const loggedUser: User = {
        id: matchingAccount.id,
        role: matchingAccount.role,
        name: matchingAccount.name,
        email: matchingAccount.email,
        title:
          matchingAccount.title ||
          (role === 'seeker'
            ? 'Candidate'
            : role === 'recruiter'
            ? 'Lead Technical Recruiter'
            : 'Super Admin & Platform Director'),
        company: matchingAccount.company,
        ...(role === 'seeker' ? { seekerProfile: seekerProfile || DEFAULT_SEEKER_PROFILE } : {}),
      };
      setUser(loggedUser);
      return true;
    }

    // 2. Match against recruiter list directly if standard 12345 pass used
    if (role === 'recruiter') {
      const matchedRec = recruiters.find(
        (r) => r.email.toLowerCase() === inputEmail && (inputPass === '12345' || !inputPass)
      );
      if (matchedRec) {
        const recruiterUser: User = {
          id: matchedRec.id,
          role: 'recruiter',
          name: matchedRec.name,
          email: matchedRec.email,
          title: 'Lead Technical Recruiter',
          company: matchedRec.company,
        };
        setUser(recruiterUser);
        return true;
      }
    }

    // 3. Fallback default credentials
    if (role === 'seeker') {
      const isValid = (inputEmail === 'candidate@gmail.com' && inputPass === '12345') || (!inputEmail && !inputPass);
      if (isValid) {
        const seekerUser: User = {
          id: 'candidate_user',
          role: 'seeker',
          name: seekerProfile?.fullName || 'Alex Morgan',
          email: inputEmail || 'candidate@gmail.com',
          title: 'Senior CS Candidate (IIT Bombay)',
          seekerProfile: seekerProfile || DEFAULT_SEEKER_PROFILE,
        };
        setUser(seekerUser);
        return true;
      }
    }

    if (role === 'recruiter') {
      const isValid = (inputEmail === 'recruiter@gmail.com' && inputPass === '12345') || (!inputEmail && !inputPass);
      if (isValid) {
        const recruiterUser: User = {
          id: 'recruiter_user',
          role: 'recruiter',
          name: 'Sarah Jenkins',
          email: inputEmail || 'recruiter@gmail.com',
          title: 'Lead Technical Recruiter',
          company: 'Stripeflow Payments',
        };
        setUser(recruiterUser);
        return true;
      }
    }

    if (role === 'admin') {
      const isValid = (inputEmail === 'admin@gmail.com' && inputPass === '12345') || (!inputEmail && !inputPass);
      if (isValid) {
        const adminUser: User = {
          id: 'admin_user',
          role: 'admin',
          name: 'David Vance',
          email: inputEmail || 'admin@gmail.com',
          title: 'Super Admin & Platform Director',
        };
        setUser(adminUser);
        return true;
      }
    }

    return false;
  };

  const loginWithVerifiedSession = (session: { token: string; user: User }): boolean => {
    if (!session || !session.user || !session.token) {
      return false;
    }

    const verifiedUser = session.user;
    const userEmail = (verifiedUser.email || '').toLowerCase().trim();
    const userName = verifiedUser.name || 'Candidate';
    const role = verifiedUser.role || 'seeker';

    try {
      localStorage.setItem('hirehub_session_token', session.token);
    } catch {
      // Ignore localStorage availability issues
    }

    // 1. Check if account already exists
    const existing = accounts.find((a) => a.email.toLowerCase() === userEmail && a.role === role);
    if (existing) {
      const loggedUser: User = {
        id: existing.id || verifiedUser.id,
        role: existing.role,
        name: verifiedUser.name || existing.name,
        email: existing.email,
        avatarUrl: verifiedUser.avatarUrl || existing.avatarUrl,
        sessionToken: session.token,
        title:
          existing.title ||
          (role === 'seeker'
            ? 'Candidate'
            : role === 'recruiter'
            ? 'Lead Technical Recruiter'
            : 'Super Admin & Platform Director'),
        company: existing.company,
        ...(role === 'seeker'
          ? {
              seekerProfile: seekerProfile || {
                ...DEFAULT_SEEKER_PROFILE,
                fullName: userName,
              },
            }
          : {}),
      };
      setUser(loggedUser);
      return true;
    }

    // 2. Provision real verified user
    const newLoggedUser: User = {
      id: verifiedUser.id || `google_${role}_${Date.now()}`,
      role,
      name: userName,
      email: userEmail,
      avatarUrl: verifiedUser.avatarUrl,
      sessionToken: session.token,
      title:
        role === 'seeker'
          ? 'Candidate'
          : role === 'recruiter'
          ? 'Lead Technical Recruiter'
          : 'Super Admin & Platform Director',
      company: role === 'recruiter' ? 'Stripeflow Payments' : undefined,
      ...(role === 'seeker'
        ? {
            seekerProfile: seekerProfile || {
              ...DEFAULT_SEEKER_PROFILE,
              fullName: userName,
            },
          }
        : {}),
    };

    const newAccount: StoredAccount = {
      id: newLoggedUser.id,
      role,
      name: userName,
      email: userEmail,
      avatarUrl: verifiedUser.avatarUrl,
      pass: 'google_oauth_session',
      company: newLoggedUser.company,
      title: newLoggedUser.title,
      joinedDate: formatToIST(new Date()),
    };

    setAccounts((prev) => [
      newAccount,
      ...prev.filter((a) => a.email.toLowerCase() !== userEmail || a.role !== role),
    ]);
    setUser(newLoggedUser);
    return true;
  };

  const registerNewUser = (
    role: UserRole,
    details: { name: string; email: string; id: string; pass: string; company?: string }
  ): boolean => {
    const normalizedEmail = details.email.trim().toLowerCase();
    const newUser: User = {
      id: details.id || `user_${Date.now()}`,
      role,
      name: details.name || 'New User',
      email: normalizedEmail || `${(details.name || 'user').toLowerCase().replace(/\s+/g, '')}@example.com`,
      title: role === 'seeker' ? 'Candidate' : role === 'recruiter' ? 'Hiring Partner' : 'Platform Administrator',
      company: details.company || (role === 'recruiter' ? 'TechCorp Solutions' : undefined),
    };

    const newAccount: StoredAccount = {
      id: newUser.id,
      role,
      name: newUser.name,
      email: newUser.email,
      pass: details.pass.trim() || '12345',
      company: newUser.company,
      title: newUser.title,
      joinedDate: formatToIST(new Date()),
    };

    setAccounts((prev) => [newAccount, ...prev.filter((a) => a.email.toLowerCase() !== newAccount.email.toLowerCase() || a.role !== role)]);

    if (role === 'seeker') {
      const newProfile: SeekerProfile = {
        fullName: details.name || 'New Candidate',
        collegeName: 'Stanford University',
        cgpa: 8.5,
        certifications: ['Full Stack Web Development'],
        passingYear: '2026',
        interestedRoles: ['Frontend', 'Fullstack'],
        linkedInUrl: 'https://linkedin.com',
        portfolioUrl: 'https://github.com',
        isOnboarded: false,
      };
      newUser.seekerProfile = newProfile;
      setSeekerProfile(newProfile);
    }

    setUser(newUser);
    return true;
  };

  // Admin creating Recruiter or Admin accounts directly
  const createAccountByAdmin = (details: {
    role: 'admin' | 'recruiter';
    name: string;
    email: string;
    pass: string;
    company?: string;
  }): { success: boolean; message: string; account?: StoredAccount } => {
    const normalizedEmail = details.email.trim().toLowerCase();
    const cleanName = details.name.trim();
    const cleanPass = details.pass.trim();

    if (!cleanName || !normalizedEmail || !cleanPass) {
      return { success: false, message: 'Please provide valid Name, Email/ID, and Password.' };
    }

    const exists = accounts.some(
      (acc) => acc.email.toLowerCase() === normalizedEmail && acc.role === details.role
    );
    if (exists) {
      return {
        success: false,
        message: `An account with ${details.email} already exists for role "${details.role}".`,
      };
    }

    const newId = details.role === 'recruiter' ? `rec-${Date.now()}` : `admin-${Date.now()}`;
    const companyName = details.company?.trim() || (details.role === 'recruiter' ? `${cleanName} Hiring Group` : undefined);

    const newAccount: StoredAccount = {
      id: newId,
      role: details.role,
      name: cleanName,
      email: normalizedEmail,
      pass: cleanPass,
      company: companyName,
      title: details.role === 'admin' ? 'System Administrator' : 'Technical Recruiter',
      joinedDate: formatToIST(new Date()),
    };

    setAccounts((prev) => [newAccount, ...prev]);

    // If it's a recruiter account, add into the Recruiters directory list so Admin can audit & manage it immediately
    if (details.role === 'recruiter') {
      const initials = (companyName || cleanName)
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'RH';

      const newRecruiter: AdminRecruiterUser = {
        id: newId,
        name: cleanName,
        email: normalizedEmail,
        company: companyName || 'Enterprise Partner',
        companyInitials: initials,
        companyColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        companyLinkedInUrl: `https://linkedin.com/company/${(companyName || 'enterprise').toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        category: 'Technology & Services',
        location: 'Bengaluru, KA (Remote)',
        joinedDate: formatToIST(new Date()),
        tier: 'Enterprise',
        isDeactivated: false,
      };

      setRecruiters((prev) => [newRecruiter, ...prev]);
    }

    return {
      success: true,
      message: `${details.role === 'admin' ? 'Admin' : 'Recruiter'} account created successfully for ${cleanName} (${normalizedEmail}).`,
      account: newAccount,
    };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('hirehub_auth_user');
  };

  const updateSeekerProfile = (partial: Partial<SeekerProfile>) => {
    setSeekerProfile((prev) => {
      const updated = prev ? { ...prev, ...partial } : ({ ...DEFAULT_SEEKER_PROFILE, ...partial } as SeekerProfile);
      if (user && user.role === 'seeker') {
        setUser({ ...user, name: updated.fullName, seekerProfile: updated });
      }
      return updated;
    });
  };

  const completeSeekerOnboarding = (profile: SeekerProfile) => {
    const finalized = { ...profile, isOnboarded: true };
    setSeekerProfile(finalized);
    if (user && user.role === 'seeker') {
      setUser({ ...user, name: finalized.fullName, seekerProfile: finalized });
    }
  };

  const addJob = (newJobData: Omit<Job, 'id' | 'postedDate' | 'isClosed'> & { isClosed?: boolean; id?: string }) => {
    const newId = newJobData.id || `job-${Date.now()}`;
    const initials = newJobData.company
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'TC';

    const fullJob: Job = {
      ...newJobData,
      id: newId,
      companyInitials: initials,
      companyColor: newJobData.companyColor || 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      postedDate: formatToIST(new Date()),
      isClosed: newJobData.isClosed ?? false,
      adminForceStatus: newJobData.adminForceStatus || 'auto',
    };

    setJobs((prev) => [fullJob, ...prev]);
  };

  const updateJob = (jobId: string, updatedData: Partial<Job>) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...updatedData } : j))
    );

    // Also cascade any company name or role title changes to existing job applications/tracker entries referencing it
    if (updatedData.title || updatedData.company || updatedData.payRange || updatedData.location) {
      setApplications((prev) =>
        prev.map((app) => {
          if (app.jobId === jobId) {
            return {
              ...app,
              role: updatedData.title || app.role,
              company: updatedData.company || app.company,
              payRange: updatedData.payRange || app.payRange,
              location: updatedData.location || app.location,
            };
          }
          return app;
        })
      );
    }
  };

  const deleteJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const toggleJobStatus = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, isClosed: !j.isClosed } : j))
    );
  };

  const setJobAdminOverride = (jobId: string, override: 'auto' | 'open' | 'closed') => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, adminForceStatus: override } : j))
    );
  };

  const addApplication = (
    job: Job,
    applicationData?: { resumeFileName?: string; answers?: ApplicationAnswer[] }
  ): { success: boolean; message: string } => {
    const existing = applications.find((a) => a.jobId === job.id);
    if (existing) {
      return { success: false, message: `You have already applied for ${job.title} at ${job.company}.` };
    }

    const currentIst = formatToIST(new Date());
    const candidateName = seekerProfile?.fullName || user?.name || 'Alex Morgan';
    const newApp: JobApplication = {
      id: `app-${Date.now()}`,
      jobId: job.id,
      company: job.company,
      role: job.title,
      appliedDate: currentIst,
      lastUpdatedDate: currentIst,
      daysInactive: 0,
      status: 'Applied',
      notes: `Applied on ${currentIst}. Resume: ${applicationData?.resumeFileName || `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`}. Awaiting recruiter review.`,
      payRange: job.payRange,
      location: job.location,
      resumeFileName: applicationData?.resumeFileName || `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`,
      answers: applicationData?.answers || [],
      candidateName,
      candidateEmail: user?.email || 'alex.morgan@berkeley.edu',
      candidateCgpa: seekerProfile?.cgpa ?? 8.4,
      candidateCollege: seekerProfile?.collegeName || 'UC Berkeley',
      candidatePassingYear: seekerProfile?.passingYear || '2025',
      candidateCertifications: seekerProfile?.certifications || ['Full Stack Web Development'],
      candidateInterestedRoles: seekerProfile?.interestedRoles || ['Frontend', 'Fullstack'],
      candidateLinkedInUrl: seekerProfile?.linkedInUrl || 'https://linkedin.com/in/alexmorgan-dev',
      candidatePortfolioUrl: seekerProfile?.portfolioUrl || 'https://alexmorgan.design',
      candidateSkills: seekerProfile?.skills || job.skills.slice(0, 4),
    };

    setApplications((prev) => [newApp, ...prev]);
    return { success: true, message: `Successfully applied to ${job.title} at ${job.company}!` };
  };

  const updateApplicationStatus = (id: string, status: ApplicationStatus) => {
    const currentIst = formatToIST(new Date());
    let matchedApp: JobApplication | undefined;

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          matchedApp = { ...app, status, lastUpdatedDate: currentIst, daysInactive: 0 };
          return matchedApp;
        }
        return app;
      })
    );

    // Call API status updater
    api.updateApplicationStatus(id, status).catch(() => {});

    // Create status change notification for candidate
    if (matchedApp) {
      const app = matchedApp as JobApplication;
      let statusNotice = '';
      if (status === 'Offered') {
        statusNotice = `Congratulations! You have received an employment offer for ${app.role} at ${app.company}! Please check your candidate portal for next steps.`;
      } else if (status === 'Interviewing') {
        statusNotice = `Your application for ${app.role} at ${app.company} has advanced to the Interviewing stage.`;
      } else if (status === 'Rejected') {
        statusNotice = `Application update: Your application for ${app.role} at ${app.company} has been archived.`;
      }

      if (statusNotice) {
        const autoNotif: AppNotification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          senderRole: 'recruiter',
          senderName: 'Talent Acquisition Team',
          senderCompany: app.company,
          targetType: 'specific',
          targetCandidateEmails: app.candidateEmail ? [app.candidateEmail] : ['candidate@gmail.com'],
          targetCandidateNames: app.candidateName ? [app.candidateName] : ['Alex Morgan'],
          title: `Application Status: ${app.role} (${status})`,
          message: statusNotice,
          jobTitle: app.role,
          jobId: app.jobId,
          sentAt: currentIst,
          createdAtMs: Date.now(),
          readBy: [],
        };
        setNotifications((prev) => [autoNotif, ...prev]);
      }
    }
  };

  const updateApplicationNotes = (id: string, notes: string) => {
    const currentIst = formatToIST(new Date());
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, notes, lastUpdatedDate: currentIst, daysInactive: 0 } : app))
    );
  };

  const deleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  const sendBroadcastMessage = (msg: Omit<BroadcastMessage, 'id' | 'sentAt'>) => {
    const newBroadcast: BroadcastMessage = {
      ...msg,
      id: `bm-${Date.now()}`,
      sentAt: formatToIST(new Date()),
    };
    setBroadcastMessages((prev) => [newBroadcast, ...prev]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithVerifiedSession,
        registerNewUser,
        createAccountByAdmin,
        accounts,
        recruiters,
        setRecruiters,
        logout,
        seekerProfile,
        updateSeekerProfile,
        completeSeekerOnboarding,
        jobs,
        addJob,
        updateJob,
        deleteJob,
        toggleJobStatus,
        setJobAdminOverride,
        applications,
        addApplication,
        updateApplicationStatus,
        updateApplicationNotes,
        deleteApplication,
        broadcastMessages,
        sendBroadcastMessage,
        notifications: candidateNotifications,
        unreadNotificationCount,
        sendNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        candidateStats,
        refreshCandidateStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
