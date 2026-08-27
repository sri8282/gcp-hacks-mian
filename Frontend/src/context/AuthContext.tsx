import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { formatToIST } from '../utils/istTime';
import { api, SendNotificationPayload, setAuthToken, clearAuthToken, getAuthToken, normalizeJob, normalizeApplication } from '../lib/api';


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
  login: (role: UserRole, id?: string, pass?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithVerifiedSession: (session: { token: string; user: any }) => boolean;
  registerNewUser: (
    role: UserRole,
    details: { name: string; email: string; id?: string; pass: string; company?: string }
  ) => Promise<{ success: boolean; message?: string }>;
  createAccountByAdmin: (details: {
    role: 'admin' | 'recruiter';
    name: string;
    email: string;
    pass: string;
    company?: string;
  }) => Promise<{ success: boolean; message: string; account?: StoredAccount }>;
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
  setApplications: React.Dispatch<React.SetStateAction<JobApplication[]>>;
  addApplication: (
    job: Job,
    applicationData?: { resumeFileName?: string; answers?: ApplicationAnswer[]; resumeUrl?: string }
  ) => { success: boolean; message: string };
  updateApplicationStatus: (id: string, status: ApplicationStatus, backendStatus?: string) => void;

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
  isLoading: boolean;
}

const EMPTY_SEEKER_PROFILE: SeekerProfile = {
  fullName: '',
  collegeName: '',
  cgpa: 0,
  certifications: [],
  passingYear: '',
  interestedRoles: [],
  linkedInUrl: '',
  portfolioUrl: '',
  skills: [],
  isOnboarded: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Authenticated user session
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('hirehub_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.sessionToken) {
          setAuthToken(parsed.sessionToken);
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [seekerProfile, setSeekerProfile] = useState<SeekerProfile | null>(() => {
    const saved = localStorage.getItem('hirehub_seeker_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });


  // Stored system accounts for display & admin audit
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => {
    const saved = sessionStorage.getItem('hirehub_accounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  // Global Recruiters List
  const [recruiters, setRecruiters] = useState<AdminRecruiterUser[]>(() => {
    const saved = sessionStorage.getItem('hirehub_admin_recruiters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  // Jobs
  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = sessionStorage.getItem('hirehub_jobs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  // Applications
  const [applications, setApplications] = useState<JobApplication[]>(() => {
    const saved = sessionStorage.getItem('hirehub_applications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });


  // Broadcast messages
  const [broadcastMessages, setBroadcastMessages] = useState<BroadcastMessage[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Candidate Live Stats
  const [candidateStats, setCandidateStats] = useState<CandidateApplicationStats>({
    totalApplied: 0,
    interviewing: 0,
    offered: 0,
    rejected: 0,
  });

  // Reset state helper on logout / user switch / 401
  const resetAllState = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setSeekerProfile(null);
    setJobs([]);
    setApplications([]);
    setAccounts([]);
    setRecruiters([]);
    setNotifications([]);
    setBroadcastMessages([]);
    setCandidateStats({
      totalApplied: 0,
      interviewing: 0,
      offered: 0,
      rejected: 0,
    });

    sessionStorage.removeItem('hirehub_user');
    sessionStorage.removeItem('hirehub_token');
    sessionStorage.removeItem('hirehub_jobs');
    sessionStorage.removeItem('hirehub_applications');
    sessionStorage.removeItem('hirehub_accounts');
    sessionStorage.removeItem('hirehub_admin_recruiters');
    sessionStorage.removeItem('hirehub_admin_seekers');
    localStorage.removeItem('hirehub_token');
    localStorage.removeItem('hirehub_seeker_profile');
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      resetAllState();
    };
    window.addEventListener('hirehub_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('hirehub_unauthorized', handleUnauthorized);
  }, [resetAllState]);

  // Save changes to sessionStorage & sync setAuthToken with active user sessionToken
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('hirehub_user', JSON.stringify(user));
      if (user.sessionToken) {
        setAuthToken(user.sessionToken);
      }
    } else {
      sessionStorage.removeItem('hirehub_user');
      clearAuthToken();
    }
  }, [user]);


  useEffect(() => {
    if (seekerProfile) {
      localStorage.setItem('hirehub_seeker_profile', JSON.stringify(seekerProfile));
    } else {
      localStorage.removeItem('hirehub_seeker_profile');
    }
  }, [seekerProfile]);

  useEffect(() => {
    sessionStorage.setItem('hirehub_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    sessionStorage.setItem('hirehub_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    sessionStorage.setItem('hirehub_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    sessionStorage.setItem('hirehub_admin_recruiters', JSON.stringify(recruiters));
  }, [recruiters]);


  // Refresh live candidate stats & applications
  const refreshCandidateStats = useCallback(async () => {
    if (!user || user.role !== 'seeker') return;
    try {
      const [statsRes, appsRes] = await Promise.all([
        api.applications.getCandidateStats().catch(() => null),
        api.applications.getMyApplications().catch(() => null),
      ]);

      if (statsRes) {
        setCandidateStats({
          totalApplied: statsRes.total_applied || 0,
          interviewing: statsRes.interviewing || statsRes.interviewing_or_in_review || 0,
          offered: statsRes.offered || 0,
          rejected: statsRes.rejected || 0,
        });
      }

      if (appsRes && Array.isArray(appsRes) && appsRes.length > 0) {
        const mappedApps: JobApplication[] = appsRes.map((a: any) => {
          const norm = normalizeApplication(a);
          return {
            id: norm.id,
            jobId: norm.jobId || norm.job_id,
            company: norm.company || 'Company',
            role: norm.role || 'Position',
            appliedDate: norm.appliedAt ? new Date(norm.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN'),
            lastUpdatedDate: new Date(norm.updatedAt || norm.updated_at || norm.appliedAt || norm.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            daysInactive: Math.floor((Date.now() - new Date(norm.updatedAt || norm.updated_at || norm.appliedAt || norm.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
            status: norm.status as ApplicationStatus,
            notes: norm.notes || '',
            payRange: norm.payRange || '',
            location: norm.location || 'Remote',
            candidateName: norm.candidateName || user.name,
            candidateEmail: norm.candidateEmail || user.email,
            candidateCollege: norm.candidateCollege,
            candidateCgpa: norm.candidateCgpa,
            candidateCertifications: norm.candidateCertifications,
            candidateInterestedRoles: norm.candidateInterestedRoles,
            candidateLinkedInUrl: norm.candidateLinkedInUrl,
            candidatePortfolioUrl: norm.candidatePortfolioUrl,
            resumeUrl: norm.resumeUrl,
          };
        });
        setApplications(mappedApps);
      }
    } catch (err) {
      console.warn('refreshCandidateStats error:', err);
    }
  }, [user]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const notifsRes = await api.notifications.getNotifications().catch(() => null);
      if (notifsRes && Array.isArray(notifsRes.notifications)) {
        setNotifications(notifsRes.notifications);
      }
    } catch (err) {
      console.warn('refreshNotifications warning:', err);
    }
  }, [user]);


  // Load live data from real backend on mount and when user session changes
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user || !user.id) return;
      setIsLoading(true);
      try {
        if (user.role === 'recruiter') {
          const recruiterJobs = await api.recruiter.getMyJobs().catch(() => []);
          setJobs(recruiterJobs);
        } else if (user.role === 'seeker') {

          const liveJobs = await api.jobs.getJobs().catch(() => []);
          setJobs(liveJobs);
          await Promise.all([refreshCandidateStats(), refreshNotifications()]);
        } else if (user.role === 'admin') {
          const [allJobs, allUsers] = await Promise.all([
            api.admin.getJobs().catch(() => []),
            api.admin.getUsers().catch(() => []),
          ]);
          setJobs(allJobs);
          setAccounts(allUsers);
        }
      } catch (err) {
        console.warn('Initial data load warning:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [user?.id, user?.role, refreshCandidateStats, refreshNotifications]);

  // Real backend login
  const login = async (
    role: UserRole,
    id?: string,
    pass?: string
  ): Promise<{ success: boolean; message?: string }> => {
    clearAuthToken();
    const inputEmail = (id || '').trim().toLowerCase();
    const inputPass = (pass || '').trim();

    try {
      const res = await api.auth.login(inputEmail, inputPass);
      if (res && res.token && res.user) {
        resetAllState();
        setAuthToken(res.token);

        const mappedRole: UserRole =
          res.user.role === 'candidate' ? 'seeker' : (res.user.role as UserRole);

        const loggedUser: User = {
          id: res.user.id,
          role: mappedRole,
          name: res.user.name,
          email: res.user.email,
          avatarUrl: res.user.avatar_url,
          sessionToken: res.token,
          title:
            mappedRole === 'seeker'
              ? 'Candidate'
              : mappedRole === 'recruiter'
              ? 'Lead Technical Recruiter'
              : 'Super Admin & Platform Director',
          company: mappedRole === 'recruiter' ? (res.user as any).RecruiterProfile?.companyName || (res.user as any).company || undefined : undefined,
          ...(mappedRole === 'seeker' ? { seekerProfile: seekerProfile || undefined } : {}),
        };

        setUser(loggedUser);
        sessionStorage.setItem('hirehub_user', JSON.stringify(loggedUser));
        return { success: true };
      }
    } catch (apiErr: any) {
      console.warn('Backend login error:', apiErr.message);
      return { success: false, message: apiErr.message || 'Invalid credentials or login failed.' };
    }

    return { success: false, message: 'Invalid credentials. Please verify your email and password.' };
  };

  // Google OAuth verified session login
  const loginWithVerifiedSession = (session: { token: string; user: any }): boolean => {
    clearAuthToken();
    if (!session || !session.user || !session.token) return false;

    resetAllState();
    setAuthToken(session.token);

    const verifiedUser = session.user;
    const userEmail = (verifiedUser.email || '').toLowerCase().trim();
    const userName = verifiedUser.name || 'Candidate';
    const mappedRole: UserRole =
      verifiedUser.role === 'candidate' ? 'seeker' : (verifiedUser.role || 'seeker');

    const loggedUser: User = {
      id: verifiedUser.id,
      role: mappedRole,
      name: userName,
      email: userEmail,
      avatarUrl: verifiedUser.avatar_url || verifiedUser.avatarUrl,
      sessionToken: session.token,
      title:
        mappedRole === 'seeker'
          ? 'Candidate'
          : mappedRole === 'recruiter'
          ? 'Lead Technical Recruiter'
          : 'Super Admin & Platform Director',
      company: mappedRole === 'recruiter' ? (verifiedUser as any).RecruiterProfile?.companyName || (verifiedUser as any).company || undefined : undefined,
      ...(mappedRole === 'seeker'
        ? {
            seekerProfile: seekerProfile || undefined,
          }
        : {}),
    };

    setUser(loggedUser);
    sessionStorage.setItem('hirehub_user', JSON.stringify(loggedUser));
    return true;
  };

  // Real candidate signup
  const registerNewUser = async (
    role: UserRole,
    details: { name: string; email: string; id?: string; pass: string; company?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    clearAuthToken();
    const normalizedEmail = details.email.trim().toLowerCase();

    try {
      const res = await api.auth.signup(details.name, normalizedEmail, details.pass, 'candidate');
      if (res && res.token && res.user) {
        resetAllState();
        setAuthToken(res.token);
        const newUser: User = {
          id: res.user.id,
          role: 'seeker',
          name: res.user.name,
          email: res.user.email,
          sessionToken: res.token,
          title: 'Candidate',
          seekerProfile: seekerProfile || undefined,
        };


        setUser(newUser);
        sessionStorage.setItem('hirehub_user', JSON.stringify(newUser));
        return { success: true };
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      return { success: false, message: err.message || 'Registration failed' };
    }
    return { success: false, message: 'Registration failed' };
  };

  // Admin creating Recruiter or Admin accounts directly
  const createAccountByAdmin = async (details: {
    role: 'admin' | 'recruiter';
    name: string;
    email: string;
    pass: string;
    company?: string;
  }): Promise<{ success: boolean; message: string; account?: StoredAccount }> => {
    const normalizedEmail = details.email.trim().toLowerCase();
    const cleanName = details.name.trim();
    const cleanPass = details.pass.trim();

    if (!cleanName || !normalizedEmail || !cleanPass) {
      return { success: false, message: 'Please provide valid Name, Email, and Password.' };
    }

    try {
      const res = await api.auth.adminCreateUser({
        role: details.role,
        name: cleanName,
        email: normalizedEmail,
        password: cleanPass,
      });

      const newAccount: StoredAccount = {
        id: res.user.id,
        role: details.role,
        name: cleanName,
        email: normalizedEmail,
        pass: '••••••••',
        company: details.company || (details.role === 'recruiter' ? `${cleanName} Hiring Group` : undefined),
        title: details.role === 'admin' ? 'Super Admin' : 'Technical Recruiter',
        joinedDate: formatToIST(new Date()),
      };

      setAccounts((prev) => [newAccount, ...prev]);

      if (details.role === 'recruiter') {
        const initials = cleanName.slice(0, 2).toUpperCase() || 'TC';
        const newRecruiter: AdminRecruiterUser = {
          id: res.user.id,
          name: cleanName,
          email: normalizedEmail,
          company: details.company || `${cleanName} Hiring Group`,
          companyInitials: initials,
          companyColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
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
    } catch (err: any) {
      console.error('Admin create user error:', err);
      return {
        success: false,
        message: err.message || 'Failed to create user on backend.',
      };
    }
  };

  const logout = () => {
    resetAllState();
  };


  const updateSeekerProfile = (partial: Partial<SeekerProfile>) => {
    setSeekerProfile((prev) => {
      const updated = prev ? { ...prev, ...partial } : ({ ...EMPTY_SEEKER_PROFILE, ...partial } as SeekerProfile);

      if (user && user.role === 'seeker') {
        setUser({ ...user, name: updated.fullName, seekerProfile: updated });
      }
      return updated;
    });
  };

  const completeSeekerOnboarding = async (profile: SeekerProfile) => {
    const finalized = { ...profile, isOnboarded: true };
    setSeekerProfile(finalized);

    try {
      await api.candidate.upsertProfile({
        college: profile.collegeName,
        cgpa: profile.cgpa,
        certifications: profile.certifications,
        passingYear: profile.passingYear,
        interestedRoles: profile.interestedRoles,
        linkedinUrl: profile.linkedInUrl,
        portfolioUrl: profile.portfolioUrl,
      });

      if (user && user.role === 'seeker') {
        const updatedUser: User = {
          ...user,
          name: finalized.fullName || user.name,
          isProfileComplete: true,
          seekerProfile: finalized,
        };
        setUser(updatedUser);
        sessionStorage.setItem('hirehub_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error('Error saving seeker profile to backend:', err);
      if (user && user.role === 'seeker') {
        const updatedUser: User = {
          ...user,
          name: finalized.fullName || user.name,
          isProfileComplete: true,
          seekerProfile: finalized,
        };
        setUser(updatedUser);
        sessionStorage.setItem('hirehub_user', JSON.stringify(updatedUser));
      }
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

    // Send to real backend API in background
    api.jobs.createJob({
      title: newJobData.title,
      company: newJobData.company,
      description: newJobData.description,
      location: newJobData.location,
      requirements: newJobData.skills,
      application_close_at: newJobData.closeOn,
    }).catch((err) => console.warn('createJob API sync error:', err));
  };

  const updateJob = (jobId: string, updatedData: Partial<Job>) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...updatedData } : j))
    );
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
    applicationData?: { resumeFileName?: string; answers?: ApplicationAnswer[]; resumeUrl?: string }
  ): { success: boolean; message: string } => {
    const existing = applications.find((a) => a.jobId === job.id);
    if (existing) {
      return { success: false, message: `You have already applied for ${job.title} at ${job.company}.` };
    }

    const currentIst = formatToIST(new Date());
    const candidateName = seekerProfile?.fullName || user?.name || 'Candidate';

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
      resumeUrl: applicationData?.resumeUrl,
      answers: applicationData?.answers || [],
      candidateName,
      candidateEmail: user?.email || 'candidate@gmail.com',
      candidateCgpa: seekerProfile?.cgpa ?? 8.4,
      candidateCollege: seekerProfile?.collegeName || 'UC Berkeley',
      candidatePassingYear: seekerProfile?.passingYear || '2025',
      candidateCertifications: seekerProfile?.certifications || [],
      candidateInterestedRoles: seekerProfile?.interestedRoles || [],

      candidateLinkedInUrl: seekerProfile?.linkedInUrl || 'https://linkedin.com/in/alexmorgan-dev',
      candidatePortfolioUrl: seekerProfile?.portfolioUrl || 'https://alexmorgan.design',
      candidateSkills: seekerProfile?.skills || job.skills.slice(0, 4),
    };

    setApplications((prev) => [newApp, ...prev]);

    // Send application to real backend
    api.jobs.applyToJob(job.id, {
      resumeUrl: applicationData?.resumeUrl || applicationData?.resumeFileName,
      screeningAnswers: applicationData?.answers,
    }).catch((err) => console.warn('applyToJob API sync warning:', err));

    return { success: true, message: `Successfully applied to ${job.title} at ${job.company}!` };
  };

  const updateApplicationStatus = (id: string, status: ApplicationStatus, backendStatus?: string) => {
    const currentIst = formatToIST(new Date());
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status, lastUpdatedDate: currentIst, daysInactive: 0 } : app))
    );

    const STATUS_TO_BACKEND_MAP: Record<string, string> = {
      Applied: 'applied',
      applied: 'applied',
      Screening: 'screening',
      screening: 'screening',
      Interviewing: 'interview',
      Interview: 'interview',
      interview: 'interview',
      Offered: 'offer',
      offer: 'offer',
      Rejected: 'rejected',
      rejected: 'rejected',
    };

    const apiStatus = backendStatus || (STATUS_TO_BACKEND_MAP[status] || status.toLowerCase());

    // Call real backend update status endpoint
    api.applications.updateApplicationStatus(id, apiStatus).catch((err) => {
      console.warn('updateApplicationStatus API warning:', err);
    });
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

  const sendNotification = async (payload: SendNotificationPayload): Promise<{ success: boolean; message: string }> => {
    try {
      let res: { message: string; count?: number };
      if (payload.senderRole === 'admin') {
        res = await api.admin.broadcastNotification({
          targetType: payload.targetType,
          candidateIds: payload.target_candidate_ids || payload.applicationIds,
          title: payload.title,
          message: payload.message,
        });
      } else {
        res = await api.notifications.sendNotification({
          message: payload.message,
          target_type: payload.targetType,
          target_candidate_ids: payload.target_candidate_ids || payload.applicationIds,
          applicationIds: payload.applicationIds || payload.target_candidate_ids,
        });
      }

      await refreshNotifications();

      return { success: true, message: res.message || 'Notification sent successfully.' };
    } catch (err: any) {
      console.error('sendNotification error:', err);
      return { success: false, message: err.message || 'Failed to dispatch notification.' };
    }
  };


  const markNotificationAsRead = async (notifId: string): Promise<void> => {
    const candidateEmail = user?.email || 'read';
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, readBy: [...n.readBy, candidateEmail] } : n))
    );
    try {
      await api.notifications.markNotificationAsRead(notifId);
    } catch (err) {
      console.warn('markNotificationAsRead API warning:', err);
    }
  };

  const markAllNotificationsAsRead = async (): Promise<void> => {
    const candidateEmail = user?.email || 'read';
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readBy: [...n.readBy, candidateEmail] }))
    );
  };

  const unreadNotificationCount = notifications.filter(
    (n) => !n.readBy.includes(user?.email || '')
  ).length;

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
        setApplications,
        addApplication,

        updateApplicationStatus,
        updateApplicationNotes,
        deleteApplication,
        broadcastMessages,
        sendBroadcastMessage,
        notifications,
        unreadNotificationCount,
        sendNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        candidateStats,
        refreshCandidateStats,
        isLoading,
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
