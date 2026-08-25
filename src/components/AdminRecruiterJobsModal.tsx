import React from 'react';
import { AdminRecruiterUser, Job, JobApplication } from '../types';
import { getApplicationWindowStatus, formatToIST } from '../utils/istTime';
import {
  X,
  Building2,
  Mail,
  MapPin,
  Briefcase,
  Users,
  Linkedin,
  Clock,
  CheckCircle,
  AlertCircle,
  UserX,
  UserCheck,
  ShieldAlert,
  ExternalLink,
  Edit2,
} from 'lucide-react';

interface AdminRecruiterJobsModalProps {
  recruiter: AdminRecruiterUser | null;
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  applications: JobApplication[];
  onToggleDeactivate: (recruiterId: string) => void;
  onOpenOverrideWindow?: (job: Job) => void;
  onToggleJobStatus?: (jobId: string) => void;
}

export const AdminRecruiterJobsModal: React.FC<AdminRecruiterJobsModalProps> = ({
  recruiter,
  isOpen,
  onClose,
  jobs,
  applications,
  onToggleDeactivate,
  onOpenOverrideWindow,
  onToggleJobStatus,
}) => {
  if (!isOpen || !recruiter) return null;

  // Filter jobs posted by this recruiter/company
  const recruiterJobs = jobs.filter(
    (j) =>
      j.company.toLowerCase().includes(recruiter.company.toLowerCase()) ||
      recruiter.company.toLowerCase().includes(j.company.toLowerCase())
  );

  const recruiterJobIds = recruiterJobs.map((j) => j.id);
  const totalApplicants = applications.filter((app) =>
    recruiterJobIds.includes(app.jobId) ||
    app.company.toLowerCase().includes(recruiter.company.toLowerCase())
  ).length;

  const totalHires = applications.filter(
    (app) =>
      (recruiterJobIds.includes(app.jobId) ||
        app.company.toLowerCase().includes(recruiter.company.toLowerCase())) &&
      app.status === 'Offered'
  ).length;

  const activeJobsCount = recruiterJobs.filter(
    (j) => getApplicationWindowStatus(j).isOpen
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-left my-4 sm:my-6 flex flex-col max-h-[92vh] transition-colors">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
          <div className="flex items-start justify-between gap-4">
            
            {/* Recruiter & Company Info */}
            <div className="flex items-start gap-4 flex-1">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center font-mono font-bold text-lg shrink-0 shadow-xs transition-colors ${
                  recruiter.isDeactivated
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-700'
                    : recruiter.companyColor || 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                }`}
              >
                {recruiter.companyInitials}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    VERIFIED EMPLOYER DOSSIER
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                    {recruiter.tier} Tier
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  
                  {recruiter.isDeactivated ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                      DEACTIVATED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      ACTIVE PARTNER
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-neutral-900 dark:text-white truncate">
                  {recruiter.company}
                </h2>

                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1 text-neutral-800 dark:text-neutral-200 font-medium">
                    <Users className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Lead: {recruiter.name}</span>
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{recruiter.email}</span>
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{recruiter.location}</span>
                  </span>

                  {recruiter.companyLinkedInUrl && (
                    <>
                      <span className="text-neutral-300 dark:text-neutral-700">•</span>
                      <a
                        href={recruiter.companyLinkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                      >
                        <Linkedin className="w-3 h-3" />
                        <span>LinkedIn</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Recruiter Platform Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                Roles Posted
              </span>
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {recruiterJobs.length}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                Active in IST
              </span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {activeJobsCount}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                Total Applicants
              </span>
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                {totalApplicants}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                Successful Hires
              </span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {totalHires}
              </span>
            </div>
          </div>

          {/* Account Deactivated Warning Banner if applicable */}
          {recruiter.isDeactivated && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs font-mono text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="block font-bold">Employer Account Suspended by Administrator</strong>
                <p className="text-[11px] opacity-90 font-sans">
                  This employer account is currently deactivated. All job postings under this organization are hidden from candidate discovery feeds.
                </p>
              </div>
            </div>
          )}

          {/* Posted Job Listings Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                <span>Posted Opportunities ({recruiterJobs.length})</span>
              </h3>
              <span className="text-[11px] font-mono text-neutral-500">
                {activeJobsCount} currently accepting applicants
              </span>
            </div>

            {/* Reusable Job Card List */}
            {recruiterJobs.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 font-mono">
                {recruiterJobs.map((job) => {
                  const windowStatus = getApplicationWindowStatus(job);
                  const jobAppCount = applications.filter((a) => a.jobId === job.id).length;

                  return (
                    <div
                      key={job.id}
                      className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3 transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                    >
                      {/* Top Row: Title + Status Pill */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white font-heading">
                            {job.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-neutral-500">
                            <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{job.company}</span>
                            <span>•</span>
                            <span>{job.location}</span>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                              {job.workplaceType}
                            </span>
                            <span>•</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{job.payRange}</span>
                            <span>•</span>
                            <span>Min CGPA: <strong>{job.minCgpa.toFixed(1)}</strong></span>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                              windowStatus.isOpen
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                            }`}
                          >
                            {windowStatus.badgeLabel}
                          </span>

                          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                            <Users className="w-3 h-3 text-neutral-500" />
                            <span>{jobAppCount} Applicants</span>
                          </span>
                        </div>
                      </div>

                      {/* IST Window Row & Actions */}
                      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>
                            IST Window: <strong className="text-neutral-700 dark:text-neutral-300">{formatToIST(job.openFrom)} → {formatToIST(job.closeOn)}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {onOpenOverrideWindow && (
                            <button
                              type="button"
                              onClick={() => onOpenOverrideWindow(job)}
                              className="px-2.5 py-1 rounded text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Override Window</span>
                            </button>
                          )}

                          {onToggleJobStatus && (
                            <button
                              type="button"
                              onClick={() => onToggleJobStatus(job.id)}
                              className="px-2.5 py-1 rounded text-[11px] bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                            >
                              {job.isClosed ? 'Unpause' : 'Pause Role'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <Briefcase className="w-8 h-8 text-neutral-400 mx-auto" />
                <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300 font-bold">
                  No active jobs posted by this employer yet.
                </div>
                <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
                  New job openings created by this recruiter account will automatically appear here.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
            <Building2 className="w-4 h-4 text-emerald-500" />
            <span>Employer Account ID: {recruiter.id}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => onToggleDeactivate(recruiter.id)}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                recruiter.isDeactivated
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-xs'
                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
              }`}
            >
              {recruiter.isDeactivated ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Reactivate Employer</span>
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4" />
                  <span>Deactivate Account</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
