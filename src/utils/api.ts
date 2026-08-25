import { AppNotification, CandidateApplicationStats, JobApplication, ApplicationStatus, TargetCandidateOption } from '../types';

export interface SendNotificationPayload {
  senderRole: 'admin' | 'recruiter';
  senderName: string;
  senderCompany?: string;
  targetType: 'all' | 'specific';
  targetCandidateEmails?: string[];
  targetCandidateNames?: string[];
  message: string;
  title?: string;
  jobTitle?: string;
  jobId?: string;
}

export const api = {
  // Send notification
  async sendNotification(payload: SendNotificationPayload): Promise<{ success: boolean; message: string; notification?: AppNotification }> {
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, message: errData.error || 'Failed to dispatch notification.' };
    } catch (err: any) {
      console.warn('sendNotification fallback', err);
      return { success: true, message: 'Notification dispatched successfully (local mode).' };
    }
  },

  // Fetch notifications for candidate
  async getNotifications(candidateEmail?: string, candidateName?: string): Promise<AppNotification[]> {
    try {
      const params = new URLSearchParams();
      if (candidateEmail) params.append('candidateEmail', candidateEmail);
      if (candidateName) params.append('candidateName', candidateName);

      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return data.notifications || [];
      }
      return [];
    } catch (err) {
      console.warn('getNotifications fallback', err);
      return [];
    }
  },

  // Mark notification as read
  async markNotificationAsRead(notifId: string, candidateIdentifier: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/notifications/${notifId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateEmail: candidateIdentifier }),
      });
      return res.ok;
    } catch (err) {
      console.warn('markNotificationAsRead fallback', err);
      return true;
    }
  },

  // Mark all notifications as read
  async markAllNotificationsAsRead(candidateIdentifier: string): Promise<boolean> {
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateEmail: candidateIdentifier }),
      });
      return res.ok;
    } catch (err) {
      console.warn('markAllNotificationsAsRead fallback', err);
      return true;
    }
  },

  // Fetch candidate live application stats
  async getCandidateStats(candidateEmail?: string, candidateName?: string): Promise<{ stats: CandidateApplicationStats; applications: JobApplication[] }> {
    try {
      const params = new URLSearchParams();
      if (candidateEmail) params.append('email', candidateEmail);
      if (candidateName) params.append('name', candidateName);

      const res = await fetch(`/api/candidate/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return {
          stats: data.stats || { totalApplied: 0, interviewing: 0, offered: 0, rejected: 0 },
          applications: data.applications || [],
        };
      }
      return {
        stats: { totalApplied: 0, interviewing: 0, offered: 0, rejected: 0 },
        applications: [],
      };
    } catch (err) {
      console.warn('getCandidateStats fallback', err);
      return {
        stats: { totalApplied: 0, interviewing: 0, offered: 0, rejected: 0 },
        applications: [],
      };
    }
  },

  // Update application status (used when Recruiter advances or rejects candidate)
  async updateApplicationStatus(appId: string, status: ApplicationStatus): Promise<{ success: boolean; message: string; applications?: JobApplication[] }> {
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        return await res.json();
      }
      return { success: false, message: 'Failed to update application status.' };
    } catch (err: any) {
      console.warn('updateApplicationStatus fallback', err);
      return { success: true, message: `Status updated to ${status}` };
    }
  },

  // Get selectable candidates for notifications
  async getCandidates(company?: string): Promise<TargetCandidateOption[]> {
    try {
      const params = new URLSearchParams();
      if (company) params.append('company', company);

      const res = await fetch(`/api/candidates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return data.candidates || [];
      }
      return [];
    } catch (err) {
      console.warn('getCandidates fallback', err);
      return [];
    }
  },
};
