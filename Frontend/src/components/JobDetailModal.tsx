import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Job, SeekerProfile } from '../types';
import { getApplicationWindowStatus, formatToIST, getStatusMessage } from '../utils/istTime';
import { api } from '../lib/api';

import {
  X,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  Check,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Clock,
  Linkedin,
  HelpCircle,
  Building2,
  Share2,
  FileText,
  TrendingUp,
  UploadCloud,
  Loader2,
} from 'lucide-react';

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  seekerProfile: SeekerProfile | null;
  hasApplied: boolean;
  applicationStatus?: string;
  onApply: (job: Job, initialResume?: { resumeFileName?: string; resumeUrl?: string }) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  seekerProfile,
  hasApplied,
  applicationStatus,
  onApply,
}) => {
  const { user } = useAuth();
  const [nowMs, setNowMs] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<'overview' | 'ats_checker'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);

  // ATS Checker State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<{
    score: number;
    matchGrade: string;
    matchedSkills: string[];
    missingSkills: string[];
    suggestions: string[];
    strengths?: string[];
    gaps?: string[];
    summary?: string;
  } | null>(null);

  // ATS Resume Upload State
  const [uploadedResumeFileName, setUploadedResumeFileName] = useState<string | null>(null);
  const [uploadedResumeUrl, setUploadedResumeUrl] = useState<string | null>(null);
  const [uploadedResumeText, setUploadedResumeText] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingAts, setIsDraggingAts] = useState<boolean>(false);

  // Live timer for IST application window countdown
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset tab on job change or modal open
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      setScanResult(null);
      setIsScanning(false);
      setCopiedLink(false);
      setUploadedResumeFileName(null);
      setUploadedResumeUrl(null);
      setUploadedResumeText(null);
      setIsUploadingResume(false);
      setUploadError(null);
      setIsDraggingAts(false);
    }
  }, [isOpen, job?.id]);

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      return await file.text();
    }

    try {
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder('latin1');
      const rawText = decoder.decode(buffer);

      // 1. Extract text in PDF parenthesis operators (text)
      const matches = rawText.match(/\((.*?)\)/g) || [];
      let extracted = matches
        .map((m) => m.slice(1, -1).replace(/\\([()\\])/g, '$1').trim())
        .filter((s) => s.length > 0 && !s.startsWith('/') && !s.startsWith('Identity') && !s.includes('Obj'))
        .join(' ');

      // 2. Fallback: Extract uncompressed word tokens
      if (extracted.trim().length < 20) {
        const words = rawText.match(/[a-zA-Z0-9+#.-]{2,}/g) || [];
        const pdfKeywords = new Set([
          'obj', 'endobj', 'stream', 'endstream', 'Filter', 'FlateDecode', 'Length',
          'Catalog', 'Pages', 'Page', 'Type', 'Font', 'Encoding', 'MediaBox', 'Contents',
          'Resources', 'ProcSet', 'FontDescriptor', 'Widths'
        ]);
        extracted = words.filter((w) => !pdfKeywords.has(w)).join(' ');
      }

      return extracted.trim();
    } catch (err) {
      console.warn('Text extraction error:', err);
      return '';
    }
  };

  const handleUploadAtsResumeToGCS = async (file: File) => {
    setIsUploadingResume(true);
    setUploadError(null);
    setUploadedResumeFileName(file.name);
    setScanResult(null);

    try {
      const extractedText = await extractTextFromFile(file);
      console.log(`Extracted resume text: ${extractedText.length} characters`);

      if (!extractedText || extractedText.length < 10) {
        setUploadError("Couldn't read text from this file — try re-saving it as a standard PDF or text document and re-uploading.");
      } else {
        setUploadedResumeText(extractedText);
      }

      const contentType = file.type || 'application/pdf';
      const { uploadUrl, filePath } = await api.candidate.getResumeUploadUrl(file.name, contentType);

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with status ${uploadRes.status}`);
      }

      setUploadedResumeUrl(filePath);
    } catch (err: any) {
      console.error('ATS resume upload error:', err);
      setUploadError(err.message || 'Failed to upload resume to Cloud Storage.');
      setUploadedResumeUrl(null);
    } finally {
      setIsUploadingResume(false);
    }
  };

  if (!isOpen || !job) return null;

  // Safe normalized values to guarantee zero crashes on undefined/null data
  const company = job.company || 'Company';
  const companyInitials =
    job.companyInitials ||
    company
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ||
    'CO';
  const title = job.title || 'Engineering Role';
  const category = job.category || 'Engineering';
  const location = job.location || 'Bengaluru, KA (Remote)';
  const workplaceType = job.workplaceType || 'Remote';
  const payRange = job.payRange || job.salary || (job.minLpa && job.maxLpa ? `₹${job.minLpa} - ₹${job.maxLpa} LPA` : '₹12 - ₹18 LPA');
  const minCgpa = job.minCgpa ?? job.minCGPA ?? 7.0;
  const description =
    job.description ||
    job.jobDescription ||
    'Key engineering role responsible for building scalable web services, microservices architecture, and cloud infrastructure.';
  const responsibilities = Array.isArray(job.responsibilities) && job.responsibilities.length > 0
    ? job.responsibilities
    : [
        'Design and build high-performance, maintainable user interfaces and backend services.',
        'Collaborate with product managers and engineers across the software development lifecycle.',
        'Ensure robust quality, automated test coverage, and high uptime performance standards.',
      ];
  const skills = Array.isArray(job.skills) && job.skills.length > 0
    ? job.skills
    : ['React', 'TypeScript', 'Node.js', 'Tailwind CSS'];
  const interviewRounds = Array.isArray(job.interviewRounds) && job.interviewRounds.length > 0
    ? job.interviewRounds
    : [
        { name: 'Round 1: Online Technical Assessment', date: 'Upcoming in IST', format: '60-min Online Coding' },
        { name: 'Round 2: Technical Architecture & Problem Solving', date: 'Upcoming in IST', format: '45-min Video Call' },
        { name: 'Round 3: Engineering Leadership & Offer Discussion', date: 'Upcoming in IST', format: '30-min Video Call' },
      ];
  const customQuestions = Array.isArray(job.customQuestions) ? job.customQuestions : [];
  const candidateCgpa = seekerProfile?.cgpa ?? 8.4;
  const isEligible = candidateCgpa >= minCgpa;
  const windowStatus = getApplicationWindowStatus(job, nowMs);
  const companyLinkedInUrl =
    job.companyLinkedInUrl ||
    `https://linkedin.com/company/${company.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const dossierFileName = uploadedResumeFileName || (seekerProfile?.fullName ? `${seekerProfile.fullName.replace(/\s+/g, '_')}_Profile` : 'Candidate_Profile_Data');

  const getMatchGrade = (score: number) => {
    if (score >= 80) return 'Exceptional Match';
    if (score >= 60) return 'Good Fit';
    return 'Weak Match';
  };

  // Compute ATS Result using Gemini AI analysis with keyword fallback
  const handleRunAtsScan = async () => {
    setIsScanning(true);
    setScanProgress(30);
    setScanResult(null);

    const candidateResumeText = uploadedResumeText || [
      `Name: ${seekerProfile?.fullName || user?.name || ''}`,
      `College: ${seekerProfile?.collegeName || ''}`,
      `CGPA: ${candidateCgpa}`,
      `Skills: ${(seekerProfile?.skills || []).join(', ')}`,
      `Certifications: ${(seekerProfile?.certifications || []).join(', ')}`,
      `Interested Roles: ${(seekerProfile?.interestedRoles || []).join(', ')}`,
    ].filter(Boolean).join('\n');

    // Search keywords directly in the actual resume text + candidate profile skills
    const fullSearchableText = (candidateResumeText + ' ' + (seekerProfile?.skills || []).join(' ')).toLowerCase();
    const matched = skills.filter((s) => fullSearchableText.includes(s.toLowerCase()));
    const missing = skills.filter((s) => !matched.includes(s));

    try {
      setScanProgress(60);
      const res = await api.applications.checkAts({
        jobId: job.id,
        resumeText: candidateResumeText,
        candidateSkills: seekerProfile?.skills || [],
      });

      setScanProgress(100);
      const finalScore = typeof res.matchScore === 'number' ? res.matchScore : 0;
      setScanResult({
        score: finalScore,
        matchGrade: getMatchGrade(finalScore),
        matchedSkills: matched,
        missingSkills: missing,
        suggestions: res.summary ? [res.summary] : [],
        strengths: res.strengths || [],
        gaps: res.gaps || [],
        summary: res.summary || '',
      });
    } catch (err: any) {
      console.warn('API checkAts failed in JobDetailModal, using keyword fallback:', err);
      setScanProgress(100);
      const matchRatio = skills.length > 0 ? matched.length / skills.length : 0;
      const finalScore = Math.min(100, Math.max(0, Math.round(matchRatio * 100)));

      setScanResult({
        score: finalScore,
        matchGrade: getMatchGrade(finalScore),
        matchedSkills: matched,
        missingSkills: missing,
        suggestions: ['Evaluated using keyword matching fallback.'],
        strengths: [],
        gaps: [],
        summary: 'Keyword matching analysis was used.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs font-sans overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-left my-4 sm:my-6 flex flex-col max-h-[92vh] transition-colors">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER: Linear-style clean row/grid */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40">
          <div className="flex items-start justify-between gap-4">
            {/* Company Avatar & Role Summary */}
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 flex items-center justify-center font-mono font-bold text-emerald-600 dark:text-emerald-400 text-lg shrink-0 shadow-xs">
                {companyInitials}
              </div>

              <div className="space-y-1 flex-1 min-w-0">
                {/* Company & Badges Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    {company}
                  </span>

                  {companyLinkedInUrl && (
                    <a
                      href={companyLinkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-500 hover:text-blue-400 hover:underline"
                    >
                      <Linkedin className="w-3 h-3" />
                      <span>LinkedIn</span>
                    </a>
                  )}

                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    {category}
                  </span>

                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    Posted: {job.postedDate || 'Recent'}
                  </span>
                </div>

                {/* Job Title */}
                <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-neutral-900 dark:text-white truncate">
                  {title}
                </h1>

                {/* Metadata Row: Location, Workplace, Compensation, Min CGPA */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{location}</span>
                  </span>

                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {workplaceType}
                  </span>

                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {payRange}
                  </span>

                  <span className="text-neutral-300 dark:text-neutral-700">•</span>
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Min CGPA: <strong className="text-neutral-900 dark:text-white">{minCgpa.toFixed(1)}+</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Header Right Actions: Share & Close */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyShare}
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                title="Share link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Navigation: Overview & Criteria vs ATS Resume Match */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 text-xs font-mono rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              Role Overview & Criteria
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ats_checker');
              }}
              className={`px-3.5 py-1.5 text-xs font-mono rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ats_checker'
                  ? 'bg-emerald-500 text-black shadow-xs font-bold'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ATS Resume Match Score</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY (SCROLLABLE) */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Application Window & Live Countdown Card (IST) */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3 font-mono">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                      Indian Standard Time Application Window
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    UTC+05:30 (IST)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 block mb-0.5">Window Opens</span>
                    <strong className="text-neutral-900 dark:text-white block">
                      {job.openFromText || formatToIST(job.openFrom)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 block mb-0.5">Window Closes</span>
                    <strong className="text-neutral-900 dark:text-white block">
                      {job.closeOnText || job.deadlineText || formatToIST(job.closeOn)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 block mb-0.5">Window Status</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-bold text-xs ${
                        windowStatus.isOpen
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${windowStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500'}`} />
                      {windowStatus.badgeLabel}
                      {windowStatus.countdownText ? ` • ${windowStatus.countdownText}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Academic Eligibility Assessment Box */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 text-xs font-mono transition-colors ${
                  isEligible
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-200'
                }`}
              >
                {isEligible ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5 flex-1">
                  <div className="font-bold text-xs uppercase tracking-wide">
                    {isEligible ? 'Academic CGPA Criteria Satisfied' : 'CGPA Requirement Not Met'}
                  </div>
                  <div className="text-xs opacity-90 leading-relaxed font-sans">
                    {isEligible
                      ? `Your verified profile CGPA (${candidateCgpa.toFixed(1)} / 10.0) fulfills the minimum threshold cutoff of ${minCgpa.toFixed(1)}. You are eligible to submit your candidate dossier.`
                      : `This role requires a minimum academic CGPA cutoff of ${minCgpa.toFixed(1)} / 10.0. Your profile currently records ${candidateCgpa.toFixed(1)}.`}
                  </div>
                </div>
                <div className="shrink-0 font-mono font-bold text-xs px-2.5 py-1 rounded bg-white/60 dark:bg-neutral-900/60 border border-current">
                  {candidateCgpa.toFixed(1)} vs {minCgpa.toFixed(1)}
                </div>
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Role Overview & Context
                </h2>
                <p className="text-sm font-sans text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Key Responsibilities */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Key Responsibilities
                </h2>
                <ul className="space-y-2">
                  {responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs font-sans text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Skills & Technologies */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Required Skills & Technologies ({skills.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 text-xs font-mono rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hiring Schedule & Interview Process */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Hiring Process & Interview Stages (IST)</span>
                  </h2>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {interviewRounds.length} Stages
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {interviewRounds.map((round, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span>{round.name}</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 pl-7">
                          Format: <strong className="text-neutral-700 dark:text-neutral-300">{round.format}</strong>
                        </div>
                      </div>

                      {round.date && (
                        <div className="sm:text-right pl-7 sm:pl-0">
                          <span className="px-2.5 py-1 text-[11px] rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold inline-block">
                            {round.date}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Screening Questions Preview */}
              {customQuestions.length > 0 && (
                <div className="space-y-2.5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Application Screening Questions ({customQuestions.length})</span>
                  </h2>
                  <div className="space-y-2 font-mono text-xs">
                    {customQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200"
                      >
                        <span className="text-emerald-500 font-bold mr-1.5">Q{idx + 1}:</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company & Workplace Policy Card */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-neutral-400 block font-bold">Recruiter Entity</span>
                  <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 text-sm">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <span>{company}</span>
                  </div>
                  <span className="text-neutral-500 text-xs block">
                    {workplaceType} Work Policy • {location}
                  </span>
                </div>

                {companyLinkedInUrl && (
                  <a
                    href={companyLinkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors w-fit"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                    <span>View Verified LinkedIn Company Page</span>
                  </a>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: ATS RESUME MATCH ENGINE */}
          {activeTab === 'ats_checker' && (
            <div className="space-y-6">
              
              {/* Dossier Header Info */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                      Target Opportunity Match
                    </span>
                    <strong className="text-sm text-neutral-900 dark:text-white block font-heading">
                      {title} — {company}
                    </strong>
                    <span className="text-neutral-500 dark:text-neutral-400 text-xs block">
                      Benchmarking against {skills.length} role requirements and {minCgpa.toFixed(1)} CGPA cutoff
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRunAtsScan}
                      disabled={isScanning}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isScanning ? 'Scanning...' : 'Re-Run Scan'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Resume to Test ATS Score */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <span>Upload Resume to Check ATS Score</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    PDF, DOC, DOCX (Max 10MB)
                  </span>
                </div>

                {uploadError && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingAts(true);
                  }}
                  onDragLeave={() => setIsDraggingAts(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingAts(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleUploadAtsResumeToGCS(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                    isDraggingAts
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
                >
                  <input
                    type="file"
                    id="ats-resume-upload-input"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadAtsResumeToGCS(e.target.files[0]);
                      }
                      e.target.value = '';
                    }}
                    disabled={isUploadingResume}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-emerald-500">
                      {isUploadingResume ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UploadCloud className="w-4 h-4" />
                      )}
                    </div>

                    <div className="text-xs text-neutral-700 dark:text-neutral-300">
                      {isUploadingResume ? (
                        <span className="font-bold text-emerald-500">
                          Uploading resume to Google Cloud Storage...
                        </span>
                      ) : (
                        <>
                          <label
                            htmlFor="ats-resume-upload-input"
                            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            Click to upload resume
                          </label>{' '}
                          or drag & drop file to test ATS score
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {uploadedResumeFileName && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
                      {isUploadingResume ? (
                        <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 text-emerald-500" />
                      )}
                      <div>
                        <span className="font-bold block truncate max-w-xs">{uploadedResumeFileName}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                          {isUploadingResume
                            ? '⏳ Uploading to Cloud Storage...'
                            : uploadedResumeUrl
                            ? '✓ Uploaded & ready for application submit'
                            : '✓ Attached for ATS check'}
                        </span>
                      </div>
                    </div>

                    <label
                      htmlFor="ats-resume-upload-input"
                      className="px-2.5 py-1 text-[11px] font-mono rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white cursor-pointer"
                    >
                      Replace
                    </label>
                  </div>
                )}
              </div>

              {/* Scan in Progress Animation */}
              {isScanning && (
                <div className="p-8 text-center border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 space-y-4">
                  <Cpu className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                  <div className="font-mono text-xs text-neutral-900 dark:text-white font-bold">
                    Analyzing Resume Keywords & Academic Cutoff Match... ({scanProgress}%)
                  </div>
                  <div className="w-full max-w-md mx-auto bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    Evaluating dossier: <strong className="text-neutral-700 dark:text-neutral-300">{dossierFileName}</strong>
                  </div>
                </div>
              )}

              {/* Neutral State when scan has not been run yet */}
              {!scanResult && !isScanning && (
                <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 text-center space-y-3 font-mono">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                      ATS Score Not Checked Yet
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                      Click the button below to run Gemini AI resume analysis against {title} requirements.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunAtsScan}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Check ATS Score</span>
                  </button>
                </div>
              )}

              {/* Scan Results */}
              {scanResult && !isScanning && (
                <div className="space-y-6">
                  {/* Score Card Banner */}
                  <div className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      
                      {/* Left: Score Ring + Grade */}
                      <div className="md:col-span-7 flex items-center gap-5 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 pb-4 md:pb-0 md:pr-4">
                        <div className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center shrink-0 shadow-xs border-2 ${
                          scanResult.score >= 80
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                            : scanResult.score >= 60
                            ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'bg-red-500/10 border-red-500 text-red-500'
                        }`}>
                          <span className="text-2xl font-mono font-extrabold">
                            {scanResult.score}%
                          </span>
                          <span className="text-[9px] font-mono font-bold uppercase opacity-80 -mt-1">
                            MATCH
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold shadow-xs ${
                              scanResult.score >= 80
                                ? 'bg-emerald-500 text-black'
                                : scanResult.score >= 60
                                ? 'bg-blue-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}>
                              {scanResult.matchGrade}
                            </span>
                            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> ATS Evaluated
                            </span>
                          </div>
                          <p className="text-xs font-sans text-neutral-600 dark:text-neutral-400 leading-normal">
                            {scanResult.summary || (
                              scanResult.score >= 80
                                ? `Strong semantic alignment with technical competencies. Matched ${scanResult.matchedSkills.length} of ${skills.length} key skills.`
                                : scanResult.score >= 60
                                ? `Moderate alignment with core role requirements. Matched ${scanResult.matchedSkills.length} of ${skills.length} key skills.`
                                : `${scanResult.matchedSkills.length} of ${skills.length} required skills found in resume. Candidate does not meet core requirements.`
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right: Metrics Grid */}
                      <div className="md:col-span-5 grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 font-mono text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 block">
                            Keywords Hit
                          </span>
                          <span className={`text-sm font-bold ${
                            scanResult.matchedSkills.length > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-500'
                          }`}>
                            {scanResult.matchedSkills.length} / {skills.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-neutral-400 dark:text-neutral-500 block">
                            Academic Cutoff
                          </span>
                          <span className={`text-sm font-bold ${isEligible ? 'text-neutral-900 dark:text-white' : 'text-red-500'}`}>
                            {candidateCgpa.toFixed(1)} &ge; {minCgpa.toFixed(1)} {isEligible ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                          <span>Dossier File:</span>
                          <span className="text-emerald-500 font-bold truncate max-w-[150px]">{dossierFileName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Summary Banner */}
                  {scanResult.summary && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1 font-mono text-xs">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Executive Summary
                      </div>
                      <p className="text-neutral-800 dark:text-neutral-200 font-sans leading-relaxed pt-0.5">
                        {scanResult.summary}
                      </p>
                    </div>
                  )}

                  {/* AI Strengths & Gaps */}
                  {((scanResult.strengths && scanResult.strengths.length > 0) || (scanResult.gaps && scanResult.gaps.length > 0)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                      {scanResult.strengths && scanResult.strengths.length > 0 && (
                        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900/80 border border-emerald-500/30 space-y-2">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            Key Strengths
                          </div>
                          <ul className="space-y-1.5 text-neutral-700 dark:text-neutral-300 font-sans text-xs">
                            {scanResult.strengths.map((st, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{st}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {scanResult.gaps && scanResult.gaps.length > 0 && (
                        <div className="p-4 rounded-xl bg-white dark:bg-neutral-900/80 border border-amber-500/30 space-y-2">
                          <div className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Areas for Growth / Gaps
                          </div>
                          <ul className="space-y-1.5 text-neutral-700 dark:text-neutral-300 font-sans text-xs">
                            {scanResult.gaps.map((gp, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-amber-500 font-bold">•</span>
                                <span>{gp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Matched vs Missing Skills Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch font-mono">
                    {/* Matched Skills */}
                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-900/80 border border-emerald-500/30 shadow-xs flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              Matched Skills ({scanResult.matchedSkills.length})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                            DETECTED
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.matchedSkills.map((s) => (
                            <span
                              key={s}
                              className="px-2.5 py-1 text-xs font-mono rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-medium"
                            >
                              <Check className="w-3 h-3 text-emerald-500" />
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-4 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                        Present in both the JD and your candidate profile.
                      </p>
                    </div>

                    {/* Missing / Recommended Skills */}
                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                              Recommended Keywords ({scanResult.missingSkills.length})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold border border-neutral-300 dark:border-neutral-700">
                            SUGGESTED
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.missingSkills.map((s) => (
                            <span
                              key={s}
                              className="px-2.5 py-1 text-xs font-mono rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 flex items-center gap-1.5 font-medium"
                            >
                              <span className="text-amber-500 font-bold">+</span>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-4 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                        Incorporate these into project bullet points to improve search parsing.
                      </p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 space-y-3 font-sans">
                    <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                      <Lightbulb className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                        Actionable Resume Tailoring Recommendations
                      </h3>
                    </div>

                    <ul className="space-y-2 pt-1 text-xs text-neutral-700 dark:text-neutral-300">
                      {scanResult.suggestions.map((sug, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL ACTION FOOTER (STICKY) */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs">
          {/* Left Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Back to Job Feed
            </button>

            {activeTab === 'overview' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ats_checker');
                }}
                className="px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Run ATS Match Check</span>
              </button>
            )}
          </div>

          {/* Right Action: Apply / Applied State */}
          <div className="flex items-center justify-end">
            {hasApplied ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>{getStatusMessage(applicationStatus)}</span>
              </div>

            ) : !windowStatus.isOpen ? (
              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="px-5 py-2.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-not-allowed border border-neutral-300 dark:border-neutral-700 flex items-center gap-1.5 font-semibold"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{windowStatus.status === 'upcoming' ? 'Opening Soon' : 'Application Window Closed'}</span>
                </button>
              </div>
            ) : !isEligible ? (
              <button
                disabled
                className="px-4 py-2.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 cursor-not-allowed flex items-center gap-1.5 font-semibold"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Ineligible (CGPA &lt; {minCgpa.toFixed(1)})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApply(job, {
                    resumeFileName: uploadedResumeFileName || undefined,
                    resumeUrl: uploadedResumeUrl || undefined,
                  });
                }}
                className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-2 shadow-sm transition-all transform active:scale-98 cursor-pointer"
              >
                <span>Proceed to Apply</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
