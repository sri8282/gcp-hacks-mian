import React, { useState, useEffect } from 'react';
import { Job, WorkplaceType, InterviewRound } from '../types';
import { formatToIST, toIstDatetimeLocalString, formatLpa, getApplicationWindowStatus } from '../utils/istTime';
import {
  X,
  Check,
  Plus,
  Trash2,
  Building2,
  Briefcase,
  MapPin,
  IndianRupee,
  GraduationCap,
  Calendar,
  Clock,
  Linkedin,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface AdminJobDetailEditModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveJob: (jobId: string, updatedJob: Partial<Job>) => void;
  applicantCount: number;
}

const COLOR_PRESETS = [
  { id: 'emerald', label: 'Emerald Green', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'blue', label: 'Tech Blue', class: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { id: 'purple', label: 'Cyber Violet', class: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { id: 'amber', label: 'Amber Gold', class: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'rose', label: 'Rose Red', class: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { id: 'neutral', label: 'Monochrome Dark', class: 'bg-neutral-800 text-neutral-200 border-neutral-700' },
];

export const AdminJobDetailEditModal: React.FC<AdminJobDetailEditModalProps> = ({
  job,
  isOpen,
  onClose,
  onSaveJob,
  applicantCount,
}) => {
  const [nowMs, setNowMs] = useState(Date.now());

  // Form State initialized from job
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [companyLinkedInUrl, setCompanyLinkedInUrl] = useState('');
  const [category, setCategory] = useState('Fullstack');
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>('Remote');
  const [location, setLocation] = useState('');
  const [minLpa, setMinLpa] = useState<number>(12);
  const [maxLpa, setMaxLpa] = useState<number>(18);
  const [minCgpa, setMinCgpa] = useState<number>(7.5);
  const [openFrom, setOpenFrom] = useState('');
  const [closeOn, setCloseOn] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0].class);
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [respInput, setRespInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState('');
  const [interviewRounds, setInterviewRounds] = useState<InterviewRound[]>([]);
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [adminForceStatus, setAdminForceStatus] = useState<'auto' | 'open' | 'closed'>('auto');
  const [recruiterIsClosed, setRecruiterIsClosed] = useState(false);

  // Live timer for IST updates
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync state whenever the selected job changes
  useEffect(() => {
    if (job) {
      setTitle(job.title || '');
      setCompany(job.company || '');
      setCompanyLinkedInUrl(job.companyLinkedInUrl || `https://linkedin.com/company/${(job.company || 'tech').toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
      setCategory(job.category || 'Fullstack');
      setWorkplaceType(job.workplaceType || 'Remote');
      setLocation(job.location || 'Bengaluru, KA (Remote)');
      setMinLpa(job.minLpa !== undefined ? job.minLpa : 12);
      setMaxLpa(job.maxLpa !== undefined ? job.maxLpa : 18);
      setMinCgpa(job.minCgpa !== undefined ? job.minCgpa : 7.5);
      setOpenFrom(job.openFrom ? toIstDatetimeLocalString(job.openFrom) : '');
      setCloseOn(job.closeOn ? toIstDatetimeLocalString(job.closeOn) : '');

      setSelectedColor(job.companyColor || COLOR_PRESETS[0].class);
      setDescription(
        job.description ||
          'We are looking for a high-performing engineer to build scalable software architecture, resilient transactional workflows, and elegant user-facing interfaces.'
      );
      setResponsibilities(
        job.responsibilities && job.responsibilities.length > 0
          ? job.responsibilities
          : [
              'Architect and build resilient user interfaces and backend APIs with modern frameworks.',
              'Collaborate with product designers and engineering leadership on new core capabilities.',
              'Maintain sub-second response times, high test coverage, and strict security compliance.',
            ]
      );
      setSkills(job.skills && job.skills.length > 0 ? job.skills : []);

      setInterviewRounds(
        job.interviewRounds && job.interviewRounds.length > 0
          ? job.interviewRounds
          : [
              { name: 'Round 1: Online Technical Assessment', date: 'Upcoming in IST', format: '60-min Live Coding' },
              { name: 'Round 2: Architecture & System Design', date: 'Upcoming in IST', format: 'Virtual Whiteboard' },
              { name: 'Round 3: Behavioral & Culture Fit', date: 'Upcoming in IST', format: '45-min Video Call' },
            ]
      );
      setCustomQuestions(
        job.customQuestions && job.customQuestions.length > 0
          ? job.customQuestions
          : [
              'What is your primary experience with distributed systems and state management?',
              'Describe a complex engineering challenge you solved and how you tested the solution.',
            ]
      );
      setAdminForceStatus(job.adminForceStatus || 'auto');
      setRecruiterIsClosed(Boolean(job.isClosed));
    }
  }, [job, isOpen]);

  if (!isOpen || !job) return null;

  // Real-time Preview computation based on currently edited form state
  const mockCurrentJob: Job = {
    ...job,
    title,
    company,
    minLpa: Number(minLpa),
    maxLpa: Number(maxLpa),
    minCgpa: Number(minCgpa),
    openFrom,
    closeOn,
    adminForceStatus,
    isClosed: recruiterIsClosed,
  };
  const liveStatus = getApplicationWindowStatus(mockCurrentJob, nowMs);

  // Skill handlers
  const handleAddSkill = () => {
    if (skillsInput.trim() && !skills.includes(skillsInput.trim())) {
      setSkills([...skills, skillsInput.trim()]);
      setSkillsInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // Responsibility handlers
  const handleAddResp = () => {
    if (respInput.trim()) {
      setResponsibilities([...responsibilities, respInput.trim()]);
      setRespInput('');
    }
  };

  const handleRemoveResp = (index: number) => {
    setResponsibilities(responsibilities.filter((_, idx) => idx !== index));
  };

  // Interview round handlers
  const handleAddRound = () => {
    setInterviewRounds([
      ...interviewRounds,
      {
        name: `Round ${interviewRounds.length + 1}: Technical Assessment`,
        date: 'To be scheduled in IST',
        format: 'Video Call',
      },
    ]);
  };

  const handleRemoveRound = (index: number) => {
    setInterviewRounds(interviewRounds.filter((_, idx) => idx !== index));
  };

  const handleRoundChange = (index: number, field: keyof InterviewRound, value: string) => {
    setInterviewRounds(
      interviewRounds.map((r, idx) => (idx === index ? { ...r, [field]: value } : r))
    );
  };

  // Screening question handlers
  const handleAddQuestion = () => {
    if (questionInput.trim() && !customQuestions.includes(questionInput.trim())) {
      setCustomQuestions([...customQuestions, questionInput.trim()]);
      setQuestionInput('');
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, idx) => idx !== index));
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;

    const companyInitials = company
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'TC';

    const formattedPayRange = formatLpa(Number(minLpa), Number(maxLpa));
    const openFromText = formatToIST(openFrom);
    const closeOnText = formatToIST(closeOn);

    const updatedJob: Partial<Job> = {
      title,
      company,
      companyInitials,
      companyColor: selectedColor,
      companyLinkedInUrl,
      category,
      workplaceType,
      location,
      minLpa: Number(minLpa),
      maxLpa: Number(maxLpa),
      payRange: formattedPayRange,
      minCgpa: Number(minCgpa),
      openFrom,
      closeOn,
      openFromText,
      closeOnText,
      deadlineText: closeOnText,
      description,
      responsibilities,
      skills,
      interviewRounds,
      customQuestions,
      adminForceStatus,
    };

    onSaveJob(job.id, updatedJob);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="w-full max-w-5xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-left my-4 sm:my-6 flex flex-col max-h-[92vh] transition-colors">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER: Linear Governance Bar */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Shield className="w-3 h-3" />
                  ADMIN JOB MANAGEMENT & OVERRIDE
                </span>

                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span className="text-xs font-mono text-neutral-500">
                  Job ID: <code className="text-neutral-700 dark:text-neutral-300">{job.id}</code>
                </span>

                <span className="text-neutral-300 dark:text-neutral-700">•</span>
                <span className="text-xs font-mono text-neutral-500">
                  Total Applicants: <strong className="text-neutral-900 dark:text-white">{applicantCount}</strong>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-neutral-900 dark:text-white">
                Edit Job: {title || 'Role Title'}
              </h1>
              <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                Directly edit listing attributes, adjust IST application windows, and set system-wide administrative overrides.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer shrink-0"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Override Status Callout Bar */}
          <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Current Computed Status:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-bold ${
                  liveStatus.isOpen
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${liveStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500'}`} />
                {liveStatus.badgeLabel}
              </span>
            </div>

            {/* Admin Override Indicator Badge */}
            {adminForceStatus !== 'auto' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                Admin Override Active: {adminForceStatus === 'open' ? 'Force Open' : 'Force Closed'}
              </span>
            ) : (
              <span className="text-neutral-400 text-[11px]">
                No admin override active (Standard Window Priority)
              </span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL FORM BODY (SCROLLABLE) */}
        {/* ========================================================================= */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs font-mono">
          
          {/* ========================================================================= */}
          {/* SECTION 0: ADMIN OVERRIDE PRIORITY CONTROL BOX */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Admin Override Priority Controls
                </span>
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                Priority: Admin State &gt; Recruiter Manual Pause &gt; IST Window
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 font-sans">
              Force-closing a job hides applications platform-wide immediately. Force-opening overrides any recruiter manual pause while respecting IST application window dates.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setAdminForceStatus('auto')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  adminForceStatus === 'auto'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white shadow-xs font-bold'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs">Auto (Standard)</span>
                  {adminForceStatus === 'auto' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="text-[10px] opacity-75 mt-1 font-sans">
                  Follows recruiter toggle and IST window schedule.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAdminForceStatus('open')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  adminForceStatus === 'open'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                    : 'bg-white dark:bg-neutral-900 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Force Open
                  </span>
                  {adminForceStatus === 'open' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="text-[10px] opacity-75 mt-1 font-sans">
                  Overrides recruiter pause; respects window dates.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAdminForceStatus('closed')}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  adminForceStatus === 'closed'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs font-bold'
                    : 'bg-white dark:bg-neutral-900 border-red-500/30 text-red-600 dark:text-red-400 hover:border-red-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Force Close
                  </span>
                  {adminForceStatus === 'closed' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="text-[10px] opacity-75 mt-1 font-sans">
                  Immediately closes listing everywhere.
                </div>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: CORE ROLE IDENTITY */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
              <span>Role Identity & Employer Info</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Job Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  Role Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripeflow Payments"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Company LinkedIn URL */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <Linkedin className="w-3 h-3 text-blue-500" />
                  <span>Company LinkedIn URL</span>
                </label>
                <input
                  type="url"
                  value={companyLinkedInUrl}
                  onChange={(e) => setCompanyLinkedInUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Domain Category */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  Domain Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Frontend">Frontend Engineering</option>
                  <option value="Backend">Backend Engineering</option>
                  <option value="Fullstack">Fullstack Engineering</option>
                  <option value="DevOps & Cloud">DevOps & Cloud Infrastructure</option>
                  <option value="Data & AI">Data Engineering & Machine Learning</option>
                  <option value="Mobile">Mobile Engineering (iOS / Android)</option>
                  <option value="Product & Design">Product & Systems Design</option>
                </select>
              </div>

              {/* Workplace Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  Workplace Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Remote', 'Hybrid', 'In-office'] as WorkplaceType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setWorkplaceType(type)}
                      className={`py-2 rounded-lg border text-center transition-colors cursor-pointer ${
                        workplaceType === type
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white font-bold'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-neutral-400" />
                  <span>Location / Office Hub</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, KA (Hybrid)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: COMPENSATION & ACADEMIC CUTOFF */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
              <span>Compensation (INR LPA) & CGPA Eligibility</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Min LPA */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  Minimum CTC (₹ LPA)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="3"
                    max="100"
                    step="0.5"
                    value={minLpa}
                    onChange={(e) => setMinLpa(Number(e.target.value))}
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Max LPA */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  Maximum CTC (₹ LPA)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="3"
                    max="150"
                    step="0.5"
                    value={maxLpa}
                    onChange={(e) => setMaxLpa(Number(e.target.value))}
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Min CGPA */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Minimum CGPA Cutoff (0 - 10.0)</span>
                </label>
                <input
                  type="number"
                  min="5.0"
                  max="10.0"
                  step="0.1"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 flex items-center gap-2">
              <span>Formatted display:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">
                {formatLpa(Number(minLpa), Number(maxLpa))}
              </strong>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: IST APPLICATION WINDOW SCHEDULE */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Application Window Dates (Indian Standard Time)</span>
              </h3>
              <span className="text-[10px] text-neutral-400">UTC+05:30 (IST)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Window Opens */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  Window Opens (IST)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={openFrom}
                  onChange={(e) => setOpenFrom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
                <span className="text-[10px] text-neutral-400 block">
                  IST Format: {formatToIST(openFrom)}
                </span>
              </div>

              {/* Window Closes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  Window Closes (IST)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={closeOn}
                  onChange={(e) => setCloseOn(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
                <span className="text-[10px] text-neutral-400 block">
                  IST Format: {formatToIST(closeOn)}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: REQUIRED SKILLS */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Required Skills & Tech Stack</span>
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Add skill (e.g. Next.js, Go, Kafka, AWS)"
                className="flex-1 px-3.5 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold cursor-pointer"
              >
                Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 5: JOB DESCRIPTION & RESPONSIBILITIES */}
          {/* ========================================================================= */}
          <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Job Description & Responsibilities</span>
            </h3>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                Summary Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overview of the position, team mission, and impact..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-sans text-xs focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Key Responsibilities */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                Key Responsibilities
              </label>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={respInput}
                  onChange={(e) => setRespInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddResp();
                    }
                  }}
                  placeholder="Add bullet point responsibility..."
                  className="flex-1 px-3.5 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-sans text-xs focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddResp}
                  className="px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold cursor-pointer"
                >
                  Add Bullet
                </button>
              </div>

              <div className="space-y-1.5 pt-1 font-sans">
                {responsibilities.map((resp, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs"
                  >
                    <span className="text-neutral-700 dark:text-neutral-300 flex-1">• {resp}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveResp(idx)}
                      className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 6: HIRING PROCESS ROUNDS */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Hiring Process Rounds</span>
              </h3>
              <button
                type="button"
                onClick={handleAddRound}
                className="px-3 py-1 rounded bg-neutral-900 text-white dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Round</span>
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {interviewRounds.map((round, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-500 uppercase">Round Title</label>
                    <input
                      type="text"
                      value={round.name}
                      onChange={(e) => handleRoundChange(idx, 'name', e.target.value)}
                      placeholder="e.g. Round 1: DSA Coding"
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-500 uppercase">Date / Time (IST)</label>
                    <input
                      type="text"
                      value={round.date}
                      onChange={(e) => handleRoundChange(idx, 'date', e.target.value)}
                      placeholder="e.g. 15 Sep 2026, 03:00 PM IST"
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1 flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-neutral-500 uppercase">Assessment Format</label>
                      <input
                        type="text"
                        value={round.format}
                        onChange={(e) => handleRoundChange(idx, 'format', e.target.value)}
                        placeholder="e.g. 60-min Virtual Panel"
                        className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRound(idx)}
                      className="p-2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                      title="Remove round"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 7: SCREENING QUESTIONS */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Custom Screening Questions</span>
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
                placeholder="Add screening question for applicants..."
                className="flex-1 px-3.5 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-bold cursor-pointer"
              >
                Add Question
              </button>
            </div>

            <div className="space-y-2 pt-1 font-sans">
              {customQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs"
                >
                  <span className="text-neutral-700 dark:text-neutral-300 flex-1">
                    <strong className="text-neutral-900 dark:text-white mr-1">Q{idx + 1}:</strong>
                    {q}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="text-neutral-400 hover:text-red-500 transition-colors cursor-pointer shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* ========================================================================= */}
        {/* MODAL FOOTER ACTIONS */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/50 flex items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-neutral-500">
            <span>Updating will synchronize seeker feed, recruiter dashboard, and applications.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Job Updates</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
