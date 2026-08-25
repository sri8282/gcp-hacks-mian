import React, { useState } from 'react';
import { Job, ApplicationAnswer } from '../types';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Building,
  MapPin,
  ArrowRight,
  Sparkles,
  Paperclip,
  Check
} from 'lucide-react';

interface ApplyModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (job: Job, data: { resumeFileName: string; answers: ApplicationAnswer[] }) => void;
  defaultCandidateName?: string;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  job,
  isOpen,
  onClose,
  onSubmit,
  defaultCandidateName = 'Alex Morgan',
}) => {
  if (!isOpen || !job) return null;

  const jobSkills = Array.isArray(job.skills) ? job.skills : ['core technical stack'];
  // Questions tailored to company and role
  const defaultQuestions = [
    `Why are you interested in joining ${job.company || 'our company'} as a ${job.title || 'team member'}?`,
    `Highlight a relevant technical project or problem where you utilized ${jobSkills.slice(0, 2).join(' or ')}.`,
    `What is your availability/start date and notice period?`,
  ];

  const questionsToUse = job.customQuestions && job.customQuestions.length > 0
    ? job.customQuestions
    : defaultQuestions;

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>(
    `${defaultCandidateName.replace(/\s+/g, '_')}_Resume_2026.pdf`
  );
  const [answers, setAnswers] = useState<string[]>(() =>
    questionsToUse.map(() => '')
  );
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setResumeFileName(file.name);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setResumeFileName(file.name);
      setErrorMsg(null);
    }
  };

  const handleAnswerChange = (index: number, val: string) => {
    const next = [...answers];
    next[index] = val;
    setAnswers(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!resumeFileName.trim()) {
      setErrorMsg('Please select or upload a resume to proceed.');
      return;
    }

    const structuredAnswers: ApplicationAnswer[] = questionsToUse.map((q, idx) => ({
      question: q,
      answer: answers[idx]?.trim() || 'Provided in standard candidate dossier and resume profile.',
    }));

    onSubmit(job, {
      resumeFileName: resumeFileName.trim(),
      answers: structuredAnswers,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 sm:p-8 shadow-2xl text-left my-8 transition-colors">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              APPLICATION DOSSIER
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
              Apply for {job.title}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs font-mono text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">{job.company}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-neutral-400" />
                {job.location}
              </span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{job.payRange}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-md border border-neutral-200 dark:border-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: Resume Upload */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-semibold mb-2">
              1. Resume Upload (.pdf, .doc, .docx) *
            </label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-5 text-center transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 hover:border-neutral-400 dark:hover:border-neutral-600'
              }`}
            >
              <input
                type="file"
                id="resume-upload-input"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-emerald-500">
                  <UploadCloud className="w-5 h-5" />
                </div>

                <div className="text-xs font-mono text-neutral-700 dark:text-neutral-300">
                  <label
                    htmlFor="resume-upload-input"
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Click to browse
                  </label>{' '}
                  or drag and drop your resume file here
                </div>
                <span className="text-[11px] font-mono text-neutral-400">
                  Supported formats: PDF, DOC, DOCX (Max 10MB)
                </span>
              </div>
            </div>

            {/* Selected File Card */}
            {resumeFileName && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2.5 text-neutral-900 dark:text-white">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-bold block truncate max-w-xs">{resumeFileName}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      ✓ Ready for submission
                    </span>
                  </div>
                </div>

                <label
                  htmlFor="resume-upload-input"
                  className="px-2.5 py-1 text-[11px] font-mono rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white cursor-pointer"
                >
                  Change File
                </label>
              </div>
            )}
          </div>

          {/* Section 2: Custom Recruiter Questions */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-semibold">
                2. Recruiter Screening Questions
              </label>
              <span className="text-[11px] font-mono text-neutral-400">
                {questionsToUse.length} custom prompts
              </span>
            </div>

            {questionsToUse.map((q, idx) => (
              <div key={idx} className="space-y-1.5">
                <label className="block text-xs font-mono text-neutral-800 dark:text-neutral-200">
                  <span className="text-emerald-500 font-bold mr-1.5">Q{idx + 1}.</span>
                  {q}
                </label>
                <textarea
                  rows={2}
                  value={answers[idx] || ''}
                  onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  placeholder={`Provide concise response for ${job.company} hiring team...`}
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 placeholder-neutral-400"
                />
              </div>
            ))}
          </div>

          {/* Form Actions */}
          <div className="pt-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-mono font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
