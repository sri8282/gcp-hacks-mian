import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleNavbar } from '../components/RoleNavbar';
import { ViewApplicantsModal } from '../components/ViewApplicantsModal';
import { SendNotificationModal } from '../components/SendNotificationModal';
import { Job } from '../types';
import { getApplicationWindowStatus, formatToIST } from '../utils/istTime';
import {
  PlusCircle,
  Users,
  CheckCircle2,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Search,
  Briefcase,
  Clock,
  IndianRupee,
  ShieldAlert,
  Send,
  BellRing
} from 'lucide-react';

export const RecruiterDashboard: React.FC = () => {
  const { user, jobs, toggleJobStatus, applications } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'my_postings' | 'all_postings'>('my_postings');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<Job | null>(null);
  const [isSendNotificationOpen, setIsSendNotificationOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Live timer update for countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const recruiterCompany = user?.company || (user as any)?.recruiterProfile?.companyName || '';

  // Safe field getters for Job objects
  const getJobCompany = (j: any) => j.company || j.companyName || '';
  const getJobTitle = (j: any) => j.title || '';
  const getJobSkills = (j: any): string[] => (Array.isArray(j.skills) ? j.skills : []);

  // Filter jobs with safe null guards
  const myCompanyJobs = jobs.filter((j) => {
    const comp = getJobCompany(j).toLowerCase();
    const rComp = recruiterCompany.toLowerCase();
    if (!rComp) return true;
    return comp.includes(rComp) || rComp.includes(comp);
  });

  const baseJobs = activeTab === 'my_postings' ? (myCompanyJobs.length > 0 ? myCompanyJobs : jobs) : jobs;

  const filteredJobs = baseJobs.filter((job) => {
    const windowStatus = getApplicationWindowStatus(job, nowMs);
    const q = (searchTerm || '').toLowerCase();
    const titleMatch = getJobTitle(job).toLowerCase().includes(q);
    const compMatch = getJobCompany(job).toLowerCase().includes(q);
    const skillMatch = getJobSkills(job).some((s) => (s || '').toLowerCase().includes(q));
    const matchesSearch = titleMatch || compMatch || skillMatch;

    const matchesStatus =
      statusFilter === 'all' ? true : statusFilter === 'open' ? windowStatus.isOpen : !windowStatus.isOpen;

    return matchesSearch && matchesStatus;
  });

  const totalOpenJobs = jobs.filter((j) => getApplicationWindowStatus(j, nowMs).isOpen).length;
  const totalCandidateApplies = applications.length;


  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white flex flex-col font-sans transition-colors">
      <RoleNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Recruiter Header */}
        <div className="mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ENTERPRISE RECRUITER CONSOLE
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 font-semibold">{recruiterCompany}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-heading text-neutral-900 dark:text-white">
              Talent Acquisition Command
            </h1>
            <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 mt-1">
              Welcome back, <strong className="text-neutral-900 dark:text-white">{user?.name}</strong>. Manage Indian Standard Time application windows, evaluate applicants, and adjust compensation.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsSendNotificationOpen(true)}
              className="px-4 py-2.5 text-xs font-mono font-bold rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4 text-emerald-500" />
              Send Notification
            </button>

            <Link
              to="/recruiter/post-job"
              className="px-5 py-2.5 text-xs font-mono font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Post a New Role
            </Link>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:opacity-80">
              ✕
            </button>
          </div>
        )}


        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left shadow-xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Active Applications In Window
            </span>
            <div className="text-3xl font-mono font-extrabold text-neutral-900 dark:text-white mt-1">
              {totalOpenJobs}
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Live & accepting submissions in IST
            </span>
          </div>

          <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left shadow-xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Total Candidate Submissions
            </span>
            <div className="text-3xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {totalCandidateApplies}
            </div>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-1.5 block">
              {totalCandidateApplies} verified candidate submission{totalCandidateApplies === 1 ? '' : 's'} recorded
            </span>

          </div>

          <div className="p-5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-left shadow-xs">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
              Compensation Benchmark
            </span>
            <div className="text-3xl font-mono font-extrabold text-neutral-900 dark:text-white mt-1">
              {(() => {
                if (!myCompanyJobs || myCompanyJobs.length === 0) return 'No data yet';
                const validSalaries = myCompanyJobs
                  .map((j: any) => j.salaryLPA ?? j.minLpa ?? (parseFloat(j.payRange) || null))
                  .filter((val: any) => typeof val === 'number' && !isNaN(val) && val > 0);
                if (validSalaries.length === 0) return 'No data yet';
                const sum = validSalaries.reduce((acc: number, curr: number) => acc + curr, 0);
                return `₹${(sum / validSalaries.length).toFixed(1)} LPA`;
              })()}
            </div>

            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-1.5 block">
              Average base offer package across openings
            </span>
          </div>
        </div>

        {/* My Postings Section */}
        <div className="space-y-4">
          {/* Subheader & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('my_postings')}
                className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'my_postings'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                My Postings ({myCompanyJobs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all_postings')}
                className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'all_postings'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                All Openings Feed ({jobs.length})
              </button>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter listings by role/skill..."
                  className="pl-8 pr-3 py-1.5 text-xs font-mono rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-mono rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open Window Only</option>
                <option value="closed">Closed Window Only</option>
              </select>
            </div>
          </div>

          {/* Job Postings Cards */}
          <div className="space-y-3.5">
            {filteredJobs.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-950">
                <Briefcase className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <div className="text-sm font-mono font-bold text-neutral-900 dark:text-white">
                  No job postings match your filters
                </div>
                <div className="text-xs font-mono text-neutral-500 mt-1">
                  Click "+ Post a New Role" to publish a new verified opportunity.
                </div>
              </div>
            ) : (
              filteredJobs.map((job) => {
                const windowStatus = getApplicationWindowStatus(job, nowMs);
                const jobApplies = applications.filter((a) => a.jobId === job.id);
                const applicantCount = jobApplies.length;


                return (
                  <div
                    key={job.id}
                    className="p-5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5 text-left shadow-xs hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors"
                  >
                    {/* Left Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                          {job.title}
                        </span>

                        {/* Window Status Badge */}
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                            windowStatus.isOpen
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : windowStatus.status === 'upcoming'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                              : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-500 border-neutral-300 dark:border-neutral-800'
                          }`}
                        >
                          {windowStatus.badgeLabel}
                        </span>

                        {/* Countdown Pill if available */}
                        {windowStatus.countdownText && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-pulse" />
                            {windowStatus.countdownText}
                          </span>
                        )}

                        {job.adminForceStatus && job.adminForceStatus !== 'auto' && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30 font-semibold flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            Admin Force: {job.adminForceStatus}
                          </span>
                        )}

                        {/* Workplace Type */}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
                          {job.workplaceType}
                        </span>
                      </div>

                      {/* Meta information strip */}
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{job.company}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          {job.location}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                          {job.payRange}
                        </span>
                        <span>•</span>
                        <span>Min CGPA: <strong>{job.minCgpa.toFixed(1)}+</strong></span>
                      </div>

                      {/* Application Window Range (IST) */}
                      <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-2">
                        <span className="text-neutral-400">Window (IST):</span>
                        <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                          {formatToIST(job.openFrom)} → {formatToIST(job.closeOn)}
                        </span>
                      </div>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 text-[10px] font-mono rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right Controls Bar */}
                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-neutral-100 dark:border-neutral-800">
                      {/* Applicants Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedJobForApplicants(job)}
                        className="px-3.5 py-2 text-xs font-mono font-bold rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                        View Applicants ({applicantCount})
                      </button>

                      {/* Edit Button */}
                      <Link
                        to={`/recruiter/post-job?edit=${job.id}`}
                        className="px-3.5 py-2 text-xs font-mono font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                        Edit
                      </Link>

                      {/* Open/Close Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => toggleJobStatus(job.id)}
                        className={`px-3.5 py-2 text-xs font-mono font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          job.isClosed
                            ? 'border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                            : 'border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-red-600 dark:text-red-400 hover:bg-red-500/10'
                        }`}
                        title={
                          job.isClosed
                            ? 'Resume acceptance of applications within window'
                            : 'Force-close applications early'
                        }
                      >
                        {job.isClosed ? (
                          <>
                            <ToggleLeft className="w-4 h-4 text-neutral-500" />
                            <span>Resume Window</span>
                          </>
                        ) : (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-500" />
                            <span>Pause Early</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* View Applicants Modal */}
      {selectedJobForApplicants && (
        <ViewApplicantsModal
          job={selectedJobForApplicants}
          onClose={() => setSelectedJobForApplicants(null)}
        />
      )}

      {/* Send Notification Modal */}
      <SendNotificationModal
        isOpen={isSendNotificationOpen}
        onClose={() => setIsSendNotificationOpen(false)}
        senderRole="recruiter"
        senderCompany={recruiterCompany}
        senderName={user?.name || 'Technical Recruiter'}
        onNotificationSent={(msg) => showToast(msg)}
      />
    </div>
  );
};

