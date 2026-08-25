import { api as centralizedApi, apiRequest, API_BASE_URL, API_URL, getAuthToken, setAuthToken, clearAuthToken } from '../lib/api';
import { AppNotification, CandidateApplicationStats, JobApplication, ApplicationStatus, TargetCandidateOption } from '../types';

export { API_BASE_URL, API_URL, getAuthToken, setAuthToken, clearAuthToken, apiRequest };

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

export const api = {
  ...centralizedApi,

  // Wrapper for sending notifications
  async sendNotification(payload: SendNotificationPayload): Promise<{ success: boolean; message: string; notification?: AppNotification }> {
    try {
      const res = await centralizedApi.notifications.sendNotification({
        message: payload.message,
        target_type: payload.targetType,
        target_candidate_ids: payload.target_candidate_ids,
      });
      return { success: true, message: res.message };
    } catch (err: any) {
      console.error('sendNotification error:', err);
      return { success: false, message: err.message || 'Failed to dispatch notification.' };
    }
  },

  // Wrapper for fetching candidate notifications
  async getNotifications(candidateEmail?: string, candidateName?: string): Promise<AppNotification[]> {
    try {
      const res = await centralizedApi.notifications.getNotifications();
      return (res.notifications || []).map((n: any) => ({
        id: n.id,
        senderRole: n.sender_role || 'admin',
        senderName: n.sender?.name || (n.sender_role === 'system' ? 'HireHub System' : 'Admin'),
        senderCompany: n.sender_role === 'system' ? 'HireHub Platform' : undefined,
        targetType: 'all',
        message: n.message,
        title: n.title || 'Platform Notification',
        sentAt: n.created_at_ist || new Date(n.created_at).toLocaleString(),
        createdAtMs: new Date(n.created_at).getTime(),
        readBy: n.is_read ? [candidateEmail || 'read'] : [],
      }));
    } catch (err) {
      console.warn('getNotifications error:', err);
      return [];
    }
  },

  // Wrapper for marking notification as read
  async markNotificationAsRead(notifId: string, candidateIdentifier?: string): Promise<boolean> {
    try {
      await centralizedApi.notifications.markNotificationAsRead(notifId);
      return true;
    } catch (err) {
      console.warn('markNotificationAsRead error:', err);
      return false;
    }
  },

  // Wrapper for candidate live application stats
  async getCandidateStats(candidateEmail?: string, candidateName?: string): Promise<{ stats: CandidateApplicationStats; applications: JobApplication[] }> {
    try {
      const [statsRes, appsRes] = await Promise.all([
        centralizedApi.applications.getCandidateStats().catch(() => ({
          total_applied: 0,
          in_review: 0,
          interviewing: 0,
          interviewing_or_in_review: 0,
          offered: 0,
          rejected: 0,
        })),
        centralizedApi.applications.getMyApplications().catch(() => []),
      ]);

      const formattedApps: JobApplication[] = (appsRes || []).map((a: any) => ({
        id: a.id,
        jobId: a.job_id,
        company: a.Job?.company || 'Company',
        role: a.Job?.title || 'Position',
        appliedDate: new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        lastUpdatedDate: new Date(a.updated_at || a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        daysInactive: Math.floor((Date.now() - new Date(a.updated_at || a.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        status: a.status as ApplicationStatus,
        notes: a.notes || 'In review pipeline',
        payRange: a.Job?.payRange || '12 - 18 LPA',
        location: a.Job?.location || 'Remote',
      }));

      return {
        stats: {
          totalApplied: statsRes.total_applied || 0,
          interviewing: statsRes.interviewing || 0,
          offered: statsRes.offered || 0,
          rejected: statsRes.rejected || 0,
        },
        applications: formattedApps,
      };
    } catch (err) {
      console.warn('getCandidateStats error:', err);
      return {
        stats: { totalApplied: 0, interviewing: 0, offered: 0, rejected: 0 },
        applications: [],
      };
    }
  },

  // Wrapper for updating application status
  async updateApplicationStatus(appId: string, status: ApplicationStatus): Promise<{ success: boolean; message: string }> {
    try {
      const res = await centralizedApi.applications.updateApplicationStatus(appId, status);
      return { success: true, message: res.message };
    } catch (err: any) {
      console.error('updateApplicationStatus error:', err);
      return { success: false, message: err.message || 'Failed to update application status' };
    }
  },

  // Get selectable candidates for notifications
  async getCandidates(company?: string): Promise<TargetCandidateOption[]> {
    try {
      const apps = await centralizedApi.applications.getRecruiterApplications().catch(() => []);
      const map = new Map<string, TargetCandidateOption>();
      (apps || []).forEach((app: any) => {
        const email = app.Candidate?.User?.email || app.candidateEmail;
        const name = app.Candidate?.User?.name || app.candidateName || 'Candidate';
        if (email && !map.has(email)) {
          map.set(email, {
            id: app.candidate_id || app.Candidate?.id || email,
            name,
            email,
            college: app.Candidate?.college_name || 'Verified Institution',
            cgpa: app.Candidate?.cgpa || 8.0,
            roleApplied: app.Job?.title || 'Engineer',
            companyApplied: app.Job?.company || company || 'TechCorp',
          });
        }
      });
      return Array.from(map.values());
    } catch (err) {
      console.warn('getCandidates error:', err);
      return [];
    }
  },
};
