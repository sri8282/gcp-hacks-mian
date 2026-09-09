import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Users,
  Search,
  Check,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Shield,
  Briefcase,
  User,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TargetCandidateOption, NotificationTargetType } from '../types';
import { api } from '../utils/api';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderRole: 'admin' | 'recruiter';
  senderCompany?: string;
  senderName?: string;
  defaultJobTitle?: string;
  defaultJobId?: string;
  onNotificationSent?: (message: string) => void;
}

export const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  isOpen,
  onClose,
  senderRole,
  senderCompany,
  senderName,
  defaultJobTitle,
  defaultJobId,
  onNotificationSent,
}) => {
  const { user, sendNotification, applications } = useAuth();

  const [targetType, setTargetType] = useState<NotificationTargetType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidateEmails, setSelectedCandidateEmails] = useState<string[]>([]);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [availableCandidates, setAvailableCandidates] = useState<TargetCandidateOption[]>([]);

  const companyScope = senderRole === 'recruiter' ? (senderCompany || user?.company || 'Company') : undefined;

  // Build candidate options list based on role scope
  useEffect(() => {
    async function loadCandidates() {
      // 1. First build candidates from applications matching scope
      const map = new Map<string, TargetCandidateOption>();

      applications.forEach((app) => {
        const isMatch =
          senderRole === 'admin' ||
          !companyScope ||
          app.company.toLowerCase().includes(companyScope.toLowerCase()) ||
          companyScope.toLowerCase().includes(app.company.toLowerCase());

        if (isMatch) {
          const email = app.candidateEmail || 'candidate@hirehub.com';
          if (!map.has(email)) {
            map.set(email, {
              id: app.id,
              name: app.candidateName || 'Candidate',

              email,
              college: app.candidateCollege || 'IIT Bombay',
              cgpa: app.candidateCgpa ?? 8.4,
              roleApplied: app.role,
              companyApplied: app.company,
            });
          }
        }
      });

      // 2. Fetch extra from backend API to populate rich dataset
      try {
        const backendCandidates = await api.getCandidates(companyScope);
        backendCandidates.forEach((c) => {
          if (!map.has(c.email)) {
            map.set(c.email, c);
          }
        });
      } catch {
        // ignore
      }

      setAvailableCandidates(Array.from(map.values()));
    }

    if (isOpen) {
      loadCandidates();
    }
  }, [isOpen, senderRole, companyScope, applications]);

  // Filter candidates based on search
  const filteredCandidates = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return availableCandidates;
    return availableCandidates.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        (c.college || '').toLowerCase().includes(term) ||
        (c.roleApplied || '').toLowerCase().includes(term)
    );
  }, [availableCandidates, searchTerm]);

  // Toggle selection
  const handleToggleCandidate = (email: string) => {
    if (selectedCandidateEmails.includes(email)) {
      setSelectedCandidateEmails(selectedCandidateEmails.filter((e) => e !== email));
    } else {
      setSelectedCandidateEmails([...selectedCandidateEmails, email]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCandidateEmails.length === filteredCandidates.length) {
      setSelectedCandidateEmails([]);
    } else {
      setSelectedCandidateEmails(filteredCandidates.map((c) => c.email));
    }
  };

  // Quick message templates
  const applyTemplate = (type: 'assessment' | 'interview' | 'offer' | 'general') => {
    const org = companyScope || 'HireHub Administration';
    if (type === 'assessment') {
      setNotificationTitle(`Round 1 Technical Assessment Details — ${org}`);
      setNotificationMessage(
        `Dear Candidate,\n\nWe have scheduled your online coding assessment for ${defaultJobTitle || 'your active application'} at ${org}. Please review your candidate portal for assessment instructions and Indian Standard Time deadlines.\n\nBest regards,\n${senderName || 'Talent Acquisition'}`
      );
    } else if (type === 'interview') {
      setNotificationTitle(`Invitation to Technical Architecture Interview — ${org}`);
      setNotificationMessage(
        `Dear Candidate,\n\nCongratulations on clearing the preliminary evaluation. We would like to invite you to a virtual technical interview. Please log in to confirm your preferred IST slot.\n\nWarm regards,\n${senderName || 'Hiring Team'}`
      );
    } else if (type === 'offer') {
      setNotificationTitle(`Official Employment Offer Extended — ${org}`);
      setNotificationMessage(
        `Dear Candidate,\n\nWe are delighted to extend an official employment offer for the ${defaultJobTitle || 'engineering'} position with ${org}. Please review the formal offer documents in your candidate dossier.\n\nWelcome aboard!\n${org}`
      );
    } else if (type === 'general') {
      setNotificationTitle(`Platform Update & Campus Hiring Notice`);
      setNotificationMessage(
        `Dear Candidate,\n\nPlease make sure your academic profile, verified CGPA, and technical project links are up to date for upcoming campus hiring cycles in IST.\n\nRegards,\nHireHub Administration`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationMessage.trim()) {
      setToastMessage('Please provide a message body before sending.');
      return;
    }

    if (targetType === 'specific' && selectedCandidateEmails.length === 0) {
      setToastMessage('Please select at least one candidate recipient.');
      return;
    }

    setIsSubmitting(true);

    const targetNames =
      targetType === 'specific'
        ? availableCandidates
            .filter((c) => selectedCandidateEmails.includes(c.email))
            .map((c) => c.name)
        : [];

    const relevantAppIds = applications
      .filter((app) =>
        senderRole === 'admin' ||
        !companyScope ||
        app.company.toLowerCase().includes(companyScope.toLowerCase()) ||
        companyScope.toLowerCase().includes(app.company.toLowerCase())
      )
      .map((app) => app.id)
      .filter(Boolean);

    const availableAppIds = availableCandidates.map((c) => c.id).filter(Boolean);
    const allAppIds = Array.from(new Set([...availableAppIds, ...relevantAppIds]));

    const specificAppIds = availableCandidates
      .filter((c) => selectedCandidateEmails.includes(c.email))
      .map((c) => c.id)
      .filter(Boolean);

    const targetCandidateIds = targetType === 'specific' ? specificAppIds : allAppIds;

    const res = await sendNotification({
      senderRole,
      senderName: senderName || user?.name || (senderRole === 'admin' ? 'David Vance' : 'Lead Recruiter'),
      senderCompany: companyScope || (senderRole === 'admin' ? 'HireHub Admin' : 'Talent Acquisition Team'),
      targetType,
      targetCandidateEmails: targetType === 'specific' ? selectedCandidateEmails : undefined,
      targetCandidateNames: targetType === 'specific' ? targetNames : undefined,
      target_candidate_ids: targetCandidateIds,
      applicationIds: targetCandidateIds,
      title: notificationTitle.trim() || undefined,
      message: notificationMessage.trim(),
      jobTitle: defaultJobTitle,
      jobId: defaultJobId,
    });


    setIsSubmitting(false);

    if (res.success) {
      if (onNotificationSent) {
        onNotificationSent(res.message);
      }
      onClose();
    } else {
      setToastMessage(res.message || 'Failed to dispatch notification.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm font-sans overflow-y-auto">
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white my-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between bg-neutral-50 dark:bg-neutral-900/40">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {senderRole === 'admin' ? 'ADMIN DISPATCH CENTER' : 'RECRUITER NOTIFICATION HUB'}
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-xs font-mono text-neutral-600 dark:text-neutral-300 font-semibold">
                {companyScope || 'Platform-Wide Admin'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-neutral-900 dark:text-white">
              Send Candidate Notification
            </h2>
            <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1">
              {senderRole === 'recruiter'
                ? `Notify applicants who applied to ${companyScope} job postings.`
                : 'Broadcast official updates or target specific candidates across the platform.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast error/warning */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-amber-700 dark:text-amber-300 hover:opacity-80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Target Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              1. Notification Target
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  targetType === 'all'
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 ring-1 ring-emerald-500'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    {senderRole === 'recruiter' ? 'All My Job Applicants' : 'All Platform Candidates'}
                  </span>
                  {targetType === 'all' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-[11px] font-mono text-neutral-500">
                  {senderRole === 'recruiter'
                    ? `Dispatches to every candidate who applied to ${companyScope} (${availableCandidates.length} applicants).`
                    : `Dispatches broadcast alert to all registered candidates (${availableCandidates.length}+ candidates).`}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('specific')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  targetType === 'specific'
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 ring-1 ring-emerald-500'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    Specific Candidates ({selectedCandidateEmails.length} selected)
                  </span>
                  {targetType === 'specific' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-[11px] font-mono text-neutral-500">
                  {senderRole === 'recruiter'
                    ? `Select individual candidates from your applicant pool.`
                    : 'Search and multi-select specific candidates by name, email, or college.'}
                </p>
              </button>
            </div>
          </div>

          {/* Searchable Multi-select candidate list (if specific candidates chosen) */}
          {targetType === 'specific' && (
            <div className="space-y-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search candidate by name, email, college, role..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-2.5 py-1.5 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {selectedCandidateEmails.length === filteredCandidates.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {selectedCandidateEmails.length}/{filteredCandidates.length} Selected
                  </span>
                </div>
              </div>

              {/* Candidates Grid/List */}
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {filteredCandidates.length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono text-neutral-400">
                    No candidates found matching query.
                  </div>
                ) : (
                  filteredCandidates.map((cand) => {
                    const isSelected = selectedCandidateEmails.includes(cand.email);
                    return (
                      <div
                        key={cand.email}
                        onClick={() => handleToggleCandidate(cand.email)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15'
                            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleCandidate(cand.email)}
                            className="rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                                {cand.name}
                              </span>
                              {cand.cgpa && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 font-semibold">
                                  CGPA {cand.cgpa.toFixed(1)}
                                </span>
                              )}
                              {cand.roleApplied && (
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-[180px]">
                                  • {cand.roleApplied}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500 mt-0.5">
                              <span>{cand.email}</span>
                              {cand.college && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3" /> {cand.college}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            ✓ Target
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Quick Templates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Quick Message Templates
              </label>
              <span className="text-[11px] font-mono text-neutral-400">Click to autofill</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyTemplate('assessment')}
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                Assessment Link
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('interview')}
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                Interview Invite
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('offer')}
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                Offer Extension
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('general')}
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                Campus Drive Notice
              </button>
            </div>
          </div>

          {/* Title / Subject */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              2. Subject / Title
            </label>
            <input
              type="text"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              placeholder="e.g. Round 1 Assessment Invitation & Schedule in IST"
              className="w-full p-2.5 text-xs font-mono rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                3. Message Body *
              </label>
              <span className="text-[11px] font-mono text-neutral-400">
                {notificationMessage.length} characters
              </span>
            </div>
            <textarea
              rows={5}
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="Write your message here... Candidate will receive an instant notification in their navbar bell and notifications tab."
              required
              className="w-full p-3 text-xs font-mono rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500 leading-relaxed resize-y"
            />
          </div>

          {/* Preview Sender Strip */}
          <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs font-mono flex items-center justify-between flex-wrap gap-2">
            <span className="text-neutral-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Sender Identity:
            </span>
            <span className="font-bold text-neutral-900 dark:text-white">
              {senderName || user?.name} ({companyScope || 'Admin'})
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-mono font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? 'Dispatching...'
                  : targetType === 'all'
                  ? 'Send to All Candidates'
                  : `Send to ${selectedCandidateEmails.length} Candidate(s)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
