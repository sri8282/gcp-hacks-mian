import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleNavbar } from '../components/RoleNavbar';
import { WorkplaceType, InterviewRound } from '../types';
import { formatToIST, toIstDatetimeLocalString, formatLpa } from '../utils/istTime';
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Calendar,
  Clock,
  IndianRupee,
  Linkedin,
} from 'lucide-react';

const COLOR_PRESETS = [
  { id: 'emerald', label: 'Emerald Green', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'blue', label: 'Tech Blue', class: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { id: 'purple', label: 'Cyber Violet', class: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { id: 'amber', label: 'Amber Gold', class: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'rose', label: 'Rose Red', class: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { id: 'neutral', label: 'Monochrome Dark', class: 'bg-neutral-800 text-neutral-200 border-neutral-700' },
];

export const RecruiterPostJobPage: React.FC = () => {
  const { jobs, addJob, updateJob, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editJobId = searchParams.get('edit');

  const existingJob = editJobId ? jobs.find((j) => j.id === editJobId) : null;
  const isEditing = Boolean(existingJob);

  // Default Open From = Now, Close On = +30 days
  const defaultOpen = toIstDatetimeLocalString(new Date());
  const defaultCloseDate = new Date();
  defaultCloseDate.setDate(defaultCloseDate.getDate() + 30);
  const defaultClose = toIstDatetimeLocalString(defaultCloseDate);

  const recruiterCompany = user?.company || (user as any)?.recruiterProfile?.companyName || user?.name || '';

  // Form State - Blank by default except companyName pre-filled from recruiter profile
  const [title, setTitle] = useState(existingJob?.title || '');
  const [company, setCompany] = useState(existingJob?.company || recruiterCompany);
  const [companyLinkedInUrl, setCompanyLinkedInUrl] = useState(existingJob?.companyLinkedInUrl || '');
  const [category, setCategory] = useState(existingJob?.category || 'Software Engineering');
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>(existingJob?.workplaceType || 'Remote');
  const [location, setLocation] = useState(existingJob?.location || '');
  
  // LPA Salary
  const [minLpa, setMinLpa] = useState<number>(existingJob?.minLpa ?? 0);
  const [maxLpa, setMaxLpa] = useState<number>(existingJob?.maxLpa ?? 0);

  const [minCgpa, setMinCgpa] = useState<number>(existingJob?.minCgpa ?? 0);
  
  // Application Window (Open From & Close On)
  const [openFrom, setOpenFrom] = useState(existingJob?.openFrom ? toIstDatetimeLocalString(existingJob.openFrom) : defaultOpen);
  const [closeOn, setCloseOn] = useState(existingJob?.closeOn ? toIstDatetimeLocalString(existingJob.closeOn) : defaultClose);
  
  const [selectedColor, setSelectedColor] = useState(existingJob?.companyColor || COLOR_PRESETS[0].class);

  const [description, setDescription] = useState(existingJob?.description || '');

  const [responsibilities, setResponsibilities] = useState<string[]>(existingJob?.responsibilities || []);
  const [respInput, setRespInput] = useState('');

  const [skills, setSkills] = useState<string[]>(existingJob?.skills || []);
  const [skillsInput, setSkillsInput] = useState('');

  const [hasConfirmedRounds, setHasConfirmedRounds] = useState(
    existingJob?.interviewRounds ? existingJob.interviewRounds.length > 0 : false
  );
  const [interviewRounds, setInterviewRounds] = useState<InterviewRound[]>(existingJob?.interviewRounds || []);

  const [customQuestions, setCustomQuestions] = useState<string[]>(existingJob?.customQuestions || []);
  const [questionInput, setQuestionInput] = useState('');


  const [publishedToast, setPublishedToast] = useState(false);

  // Sync if editing
  useEffect(() => {
    if (existingJob) {
      setTitle(existingJob.title);
      setCompany(existingJob.company);
      setCompanyLinkedInUrl(existingJob.companyLinkedInUrl || '');
      setCategory(existingJob.category);
      setWorkplaceType(existingJob.workplaceType);
      setLocation(existingJob.location);
      if (existingJob.minLpa !== undefined && existingJob.maxLpa !== undefined) {
        setMinLpa(existingJob.minLpa);
        setMaxLpa(existingJob.maxLpa);
      }
      setMinCgpa(existingJob.minCgpa);
      if (existingJob.openFrom) setOpenFrom(toIstDatetimeLocalString(existingJob.openFrom));
      if (existingJob.closeOn) setCloseOn(toIstDatetimeLocalString(existingJob.closeOn));
      setDescription(existingJob.description);
      setResponsibilities(existingJob.responsibilities || []);
      setSkills(existingJob.skills || []);
      setSelectedColor(existingJob.companyColor || COLOR_PRESETS[0].class);
      if (existingJob.interviewRounds && existingJob.interviewRounds.length > 0) {
        setHasConfirmedRounds(true);
        setInterviewRounds(existingJob.interviewRounds);
      } else {
        setHasConfirmedRounds(false);
      }
      if (existingJob.customQuestions) {
        setCustomQuestions(existingJob.customQuestions);
      }
    }
  }, [editJobId, existingJob]);

  // Skill management
  const handleAddSkill = () => {
    if (skillsInput.trim() && !skills.includes(skillsInput.trim())) {
      setSkills([...skills, skillsInput.trim()]);
      setSkillsInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  // Responsibility management
  const handleAddResp = () => {
    if (respInput.trim()) {
      setResponsibilities([...responsibilities, respInput.trim()]);
      setRespInput('');
    }
  };

  const handleRemoveResp = (index: number) => {
    setResponsibilities(responsibilities.filter((_, idx) => idx !== index));
  };

  // Interview rounds
  const handleAddRound = () => {
    setInterviewRounds([
      ...interviewRounds,
      {
        name: `Round ${interviewRounds.length + 1}: Technical Assessment`,
        date: 'To be scheduled',
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

  // Custom screening questions
  const handleAddQuestion = () => {
    if (questionInput.trim() && !customQuestions.includes(questionInput.trim())) {
      setCustomQuestions([...customQuestions, questionInput.trim()]);
      setQuestionInput('');
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const companyInitials = company
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'TC';

    const rounds = hasConfirmedRounds
      ? interviewRounds.map((r) => ({
          name: r.name,
          date: r.date && r.date.trim() ? r.date : 'To be scheduled',
          format: r.format || 'Virtual Panel',
        }))
      : undefined;

    const formattedPayRange = formatLpa(minLpa, maxLpa);
    const openFromText = formatToIST(openFrom);
    const closeOnText = formatToIST(closeOn);

    if (isEditing && editJobId) {
      updateJob(editJobId, {
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
        interviewRounds: rounds,
        customQuestions,
      });
    } else {
      addJob({
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
        interviewRounds: rounds,
        customQuestions,
        isClosed: false,
        adminForceStatus: 'auto',
      });
    }

    setPublishedToast(true);
    setTimeout(() => {
      navigate('/recruiter/dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white flex flex-col font-sans transition-colors">
      <RoleNavbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Breadcrumb Back */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <Link
            to="/recruiter/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-500 dark:text-neutral-400 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Recruiter Dashboard
          </Link>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
            {isEditing ? 'EDITING PUBLISHED ROLE' : 'NEW ROLE CREATION PROTOCOL'}
          </span>
        </div>

        {publishedToast && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500 text-emerald-700 dark:text-emerald-300 text-xs font-mono flex items-center gap-2 shadow-md">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{isEditing ? 'Job updated successfully!' : 'Position published successfully! Live across portal.'} Redirecting...</span>
          </div>
        )}

        <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl text-left">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Recruiter Posting Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-900 dark:text-white tracking-tight">
              {isEditing ? 'Edit Job Opening' : 'Post a Verified Engineering Opening'}
            </h1>
            <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1">
              Define Indian Standard Time application windows, INR (LPA) compensation, academic cutoffs, and custom screening questions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Core Company & Role Info */}
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                01 / Company & Role Identity
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Distributed Systems Engineer"
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                    Hiring Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Stripeflow Payments"
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Company LinkedIn URL */}
              <div>
                <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                  Company LinkedIn Page URL
                </label>
                <input
                  type="url"
                  value={companyLinkedInUrl}
                  onChange={(e) => setCompanyLinkedInUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/yourcompany"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Company Logo / Color Preset */}
              <div>
                <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                  Company Badge Theme Color
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedColor(preset.class)}
                      className={`p-2.5 rounded-lg text-xs font-mono border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedColor === preset.class
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 font-bold'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 opacity-80'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${preset.class.split(' ')[0]}`} />
                      <span className="text-[11px] truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Compensation & Logistics */}
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                02 / Compensation (INR LPA), Logistics & Academic Threshold
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                    Workplace Type *
                  </label>
                  <select
                    value={workplaceType}
                    onChange={(e) => setWorkplaceType(e.target.value as WorkplaceType)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, KA (Remote)"
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                    Engineering Domain *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Fullstack">Fullstack</option>
                    <option value="AI / ML">AI / ML</option>
                    <option value="DevOps">DevOps / Cloud</option>
                    <option value="Security">Security & Cyber</option>
                    <option value="Design">UI / UX Design</option>
                    <option value="Data">Data Engineering</option>
                  </select>
                </div>
              </div>

              {/* Salary in LPA (INR) & CGPA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Min LPA */}
                <div>
                  <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                    Minimum Salary (₹ LPA) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-mono text-neutral-500">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="200"
                      required
                      value={minLpa}
                      onChange={(e) => setMinLpa(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 12"
                      className="w-full pl-7 pr-12 py-2.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                    />
                    <span className="absolute right-3 text-xs font-mono text-neutral-400">LPA</span>
                  </div>
                </div>

                {/* Max LPA */}
                <div>
                  <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                    Maximum Salary (₹ LPA) *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-mono text-neutral-500">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="200"
                      required
                      value={maxLpa}
                      onChange={(e) => setMaxLpa(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 18"
                      className="w-full pl-7 pr-12 py-2.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                    />
                    <span className="absolute right-3 text-xs font-mono text-neutral-400">LPA</span>
                  </div>
                </div>

                {/* CGPA */}
                <div>
                  <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                    Minimum CGPA Cutoff (0.0 - 10.0) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Formatted LPA Preview */}
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs font-mono flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                  Live Formatted Compensation Display:
                </span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  {formatLpa(minLpa, maxLpa)}
                </strong>
              </div>
            </div>

            {/* Section 3: Application Window (Open From & Close On in IST) */}
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 pb-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <span>03 / Application Window (Indian Standard Time)</span>
                <span className="text-[11px] text-emerald-500 lowercase">live IST validation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Applications Open From */}
                <div>
                  <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                    Applications Open From (IST) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={openFrom}
                    onChange={(e) => setOpenFrom(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-neutral-500 mt-1 block">
                    IST Preview: <strong className="text-neutral-800 dark:text-neutral-200">{formatToIST(openFrom)}</strong>
                  </span>
                </div>

                {/* Applications Close On */}
                <div>
                  <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                    Applications Close On (IST) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={closeOn}
                    onChange={(e) => setCloseOn(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-neutral-500 mt-1 block">
                    IST Preview: <strong className="text-neutral-800 dark:text-neutral-200">{formatToIST(closeOn)}</strong>
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-500 flex items-start gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Candidates can only submit applications between the Open and Close timestamps. Outside this window, applications will be automatically locked and marked as "Opening Soon" or "Closed".
                </span>
              </div>
            </div>

            {/* Section 4: Skills & Description */}
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                04 / Technical Skills & Description
              </div>

              {/* Skills Tag Input */}
              <div>
                <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                  Required Skills & Technologies (Press Enter or Add)
                </label>
                <div className="flex gap-2 mb-2">
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
                    placeholder="e.g. React, Kubernetes, Golang, GraphQL"
                    className="flex-1 px-3.5 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 text-xs font-mono font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Skill
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 min-h-[44px]">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 text-xs font-mono rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="hover:text-red-500 text-neutral-400 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                  Job Description & Mission * (Rich Text, min 4-5 lines)
                </label>
                <textarea
                  rows={5}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an overview of the technical challenges, team structure, and impact..."
                  className="w-full p-3.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Responsibilities List */}
              <div>
                <label className="block text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-1.5 font-semibold">
                  Key Responsibilities
                </label>
                <div className="flex gap-2 mb-2">
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
                    placeholder="e.g. Design zero-downtime database migrations with automated rollbacks"
                    className="flex-1 px-3.5 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddResp}
                    className="px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-300 cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {responsibilities.map((resp, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-neutral-700 dark:text-neutral-300 flex-1 pr-2">• {resp}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveResp(idx)}
                        className="text-neutral-400 hover:text-red-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 5: Hiring Process Rounds */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  05 / Hiring Process Rounds & Schedule (IST)
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasConfirmedRounds}
                    onChange={(e) => setHasConfirmedRounds(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Publish Confirmed Interview Schedule</span>
                </label>
              </div>

              {hasConfirmedRounds ? (
                <div className="space-y-3">
                  {interviewRounds.map((round, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Round Title</label>
                        <input
                          type="text"
                          value={round.name}
                          onChange={(e) => handleRoundChange(idx, 'name', e.target.value)}
                          placeholder="Round name..."
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Format</label>
                        <input
                          type="text"
                          value={round.format}
                          onChange={(e) => handleRoundChange(idx, 'format', e.target.value)}
                          placeholder="e.g. 60-min Coding"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1">Date/Time (IST)</label>
                        <input
                          type="text"
                          value={round.date || ''}
                          onChange={(e) => handleRoundChange(idx, 'date', e.target.value)}
                          placeholder="e.g. 15 Sep 2026, 02:00 PM IST"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveRound(idx)}
                          className="p-1 text-neutral-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddRound}
                    className="px-3 py-1.5 text-xs font-mono rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-300 flex items-center gap-1.5 cursor-pointer font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Interview Stage
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-500 text-center">
                  Candidates will see "Interview schedule to be announced upon initial screening".
                </div>
              )}
            </div>

            {/* Section 6: Custom Screening Questions */}
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                06 / Custom Screening Questions (Shown in Candidate Apply Modal)
              </div>

              <div className="flex gap-2">
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
                  placeholder="e.g. What is your experience with Kubernetes cluster autoscaling?"
                  className="flex-1 px-3.5 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-4 py-2 text-xs font-mono font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>

              <div className="space-y-2">
                {customQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                      Q{idx + 1}: {q}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-neutral-400 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit & Cancel Actions */}
            <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                to="/recruiter/dashboard"
                className="px-5 py-2.5 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white w-full sm:w-auto text-center"
              >
                Cancel & Return
              </Link>

              <button
                type="submit"
                className="px-8 py-3 text-xs font-mono font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer w-full sm:w-auto"
              >
                <Check className="w-4 h-4" />
                {isEditing ? 'Save & Update Opening' : 'Publish Verified Role Live'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
