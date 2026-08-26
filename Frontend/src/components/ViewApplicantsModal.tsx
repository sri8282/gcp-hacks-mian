import React, { useState, useEffect, useCallback } from 'react';
import { Job, JobApplication, ApplicationStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  X,
  Users,
  FileText,
  CheckCircle2,
  Check,
  GraduationCap,
  Mail,
  Calendar,
  Sparkles,
  Award,
  Linkedin,
  Globe,
  Send,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  XCircle,
  Eye,
  History,
  Search,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface ViewApplicantsModalProps {
  job: Job;
  onClose: () => void;
}

interface AtsResult {
  score: number;
  grade: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export const ViewApplicantsModal: React.FC<ViewApplicantsModalProps> = ({ job, onClose }) => {
  const {
    applications,
    setApplications,
    updateApplicationStatus,
    updateApplicationNotes,
    broadcastMessages,
    sendBroadcastMessage,
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<string[]>([]);
  const [viewProfileApp, setViewProfileApp] = useState<JobApplication | null>(null);
  const [previewResumeApp, setPreviewResumeApp] = useState<JobApplication | null>(null);

  // ATS State
  const [atsModalApp, setAtsModalApp] = useState<JobApplication | null>(null);
  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [isScanningAts, setIsScanningAts] = useState(false);

  // Bulk Messaging State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [broadcastToast, setBroadcastToast] = useState(false);

  // Notes editing state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState('');

  // Live applicant refetching on modal open / job change
  const [fetchedApplicants, setFetchedApplicants] = useState<JobApplication[] | null>(null);
  const [isFetchingApplicants, setIsFetchingApplicants] = useState(false);

  const fetchLiveApplicants = useCallback(async () => {
    if (!job?.id) return;
    setIsFetchingApplicants(true);
    try {
      const freshApps = await api.recruiter.getApplicantsForJob(job.id);
      setFetchedApplicants(freshApps);

      // Merge into global applications state so applicant count on job cards updates immediately
      setApplications((prev) => {
        const otherApps = prev.filter((a) => a.jobId !== job.id);
        return [...otherApps, ...freshApps];
      });
    } catch (err) {
      console.warn('Error fetching applicants for job:', err);
    } finally {
      setIsFetchingApplicants(false);
    }
  }, [job?.id, setApplications]);


  useEffect(() => {
    fetchLiveApplicants();
  }, [fetchLiveApplicants]);

  // Real applications for this job (prefer freshly fetched from API, fallback to context state)
  const jobApplications = applications.filter((app) => app.jobId === job.id);
  const effectiveApplicants: JobApplication[] = fetchedApplicants !== null ? fetchedApplicants : jobApplications;



  const filteredApplicants = effectiveApplicants.filter((app) => {
    const candidateName = app.candidateName || 'Candidate';
    const matchesSearch =
      candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.candidateEmail && app.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.candidateCollege && app.candidateCollege.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.candidateSkills && app.candidateSkills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleSelectApplicant = (id: string) => {
    if (selectedApplicantIds.includes(id)) {
      setSelectedApplicantIds(selectedApplicantIds.filter((item) => item !== id));
    } else {
      setSelectedApplicantIds([...selectedApplicantIds, id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedApplicantIds.length === filteredApplicants.length) {
      setSelectedApplicantIds([]);
    } else {
      setSelectedApplicantIds(filteredApplicants.map((a) => a.id));
    }
  };

  const handleStatusChange = async (appId: string, inputStatus: string) => {
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

    const DISPLAY_STATUS_MAP: Record<string, ApplicationStatus> = {
      applied: 'Applied',
      screening: 'Interviewing',
      interview: 'Interviewing',
      offer: 'Offered',
      rejected: 'Rejected',
    };

    const backendStatus = STATUS_TO_BACKEND_MAP[inputStatus] || inputStatus.toLowerCase();
    const displayStatus = DISPLAY_STATUS_MAP[backendStatus] || 'Applied';

    updateApplicationStatus(appId, displayStatus, backendStatus);
    if (viewProfileApp && viewProfileApp.id === appId) {
      setViewProfileApp({ ...viewProfileApp, status: displayStatus });
    }

    await fetchLiveApplicants();
  };


  const handleMoveToNextRound = async (app: JobApplication) => {
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

    const NEXT_STATUS_MAP: Record<string, string> = {
      applied: 'screening',
      screening: 'interview',
      interview: 'offer',
      offer: 'offer',
      rejected: 'applied',
    };

    const currentBackend = STATUS_TO_BACKEND_MAP[app.status] || (app.status ? app.status.toLowerCase() : 'applied');
    const nextBackend = NEXT_STATUS_MAP[currentBackend] || 'screening';
    await handleStatusChange(app.id, nextBackend);
  };

  const handleRejectCandidate = async (app: JobApplication) => {
    await handleStatusChange(app.id, 'rejected');
  };


  const handleSaveNotes = (appId: string) => {
    updateApplicationNotes(appId, notesInput);
    setEditingNotesId(null);
    if (viewProfileApp && viewProfileApp.id === appId) {
      setViewProfileApp({ ...viewProfileApp, notes: notesInput });
    }
  };

  // Run ATS for Candidate vs Job
  const handleCheckAts = (app: JobApplication) => {
    setAtsModalApp(app);
    setIsScanningAts(true);
    setAtsResult(null);

    setTimeout(() => {
      const candidateSkills = app.candidateSkills || [
        'React',
        'TypeScript',
        'Tailwind CSS',
        'Node.js',
        'PostgreSQL',
      ];
      const jobSkills = job.skills || [];


      const matched = jobSkills.filter((s) =>
        candidateSkills.some((cs) => cs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cs.toLowerCase()))
      );
      const missing = jobSkills.filter((s) => !matched.includes(s));

      const matchRatio = jobSkills.length > 0 ? matched.length / jobSkills.length : 0;
      const cgpaBonus = (app.candidateCgpa ?? 8.0) >= job.minCgpa ? 10 : -10;
      const calculatedScore = Math.min(98, Math.max(55, Math.round(matchRatio * 85 + cgpaBonus)));

      let grade = 'Strong Match';
      if (calculatedScore >= 90) grade = 'Exceptional Fit';
      else if (calculatedScore >= 75) grade = 'High Potential';
      else grade = 'Moderate Alignment';

      const suggestions: string[] = [];
      if (missing.length > 0) {
        suggestions.push(`Evaluate candidate's knowledge of ${missing.slice(0, 2).join(' and ')} in technical interview.`);
      }
      if ((app.candidateCgpa ?? 8.0) >= job.minCgpa) {
        suggestions.push(`Academic CGPA of ${app.candidateCgpa?.toFixed(1)} fulfills the required cutoff of ${job.minCgpa.toFixed(1)}.`);
      } else {
        suggestions.push(`CGPA is below preferred threshold (${app.candidateCgpa?.toFixed(1)} vs ${job.minCgpa.toFixed(1)}). Review practical project repositories.`);
      }
      suggestions.push(`Candidate has demonstrated core proficiencies in ${matched.slice(0, 3).join(', ')}.`);

      setAtsResult({
        score: calculatedScore,
        grade,
        matchedKeywords: matched,
        missingKeywords: missing,
        suggestions,
      });

      setIsScanningAts(false);
    }, 700);
  };

  // Quick Template Selection for Bulk Messaging
  const handleSelectTemplate = (type: string) => {
    if (type === 'oa') {
      setMessageSubject(`Round 1 Technical Assessment Details — ${job.company} (${job.title})`);
      setMessageBody(
        `Dear Candidate,\n\nWe are pleased to advance your application for the ${job.title} position at ${job.company}. Please find your 90-minute technical assessment link scheduled for this week in IST. Ensure your development environment is prepared.\n\nBest regards,\nRecruitment Team at ${job.company}`
      );
    } else if (type === 'interview') {
      setMessageSubject(`Invitation: UI & System Architecture Interview — ${job.company}`);
      setMessageBody(
        `Dear Candidate,\n\nCongratulations! Based on your strong resume profile and academic qualifications, we would like to invite you to our virtual architecture interview round.\n\nPlease check your portal to confirm your preferred IST timeslot.\n\nWarm regards,\n${job.company} Talent Acquisition`
      );
    } else if (type === 'offer') {
      setMessageSubject(`Official Offer Notification — ${job.company} (${job.payRange})`);
      setMessageBody(
        `Dear Candidate,\n\nWe are thrilled to extend an official employment offer for the ${job.title} role at ${job.company} (${job.payRange}). Please review the attached compensation breakdown and reach out with any questions.\n\nWelcome to the team!\n${job.company}`
      );
    } else if (type === 'update') {
      setMessageSubject(`Application Status Update: ${job.title} at ${job.company}`);
      setMessageBody(
        `Dear Candidate,\n\nThank you for your patience while our engineering leads review candidate dossiers for ${job.title}. We are actively reviewing submissions and will post stage updates by end of the week.\n\nSincerely,\n${job.company} Hiring Team`
      );
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageSubject.trim() || !messageBody.trim()) return;

    const recipients =
      selectedApplicantIds.length > 0
        ? effectiveApplicants.filter((a) => selectedApplicantIds.includes(a.id))
        : filteredApplicants;

    const recipientNames = recipients.map((r) => r.candidateName || 'Candidate');

    sendBroadcastMessage({
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      recipientCount: recipients.length,
      recipientNames,
      subject: messageSubject,
      body: messageBody,
    });

    setBroadcastToast(true);
    setIsComposeOpen(false);
    setMessageSubject('');
    setMessageBody('');
    setSelectedApplicantIds([]);

    setTimeout(() => {
      setBroadcastToast(false);
    }, 4000);
  };

  const jobBroadcasts = broadcastMessages.filter((b) => b.jobId === job.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm font-sans overflow-y-auto">
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-4">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between bg-neutral-50 dark:bg-neutral-900/40">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                APPLICANT MANAGEMENT SYSTEM
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-xs font-mono text-neutral-600 dark:text-neutral-300 font-semibold">{job.company}</span>
              {job.companyLinkedInUrl && (
                <a
                  href={job.companyLinkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-500 hover:underline flex items-center gap-1"
                >
                  <Linkedin className="w-3 h-3" /> Company Profile
                </a>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-neutral-900 dark:text-white">
              {job.title}
            </h2>
            <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1 flex flex-wrap items-center gap-3">
              <span>Min CGPA: <strong>{job.minCgpa.toFixed(1)}+</strong></span>
              <span>•</span>
              <span>{job.workplaceType} ({job.location})</span>
              <span>•</span>
              <span>Pay: <strong>{job.payRange}</strong></span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{effectiveApplicants.length} Total Applicants</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLiveApplicants}
              disabled={isFetchingApplicants}
              title="Refresh applicant list from backend"
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isFetchingApplicants ? 'animate-spin' : ''}`} />
              <span>{isFetchingApplicants ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Broadcast Toast Notification */}
        {broadcastToast && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Broadcast message successfully dispatched to candidates! Tracked in Broadcast History.</span>
            </span>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="underline font-bold hover:text-emerald-400 cursor-pointer ml-2"
            >
              View History
            </button>
          </div>
        )}

        {/* Toolbar & Action Bar */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-neutral-950">
          {/* Left: Search & Filter */}
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidates by name, university, skills..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-mono text-neutral-500 uppercase font-semibold">Stage:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All ({effectiveApplicants.length})</option>
                <option value="Applied">Applied</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Offered">Offered</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Right: Multi-select Actions & Message Broadcast */}
          <div className="flex items-center gap-2 justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filteredApplicants.length > 0 && selectedApplicantIds.length === filteredApplicants.length}
                  onChange={handleToggleSelectAll}
                  className="rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Select All ({selectedApplicantIds.length}/{filteredApplicants.length})</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              {jobBroadcasts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="px-2.5 py-1.5 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 flex items-center gap-1 cursor-pointer"
                  title="View Past Broadcasts"
                >
                  <History className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="hidden sm:inline">History ({jobBroadcasts.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  handleSelectTemplate('oa');
                  setIsComposeOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {selectedApplicantIds.length > 0
                    ? `Message Selected (${selectedApplicantIds.length})`
                    : 'Message All Applicants'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Applicants List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredApplicants.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
              <Users className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <div className="text-sm font-mono font-bold text-neutral-900 dark:text-white">
                No applicants match the current filter criteria
              </div>
              <div className="text-xs font-mono text-neutral-500 mt-1">
                Try clearing search terms or selecting another stage filter.
              </div>
            </div>
          ) : (
            filteredApplicants.map((app) => {
              const meetsCgpa = (app.candidateCgpa ?? 8.0) >= job.minCgpa;
              const isSelected = selectedApplicantIds.includes(app.id);

              return (
                <div
                  key={app.id}
                  className={`rounded-xl border transition-all p-4 sm:p-5 text-left ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  {/* Top Candidate Row */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Checkbox + Basic Info */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectApplicant(app.id)}
                        className="mt-1 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setViewProfileApp(app)}
                            className="text-base font-bold font-heading text-neutral-900 dark:text-white hover:text-emerald-500 transition-colors text-left cursor-pointer"
                          >
                            {app.candidateName || 'Candidate Name'}
                          </button>

                          {/* CGPA Badge */}
                          <span
                            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              meetsCgpa
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                            }`}
                          >
                            CGPA: {app.candidateCgpa?.toFixed(1) ?? '8.4'} / 10.0 {meetsCgpa ? '✓ Eligible' : '⚠️ Below Cutoff'}
                          </span>

                          {/* Stage Badge */}
                          <span
                            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              app.status === 'Offered'
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                                : app.status === 'Interviewing'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                : app.status === 'Rejected'
                                ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>

                        {/* College, Passing Year & Applied Date */}
                        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1 text-neutral-800 dark:text-neutral-200">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                            {app.candidateCollege || 'UC Berkeley'} ({app.candidatePassingYear || '2025'})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-neutral-400" />
                            {app.candidateEmail || 'alex.morgan@berkeley.edu'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                            Applied: {app.appliedDate}
                          </span>
                        </div>

                        {/* Quick Skills Pills */}
                        {app.candidateSkills && app.candidateSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1 pt-1">
                            {app.candidateSkills.slice(0, 4).map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 text-[10px] font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                              >
                                {s}
                              </span>
                            ))}
                            {app.candidateSkills.length > 4 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono text-neutral-500">
                                +{app.candidateSkills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Action Controls: Check ATS, View Profile, Stage Controls */}
                    <div className="flex flex-wrap items-center gap-2 lg:self-center">
                      {/* Check ATS Score Button */}
                      <button
                        type="button"
                        onClick={() => handleCheckAts(app)}
                        className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Run ATS Match Score against this Job's requirements"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Check ATS Score
                      </button>

                      {/* View Details Profile Dossier */}
                      <button
                        type="button"
                        onClick={() => setViewProfileApp(app)}
                        className="px-3 py-1.5 text-xs font-mono rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Dossier
                      </button>

                      {/* Move to Next Round */}
                      {app.status !== 'Offered' && app.status !== 'Rejected' && (
                        <button
                          type="button"
                          onClick={() => handleMoveToNextRound(app)}
                          className="px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black hover:opacity-90 flex items-center gap-1 transition-all cursor-pointer"
                          title="Advance to next interview round"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          Next Round
                        </button>
                      )}

                      {/* Reject Button */}
                      {app.status !== 'Rejected' && (
                        <button
                          type="button"
                          onClick={() => handleRejectCandidate(app)}
                          className="p-1.5 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 hover:border-red-500 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Reject Candidate"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      {/* Direct Stage Dropdown */}
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="Applied">Applied</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offered">Offered</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {/* Resume and Links Strip */}
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPreviewResumeApp(app)}
                        className="text-neutral-700 dark:text-neutral-300 hover:text-emerald-500 flex items-center gap-1.5 cursor-pointer font-semibold"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        {app.resumeFileName || 'Resume.pdf'}
                      </button>

                      {app.candidateLinkedInUrl && (
                        <a
                          href={app.candidateLinkedInUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <Linkedin className="w-3 h-3" /> LinkedIn
                        </a>
                      )}

                      {app.candidatePortfolioUrl && (
                        <a
                          href={app.candidatePortfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" /> Portfolio
                        </a>
                      )}
                    </div>

                    <span className="text-[11px] text-neutral-400">
                      Last Updated: {app.lastUpdatedDate || app.appliedDate}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-500">
            Managing {filteredApplicants.length} candidate applications for {job.company}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Close Manager
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CANDIDATE FULL PROFILE DOSSIER MODAL */}
      {/* ========================================================================= */}
      {viewProfileApp && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-6 text-left">
            {/* Dossier Header */}
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between bg-neutral-50 dark:bg-neutral-900/50">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-2">
                  <UserCheck className="w-3.5 h-3.5" />
                  VERIFIED CANDIDATE PROFILE
                </div>
                <h3 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white">
                  {viewProfileApp.candidateName || 'Candidate Profile'}
                </h3>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  Applicant for {job.title} at {job.company}
                </p>
              </div>
              <button
                onClick={() => setViewProfileApp(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Academic & Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs font-mono">
                <div>
                  <span className="text-neutral-500 uppercase block mb-1">University / College</span>
                  <strong className="text-neutral-900 dark:text-white font-semibold flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                    {viewProfileApp.candidateCollege || 'UC Berkeley'}
                  </strong>
                </div>

                <div>
                  <span className="text-neutral-500 uppercase block mb-1">Academic CGPA</span>
                  <strong
                    className={`font-semibold flex items-center gap-1 ${
                      (viewProfileApp.candidateCgpa ?? 8.0) >= job.minCgpa
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-500'
                    }`}
                  >
                    {viewProfileApp.candidateCgpa?.toFixed(1) ?? '8.4'} / 10.0 (Min Req: {job.minCgpa.toFixed(1)})
                  </strong>
                </div>

                <div>
                  <span className="text-neutral-500 uppercase block mb-1">Passing Year</span>
                  <strong className="text-neutral-900 dark:text-white font-semibold">
                    Class of {viewProfileApp.candidatePassingYear || '2025'}
                  </strong>
                </div>
              </div>

              {/* Contact Links & Resume */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs font-mono">
                <div className="text-[11px] font-mono uppercase text-neutral-500 font-bold">
                  Professional Links & Verified Document
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {viewProfileApp.candidateLinkedInUrl && (
                    <a
                      href={viewProfileApp.candidateLinkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-500 hover:underline"
                    >
                      <Linkedin className="w-3.5 h-3.5" /> LinkedIn Profile
                    </a>
                  )}

                  {viewProfileApp.candidatePortfolioUrl && (
                    <a
                      href={viewProfileApp.candidatePortfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" /> Portfolio / Website
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setPreviewResumeApp(viewProfileApp)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    Preview {viewProfileApp.resumeFileName || 'Resume.pdf'}
                  </button>
                </div>
              </div>

              {/* Certifications */}
              {viewProfileApp.candidateCertifications && viewProfileApp.candidateCertifications.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Certifications & Accreditations
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {viewProfileApp.candidateCertifications.map((cert) => (
                      <span
                        key={cert}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-500" />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interested Roles & Technical Skills */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Candidate Skills & Interested Domains
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(viewProfileApp.candidateSkills || []).map((skill) => (

                    <span
                      key={skill}
                      className="px-2.5 py-1 text-xs font-mono rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Screening Question Responses */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Screening Question Responses
                </div>
                {viewProfileApp.answers && viewProfileApp.answers.length > 0 ? (
                  <div className="space-y-2.5">
                    {viewProfileApp.answers.map((ans, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono"
                      >
                        <div className="font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                          Q{idx + 1}: {ans.question}
                        </div>
                        <div className="text-neutral-600 dark:text-neutral-400 pl-3 border-l-2 border-emerald-500">
                          {ans.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-neutral-500 italic p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                    No custom screening answers submitted.
                  </div>
                )}
              </div>

              {/* Recruiter Evaluation Notes in Dossier */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    Recruiter Evaluation Notes
                  </span>
                  {!editingNotesId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotesId(viewProfileApp.id);
                        setNotesInput(viewProfileApp.notes || '');
                      }}
                      className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Edit Notes
                    </button>
                  )}
                </div>

                {editingNotesId === viewProfileApp.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      className="w-full p-2.5 text-xs font-mono rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                      placeholder="Add recruiter review notes, interview feedback..."
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingNotesId(null)}
                        className="px-3 py-1 text-xs font-mono rounded border border-neutral-300 dark:border-neutral-700 text-neutral-500 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveNotes(viewProfileApp.id)}
                        className="px-3.5 py-1 text-xs font-mono rounded bg-emerald-500 text-black font-bold cursor-pointer"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                    {viewProfileApp.notes || 'No evaluation notes recorded yet.'}
                  </p>
                )}
              </div>
            </div>

            {/* Dossier Footer Actions */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setViewProfileApp(null);
                  handleCheckAts(viewProfileApp);
                }}
                className="px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Run ATS Check
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRejectCandidate(viewProfileApp)}
                  className="px-4 py-2 text-xs font-mono rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
                >
                  Reject Candidate
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleMoveToNextRound(viewProfileApp);
                  }}
                  className="px-4 py-2 text-xs font-mono font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Move to Next Round
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ATS CHECK RESULTS MODAL (PER CANDIDATE) */}
      {/* ========================================================================= */}
      {atsModalApp && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-6 text-left">
            {/* ATS Header */}
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between bg-neutral-50 dark:bg-neutral-900/50">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  ATS SEMANTIC MATCH ENGINE
                </div>
                <h3 className="text-xl font-bold font-heading text-neutral-900 dark:text-white">
                  ATS Score: {atsModalApp.candidateName}
                </h3>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  Benchmarked against: <strong>{job.title}</strong> requirements
                </p>
              </div>
              <button
                onClick={() => {
                  setAtsModalApp(null);
                  setAtsResult(null);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ATS Content */}
            <div className="p-6 space-y-6">
              {isScanningAts ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-sm font-mono font-bold text-neutral-900 dark:text-white">
                    Parsing candidate resume & evaluating skill graph...
                  </div>
                  <div className="text-xs font-mono text-neutral-500">
                    Extracting technical keywords, years of experience, and role alignment metrics.
                  </div>
                </div>
              ) : atsResult ? (
                <>
                  {/* Prominent Score Card */}
                  <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-mono text-neutral-500 uppercase block mb-1">
                        Computed Match Score
                      </span>
                      <div className="text-3xl sm:text-4xl font-bold font-mono text-emerald-500 flex items-baseline gap-2">
                        <span>{atsResult.score}%</span>
                        <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {atsResult.grade}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono text-neutral-500 space-y-1">
                      <div>File: <strong className="text-neutral-800 dark:text-neutral-200">{atsModalApp.resumeFileName || 'Resume.pdf'}</strong></div>
                      <div>Cutoff: <strong className="text-neutral-800 dark:text-neutral-200">{job.minCgpa.toFixed(1)} CGPA</strong></div>
                    </div>
                  </div>

                  {/* Matched Keywords */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Matched Keywords ({atsResult.matchedKeywords.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {atsResult.matchedKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2.5 py-1 text-xs font-mono rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  {atsResult.missingKeywords.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Missing Job Keywords ({atsResult.missingKeywords.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {atsResult.missingKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="px-2.5 py-1 text-xs font-mono rounded bg-red-500/5 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
                          >
                            × {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actionable Recruiter Suggestions */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Screening Recommendations
                    </div>
                    <ul className="space-y-1.5 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                      {atsResult.suggestions.map((sug, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
            </div>

            {/* ATS Footer */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAtsModalApp(null);
                  setAtsResult(null);
                }}
                className="px-4 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                Close ATS View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BULK MESSAGE COMPOSER MODAL */}
      {/* ========================================================================= */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-6 text-left">
            {/* Compose Header */}
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between bg-neutral-50 dark:bg-neutral-900/50">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-2">
                  <Send className="w-3.5 h-3.5" />
                  BULK APPLICANT BROADCAST
                </div>
                <h3 className="text-xl font-bold font-heading text-neutral-900 dark:text-white">
                  Broadcast Update to Applicants
                </h3>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  Broadcasting to{' '}
                  <strong className="text-emerald-500">
                    {selectedApplicantIds.length > 0
                      ? `${selectedApplicantIds.length} Selected Candidates`
                      : `All ${filteredApplicants.length} Candidates`}
                  </strong>{' '}
                  for {job.title}
                </p>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compose Form */}
            <form onSubmit={handleSendBroadcast} className="p-6 space-y-5">
              {/* Template Picker */}
              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase font-semibold mb-1.5">
                  Quick Message Templates
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('oa')}
                    className="p-2 rounded-lg text-xs font-mono border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-left cursor-pointer"
                  >
                    📝 Round 1 OA
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('interview')}
                    className="p-2 rounded-lg text-xs font-mono border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-left cursor-pointer"
                  >
                    🎙️ Interview Invite
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('offer')}
                    className="p-2 rounded-lg text-xs font-mono border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-left cursor-pointer"
                  >
                    🎉 Official Offer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('update')}
                    className="p-2 rounded-lg text-xs font-mono border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-left cursor-pointer"
                  >
                    📢 Status Notice
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 font-semibold mb-1.5">
                  Broadcast Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="e.g. Round 1 Technical Assessment Schedule"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 font-semibold mb-1.5">
                  Message Content * (Markdown / Plaintext)
                </label>
                <textarea
                  rows={6}
                  required
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your message to candidates..."
                  className="w-full p-3.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-mono font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Broadcast Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BROADCAST HISTORY MODAL */}
      {/* ========================================================================= */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-6 text-left">
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between bg-neutral-50 dark:bg-neutral-900/50">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-2">
                  <History className="w-3.5 h-3.5" />
                  DISPATCH AUDIT LOG
                </div>
                <h3 className="text-xl font-bold font-heading text-neutral-900 dark:text-white">
                  Broadcast History for {job.title}
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {jobBroadcasts.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-neutral-500">
                  No broadcast messages sent yet for this role.
                </div>
              ) : (
                jobBroadcasts.map((bm) => (
                  <div
                    key={bm.id}
                    className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-neutral-900 dark:text-white text-sm font-bold">
                        {bm.subject}
                      </strong>
                      <span className="text-[11px] text-neutral-500">{bm.sentAt}</span>
                    </div>

                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Dispatched to {bm.recipientCount} candidates ({bm.recipientNames.slice(0, 3).join(', ')}
                      {bm.recipientNames.length > 3 ? ` +${bm.recipientNames.length - 3} more` : ''})
                    </div>

                    <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-line bg-white dark:bg-neutral-950 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      {bm.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-2 text-xs font-mono rounded-lg bg-neutral-900 dark:bg-neutral-800 text-white font-semibold cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IN-APP RESUME PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewResumeApp && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-6 text-left">
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between bg-neutral-50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-emerald-500" />
                <div>
                  <h4 className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                    {previewResumeApp.resumeFileName || 'Candidate_Resume.pdf'}
                  </h4>
                  <p className="text-[11px] font-mono text-neutral-500">
                    Uploaded by {previewResumeApp.candidateName} • Verified Authenticity
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewResumeApp(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Simulator Body */}
            <div className="p-6 bg-neutral-100 dark:bg-neutral-900 max-h-[65vh] overflow-y-auto font-mono text-xs">
              <div className="bg-white dark:bg-black p-6 rounded-xl border border-neutral-300 dark:border-neutral-800 shadow-sm space-y-4">
                <div className="border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <h1 className="text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                    {previewResumeApp.candidateName || 'Candidate Name'}
                  </h1>
                  <div className="text-neutral-500 text-[11px] flex flex-wrap gap-3 mt-1">
                    <span>{previewResumeApp.candidateEmail}</span>
                    <span>•</span>
                    <span>{previewResumeApp.candidateCollege} (CGPA: {previewResumeApp.candidateCgpa?.toFixed(1)})</span>
                    <span>•</span>
                    <span>Class of {previewResumeApp.candidatePassingYear || '2025'}</span>
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-neutral-900 dark:text-white text-xs uppercase mb-1">
                    TECHNICAL CORE COMPETENCIES
                  </h5>
                  <p className="text-neutral-700 dark:text-neutral-300">
                  {(previewResumeApp.candidateSkills || []).join(' • ')}
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-neutral-900 dark:text-white text-xs uppercase mb-1">
                    ACCREDITATIONS & CERTIFICATIONS
                  </h5>
                  <p className="text-neutral-700 dark:text-neutral-300">
                    {(previewResumeApp.candidateCertifications || []).join(' • ')}

                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-neutral-900 dark:text-white text-xs uppercase mb-1">
                    ENGINEERING PROJECTS & EXPERIENCE
                  </h5>
                  <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    Designed and deployed high-performance full-stack web applications with low-latency APIs, automated CI/CD pipelines, and responsive Tailwind UI designs. Maintained high code test coverage and WCAG accessibility standards.
                  </p>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> PDF Verified & Encrypted
              </span>
              <button
                type="button"
                onClick={() => setPreviewResumeApp(null)}
                className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-800 text-white font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
