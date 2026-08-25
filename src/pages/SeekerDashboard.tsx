import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleNavbar } from '../components/RoleNavbar';
import { SeekerOnboardingModal } from '../components/SeekerOnboardingModal';
import { JobDetailModal } from '../components/JobDetailModal';
import { ApplyModal } from '../components/ApplyModal';
import { ApplicationTracker } from '../components/ApplicationTracker';
import { CandidateNotificationsView } from '../components/CandidateNotificationsView';
import { Job, ApplicationAnswer } from '../types';
import { getApplicationWindowStatus, formatToIST } from '../utils/istTime';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  MapPin,
  Building,
  Layers,
  ArrowRight,
  Filter,
  Check,
  UserCheck,
  Cpu,
  IndianRupee,
  Bell
} from 'lucide-react';

export const SeekerDashboard: React.FC = () => {
  const {
    user,
    seekerProfile,
    completeSeekerOnboarding,
    jobs,
    applications,
    addApplication,
    updateApplicationStatus,
    updateApplicationNotes,
    deleteApplication,
    candidateStats,
    unreadNotificationCount,
  } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<'jobs' | 'tracker' | 'notifications'>('jobs');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(
    () => (user?.seekerProfile ? !user.seekerProfile.isOnboarded : false)
  );
  const [selectedDetailJob, setSelectedDetailJob] = useState<Job | null>(null);
  const [selectedApplyJob, setSelectedApplyJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'recommended' | 'eligible' | 'open' | 'remote'>('all');
  const [toastMessage, setToMessage] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Live clock tick for countdown calculations
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Time-based greeting in IST
  const getGreeting = () => {
    const d = new Date();
    // compute hour in Asia/Kolkata
    const istHourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    }).format(d);
    const hour = parseInt(istHourStr, 10);
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const candidateCgpa = seekerProfile?.cgpa ?? 8.4;
  const interestedRoles = seekerProfile?.interestedRoles || ['Frontend', 'Fullstack'];

  // Live stats from single source of truth / backend
  const totalApplied = candidateStats.totalApplied ?? applications.length;
  const activeInterviews = candidateStats.interviewing ?? applications.filter((a) => a.status === 'Interviewing').length;
  const offersReceived = candidateStats.offered ?? applications.filter((a) => a.status === 'Offered').length;
  const rejectedCount = candidateStats.rejected ?? applications.filter((a) => a.status === 'Rejected').length;

  const showToast = (msg: string) => {
    setToMessage(msg);
    setTimeout(() => {
      setToMessage(null);
    }, 4000);
  };

  const handleOpenApplyModal = (job: Job) => {
    const status = getApplicationWindowStatus(job, nowMs);
    if (!status.isOpen) {
      showToast(`Cannot apply: ${status.reason}`);
      return;
    }
    setSelectedApplyJob(job);
  };

  const handleConfirmSubmitApplication = (
    job: Job,
    data: { resumeFileName: string; answers: ApplicationAnswer[] }
  ) => {
    const result = addApplication(job, data);
    showToast(result.message);
  };

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const windowStatus = getApplicationWindowStatus(job, nowMs);

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesLocation = job.location.toLowerCase().includes(q);
        const matchesSkills = job.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCompany && !matchesLocation && !matchesSkills) {
          return false;
        }
      }

      // 2. Filter Pills
      if (filterMode === 'recommended') {
        const matchesDomain = interestedRoles.some(
          (role) =>
            job.category.toLowerCase().includes(role.toLowerCase()) ||
            job.title.toLowerCase().includes(role.toLowerCase()) ||
            job.skills.some((s) => s.toLowerCase().includes(role.toLowerCase()))
        );
        if (!matchesDomain) return false;
      }

      if (filterMode === 'eligible') {
        if (candidateCgpa < job.minCgpa) return false;
      }

      if (filterMode === 'open') {
        if (!windowStatus.isOpen) return false;
      }

      if (filterMode === 'remote') {
        if (job.workplaceType !== 'Remote') return false;
      }

      return true;
    });
  }, [jobs, searchQuery, filterMode, candidateCgpa, interestedRoles, nowMs]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white flex flex-col font-sans transition-colors">
      <RoleNavbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'jobs' | 'tracker' | 'notifications')}
        onOpenProfile={() => setIsOnboardingOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-neutral-900 text-white border border-emerald-500/50 shadow-2xl rounded-lg p-3.5 flex items-center gap-3 animate-fade-in font-mono text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Candidate Welcome Strip */}
        <div className="mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                AUTHENTICATED CANDIDATE PORTAL
              </span>
              <span className="text-neutral-400 dark:text-neutral-600">•</span>
              <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400 font-medium">
                {seekerProfile?.collegeName || 'Indian Institute of Technology'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading text-neutral-900 dark:text-white">
              {getGreeting()}, {user?.name.split(' ')[0] || 'Alex'}
            </h1>
            <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 mt-1">
              Live automated eligibility scoring active with verified CGPA cutoff index {candidateCgpa.toFixed(1)} / 10.0 • Times displayed in Indian Standard Time (IST).
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="px-3.5 py-2 text-xs font-mono rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 text-neutral-800 dark:text-neutral-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3.5 py-2 text-xs font-mono rounded-lg border transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'notifications'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black font-bold'
                  : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:border-emerald-500'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-emerald-500" />
              <span>Alerts</span>
              {unreadNotificationCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black text-[10px] font-bold">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'jobs' ? 'tracker' : 'jobs')}
              className="px-3.5 py-2 text-xs font-mono font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{activeTab === 'jobs' ? 'View Pipeline Tracker' : 'View Job Feed'}</span>
            </button>
          </div>
        </div>

        {/* 4 Live Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
          <div
            onClick={() => setActiveTab('tracker')}
            className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left transition-all hover:border-emerald-500/50 cursor-pointer"
          >
            <span className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-semibold">
              Total Applied
            </span>
            <div className="text-2xl font-mono font-bold text-neutral-900 dark:text-white mt-1">
              {totalApplied}
            </div>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-1 block">
              Active candidate pipeline
            </span>
          </div>

          <div
            onClick={() => setActiveTab('tracker')}
            className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left transition-all hover:border-emerald-500/50 cursor-pointer"
          >
            <span className="text-[11px] font-mono uppercase text-blue-600 dark:text-blue-400 font-semibold">
              Active Interviews
            </span>
            <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
              {activeInterviews}
            </div>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-1 block">
              Technical & interview rounds
            </span>
          </div>

          <div
            onClick={() => setActiveTab('tracker')}
            className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left transition-all hover:border-emerald-500/50 cursor-pointer"
          >
            <span className="text-[11px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-semibold">
              Offers Extended
            </span>
            <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {offersReceived}
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
              Ready for decision
            </span>
          </div>

          <div
            onClick={() => setActiveTab('tracker')}
            className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left transition-all hover:border-emerald-500/50 cursor-pointer"
          >
            <span className="text-[11px] font-mono uppercase text-neutral-500 dark:text-neutral-400 font-semibold">
              Archived / Logged
            </span>
            <div className="text-2xl font-mono font-bold text-neutral-600 dark:text-neutral-400 mt-1">
              {rejectedCount}
            </div>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-1 block">
              Historical records
            </span>
          </div>
        </div>

        {/* View Switcher: Job Discovery vs Application Pipeline vs Notifications */}
        {activeTab === 'notifications' ? (
          <CandidateNotificationsView />
        ) : activeTab === 'tracker' ? (
          <div>
            <div className="flex items-center justify-between mb-6 text-left">
              <div>
                <h2 className="text-lg font-bold font-mono text-neutral-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  Application Pipeline Tracker
                </h2>
                <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Manage stages, candidate notes, and review your submitted responses with timestamps in IST.
                </p>
              </div>
            </div>
            <ApplicationTracker
              applications={applications}
              onStatusChange={updateApplicationStatus}
              onNotesChange={updateApplicationNotes}
              onDelete={deleteApplication}
            />
          </div>
        ) : (
          <div>
            {/* Search & Filter Header */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by role title, company, location, or tech stack (e.g. React, Golang, Python)..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500 placeholder-neutral-400 dark:placeholder-neutral-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Counter indicator */}
                <div className="flex items-center px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs font-mono text-neutral-600 dark:text-neutral-400 shrink-0">
                  Showing <span className="font-bold text-emerald-600 dark:text-emerald-400 mx-1.5">{filteredJobs.length}</span> of {jobs.length} Verified Positions
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-neutral-500 flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3" /> Filter:
                </span>

                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-md border transition-colors cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white border-neutral-700 font-semibold'
                      : 'bg-neutral-100 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  All Listings ({jobs.length})
                </button>

                <button
                  onClick={() => setFilterMode('recommended')}
                  className={`px-3 py-1.5 rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                    filterMode === 'recommended'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500 font-semibold'
                      : 'bg-neutral-100 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Recommended For You
                </button>

                <button
                  onClick={() => setFilterMode('eligible')}
                  className={`px-3 py-1.5 rounded-md border transition-colors cursor-pointer flex items-center gap-1 ${
                    filterMode === 'eligible'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500 font-semibold'
                      : 'bg-neutral-100 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Eligible Only (CGPA ≥ {candidateCgpa.toFixed(1)})
                </button>

                <button
                  onClick={() => setFilterMode('open')}
                  className={`px-3 py-1.5 rounded-md border transition-colors cursor-pointer ${
                    filterMode === 'open'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500 font-semibold'
                      : 'bg-neutral-100 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  Open Window Only
                </button>

                <button
                  onClick={() => setFilterMode('remote')}
                  className={`px-3 py-1.5 rounded-md border transition-colors cursor-pointer ${
                    filterMode === 'remote'
                      ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white border-neutral-700 font-semibold'
                      : 'bg-neutral-100 dark:bg-neutral-950 text-neutral-700 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  Remote Positions
                </button>
              </div>
            </div>

            {/* Job Grid */}
            {filteredJobs.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl p-8 bg-neutral-50 dark:bg-neutral-950/40">
                <p className="text-sm font-mono text-neutral-600 dark:text-neutral-400">
                  No matching jobs found with current search & filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterMode('all');
                  }}
                  className="mt-4 px-4 py-2 text-xs font-mono rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 cursor-pointer"
                >
                  Reset Search & Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.map((job) => {
                  const isEligible = candidateCgpa >= job.minCgpa;
                  const isRecommended = interestedRoles.some(
                    (role) =>
                      job.category.toLowerCase().includes(role.toLowerCase()) ||
                      job.title.toLowerCase().includes(role.toLowerCase()) ||
                      job.skills.some((s) => s.toLowerCase().includes(role.toLowerCase()))
                  );
                  const alreadyApplied = applications.some((a) => a.jobId === job.id);
                  const windowStatus = getApplicationWindowStatus(job, nowMs);

                  return (
                    <div
                      key={job.id}
                      className="group bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 text-left shadow-xs"
                    >
                      <div>
                        {/* Top Meta Bar */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                              {job.companyInitials}
                            </div>
                            <div>
                              <h3 className="text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-300">
                                {job.company}
                              </h3>
                              <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {job.location}
                                </span>
                                <span>•</span>
                                <span className="px-1.5 py-0.2 bg-neutral-100 dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-700 dark:text-neutral-300">
                                  {job.workplaceType}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Recommended / Window Tag */}
                          <div className="flex flex-col items-end gap-1">
                            {isRecommended && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                <Sparkles className="w-2.5 h-2.5" />
                                RECOMMENDED
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                                windowStatus.isOpen
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : windowStatus.status === 'upcoming'
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border-neutral-300 dark:border-neutral-800'
                              }`}
                            >
                              {windowStatus.badgeLabel}
                            </span>
                          </div>
                        </div>

                        {/* Role Title */}
                        <h4 className="text-base font-mono font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {job.title}
                        </h4>

                        {/* Pay Range & Countdown */}
                        <div className="flex items-center justify-between text-xs font-mono mb-2">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                            {job.payRange}
                          </span>
                          {windowStatus.countdownText && (
                            <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 animate-pulse" />
                              {windowStatus.countdownText}
                            </span>
                          )}
                        </div>

                        {/* Application Window Range (IST) */}
                        <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-1">
                          <span className="text-neutral-400">IST Window:</span>
                          <span className="truncate">{formatToIST(job.openFrom)} → {formatToIST(job.closeOn)}</span>
                        </div>

                        {/* Description excerpt */}
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3 leading-relaxed">
                          {job.description}
                        </p>

                        {/* Skills Chips */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {job.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 text-[10px] font-mono rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 4 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-mono text-neutral-500">
                              +{job.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Footer: Eligibility & Actions */}
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
                        {/* Eligibility pill */}
                        <div className="flex items-center gap-1.5">
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Eligible (CGPA {job.minCgpa.toFixed(1)}+)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-red-600 dark:text-red-400 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                              <span>Cutoff: {job.minCgpa.toFixed(1)}+</span>
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailJob(job)}
                            className="px-2.5 py-1.5 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Cpu className="w-3 h-3 text-emerald-500" />
                            <span>Details</span>
                          </button>

                          {alreadyApplied ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold">
                              <Check className="w-3 h-3" /> Applied
                            </span>
                          ) : !windowStatus.isOpen ? (
                            <div className="relative group">
                              <button
                                disabled
                                title={windowStatus.reason}
                                className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 text-xs font-mono cursor-not-allowed border border-neutral-300 dark:border-neutral-800"
                              >
                                {windowStatus.status === 'upcoming' ? 'Not Open Yet' : 'Closed'}
                              </button>
                            </div>
                          ) : !isEligible ? (
                            <button
                              disabled
                              title={`Requires CGPA ${job.minCgpa.toFixed(1)}`}
                              className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-400 border border-neutral-200 dark:border-neutral-800 text-xs font-mono cursor-not-allowed"
                            >
                              Ineligible
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenApplyModal(job)}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold transition-colors cursor-pointer shadow-xs"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Onboarding / Profile Edit Modal */}
      <SeekerOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        initialProfile={seekerProfile}
        onSave={(profile) => {
          completeSeekerOnboarding(profile);
          showToast('Profile updated & live eligibility recalibrated!');
        }}
      />

      {/* Job Details Modal with ATS Checker */}
      <JobDetailModal
        job={selectedDetailJob}
        isOpen={!!selectedDetailJob}
        onClose={() => setSelectedDetailJob(null)}
        seekerProfile={seekerProfile}
        hasApplied={applications.some((a) => a.jobId === selectedDetailJob?.id)}
        onApply={(job) => {
          setSelectedDetailJob(null);
          handleOpenApplyModal(job);
        }}
      />

      {/* Dedicated Apply Flow Modal */}
      <ApplyModal
        job={selectedApplyJob}
        isOpen={!!selectedApplyJob}
        onClose={() => setSelectedApplyJob(null)}
        onSubmit={handleConfirmSubmitApplication}
        defaultCandidateName={seekerProfile?.fullName || user?.name || 'Alex Morgan'}
      />
    </div>
  );
};
