import React from 'react';
import { AdminSeekerUser, JobApplication } from '../types';
import {
  X,
  GraduationCap,
  Mail,
  Calendar,
  Sparkles,
  Award,
  Linkedin,
  Globe,
  Github,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  UserX,
  UserCheck,
  FileText,
  Download,
} from 'lucide-react';

interface AdminSeekerDossierModalProps {
  seeker: AdminSeekerUser | null;
  isOpen: boolean;
  onClose: () => void;
  applications: JobApplication[];
  onToggleDeactivate: (seekerId: string) => void;
}

export const AdminSeekerDossierModal: React.FC<AdminSeekerDossierModalProps> = ({
  seeker,
  isOpen,
  onClose,
  applications,
  onToggleDeactivate,
}) => {
  if (!isOpen || !seeker) return null;

  // Filter applications submitted by this candidate
  const candidateApps = applications.filter(
    (app) =>
      (app.candidateEmail && app.candidateEmail.toLowerCase() === seeker.email.toLowerCase()) ||
      (app.candidateName && app.candidateName.toLowerCase() === seeker.name.toLowerCase())
  );

  const getInitials = (name: string) => {
    return (
      name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'JS'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Offered':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'Interviewing':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'Rejected':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-left my-4 sm:my-6 flex flex-col max-h-[90vh] transition-colors">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
          <div className="flex items-start justify-between gap-4">
            
            {/* Candidate Identity */}
            <div className="flex items-start gap-4 flex-1">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center font-mono font-bold text-lg shrink-0 shadow-xs transition-colors ${
                  seeker.isDeactivated
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-700'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                }`}
              >
                {getInitials(seeker.name)}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    CANDIDATE DOSSIER
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="text-xs font-mono text-neutral-500">
                    ID: {seeker.id}
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  
                  {seeker.isDeactivated ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                      DEACTIVATED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-neutral-900 dark:text-white truncate">
                  {seeker.name}
                </h2>

                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{seeker.email}</span>
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{seeker.college}</span>
                  </span>
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

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Top Academic & Verification Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                Verified CGPA
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {seeker.cgpa.toFixed(1)}
                </span>
                <span className="text-[10px] text-neutral-400">/ 10.0</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                Passing Batch
              </span>
              <span className="text-sm font-bold text-neutral-900 dark:text-white block mt-0.5">
                Class of {seeker.passingYear}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                Applications
              </span>
              <span className="text-xl font-bold text-neutral-900 dark:text-white block">
                {candidateApps.length}
              </span>

            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] uppercase text-neutral-500 font-bold block mb-1">
                Joined Platform
              </span>
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mt-1">
                {seeker.joinedDate}
              </span>
            </div>
          </div>

          {/* Account Deactivated Warning Banner if applicable */}
          {seeker.isDeactivated && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs font-mono text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="block font-bold">Account Access Suspended by Administrator</strong>
                <p className="text-[11px] opacity-90 font-sans">
                  This candidate account is currently marked as deactivated. The candidate cannot submit new job applications or access real-time status feeds until reactivated.
                </p>
              </div>
            </div>
          )}

          {/* Interested Roles */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Target Career Tracks & Interested Roles
            </h3>
            <div className="flex flex-wrap gap-2">
              {seeker.interestedRoles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 text-xs font-mono font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Technical Skills & Competencies */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Verified Technical Skills ({seeker.skills.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {seeker.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 text-xs font-mono rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Certifications & Badges */}
          {seeker.certifications && seeker.certifications.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified Certifications & Accreditations</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {seeker.certifications.map((cert, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2 font-mono text-xs text-neutral-800 dark:text-neutral-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio & External Profiles */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Verified External Profiles & Artifacts
            </h3>
            <div className="flex flex-wrap gap-3 font-mono text-xs">
              {seeker.linkedInUrl && (
                <a
                  href={seeker.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn Profile</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {seeker.portfolioUrl && (
                <a
                  href={seeker.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Personal Portfolio</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {seeker.githubUrl && (
                <a
                  href={seeker.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}
            </div>
          </div>

          {/* Submitted Applications History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                <span>Submitted Applications ({candidateApps.length})</span>

              </h3>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {candidateApps.length > 0 ? (
                candidateApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {app.role}
                      </div>
                      <div className="text-neutral-500 text-[11px] flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{app.company}</span>
                        <span>•</span>
                        <span>{app.payRange}</span>
                        <span>•</span>
                        <span>Applied: {app.appliedDate}</span>
                        {app.resumeUrl ? (
                          <>
                            <span>•</span>
                            <a
                              href={app.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
                              title="Download candidate submitted resume from Cloud Storage"
                            >
                              <FileText className="w-3 h-3 text-emerald-500" />
                              <span>{app.resumeFileName || 'Submitted_Resume.pdf'}</span>
                              <Download className="w-3 h-3 ml-0.5" />
                            </a>
                          </>
                        ) : app.resumeFileName ? (
                          <>
                            <span>•</span>
                            <span className="text-neutral-600 dark:text-neutral-400 inline-flex items-center gap-1">
                              <FileText className="w-3 h-3 text-emerald-500" />
                              <span>{app.resumeFileName}</span>
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border shrink-0 ${getStatusColor(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-white">
                      Senior Frontend Engineer (React & TypeScript)
                    </div>
                    <div className="text-neutral-500 text-[11px] flex items-center gap-2 mt-0.5">
                      <span className="text-neutral-700 dark:text-neutral-300 font-semibold">Stripeflow Payments</span>
                      <span>•</span>
                      <span>₹16 - ₹24 LPA</span>
                      <span>•</span>
                      <span>Applied: 20 Aug 2026, 02:45 PM IST</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold border shrink-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                    Interviewing
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Super Admin Security & Access Control Console</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              Close Dossier
            </button>

            <button
              type="button"
              onClick={() => onToggleDeactivate(seeker.id)}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                seeker.isDeactivated
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-xs'
                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
              }`}
            >
              {seeker.isDeactivated ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Reactivate Account</span>
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
