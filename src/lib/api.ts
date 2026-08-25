// Centralized API Client for HireHub

export const API_BASE_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  'https://hirehub-backend-202244994641.us-central1.run.app/api';

export const API_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  'https://hirehub-backend-202244994641.us-central1.run.app';

export interface SendNotificationPayload {
  senderRole: 'admin' | 'recruiter';
  senderName: string;
  senderCompany?: string;
  targetType: 'all' | 'specific';
  targetCandidateEmails?: string[];
  targetCandidateNames?: string[];
  target_candidate_ids?: string[];
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

// Structured API modules
export const api = {
  // Authentication & User Management
  auth: {
    async login(email: string, pass: string) {
      return apiRequest<{
        message: string;
        token: string;
        user: { id: string; name: string; email: string; role: string; auth_provider?: string; avatar_url?: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
    },

    async signup(name: string, email: string, pass: string, role: string = 'candidate') {
      return apiRequest<{
        message: string;
        token: string;
        user: { id: string; name: string; email: string; role: string };
      }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password: pass, role }),
      });
    },

    async googleLogin(credential: string) {
      return apiRequest<{
        message: string;
        token: string;
        user: { id: string; name: string; email: string; role: string; auth_provider?: string; avatar_url?: string };
      }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
    },

    async adminCreateUser(data: { role: 'admin' | 'recruiter'; name: string; email: string; password: string }) {
      return apiRequest<{
        message: string;
        user: { id: string; name: string; email: string; role: string; is_active: boolean };
      }>('/admin/create-user', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async getProfile() {
      return apiRequest<any>('/profile', { method: 'GET' });
    },

    async updateProfile(profileData: any) {
      return apiRequest<{ message: string }>('/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    },
  },

  // Jobs Module
  jobs: {
    async getJobs() {
      return apiRequest<any[]>('/jobs', { method: 'GET' });
    },

    async createJob(jobData: {
      title: string;
      company: string;
      description?: string;
      location?: string;
      requirements?: string[];
      application_close_at?: string;
    }) {
      return apiRequest<{ message: string; job: any }>('/jobs/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });
    },

    async applyToJob(jobId: string) {
      return apiRequest<{ message: string; application: any }>(`/jobs/jobs/${jobId}/apply`, {
        method: 'POST',
      });
    },
  },

  // Applications & Candidate Stats Module
  applications: {
    async getMyApplications() {
      return apiRequest<any[]>('/applications/my-applications', { method: 'GET' });
    },

    async getRecruiterApplications() {
      return apiRequest<any[]>('/applications/recruiter', { method: 'GET' });
    },

    async updateApplicationStatus(applicationId: string, status: string) {
      return apiRequest<{ message: string; application: any }>(`/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },

    async getCandidateStats() {
      return apiRequest<{
        total_applied: number;
        in_review: number;
        interviewing: number;
        interviewing_or_in_review: number;
        offered: number;
        rejected: number;
      }>('/candidate/stats', { method: 'GET' });
    },
  },

  // Notifications Module
  notifications: {
    async getNotifications() {
      return apiRequest<{ notifications: any[]; unread_count: number }>('/notifications', {
        method: 'GET',
      });
    },

    async getUnreadCount() {
      return apiRequest<{ unread_count: number }>('/notifications/unread-count', {
        method: 'GET',
      });
    },

    async markNotificationAsRead(id: string) {
      return apiRequest<{ message: string; notification: any; unread_count: number }>(
        `/notifications/${id}/read`,
        { method: 'PATCH' }
      );
    },

    async sendNotification(payload: {
      message: string;
      target_type: 'all' | 'specific';
      target_candidate_ids?: string[];
    }) {
      return apiRequest<{ message: string; recipient_count: number }>('/notifications/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },
};

export default api;
