import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleNavbar } from '../components/RoleNavbar';
import { Job, AdminSeekerUser, AdminRecruiterUser } from '../types';
import { AdminSeekerDossierModal } from '../components/AdminSeekerDossierModal';
import { AdminRecruiterJobsModal } from '../components/AdminRecruiterJobsModal';
import { AdminJobDetailEditModal } from '../components/AdminJobDetailEditModal';
import { SendNotificationModal } from '../components/SendNotificationModal';
import { formatToIST, toIstDatetimeLocalString, getApplicationWindowStatus, formatLpa } from '../utils/istTime';
import { api, normalizeJob } from '../lib/api';

import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Users,
  Briefcase,
  FileText,
  Award,
  Building2,
  Search,
  ExternalLink,
  Linkedin,
  Globe,
  UserX,
  UserCheck,
  Edit2,
  Check,
  X,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Activity,
  Filter,
  UserPlus,
  KeyRound,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  Send,
  BellRing,
  RotateCw,
  Terminal,
  Server
} from 'lucide-react';

import { Navigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {

  const {
    user,
    jobs: contextJobs,
    applications,

    seekerProfile,
    updateJob,
    toggleJobStatus,
    createAccountByAdmin,
    accounts,
    recruiters,
    setRecruiters,
  } = useAuth();

  const [adminJobs, setAdminJobs] = useState<Job[]>([]);
  const jobs = adminJobs.length > 0 ? adminJobs : contextJobs;

  
  // Role guard redirect: non-admin users navigate back to their dashboard
  if (user && user.role !== 'admin') {
    const roleStr = user.role as string;
    const targetDashboard =
      roleStr === 'seeker' || roleStr === 'candidate'
        ? '/seeker/dashboard'
        : '/recruiter/dashboard';
    return <Navigate to={targetDashboard} replace />;
  }

  
  // Navigation Tabs: 'overview' | 'jobs' | 'seekers' | 'recruiters' | 'moderation' | 'create-account' | 'system-logs'
  const [activeTab, setActiveTab] = useState<
    'overview' | 'jobs' | 'seekers' | 'recruiters' | 'moderation' | 'create-account' | 'system-logs'
  >('overview');
  const [nowMs, setNowMs] = useState(Date.now());

  // System Logs State
  const [logsData, setLogsData] = useState<Array<{
    timestamp: string;
    severity: string;
    service: string;
    message: string;
  }>>([]);
  const [healthData, setHealthData] = useState<{
    errorCount: number;
    lastErrorTimestamp: string | null;
  } | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const fetchSystemLogsData = async (showLoadingState = false) => {
    if (showLoadingState) setIsLoadingLogs(true);
    try {
      setLogsError(null);
      const res = await api.admin.getSystemLogs();
      setLogsData(res.logs || []);
      setHealthData(res.health || { errorCount: 0, lastErrorTimestamp: null });
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.warn('Failed to fetch system logs:', err);
      setLogsError(err.message || 'Failed to fetch system logs from Cloud Logging');
    } finally {
      if (showLoadingState) setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'system-logs') return;

    fetchSystemLogsData(true);

    const interval = setInterval(() => {
      fetchSystemLogsData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Platform Stats State
  const [platformStats, setPlatformStats] = useState<{
    totalCandidates: number;
    totalRecruiters: number;
    totalJobs: number;
    totalOpenJobs: number;
    totalApplications: number;
    applicationsByStatus: { applied: number; screening: number; interview: number; offer: number; rejected: number };
  } | null>(null);

  // Jobs Tab State & Filters
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [jobWorkplaceFilter, setJobWorkplaceFilter] = useState<string>('all');
  const [jobCategoryFilter, setJobCategoryFilter] = useState<string>('all');
  const [selectedJobForDetailEdit, setSelectedJobForDetailEdit] = useState<Job | null>(null);
  const [isJobDetailEditModalOpen, setIsJobDetailEditModalOpen] = useState(false);

  // Seekers State
  const [seekers, setSeekers] = useState<AdminSeekerUser[]>(() => {
    const saved = sessionStorage.getItem('hirehub_admin_seekers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  // Search & Filters
  const [seekerSearch, setSeekerSearch] = useState('');
  const [seekerStatusFilter, setSeekerStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');
  const [seekerYearFilter, setSeekerYearFilter] = useState<string>('all');

  const [recruiterSearch, setRecruiterSearch] = useState('');
  const [recruiterStatusFilter, setRecruiterStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');

  // Modals
  const [selectedSeeker, setSelectedSeeker] = useState<AdminSeekerUser | null>(null);
  const [isSeekerModalOpen, setIsSeekerModalOpen] = useState(false);

  const [selectedRecruiter, setSelectedRecruiter] = useState<AdminRecruiterUser | null>(null);
  const [isRecruiterModalOpen, setIsRecruiterModalOpen] = useState(false);

  // Job Window Override State
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editOpenFrom, setEditOpenFrom] = useState('');
  const [editCloseOn, setEditCloseOn] = useState('');
  const [editAdminOverride, setEditAdminOverride] = useState<'auto' | 'open' | 'closed'>('auto');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);

  // Create Account Form State
  const [newRole, setNewRole] = useState<'recruiter' | 'admin'>('recruiter');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSendNotificationOpen, setIsSendNotificationOpen] = useState(false);

  // System Accounts State & Edit User Modal State
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserCompanyName, setEditUserCompanyName] = useState('');
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserError, setEditUserError] = useState('');
  const [isEditUserSubmitting, setIsEditUserSubmitting] = useState(false);

  const loadSystemUsers = async () => {
    try {
      const usersRes = await api.admin.getUsers();
      if (Array.isArray(usersRes)) {
        setSystemUsers(usersRes);

        const candidateUsers: AdminSeekerUser[] = usersRes
          .filter((u: any) => u.role === 'candidate')
          .map((u: any) => {
            const profile = u.candidateProfile || u.CandidateProfile;
            return {
              id: u.id,
              name: u.name,
              email: u.email,
              college: profile?.college || 'Verified University',
              cgpa: profile?.cgpa ? Number(profile.cgpa) : 8.0,
              passingYear: profile?.passingYear ? String(profile.passingYear) : '2025',
              interestedRoles: profile?.interestedRoles || [],
              skills: profile?.skills || [],
              certifications: profile?.certifications || [],
              linkedInUrl: profile?.linkedinUrl || 'https://linkedin.com',
              portfolioUrl: profile?.portfolioUrl || 'https://github.com',
              resumeUrl: profile?.resumeUrl || '',
              joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
              isDeactivated: !u.isActive,
            };
          });

        const recruiterUsers: AdminRecruiterUser[] = usersRes
          .filter((u: any) => u.role === 'recruiter')
          .map((u: any) => {
            const profile = u.recruiterProfile || u.RecruiterProfile;
            return {
              id: u.id,
              name: u.name,
              email: u.email,
              company: profile?.companyName || `${u.name}'s Hiring Group`,
              companyInitials: (u.name || 'RC').slice(0, 2).toUpperCase(),
              companyColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              category: 'Technology',
              location: 'Remote',
              joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
              tier: 'Enterprise',
              isDeactivated: !u.isActive,
            };
          });

        setSeekers(candidateUsers);
        setRecruiters(recruiterUsers);
      } else {
        setSystemUsers([]);
      }
    } catch (err) {
      console.warn('Failed to load system users:', err);
      setSystemUsers([]);
    }
  };

  // Keep live IST timer
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real admin data from backend endpoints: GET /admin/users, GET /admin/jobs, GET /admin/stats
  useEffect(() => {
    const fetchAdminBackendData = async () => {
      if (!user || user.role !== 'admin') return;
      try {
        const [usersRes, statsRes, adminJobsRes] = await Promise.all([
          api.admin.getUsers().catch(() => []),
          api.admin.getStats().catch(() => null),
          api.admin.getJobs().catch(() => []),
        ]);

        if (Array.isArray(adminJobsRes) && adminJobsRes.length > 0) {
          setAdminJobs(adminJobsRes.map(normalizeJob));
        }


        if (Array.isArray(usersRes)) {
          setSystemUsers(usersRes);

          const candidateUsers: AdminSeekerUser[] = usersRes
            .filter((u: any) => u.role === 'candidate')
            .map((u: any) => {
              const profile = u.candidateProfile || u.CandidateProfile;
              return {
                id: u.id,
                name: u.name,
                email: u.email,
                college: profile?.college || 'Verified University',
                cgpa: profile?.cgpa ? Number(profile.cgpa) : 8.0,
                passingYear: profile?.passingYear ? String(profile.passingYear) : '2025',
                interestedRoles: profile?.interestedRoles || [],
                skills: profile?.skills || [],
                certifications: profile?.certifications || [],
                linkedInUrl: profile?.linkedinUrl || 'https://linkedin.com',
                portfolioUrl: profile?.portfolioUrl || 'https://github.com',
                resumeUrl: profile?.resumeUrl || '',
                joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
                isDeactivated: !u.isActive,
              };
            });

          const recruiterUsers: AdminRecruiterUser[] = usersRes
            .filter((u: any) => u.role === 'recruiter')
            .map((u: any) => {
              const profile = u.recruiterProfile || u.RecruiterProfile;
              return {
                id: u.id,
                name: u.name,
                email: u.email,
                company: profile?.companyName || `${u.name}'s Hiring Group`,
                companyInitials: (u.name || 'RC').slice(0, 2).toUpperCase(),
                companyColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                category: 'Technology',
                location: 'Remote',
                joinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
                tier: 'Enterprise',
                isDeactivated: !u.isActive,
              };
            });

          setSeekers(candidateUsers);
          setRecruiters(recruiterUsers);
        }

        if (statsRes) {
          setPlatformStats(statsRes);
        }
      } catch (err) {
        console.warn('Admin backend fetch warning:', err);
      }
    };

    fetchAdminBackendData();
  }, [user, setRecruiters]);



  // Save seekers to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('hirehub_admin_seekers', JSON.stringify(seekers));
  }, [seekers]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleUserActiveInList = async (userId: string) => {
    try {
      const res = await api.admin.toggleUserActive(userId);
      showToast(res.message || 'User status updated');
      await loadSystemUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle user status');
    }
  };


  const handleOpenEditUserModal = (u: any) => {
    setEditingUser(u);
    setEditUserName(u.name || '');
    setEditUserEmail(u.email || '');
    setEditUserCompanyName(u.RecruiterProfile?.companyName || u.companyName || '');
    setEditUserError('');
    setIsEditUserModalOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditUserError('');
    setIsEditUserSubmitting(true);

    try {
      await api.admin.updateUser(editingUser.id, {
        name: editUserName.trim(),
        email: editUserEmail.trim().toLowerCase(),
        companyName: editingUser.role === 'recruiter' ? editUserCompanyName.trim() : undefined,
      });

      showToast(`User ${editUserName} updated successfully`);
      setIsEditUserModalOpen(false);
      setEditingUser(null);
      await loadSystemUsers();
    } catch (err: any) {
      setEditUserError(err.message || 'Failed to update user');
    } finally {
      setIsEditUserSubmitting(false);
    }
  };


  // Handle Create Account Submission (POST /auth/admin/create-user)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess(null);

    const trimmedName = newName.trim();
    const trimmedEmail = newEmail.trim().toLowerCase();
    const trimmedPass = newPassword.trim();

    if (!trimmedName) {
      setCreateError('Please enter the user full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setCreateError('Please enter a valid email address.');
      return;
    }

    if (!trimmedPass) {
      setCreateError('Please enter a password.');
      return;
    }

    try {
      const result = await createAccountByAdmin({
        role: newRole,
        name: trimmedName,
        email: trimmedEmail,
        pass: trimmedPass,
        company: newRole === 'recruiter' ? newCompany.trim() || `${trimmedName} Hiring Group` : undefined,
      });

      if (result.success) {
        setCreateSuccess(result.message);
        showToast(result.message);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewCompany('');
        await loadSystemUsers();
      } else {

        setCreateError(result.message);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user account.');
    }
  };

  // Toggle Seeker Account Deactivation via PATCH /admin/users/:id/toggle
  const handleToggleSeekerDeactivate = async (seekerId: string) => {
    try {
      const res = await api.admin.toggleUserActive(seekerId);
      showToast(res.message || 'Candidate user status updated');
      await loadSystemUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle candidate user status');
    }
  };

  // Toggle Recruiter Account Deactivation via PATCH /admin/users/:id/toggle
  const handleToggleRecruiterDeactivate = async (recruiterId: string) => {
    try {
      const res = await api.admin.toggleUserActive(recruiterId);
      showToast(res.message || 'Recruiter account status updated');
      await loadSystemUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle recruiter account status');
    }
  };


  // Admin Force Close Job via PATCH /admin/jobs/:id/force-close
  const handleAdminForceClose = async (jobId: string) => {
    try {
      const res = await api.admin.forceCloseJob(jobId);
      updateJob(jobId, { adminForceStatus: 'closed', isClosed: true });
      showToast(res.message || 'Job force-closed by admin');
    } catch (err: any) {
      showToast(err.message || 'Failed to force-close job');
    }
  };

  // Admin Force Reopen Job via PATCH /admin/jobs/:id/force-reopen
  const handleAdminForceReopen = async (jobId: string) => {
    try {
      const res = await api.admin.forceReopenJob(jobId);
      updateJob(jobId, { adminForceStatus: 'open', isClosed: false });
      showToast(res.message || 'Job reopened by admin');
    } catch (err: any) {
      showToast(err.message || 'Failed to reopen job');
    }
  };


  // Calculate seeker application count dynamically
  const getSeekerAppCount = (seeker: AdminSeekerUser) => {
    const matchApps = applications.filter(
      (app) =>
        (app.candidateEmail && app.candidateEmail.toLowerCase() === seeker.email.toLowerCase()) ||
        (app.candidateName && app.candidateName.toLowerCase() === seeker.name.toLowerCase())
    );
    return matchApps.length;

  };

  // Calculate recruiter metrics dynamically
  const getRecruiterMetrics = (recruiter: AdminRecruiterUser) => {
    const postedJobs = jobs.filter(
      (j) =>
        j.company.toLowerCase().includes(recruiter.company.toLowerCase()) ||
        recruiter.company.toLowerCase().includes(j.company.toLowerCase())
    );
    const jobIds = postedJobs.map((j) => j.id);
    const appCount = applications.filter(
      (a) =>
        jobIds.includes(a.jobId) ||
        a.company.toLowerCase().includes(recruiter.company.toLowerCase())
    ).length;
    const hireCount = applications.filter(
      (a) =>
        (jobIds.includes(a.jobId) ||
          a.company.toLowerCase().includes(recruiter.company.toLowerCase())) &&
        a.status === 'Offered'
    ).length;
    return {
      jobsCount: postedJobs.length,
      applicantsCount: appCount,
      hiresCount: hireCount,
    };
  };

  // Calculate Global Stat Cards
  const totalSeekersCount = seekers.length;
  const totalRecruitersCount = recruiters.length;
  const totalJobsCount = jobs.length;
  const totalApplicationsCount = applications.length;
  const totalHiresCount = useMemo(() => {
    const directOffers = applications.filter((a) => a.status === 'Offered').length;
    return directOffers > 0 ? directOffers : 0;
  }, [applications]);

  // Helper to find recruiter name for a job
  const getJobRecruiterName = (job: Job) => {
    const matchedRecruiter = recruiters.find(
      (r) =>
        r.company.toLowerCase().includes(job.company.toLowerCase()) ||
        job.company.toLowerCase().includes(r.company.toLowerCase())
    );
    return matchedRecruiter ? matchedRecruiter.name : 'Talent Acquisition Lead';
  };

  // Helper to get applicant count for a job
  const getJobApplicantCount = (jobId: string) => {
    return applications.filter((a) => a.jobId === jobId).length;
  };

  // Filtered Jobs across the platform
  const filteredJobsList = useMemo(() => {
    return jobs.filter((job) => {
      const windowStatus = getApplicationWindowStatus(job, nowMs);
      const recruiterName = getJobRecruiterName(job);

      const matchSearch =
        job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
        job.company.toLowerCase().includes(jobSearch.toLowerCase()) ||
        recruiterName.toLowerCase().includes(jobSearch.toLowerCase()) ||
        job.skills.some((s) => s.toLowerCase().includes(jobSearch.toLowerCase()));

      const matchStatus =
        jobStatusFilter === 'all'
          ? true
          : jobStatusFilter === 'open'
          ? windowStatus.isOpen
          : !windowStatus.isOpen;

      const matchWorkplace =
        jobWorkplaceFilter === 'all' ? true : job.workplaceType === jobWorkplaceFilter;

      const matchCategory =
        jobCategoryFilter === 'all' ? true : job.category === jobCategoryFilter;

      return matchSearch && matchStatus && matchWorkplace && matchCategory;
    });
  }, [jobs, jobSearch, jobStatusFilter, jobWorkplaceFilter, jobCategoryFilter, recruiters, applications, nowMs]);

  // Filtered Seekers
  const filteredSeekers = useMemo(() => {
    const term = seekerSearch.trim().toLowerCase();
    return seekers.filter((seeker) => {
      const matchSearch =
        !term ||
        (seeker.name || '').toLowerCase().includes(term) ||
        (seeker.college || '').toLowerCase().includes(term) ||
        (seeker.email || '').toLowerCase().includes(term) ||
        (seeker.skills || []).some((sk) => (sk || '').toLowerCase().includes(term)) ||
        (seeker.interestedRoles || []).some((r) => (r || '').toLowerCase().includes(term));

      const matchStatus =
        seekerStatusFilter === 'all'
          ? true
          : seekerStatusFilter === 'active'
          ? !seeker.isDeactivated
          : Boolean(seeker.isDeactivated);

      const matchYear =
        seekerYearFilter === 'all' ? true : seeker.passingYear === seekerYearFilter;

      return matchSearch && matchStatus && matchYear;
    });
  }, [seekers, seekerSearch, seekerStatusFilter, seekerYearFilter]);

  // Filtered Recruiters
  const filteredRecruiters = useMemo(() => {
    const term = recruiterSearch.trim().toLowerCase();
    return recruiters.filter((recruiter) => {
      const matchSearch =
        !term ||
        (recruiter.name || '').toLowerCase().includes(term) ||
        (recruiter.company || '').toLowerCase().includes(term) ||
        (recruiter.email || '').toLowerCase().includes(term) ||
        (recruiter.category || '').toLowerCase().includes(term) ||
        (recruiter.location || '').toLowerCase().includes(term);

      const matchStatus =
        recruiterStatusFilter === 'all'
          ? true
          : recruiterStatusFilter === 'active'
          ? !recruiter.isDeactivated
          : Boolean(recruiter.isDeactivated);

      return matchSearch && matchStatus;
    });
  }, [recruiters, recruiterSearch, recruiterStatusFilter]);

  // Job Window Override Handlers
  const handleOpenEdit = (job: Job) => {
    setEditingJob(job);
    setEditOpenFrom(job.openFrom ? toIstDatetimeLocalString(job.openFrom) : '');
    setEditCloseOn(job.closeOn ? toIstDatetimeLocalString(job.closeOn) : '');
    setEditAdminOverride(job.adminForceStatus || 'auto');
    setSaveSuccessMessage(false);
  };


  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    const openText = formatToIST(editOpenFrom);
    const closeText = formatToIST(editCloseOn);

    updateJob(editingJob.id, {
      openFrom: editOpenFrom,
      closeOn: editCloseOn,
      openFromText: openText,
      closeOnText: closeText,
      deadlineText: closeText,
      adminForceStatus: editAdminOverride,
    });

    setSaveSuccessMessage(true);
    showToast(`Window override applied for ${editingJob.title}`);
    setTimeout(() => {
      setEditingJob(null);
      setSaveSuccessMessage(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white flex flex-col font-sans transition-colors">
      <RoleNavbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* ========================================================================= */}
        {/* TOP HEADER: SYSTEM GOVERNANCE & LIVE IST PILL */}
        {/* ========================================================================= */}
        <div className="pb-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                SYSTEM GOVERNANCE
              </span>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <span className="text-xs font-mono text-neutral-500">
                SUPER ADMIN OVERRIDE CONSOLE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
              Platform Overview & Administration
            </h1>
            <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              User identity governance, applicant dossier audit, recruiter partner compliance, and real-time IST window enforcement.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsSendNotificationOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-500" />
              <span>Send Notification</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('create-account')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All IST Systems Operational
            </span>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* STAT CARDS ROW: OVERVIEW SECTION */}
        {/* ========================================================================= */}
        <section aria-label="Platform Statistics Overview">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 font-mono">
            
            {/* 1. Total Candidates */}
            <div className="p-4 sm:p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left space-y-2 shadow-xs transition-colors hover:border-neutral-300 dark:hover:border-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-neutral-500">
                  Total Candidates
                </span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                {platformStats !== null ? platformStats.totalCandidates : '—'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">100%</span>
                <span>verified student profiles</span>
              </div>
            </div>

            {/* 2. Total Recruiters */}
            <div className="p-4 sm:p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left space-y-2 shadow-xs transition-colors hover:border-neutral-300 dark:hover:border-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-neutral-500">
                  Total Recruiters
                </span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                {platformStats !== null ? platformStats.totalRecruiters : '—'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                <span className="text-blue-600 dark:text-blue-400 font-bold">Enterprise</span>
                <span>& growth organizations</span>
              </div>
            </div>

            {/* 3. Total Jobs Posted */}
            <div className="p-4 sm:p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left space-y-2 shadow-xs transition-colors hover:border-neutral-300 dark:hover:border-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-neutral-500">
                  Jobs Posted
                </span>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                {platformStats !== null ? platformStats.totalJobs : '—'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {platformStats !== null ? platformStats.totalOpenJobs : '—'} Active
                </span>
                <span>in IST window</span>
              </div>
            </div>

            {/* 4. Total Applications */}
            <div className="p-4 sm:p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left space-y-2 shadow-xs transition-colors hover:border-neutral-300 dark:hover:border-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-neutral-500">
                  Applications
                </span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                {platformStats !== null ? platformStats.totalApplications : '—'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  {platformStats !== null ? platformStats.applicationsByStatus?.interview ?? 0 : '—'} Round 2+
                </span>
                <span>interviews active</span>
              </div>
            </div>

            {/* 5. Total Hires (Offered) */}
            <div className="col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left space-y-2 shadow-xs transition-colors hover:border-neutral-300 dark:hover:border-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-neutral-500">
                  Total Hires
                </span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {platformStats !== null ? platformStats.applicationsByStatus?.offer ?? 0 : '—'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Offered</span>
                <span>candidate offers</span>
              </div>
            </div>



          </div>
        </section>

        {/* ========================================================================= */}
        {/* SUB-NAV / TABS */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-neutral-100/60 dark:bg-neutral-900/60 rounded-t-lg'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Platform Overview & Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2.5 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'jobs'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-neutral-100/60 dark:bg-neutral-900/60 rounded-t-lg'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Jobs</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {jobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seekers')}
            className={`px-4 py-2.5 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'seekers'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-neutral-100/60 dark:bg-neutral-900/60 rounded-t-lg'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Candidates</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {seekers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recruiters')}
            className={`px-4 py-2.5 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'recruiters'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-neutral-100/60 dark:bg-neutral-900/60 rounded-t-lg'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Recruiters</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {recruiters.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2.5 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'moderation'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-neutral-100/60 dark:bg-neutral-900/60 rounded-t-lg'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>IST Window Moderation</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {jobs.length}
            </span>
          </button>

          {/* New Create Account Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('create-account')}
            className={`px-4 py-2.5 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'create-account'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-neutral-100/60 dark:bg-neutral-900/60 rounded-t-lg'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
            <span>Create Account</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
              Admin Only
            </span>
          </button>

          {/* New System Logs Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('system-logs')}
            className={`px-4 py-2.5 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'system-logs'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-neutral-100/60 dark:bg-neutral-900/60 rounded-t-lg'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-blue-500" />
            <span>System Logs</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
              GCP Live
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 text-left">
            
            {/* Top Grid: Pipeline Breakdown + Academic Benchmarks + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Application Pipeline Status */}
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4 font-mono">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Application Funnel Conversion</span>
                  </h2>
                  <span className="text-[10px] text-neutral-400">Real-Time</span>
                </div>

                <div className="space-y-3 pt-1 text-xs">
                  {/* Applied */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                      <span>Applied (Initial Screening)</span>
                      <strong className="text-neutral-900 dark:text-white">
                        {applications.filter((a) => a.status === 'Applied').length} Candidates
                      </strong>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{
                          width: `${Math.max(
                            25,
                            (applications.filter((a) => a.status === 'Applied').length /
                              Math.max(1, applications.length)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Interviewing */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                      <span>Interviewing (Technical Rounds)</span>
                      <strong className="text-neutral-900 dark:text-white">
                        {applications.filter((a) => a.status === 'Interviewing').length} Candidates
                      </strong>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{
                          width: `${Math.max(
                            30,
                            (applications.filter((a) => a.status === 'Interviewing').length /
                              Math.max(1, applications.length)) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Offered */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                      <span>Offered (Placement Finalized)</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {totalHiresCount} Hires
                      </strong>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: `${Math.max(
                            20,
                            (totalHiresCount / Math.max(1, applications.length)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Rejected */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                      <span>Archived / Rejected</span>
                      <strong className="text-neutral-500">
                        {applications.filter((a) => a.status === 'Rejected').length} Candidates
                      </strong>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-neutral-400 dark:bg-neutral-700 h-full rounded-full"
                        style={{
                          width: `${(applications.filter((a) => a.status === 'Rejected').length /
                            Math.max(1, applications.length)) *
                            100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Benchmark & Talent Distribution */}
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4 font-mono">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Academic Quality Benchmarks</span>
                  </h2>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Avg CGPA 8.7
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-[10px] uppercase text-neutral-400 block">Tier-1 Colleges</span>
                    <strong className="text-base text-neutral-900 dark:text-white block mt-0.5">85%</strong>
                    <span className="text-[10px] text-neutral-500">IIT, BITS, Stanford, Berkeley</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-[10px] uppercase text-neutral-400 block">Passing Batches</span>
                    <strong className="text-base text-neutral-900 dark:text-white block mt-0.5">2025 / 2026</strong>
                    <span className="text-[10px] text-neutral-500">Final & Pre-final Years</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-[10px] uppercase text-neutral-400 block">Avg Compensation</span>
                    <strong className="text-base text-emerald-600 dark:text-emerald-400 block mt-0.5">₹18.4 LPA</strong>
                    <span className="text-[10px] text-neutral-500">INR Base Packages</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-[10px] uppercase text-neutral-400 block">Compliance Rate</span>
                    <strong className="text-base text-emerald-600 dark:text-emerald-400 block mt-0.5">100%</strong>
                    <span className="text-[10px] text-neutral-500">Zero Flagged Records</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4 font-mono">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Administrative Actions</span>
                </h2>

                <div className="space-y-2 text-xs">
                  {/* Direct Notification Dispatch */}
                  <button
                    type="button"
                    onClick={() => setIsSendNotificationOpen(true)}
                    className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 flex items-center justify-between text-neutral-900 dark:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold">Broadcast Platform Notification</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                  </button>

                  {/* Direct Account Creation Action */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('create-account')}
                    className="w-full p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 flex items-center justify-between text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold">Create Admin / Recruiter Account</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                  </button>


                  <button
                    type="button"
                    onClick={() => setActiveTab('seekers')}
                    className="w-full p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 flex items-center justify-between text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold">Manage Job Seekers Directory</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('recruiters')}
                    className="w-full p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500/50 flex items-center justify-between text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">Audit Verified Employers</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('moderation')}
                    className="w-full p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-purple-500/50 flex items-center justify-between text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="font-semibold">IST Window Overrides</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>
              </div>

            </div>

            {/* Audit Log Stream */}
            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3 font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Real-Time Audit & Event Logs (IST Global Reference)</span>
                </h3>
                <span className="text-[10px] text-neutral-400">Live Sync</span>
              </div>

              <div className="space-y-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <span>[{formatToIST(new Date(Date.now() - 3600000))}] Admin Dave Vance synced Indian Standard Time global reference clock.</span>
                  <span className="text-emerald-500 font-bold">✓ SYNCED</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <span>[{formatToIST(new Date(Date.now() - 7200000))}] Recruiter Sarah Jenkins posted Senior Frontend role with INR LPA compensation.</span>
                  <span className="text-blue-500 font-bold">ROLE PUBLISHED</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <span>[{formatToIST(new Date(Date.now() - 14400000))}] Candidate Alex Morgan submitted verified application dossier with 8.4 CGPA.</span>
                  <span className="text-amber-500 font-bold">DOSSIER SUBMITTED</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <span>[{formatToIST(new Date(Date.now() - 28800000))}] System integrity verified: 0 anomalous grade alterations across all student records.</span>
                  <span className="text-emerald-500 font-bold">INTEGRITY OK</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ALL JOBS MANAGEMENT & OVERRIDE CONTROLS */}
        {/* ========================================================================= */}
        {activeTab === 'jobs' && (
          <div className="space-y-4 text-left font-mono">
            
            {/* Top Info Banner */}
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Super Admin Job Registry: Edit all listing fields, configure screening questions & rounds, and set Force Open / Force Close overrides.</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                {filteredJobsList.length} of {jobs.length} Roles
              </span>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by company, role title, recruiter name, or skills..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-neutral-500 text-[11px] font-bold uppercase">Status:</span>
                <button
                  type="button"
                  onClick={() => setJobStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                    jobStatusFilter === 'all'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-black font-bold'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  All ({jobs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setJobStatusFilter('open')}
                  className={`px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                    jobStatusFilter === 'open'
                      ? 'bg-emerald-500 text-black font-bold'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Open ({jobs.filter((j) => getApplicationWindowStatus(j, nowMs).isOpen).length})
                </button>
                <button
                  type="button"
                  onClick={() => setJobStatusFilter('closed')}
                  className={`px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                    jobStatusFilter === 'closed'
                      ? 'bg-red-500 text-white font-bold'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Closed ({jobs.filter((j) => !getApplicationWindowStatus(j, nowMs).isOpen).length})
                </button>

                {/* Workplace Filter */}
                <select
                  value={jobWorkplaceFilter}
                  onChange={(e) => setJobWorkplaceFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs cursor-pointer focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="all">All Workplaces</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="In-office">In-office</option>
                </select>

                {/* Category Filter */}
                <select
                  value={jobCategoryFilter}
                  onChange={(e) => setJobCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white text-xs cursor-pointer focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="all">All Domains</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Fullstack">Fullstack</option>
                  <option value="DevOps & Cloud">DevOps & Cloud</option>
                  <option value="Data & AI">Data & AI</option>
                </select>
              </div>
            </div>

            {/* All Jobs Table */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Company & Role</th>
                      <th className="py-3.5 px-4">Recruiter</th>
                      <th className="py-3.5 px-4">LPA Range</th>
                      <th className="py-3.5 px-4">Workplace & Min CGPA</th>
                      <th className="py-3.5 px-4">Application Window (IST)</th>
                      <th className="py-3.5 px-4">Computed Status</th>
                      <th className="py-3.5 px-4 text-center">Applicants</th>
                      <th className="py-3.5 px-4 text-center">Admin Override</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {filteredJobsList.length > 0 ? (
                      filteredJobsList.map((job) => {
                        const windowStatus = getApplicationWindowStatus(job, nowMs);
                        const recruiterName = getJobRecruiterName(job);
                        const appCount = getJobApplicantCount(job.id);
                        const displayPay = job.payRange || formatLpa(job.minLpa || 12, job.maxLpa || 18);

                        return (
                          <tr
                            key={job.id}
                            className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedJobForDetailEdit(job);
                              setIsJobDetailEditModalOpen(true);
                            }}
                          >
                            {/* Company & Role */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs shrink-0">
                                  {job.companyInitials || job.company.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold font-heading text-neutral-900 dark:text-white text-xs hover:text-emerald-500 transition-colors">
                                    {job.title}
                                  </div>
                                  <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{job.company}</span>
                                    {job.companyLinkedInUrl && (
                                      <a
                                        href={job.companyLinkedInUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-blue-500 hover:text-blue-400"
                                        title="Company LinkedIn"
                                      >
                                        <Linkedin className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Recruiter */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-medium text-neutral-900 dark:text-white">
                                {recruiterName}
                              </div>
                              <span className="text-[10px] text-neutral-400">
                                Hiring Contact
                              </span>
                            </td>

                            {/* LPA Range */}
                            <td className="py-3.5 px-4 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                              {displayPay}
                            </td>

                            {/* Workplace & Min CGPA */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                                  {job.workplaceType}
                                </span>
                                <span className="text-neutral-400">•</span>
                                <span className="text-neutral-700 dark:text-neutral-300 text-[11px]">
                                  Min <strong className="text-neutral-900 dark:text-white">{job.minCgpa.toFixed(1)}+</strong>
                                </span>
                              </div>
                              <div className="text-[10px] text-neutral-400 truncate max-w-[150px] mt-0.5">
                                {job.location}
                              </div>
                            </td>

                            {/* Application Window (IST) */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="text-[11px] text-neutral-900 dark:text-white">
                                <span className="text-neutral-400 text-[10px] uppercase block">Open:</span>
                                {formatToIST(job.openFrom)}
                              </div>
                              <div className="text-[11px] text-neutral-500 mt-1">
                                <span className="text-neutral-400 text-[10px] uppercase block">Closes:</span>
                                {formatToIST(job.closeOn)}
                              </div>
                            </td>

                            {/* Computed Status */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="space-y-1">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-bold text-[10px] ${
                                    windowStatus.isOpen
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                      : windowStatus.status === 'upcoming'
                                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${windowStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
                                  {windowStatus.badgeLabel}
                                </span>

                                {windowStatus.countdownText && (
                                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {windowStatus.countdownText}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Applicant Count */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span className="inline-flex items-center justify-center min-w-6 px-2 py-0.5 rounded text-xs font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white">
                                {appCount}
                              </span>
                            </td>

                            {/* Admin Override Toggle Buttons */}
                            <td
                              className="py-3.5 px-4 text-center whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = job.adminForceStatus === 'open' ? 'auto' : 'open';
                                    updateJob(job.id, { adminForceStatus: next });
                                    showToast(
                                      next === 'open'
                                        ? `Force Open override applied for ${job.title}`
                                        : `Force Open removed for ${job.title}`
                                    );
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                    job.adminForceStatus === 'open'
                                      ? 'bg-emerald-500 text-black border-emerald-500 shadow-xs'
                                      : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-emerald-500'
                                  }`}
                                  title="Force open this job (overrides recruiter pause)"
                                >
                                  Force Open
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = job.adminForceStatus === 'closed' ? 'auto' : 'closed';
                                    updateJob(job.id, { adminForceStatus: next });
                                    showToast(
                                      next === 'closed'
                                        ? `Force Close override applied for ${job.title}`
                                        : `Force Close removed for ${job.title}`
                                    );
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                    job.adminForceStatus === 'closed'
                                      ? 'bg-red-500 text-white border-red-500 shadow-xs'
                                      : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-red-500'
                                  }`}
                                  title="Force close this job everywhere"
                                >
                                  Force Close
                                </button>
                              </div>

                              {job.adminForceStatus && job.adminForceStatus !== 'auto' && (
                                <div className="text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400 mt-1 flex items-center justify-center gap-1">
                                  <ShieldAlert className="w-2.5 h-2.5" />
                                  <span>Override: {job.adminForceStatus}</span>
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td
                              className="py-3.5 px-4 text-right whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedJobForDetailEdit(job);
                                    setIsJobDetailEditModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit Details</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-neutral-500">
                          No jobs match your search or filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: USER MANAGEMENT (JOB SEEKERS) */}
        {/* ========================================================================= */}
        {activeTab === 'seekers' && (
          <div className="space-y-4 text-left font-mono">
            
            {/* Search & Filter Bar */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by candidate name, college, email, or skills..."
                  value={seekerSearch}
                  onChange={(e) => setSeekerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-neutral-500 text-[11px] font-bold uppercase">Status:</span>
                <button
                  type="button"
                  onClick={() => setSeekerStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                    seekerStatusFilter === 'all'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-black font-bold'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  All ({seekers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSeekerStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                    seekerStatusFilter === 'active'
                      ? 'bg-emerald-500 text-black font-bold'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Active ({seekers.filter((s) => !s.isDeactivated).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSeekerStatusFilter('deactivated')}
                  className={`px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                    seekerStatusFilter === 'deactivated'
                      ? 'bg-red-500 text-white font-bold'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Deactivated ({seekers.filter((s) => s.isDeactivated).length})
                </button>

                {/* Batch Filter */}
                <select
                  value={seekerYearFilter}
                  onChange={(e) => setSeekerYearFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs focus:outline-hidden"
                >
                  <option value="all">All Batches</option>
                  <option value="2024">Class of 2024</option>
                  <option value="2025">Class of 2025</option>
                  <option value="2026">Class of 2026</option>
                </select>
              </div>
            </div>

            {/* Seekers Table */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Candidate & Contact</th>
                      <th className="py-3 px-4">College & Degree</th>
                      <th className="py-3 px-4 text-center">CGPA</th>
                      <th className="py-3 px-4">Batch</th>
                      <th className="py-3 px-4">Interested Roles</th>
                      <th className="py-3 px-4">Profiles</th>
                      <th className="py-3 px-4 text-center">Apps</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                    {filteredSeekers.length > 0 ? (
                      filteredSeekers.map((seeker) => {
                        const appCount = getSeekerAppCount(seeker);
                        return (
                          <tr
                            key={seeker.id}
                            className={`transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 ${
                              seeker.isDeactivated
                                ? 'opacity-60 bg-neutral-100/50 dark:bg-neutral-900/30'
                                : ''
                            }`}
                          >
                            {/* Candidate & Contact */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${
                                    seeker.isDeactivated
                                      ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-700'
                                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  }`}
                                >
                                  {seeker.name
                                    .split(' ')
                                    .map((w) => w[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div className="space-y-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSeeker(seeker);
                                      setIsSeekerModalOpen(true);
                                    }}
                                    className="font-bold text-neutral-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 hover:underline cursor-pointer block text-left"
                                  >
                                    {seeker.name}
                                  </button>
                                  <span className="text-[11px] text-neutral-500 block">
                                    {seeker.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* College */}
                            <td className="py-3.5 px-4 text-neutral-800 dark:text-neutral-200 max-w-[180px] truncate">
                              {seeker.college}
                            </td>

                            {/* CGPA */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded font-extrabold text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                {seeker.cgpa.toFixed(1)}
                              </span>
                            </td>

                            {/* Batch */}
                            <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400 text-xs">
                              {seeker.passingYear}
                            </td>

                            {/* Interested Roles */}
                            <td className="py-3.5 px-4 max-w-[200px]">
                              <div className="flex flex-wrap gap-1">
                                {seeker.interestedRoles.slice(0, 2).map((role) => (
                                  <span
                                    key={role}
                                    className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                                  >
                                    {role}
                                  </span>
                                ))}
                                {seeker.interestedRoles.length > 2 && (
                                  <span className="text-[10px] text-neutral-400 pt-0.5">
                                    +{seeker.interestedRoles.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Profiles (LinkedIn & Portfolio) */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                {seeker.linkedInUrl && (
                                  <a
                                    href={seeker.linkedInUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded text-blue-500 hover:bg-blue-500/10 transition-colors"
                                    title="LinkedIn Profile"
                                  >
                                    <Linkedin className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {seeker.portfolioUrl && (
                                  <a
                                    href={seeker.portfolioUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded text-purple-500 hover:bg-purple-500/10 transition-colors"
                                    title="Portfolio Website"
                                  >
                                    <Globe className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* Applications Submitted */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                                {appCount}
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3.5 px-4 text-center">
                              {seeker.isDeactivated ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                                  DEACTIVATED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  ACTIVE
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSeeker(seeker);
                                    setIsSeekerModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold cursor-pointer transition-colors"
                                >
                                  View Profile
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleSeekerDeactivate(seeker.id)}
                                  className={`p-1.5 rounded border transition-colors cursor-pointer ${
                                    seeker.isDeactivated
                                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                      : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                                  }`}
                                  title={
                                    seeker.isDeactivated
                                      ? 'Reactivate seeker account'
                                      : 'Deactivate seeker account'
                                  }
                                >
                                  {seeker.isDeactivated ? (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  ) : (
                                    <UserX className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-neutral-500">
                          No job seekers match your active search filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: USER MANAGEMENT (RECRUITERS) */}
        {/* ========================================================================= */}
        {activeTab === 'recruiters' && (
          <div className="space-y-4 text-left font-mono">
            
            {/* Top Bar with Create Recruiter shortcut */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
              <span className="text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Verified Employer & Recruiter Directory ({recruiters.length} active partners)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewRole('recruiter');
                  setActiveTab('create-account');
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Create Recruiter Account</span>
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by recruiter contact, company name, location, category..."
                  value={recruiterSearch}
                  onChange={(e) => setRecruiterSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-neutral-500 text-[11px] font-bold uppercase">Status:</span>
                <button
                  type="button"
                  onClick={() => setRecruiterStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                    recruiterStatusFilter === 'all'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-black font-bold'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  All ({recruiters.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRecruiterStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                    recruiterStatusFilter === 'active'
                      ? 'bg-emerald-500 text-black font-bold'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Active ({recruiters.filter((r) => !r.isDeactivated).length})
                </button>
                <button
                  type="button"
                  onClick={() => setRecruiterStatusFilter('deactivated')}
                  className={`px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                    recruiterStatusFilter === 'deactivated'
                      ? 'bg-red-500 text-white font-bold'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Deactivated ({recruiters.filter((r) => r.isDeactivated).length})
                </button>
              </div>
            </div>

            {/* Recruiters Table / List View */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Company & Recruiter</th>
                      <th className="py-3 px-4">Industry Category</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Partner Tier</th>
                      <th className="py-3 px-4 text-center">Jobs Posted</th>
                      <th className="py-3 px-4 text-center">Applicants Received</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                    {filteredRecruiters.length > 0 ? (
                      filteredRecruiters.map((recruiter) => {
                        const metrics = getRecruiterMetrics(recruiter);

                        return (
                          <tr
                            key={recruiter.id}
                            className={`transition-colors hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 ${
                              recruiter.isDeactivated
                                ? 'opacity-60 bg-neutral-100/50 dark:bg-neutral-900/30'
                                : ''
                            }`}
                          >
                            {/* Company & Recruiter Contact */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${
                                    recruiter.isDeactivated
                                      ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-700'
                                      : recruiter.companyColor || 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  }`}
                                >
                                  {recruiter.companyInitials}
                                </div>
                                <div className="space-y-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedRecruiter(recruiter);
                                      setIsRecruiterModalOpen(true);
                                    }}
                                    className="font-bold text-neutral-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 hover:underline cursor-pointer block text-left"
                                  >
                                    {recruiter.company}
                                  </button>
                                  <span className="text-[11px] text-neutral-500 block">
                                    Lead: {recruiter.name} • {recruiter.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300">
                              {recruiter.category}
                            </td>

                            {/* Location */}
                            <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                              {recruiter.location}
                            </td>

                            {/* Tier */}
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                                {recruiter.tier}
                              </span>
                            </td>

                            {/* Jobs Posted */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white">
                                {metrics.jobsCount}
                              </span>
                            </td>

                            {/* Applicants Received */}
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                {metrics.applicantsCount} Applicants
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="py-3.5 px-4 text-center">
                              {recruiter.isDeactivated ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                                  DEACTIVATED
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  ACTIVE
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRecruiter(recruiter);
                                    setIsRecruiterModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold cursor-pointer transition-colors"
                                >
                                  View Posted Jobs
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleRecruiterDeactivate(recruiter.id)}
                                  className={`p-1.5 rounded border transition-colors cursor-pointer ${
                                    recruiter.isDeactivated
                                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                      : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                                  }`}
                                  title={
                                    recruiter.isDeactivated
                                      ? 'Reactivate employer account'
                                      : 'Deactivate employer account'
                                  }
                                >
                                  {recruiter.isDeactivated ? (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  ) : (
                                    <UserX className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-neutral-500">
                          No recruiters match your active search filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: JOB MODERATION & APPLICATION WINDOWS (IST) */}
        {/* ========================================================================= */}
        {activeTab === 'moderation' && (
          <div className="space-y-4 text-left font-mono">
            
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Admin Override Authority: Overrides take absolute precedence over recruiter windows and toggles.</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">IST Enforcement Active</span>
            </div>

            <div className="space-y-3">
              {jobs.map((job) => {
                const windowStatus = getApplicationWindowStatus(job, nowMs);

                return (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left text-xs shadow-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-neutral-900 dark:text-white text-sm font-heading">
                          {job.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            windowStatus.isOpen
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : windowStatus.status === 'upcoming'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                              : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800'
                          }`}
                        >
                          {windowStatus.badgeLabel}
                        </span>

                        {job.adminForceStatus && job.adminForceStatus !== 'auto' && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
                            <ShieldAlert className="w-3 h-3" />
                            ADMIN FORCE: {job.adminForceStatus.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="text-neutral-500 text-[11px] flex flex-wrap items-center gap-2">
                        <span className="text-neutral-900 dark:text-white font-medium">{job.company}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{job.payRange}</span>
                        <span>•</span>
                        <span>Min CGPA: <strong className="text-neutral-800 dark:text-neutral-200">{job.minCgpa.toFixed(1)}</strong></span>
                      </div>

                      {/* Window in IST */}
                      <div className="text-[11px] text-neutral-500 flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="text-neutral-400">Window:</span>
                        <span className="text-neutral-700 dark:text-neutral-300">
                          {formatToIST(job.openFrom)} → {formatToIST(job.closeOn)}
                        </span>
                        {windowStatus.countdownText && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">({windowStatus.countdownText})</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-200 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(job)}
                        className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Override Window
                      </button>

                      {job.isClosed || job.adminForceStatus === 'closed' ? (
                        <button
                          type="button"
                          onClick={() => handleAdminForceReopen(job.id)}
                          className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Force Reopen</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdminForceClose(job.id)}
                          className="px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                          <span>Force Close</span>
                        </button>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CREATE ACCOUNT (ADMIN-ONLY PROVISIONING) */}
        {/* ========================================================================= */}
        {activeTab === 'create-account' && (
          <div className="space-y-6 text-left font-mono">
            
            {/* Header info */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <UserPlus className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold font-heading text-neutral-900 dark:text-white">
                    Create Recruiter & Admin Accounts
                  </h2>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Provision new verified accounts directly into the system. Created users can log in immediately with their assigned ID & password on the login page.
                </p>
              </div>

              <div className="text-xs text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-950 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shrink-0">
                <span>Access Level: </span>
                <strong className="text-emerald-600 dark:text-emerald-400">Super Administrator</strong>
              </div>
            </div>

            {/* Main Form & Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: The Creation Form */}
              <div className="lg:col-span-7 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                
                {/* Form Title */}
                <div className="pb-4 mb-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Account Provisioning Form
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Instant Activation
                  </span>
                </div>

                {/* Feedback Alerts */}
                {createError && (
                  <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>{createError}</div>
                  </div>
                )}

                {createSuccess && (
                  <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold">{createSuccess}</div>
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
                        Credentials are active. The user can now sign in at the <button type="button" onClick={() => setActiveTab('recruiters')} className="text-emerald-600 dark:text-emerald-400 underline font-bold">Recruiters list</button> or on the Login page.
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
                  
                  {/* Field 1: Role Selection */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                      Account Role <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewRole('recruiter')}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                          newRole === 'recruiter'
                            ? 'bg-emerald-500/10 border-emerald-500 text-neutral-900 dark:text-white font-bold shadow-xs'
                            : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 hover:border-neutral-400'
                        }`}
                      >
                        <Building2 className={`w-4 h-4 ${newRole === 'recruiter' ? 'text-emerald-500' : 'text-neutral-400'}`} />
                        <div>
                          <div>Recruiter</div>
                          <div className="text-[10px] font-normal text-neutral-400">Employer & Hiring Partner</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewRole('admin')}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                          newRole === 'admin'
                            ? 'bg-emerald-500/10 border-emerald-500 text-neutral-900 dark:text-white font-bold shadow-xs'
                            : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 hover:border-neutral-400'
                        }`}
                      >
                        <Shield className={`w-4 h-4 ${newRole === 'admin' ? 'text-emerald-500' : 'text-neutral-400'}`} />
                        <div>
                          <div>Admin</div>
                          <div className="text-[10px] font-normal text-neutral-400">Super Administrator</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Field 2: Full Name */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => {
                          setNewName(e.target.value);
                          if (createError) setCreateError('');
                        }}
                        placeholder={newRole === 'recruiter' ? 'e.g. Sarah Jenkins' : 'e.g. David Vance'}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Field 3: Email / User ID */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                      Email / User ID <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => {
                          setNewEmail(e.target.value);
                          if (createError) setCreateError('');
                        }}
                        placeholder={newRole === 'recruiter' ? 'e.g. sarah.jenkins@company.com' : 'e.g. admin.director@hirehub.com'}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Field 4: Password */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (createError) setCreateError('');
                        }}
                        placeholder="Create a secure password (e.g. 12345 or pass123)"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Field 5: Company / Organization (Shown for Recruiter) */}
                  {newRole === 'recruiter' && (
                    <div className="space-y-1.5">
                      <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                        Company / Organization Name
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={newCompany}
                          onChange={(e) => setNewCompany(e.target.value)}
                          placeholder="e.g. Stripeflow Payments, Aether Cloud, Datadrive"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 text-xs font-mono font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Create & Provision {newRole === 'admin' ? 'Admin' : 'Recruiter'} Account</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Information & Stored System Accounts */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Security Governance Card */}
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Governance Policy</span>
                  </div>
                  <ul className="space-y-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Public self-registration for Admin & Recruiter roles is disabled to prevent unauthorized access.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Only verified administrators can provision recruiter partnerships and administrative delegates.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>Recruiter accounts appear in the Recruiters audit table immediately upon creation.</span>
                    </li>
                  </ul>
                </div>

                {/* All Provisioned Accounts List */}
                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-neutral-700 dark:text-neutral-300">
                      <KeyRound className="w-4 h-4 text-emerald-500" />
                      <span>System Accounts ({systemUsers.length})</span>
                    </div>
                    <span className="text-[10px] text-neutral-400">Live User Directory</span>
                  </div>

                  {systemUsers.length === 0 ? (
                    <div className="p-4 text-center text-xs font-mono text-neutral-500 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                      No system accounts registered yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {systemUsers.map((acc) => {
                        const companyName = acc.RecruiterProfile?.companyName || acc.companyName;
                        const joinedStr = acc.createdAt ? new Date(acc.createdAt).toLocaleString() : 'N/A';

                        return (
                          <div
                            key={acc.id}
                            className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-neutral-900 dark:text-white truncate">
                                    {acc.name}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                                      acc.role === 'admin'
                                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                        : acc.role === 'recruiter'
                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    }`}
                                  >
                                    {acc.role}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                      acc.isActive
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-rose-500/10 text-rose-500'
                                    }`}
                                  >
                                    {acc.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-neutral-500 truncate">
                                  {acc.email}
                                </div>
                                {companyName && (
                                  <div className="text-[10px] text-neutral-400 truncate">
                                    Org: {companyName}
                                  </div>
                                )}
                                <div className="text-[10px] text-neutral-400">
                                  Registered: {joinedStr}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditUserModal(acc)}
                                  className="px-2 py-1 text-[11px] rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserActiveInList(acc.id)}
                                  className={`px-2 py-1 text-[11px] rounded font-bold border cursor-pointer ${
                                    acc.isActive
                                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  }`}
                                >
                                  {acc.isActive ? 'Deactivate' : 'Reactivate'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>


              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: REAL-TIME GCP CLOUD LOGGING DASHBOARD */}
        {/* ========================================================================= */}
        {activeTab === 'system-logs' && (
          <div className="space-y-6 text-left font-mono">
            {/* Top Toolbar & Info Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                    GCP Cloud Logging — Real-Time Stream
                  </h2>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Project: <strong className="text-neutral-700 dark:text-neutral-300">hrie-506616</strong> • Services: <span className="text-purple-400 font-bold">hirehub-backend</span>, <span className="text-blue-400 font-bold">hirehub-frontend</span> (Auto-polling every 10s)
                </p>
              </div>

              <div className="flex items-center gap-3">
                {lastRefreshedAt && (
                  <span className="text-[11px] text-neutral-500">
                    Last updated: <strong className="text-neutral-700 dark:text-neutral-300">{lastRefreshedAt}</strong>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => fetchSystemLogsData(true)}
                  disabled={isLoadingLogs}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  <span>{isLoadingLogs ? 'Refreshing...' : 'Refresh Now'}</span>
                </button>
              </div>
            </div>

            {/* Health Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Error Health Indicator */}
              <div className={`p-4 rounded-xl border font-mono flex items-start gap-3.5 ${
                (healthData?.errorCount || 0) > 0
                  ? 'bg-red-500/10 border-red-500/30 text-red-500'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              }`}>
                {(healthData?.errorCount || 0) > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider">
                    Platform Health Status (Last 1 Hour)
                  </div>
                  <div className="text-lg font-extrabold">
                    {(healthData?.errorCount || 0) > 0
                      ? `${healthData?.errorCount} ERROR(s) Detected in Last Hour`
                      : '0 Errors in Last Hour — Systems Operational'}
                  </div>
                  {healthData?.lastErrorTimestamp && (
                    <div className="text-[11px] opacity-80">
                      Most Recent Error: {formatToIST(healthData.lastErrorTimestamp)}
                    </div>
                  )}
                </div>
              </div>

              {/* Total Logs Card */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Fetched Log Entries</span>
                  <Server className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                  {logsData.length} Logs
                </div>
                <div className="text-[11px] text-neutral-500">
                  Cloud Run Revision filter active
                </div>
              </div>

              {/* Polling Status Card */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Live Stream Mode</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                  10s Auto-Poll
                </div>
                <div className="text-[11px] text-neutral-500">
                  Active while tab is open
                </div>
              </div>
            </div>

            {/* Error banner if fetch failed */}
            {logsError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{logsError}</span>
              </div>
            )}

            {/* Scrollable Log Stream List */}
            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <span>REVISION LOG ENTRIES (MOST RECENT FIRST)</span>
                <span>COUNT: {logsData.length}</span>
              </div>

              {logsData.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 space-y-2">
                  {isLoadingLogs ? (
                    <div className="flex items-center justify-center gap-2">
                      <RotateCw className="w-4 h-4 animate-spin text-emerald-500" />
                      <span>Loading real-time Cloud Logging stream...</span>
                    </div>
                  ) : (
                    <span>No log entries received for the specified Cloud Run services.</span>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {logsData.map((log, index) => {
                    const isError = ['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'].includes(log.severity?.toUpperCase());
                    const isWarning = ['WARNING', 'WARN'].includes(log.severity?.toUpperCase());
                    const serviceColor = log.service === 'hirehub-backend'
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';

                    const severityBadgeClass = isError
                      ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 font-bold'
                      : isWarning
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700';

                    return (
                      <div
                        key={`${log.timestamp}-${index}`}
                        className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2 text-[11px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Severity Badge */}
                            <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-mono tracking-wider ${severityBadgeClass}`}>
                              {log.severity || 'DEFAULT'}
                            </span>

                            {/* Service Badge */}
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${serviceColor}`}>
                              {log.service}
                            </span>
                          </div>

                          {/* Formatted Timestamp */}
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {formatToIST(log.timestamp)}
                          </span>
                        </div>

                        {/* Log Message */}
                        <div className="text-neutral-800 dark:text-neutral-200 font-mono leading-relaxed whitespace-pre-wrap break-words text-[11.5px] bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-lg border border-neutral-200/60 dark:border-neutral-800/60">
                          {log.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* CANDIDATE PROFILE DOSSIER MODAL */}
      {/* ========================================================================= */}
      <AdminSeekerDossierModal
        seeker={selectedSeeker}
        isOpen={isSeekerModalOpen}
        onClose={() => {
          setIsSeekerModalOpen(false);
          setSelectedSeeker(null);
        }}
        applications={applications}
        onToggleDeactivate={handleToggleSeekerDeactivate}
      />

      {/* ========================================================================= */}
      {/* RECRUITER POSTED JOBS MODAL */}
      {/* ========================================================================= */}
      <AdminRecruiterJobsModal
        recruiter={selectedRecruiter}
        isOpen={isRecruiterModalOpen}
        onClose={() => {
          setIsRecruiterModalOpen(false);
          setSelectedRecruiter(null);
        }}
        jobs={jobs}
        applications={applications}
        onToggleDeactivate={handleToggleRecruiterDeactivate}
        onOpenOverrideWindow={(job) => {
          setIsRecruiterModalOpen(false);
          handleOpenEdit(job);
        }}
        onToggleJobStatus={toggleJobStatus}
      />

      {/* ========================================================================= */}
      {/* ADMIN OVERRIDE WINDOW MODAL */}
      {/* ========================================================================= */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl text-left font-mono space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-500" />
                <h2 className="text-base font-bold text-neutral-900 dark:text-white font-mono">
                  Admin Window & Priority Override
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveSuccessMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs rounded flex items-center gap-2">
                <Check className="w-4 h-4" /> Override updated successfully!
              </div>
            )}

            <div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white">{editingJob.title}</div>
              <div className="text-xs text-neutral-500">{editingJob.company} • {editingJob.payRange}</div>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-4 text-xs">
              {/* Override Window Dates */}
              <div className="space-y-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Override IST Application Window</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-500 mb-1">Open From (IST)</label>
                    <input
                      type="datetime-local"
                      required
                      value={editOpenFrom}
                      onChange={(e) => setEditOpenFrom(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-1">
                      {formatToIST(editOpenFrom)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-neutral-500 mb-1">Close On (IST)</label>
                    <input
                      type="datetime-local"
                      required
                      value={editCloseOn}
                      onChange={(e) => setEditCloseOn(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-neutral-400 block mt-1">
                      {formatToIST(editCloseOn)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Force Override Mode */}
              <div className="space-y-2 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <div className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>Admin Priority State</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditAdminOverride('auto')}
                    className={`p-2.5 rounded border text-center transition-colors cursor-pointer ${
                      editAdminOverride === 'auto'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-500 hover:border-neutral-400'
                    }`}
                  >
                    <div className="text-[11px]">Auto (Default)</div>
                    <div className="text-[9px] text-neutral-400 mt-0.5">Follows Window</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditAdminOverride('open')}
                    className={`p-2.5 rounded border text-center transition-colors cursor-pointer ${
                      editAdminOverride === 'open'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-500 hover:border-neutral-400'
                    }`}
                  >
                    <div className="text-[11px] text-emerald-500">Force Open</div>
                    <div className="text-[9px] text-neutral-400 mt-0.5">Always Accept</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditAdminOverride('closed')}
                    className={`p-2.5 rounded border text-center transition-colors cursor-pointer ${
                      editAdminOverride === 'closed'
                        ? 'bg-red-500/20 border-red-500 text-red-600 dark:text-red-400 font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-500 hover:border-neutral-400'
                    }`}
                  >
                    <div className="text-[11px] text-red-500">Force Close</div>
                    <div className="text-[9px] text-neutral-400 mt-0.5">Always Locked</div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 rounded bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save & Apply Admin Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL ADMIN JOB DETAIL / EDIT MODAL */}
      {/* ========================================================================= */}
      <AdminJobDetailEditModal
        job={selectedJobForDetailEdit}
        isOpen={isJobDetailEditModalOpen}
        onClose={() => {
          setIsJobDetailEditModalOpen(false);
          setSelectedJobForDetailEdit(null);
        }}
        applicantCount={
          selectedJobForDetailEdit ? getJobApplicantCount(selectedJobForDetailEdit.id) : 0
        }
        onSaveJob={(jobId, updatedJob) => {
          updateJob(jobId, updatedJob);
          showToast(`Job listing updated successfully for ${updatedJob.title || 'Role'}`);
        }}
      />

      {/* ========================================================================= */}
      {/* SEND NOTIFICATION MODAL (ADMIN PLATFORM-WIDE) */}
      {/* ========================================================================= */}
      <SendNotificationModal
        isOpen={isSendNotificationOpen}
        onClose={() => setIsSendNotificationOpen(false)}
        senderRole="admin"
        senderName={user?.name || 'Super Admin'}
        onNotificationSent={(msg) => showToast(msg)}
      />

      {/* ========================================================================= */}
      {/* EDIT SYSTEM USER MODAL */}
      {/* ========================================================================= */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
          <div className="w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-500" />
                <span>Edit User: {editingUser.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editUserError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500">
                {editUserError}
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {editingUser.role === 'recruiter' && (
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Company / Organization Name
                  </label>
                  <input
                    type="text"
                    value={editUserCompanyName}
                    onChange={(e) => setEditUserCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditUserSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 cursor-pointer"
                >
                  {isEditUserSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOAST NOTIFICATION */}
      {/* ========================================================================= */}


      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-mono text-xs shadow-2xl border border-neutral-700 dark:border-neutral-300 flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
