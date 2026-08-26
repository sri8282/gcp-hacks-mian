// Centralized API Client for HireHub
import { AppNotification } from '../types';
import { formatToIST } from '../utils/istTime';

export const API_BASE_URL: string =

  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  'http://localhost:8080/api';

export const API_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  'http://localhost:8080';

export interface SendNotificationPayload {
  senderRole: 'admin' | 'recruiter';
  senderName: string;
  senderCompany?: string;
  targetType: 'all' | 'specific';
  targetCandidateEmails?: string[];
  targetCandidateNames?: string[];
  target_candidate_ids?: string[];
  applicationIds?: string[];
  message: string;
  title?: string;
  jobTitle?: string;
  jobId?: string;
}


export const getAuthToken = (): string | null => {
  return localStorage.getItem('hirehub_token') || sessionStorage.getItem('hirehub_token') || null;
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('hirehub_token', token);
  sessionStorage.setItem('hirehub_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('hirehub_token');
  sessionStorage.removeItem('hirehub_token');
};

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanEndpoint.startsWith('http')
    ? cleanEndpoint
    : `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let responseData: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    responseData = await response.json().catch(() => null);
  } else {
    responseData = await response.text().catch(() => null);
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
      sessionStorage.removeItem('hirehub_user');
      sessionStorage.removeItem('hirehub_jobs');
      sessionStorage.removeItem('hirehub_applications');
      sessionStorage.removeItem('hirehub_accounts');
      sessionStorage.removeItem('hirehub_admin_recruiters');
      localStorage.removeItem('hirehub_token');
      localStorage.removeItem('hirehub_seeker_profile');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('hirehub_unauthorized'));
      }
    }
    const errorMessage =
      (responseData && (responseData.error || responseData.message)) ||
      `Request failed with status ${response.status}: ${response.statusText}`;
    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.data = responseData;
    throw error;
  }


  return responseData as T;
}

const STATUS_MAP: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interviewing',
  offer: 'Offered',
  rejected: 'Rejected',
  Applied: 'Applied',
  Screening: 'Screening',
  Interviewing: 'Interviewing',
  Offered: 'Offered',
  Rejected: 'Rejected',
};

export function normalizeJob(rawJob: any): any {
  if (!rawJob) return rawJob;

  const company = rawJob.company || rawJob.companyName || '';
  const companyName = rawJob.companyName || rawJob.company || company;
  const companyInitials =
    rawJob.companyInitials || (companyName || 'CO').slice(0, 2).toUpperCase();

  const openFrom =
    rawJob.openFrom ||
    rawJob.applicationOpenAt ||
    rawJob.createdAt ||
    rawJob.created_at ||
    undefined;

  const closeOn =
    rawJob.closeOn ||
    rawJob.applicationCloseAt ||
    rawJob.application_close_at ||
    undefined;


  const salaryLPA = rawJob.salaryLPA ?? rawJob.minLpa ?? null;
  const payRange =
    rawJob.payRange ||
    (salaryLPA !== null && salaryLPA !== undefined
      ? `₹${salaryLPA} LPA`
      : rawJob.minLpa
      ? `₹${rawJob.minLpa} - ${rawJob.maxLpa || rawJob.minLpa} LPA`
      : 'Competitive');

  const minCgpa = rawJob.minCgpa ?? (rawJob.minCGPA ? Number(rawJob.minCGPA) : 0);
  const minCGPA = rawJob.minCGPA ?? minCgpa;

  const isClosed =
    rawJob.isClosed !== undefined
      ? rawJob.isClosed
      : (!rawJob.isOpen || Boolean(rawJob.adminOverrideClosed));

  const isOpen = rawJob.isOpen !== undefined ? rawJob.isOpen : !isClosed;

  const adminForceStatus =
    rawJob.adminForceStatus ||
    (rawJob.adminOverrideClosed ? 'closed' : 'auto');

  const category = rawJob.category || 'General';

  return {
    ...rawJob,
    company,
    companyName,
    companyInitials,
    openFrom,
    applicationOpenAt: rawJob.applicationOpenAt || openFrom,
    closeOn,
    applicationCloseAt: rawJob.applicationCloseAt || closeOn,
    payRange,
    salaryLPA,
    minCgpa,
    minCGPA,
    isClosed,
    isOpen,
    adminForceStatus,
    adminOverrideClosed: rawJob.adminOverrideClosed !== undefined ? rawJob.adminOverrideClosed : (adminForceStatus === 'closed'),
    category,
    skills: Array.isArray(rawJob.skills) ? rawJob.skills : Array.isArray(rawJob.requirements) ? rawJob.requirements : [],
  };
}

export function normalizeApplication(rawApp: any): any {
  if (!rawApp) return rawApp;

  const rawStatus = rawApp.status || 'applied';
  const status = STATUS_MAP[rawStatus] || (rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1));

  const candidateName =
    rawApp.candidateName ||
    rawApp.candidate?.name ||
    rawApp.user?.name ||
    'Candidate';

  const candidateEmail =
    rawApp.candidateEmail ||
    rawApp.candidate?.email ||
    rawApp.user?.email ||
    '';

  const company =
    rawApp.company ||
    rawApp.job?.companyName ||
    rawApp.job?.company ||
    '';

  const role =
    rawApp.role ||
    rawApp.job?.title ||
    rawApp.title ||
    '';

  const candidateCollege =
    rawApp.candidateCollege ||
    rawApp.candidate?.candidateProfile?.college ||
    rawApp.candidateProfile?.college ||
    '';

  const candidateCgpa =
    rawApp.candidateCgpa ??
    (rawApp.candidate?.candidateProfile?.cgpa ? Number(rawApp.candidate.candidateProfile.cgpa) : undefined) ??
    (rawApp.candidateProfile?.cgpa ? Number(rawApp.candidateProfile.cgpa) : undefined);

  const candidateCertifications =
    rawApp.candidateCertifications ||
    rawApp.candidate?.candidateProfile?.certifications ||
    rawApp.candidateProfile?.certifications ||
    [];

  const candidateInterestedRoles =
    rawApp.candidateInterestedRoles ||
    rawApp.candidate?.candidateProfile?.interestedRoles ||
    rawApp.candidateProfile?.interestedRoles ||
    [];

  const candidateLinkedInUrl =
    rawApp.candidateLinkedInUrl ||
    rawApp.candidate?.candidateProfile?.linkedinUrl ||
    rawApp.candidateProfile?.linkedinUrl ||
    '';

  const candidatePortfolioUrl =
    rawApp.candidatePortfolioUrl ||
    rawApp.candidate?.candidateProfile?.portfolioUrl ||
    rawApp.candidateProfile?.portfolioUrl ||
    '';

  const resumeUrl =
    rawApp.resumeUrl ||
    rawApp.candidateProfile?.resumeUrl ||
    '';

  return {
    ...rawApp,
    status,
    candidateName,
    candidateEmail,
    company,
    role,
    candidateCollege,
    candidateCgpa,
    candidateCertifications,
    candidateInterestedRoles,
    candidateLinkedInUrl,
    candidatePortfolioUrl,
    resumeUrl,
  };
}

export function normalizeNotification(notif: any): AppNotification {
  const rawDate = notif.createdAt || notif.sentAt || notif.created_at;
  const parsedDate = rawDate ? new Date(rawDate) : new Date();
  const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const formattedIst = formatToIST(validDate);

  const senderRole = notif.type === 'admin_broadcast' ? 'admin' : 'recruiter';
  const senderName = notif.senderName || (notif.type === 'admin_broadcast' ? 'HireHub Admin' : 'Hiring Team');

  return {
    id: notif.id || `notif-${Date.now()}`,
    senderRole,
    senderName,
    senderCompany: senderName,
    targetType: 'all',
    title: senderName ? `Notification from ${senderName}` : 'Platform Notification',
    message: notif.message || '',
    sentAt: formattedIst,
    createdAtMs: validDate.getTime(),
    readBy: notif.isRead ? ['read'] : [],
  };
}

// Structured API modules matching GCP backend endpoints
export const api = {


  // Authentication & User Management
  auth: {
    async googleLogin(idToken: string) {
      return apiRequest<{
        token: string;
        user: { id: string; name: string; email: string; role: string; avatar_url?: string };
      }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, credential: idToken }),
      });
    },

    async login(email: string, pass: string) {
      return apiRequest<{
        token: string;
        user: { id: string; name: string; email: string; role: string; avatar_url?: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
    },

    async signup(name: string, email: string, pass: string, role: string = 'candidate') {
      return apiRequest<{
        token: string;
        user: { id: string; name: string; email: string; role: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      }).catch(async () => {
        // Fallback for signup/google auth flow
        return apiRequest<{
          token: string;
          user: { id: string; name: string; email: string; role: string };
        }>('/auth/google', {
          method: 'POST',
          body: JSON.stringify({ idToken: pass }),
        });
      });
    },

    async adminCreateUser(data: {
      role: 'admin' | 'recruiter';
      name: string;
      email: string;
      password: string;
      companyName?: string;
    }) {
      return apiRequest<{
        user: { id: string; name: string; email: string; role: string; isActive: boolean };
      }>('/auth/admin/create-user', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getMe() {
      return apiRequest<{ user: any }>('/auth/me', { method: 'GET' });
    },
  },

  // Candidate Jobs Module
  jobs: {
    async getJobs(params?: { search?: string; location?: string; workplaceType?: string }) {
      const query = new URLSearchParams();
      if (params?.search) query.append('search', params.search);
      if (params?.location) query.append('location', params.location);
      if (params?.workplaceType) query.append('workplaceType', params.workplaceType);
      const queryString = query.toString() ? `?${query.toString()}` : '';
      const res = await apiRequest<{ jobs: any[] }>(`/jobs${queryString}`, { method: 'GET' });
      return (res.jobs || []).map(normalizeJob);
    },

    async getJobById(id: string) {
      const res = await apiRequest<{ job: any }>(`/jobs/${id}`, { method: 'GET' });
      return { job: res.job ? normalizeJob(res.job) : null };
    },

    async createJob(jobData: any) {
      const res = await apiRequest<{ job: any }>('/recruiter/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });
      return { job: res.job ? normalizeJob(res.job) : null };
    },

    async applyToJob(jobId: string, extraData?: any) {
      const res = await apiRequest<{ application: any }>('/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId, ...extraData }),
      });
      return { application: res.application ? normalizeApplication(res.application) : null };
    },
  },

  // Applications & Candidate Module
  applications: {
    async applyToJob(data: {
      jobId: string;
      resumeUrl?: string;
      resumeText?: string;
      screeningAnswers?: any;
    }) {
      const res = await apiRequest<{ application: any }>('/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { application: res.application ? normalizeApplication(res.application) : null };
    },

    async getMyApplications() {
      const res = await apiRequest<{ applications: any[] }>('/applications/me', { method: 'GET' });
      return (res.applications || []).map(normalizeApplication);
    },

    async getRecruiterApplications() {
      return [];
    },


    async getApplicationById(id: string) {
      const res = await apiRequest<{ application: any }>(`/applications/${id}`, { method: 'GET' });
      return { application: res.application ? normalizeApplication(res.application) : null };
    },

    async deleteApplication(id: string) {
      return apiRequest<{ message: string }>(`/applications/${id}`, { method: 'DELETE' });
    },


    async updateApplicationStatus(id: string, status: string, currentRound?: number) {
      const res = await apiRequest<{ application: any }>(`/recruiter/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, currentRound }),
      });
      return { application: res.application ? normalizeApplication(res.application) : null };
    },

    async getCandidateStats() {
      const res = await apiRequest<{
        totalApplications: number;
        byStatus: { applied: number; screening: number; interview: number; offer: number; rejected: number };
        eligibleJobsCount: number;
      }>('/candidate/dashboard', { method: 'GET' });

      return {
        total_applied: res.totalApplications || 0,
        in_review: res.byStatus?.screening || 0,
        interviewing: res.byStatus?.interview || 0,
        interviewing_or_in_review: (res.byStatus?.screening || 0) + (res.byStatus?.interview || 0),
        offered: res.byStatus?.offer || 0,
        rejected: res.byStatus?.rejected || 0,
      };
    },
  },

  // Candidate Module
  candidate: {
    async getDashboardStats() {
      return apiRequest<{
        totalApplications: number;
        byStatus: { applied: number; screening: number; interview: number; offer: number; rejected: number };
        eligibleJobsCount: number;
      }>('/candidate/dashboard', { method: 'GET' });
    },

    async upsertProfile(data: {
      college?: string;
      cgpa?: number;
      certifications?: string[];
      passingYear?: number | string;
      interestedRoles?: string[];
      linkedinUrl?: string;
      portfolioUrl?: string;
      resumeUrl?: string;
    }) {
      return apiRequest<{ profile: any }>('/candidate/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async getProfile() {
      return apiRequest<{ profile: any }>('/candidate/profile', { method: 'GET' });
    },
  },

  // Recruiter Module
  recruiter: {
    async createJob(jobData: any) {
      const res = await apiRequest<{ job: any }>('/recruiter/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });
      return { job: res.job ? normalizeJob(res.job) : null };
    },

    async getMyJobs() {
      const res = await apiRequest<{ jobs: any[] }>('/recruiter/jobs', { method: 'GET' });
      return (res.jobs || []).map(normalizeJob);
    },

    async updateJob(id: string, jobData: any) {
      const res = await apiRequest<{ job: any }>(`/recruiter/jobs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(jobData),
      });
      return { job: res.job ? normalizeJob(res.job) : null };
    },

    async toggleJobOpen(id: string) {
      const res = await apiRequest<{ message: string; job: any }>(`/recruiter/jobs/${id}/toggle`, {
        method: 'PATCH',
      });
      return { message: res.message, job: res.job ? normalizeJob(res.job) : null };
    },

    async getApplicantsForJob(jobId: string) {
      const res = await apiRequest<{ applications: any[] }>(`/recruiter/jobs/${jobId}/applicants`, {
        method: 'GET',
      });
      return (res.applications || []).map(normalizeApplication);
    },

    async updateApplicationStatus(id: string, data: { status?: string; currentRound?: number }) {
      const res = await apiRequest<{ application: any }>(`/recruiter/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return { application: res.application ? normalizeApplication(res.application) : null };
    },

    async bulkMessage(data: { applicationIds: string[]; message: string }) {
      return apiRequest<{ message: string; count: number }>('/recruiter/bulk-message', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Admin Module
  admin: {
    async getUsers(role?: string) {
      const queryString = role ? `?role=${role}` : '';
      const res = await apiRequest<{ users: any[] }>(`/admin/users${queryString}`, { method: 'GET' });
      return res.users || [];
    },

    async toggleUserActive(id: string) {
      return apiRequest<{ message: string; user: any }>(`/admin/users/${id}/toggle`, {
        method: 'PATCH',
      });
    },

    async updateUser(id: string, data: { name?: string; email?: string; companyName?: string }) {
      return apiRequest<{ user: any }>(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    async getJobs() {
      const res = await apiRequest<{ jobs: any[] }>('/admin/jobs', { method: 'GET' });
      return (res.jobs || []).map(normalizeJob);
    },

    async updateJob(id: string, data: any) {
      const res = await apiRequest<{ job: any }>(`/admin/jobs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return { job: res.job ? normalizeJob(res.job) : null };
    },

    async forceCloseJob(id: string) {
      const res = await apiRequest<{ message: string; job: any }>(`/admin/jobs/${id}/force-close`, {
        method: 'PATCH',
      });
      return { message: res.message, job: res.job ? normalizeJob(res.job) : null };
    },

    async forceReopenJob(id: string) {
      const res = await apiRequest<{ message: string; job: any }>(`/admin/jobs/${id}/force-reopen`, {
        method: 'PATCH',
      });
      return { message: res.message, job: res.job ? normalizeJob(res.job) : null };
    },

    async getApplicantsForJob(jobId: string) {
      const res = await apiRequest<{ applications: any[] }>(`/admin/jobs/${jobId}/applicants`, {
        method: 'GET',
      });
      return (res.applications || []).map(normalizeApplication);
    },

    async getStats() {
      return apiRequest<{
        totalCandidates: number;
        totalRecruiters: number;
        totalJobs: number;
        totalOpenJobs: number;
        totalApplications: number;
        applicationsByStatus: { applied: number; screening: number; interview: number; offer: number; rejected: number };
      }>('/admin/stats', { method: 'GET' });
    },

    async broadcastNotification(data: {
      targetType: 'all' | 'specific';
      candidateIds?: string[];
      subject?: string;
      title?: string;
      message: string;
    }) {
      return apiRequest<{ message: string; count: number }>('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },


  // Notifications Module
  notifications: {
    async getNotifications() {
      const res = await apiRequest<{ notifications: any[] }>('/notifications', { method: 'GET' });
      const rawList = res.notifications || [];
      const normalizedList = rawList.map(normalizeNotification);
      return { notifications: normalizedList, unread_count: normalizedList.filter((n) => n.readBy.length === 0).length };
    },


    async markNotificationAsRead(id: string) {
      return apiRequest<{ notification: any }>(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
    },

    async markAsRead(id: string) {
      return apiRequest<{ notification: any }>(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
    },

    async sendNotification(payload: {
      message: string;
      target_type?: 'all' | 'specific';
      target_candidate_ids?: string[];
      applicationIds?: string[];
    }) {
      const appIds = payload.applicationIds || payload.target_candidate_ids || [];
      return apiRequest<{ message: string; count: number }>('/recruiter/bulk-message', {
        method: 'POST',
        body: JSON.stringify({ applicationIds: appIds, message: payload.message }),
      });
    },
  },
};

export default api;
