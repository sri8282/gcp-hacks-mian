import React, { useState } from 'react';
import { SeekerProfile } from '../types';
import { Sparkles, Check, X, GraduationCap, Award, BookOpen, User, Plus, Globe, Linkedin } from 'lucide-react';

interface SeekerOnboardingModalProps {
  initialProfile?: SeekerProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: SeekerProfile) => void;
  isMandatory?: boolean;
}

const AVAILABLE_DOMAINS = [
  'Frontend',
  'Backend',
  'Fullstack',
  'AI / ML',
  'DevOps & Cloud',
  'Mobile (iOS/Android)',
  'Data Science',
  'Cybersecurity',
  'Product Design',
];

export const SeekerOnboardingModal: React.FC<SeekerOnboardingModalProps> = ({
  initialProfile,
  isOpen,
  onClose,
  onSave,
  isMandatory = false,
}) => {
  const [fullName, setFullName] = useState(initialProfile?.fullName || '');
  const [collegeName, setCollegeName] = useState(initialProfile?.collegeName || '');
  const [cgpa, setCgpa] = useState<number>(initialProfile?.cgpa ?? 8.0);
  const [passingYear, setPassingYear] = useState(initialProfile?.passingYear || '2025');
  const [linkedInUrl, setLinkedInUrl] = useState(initialProfile?.linkedInUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(initialProfile?.portfolioUrl || '');
  const [certifications, setCertifications] = useState<string[]>(
    initialProfile?.certifications || []
  );
  const [certInput, setCertInput] = useState('');
  const [interestedRoles, setInterestedRoles] = useState<string[]>(
    initialProfile?.interestedRoles || ['Frontend', 'Fullstack']
  );

  if (!isOpen) return null;

  const handleAddCert = () => {
    if (certInput.trim() && !certifications.includes(certInput.trim())) {
      setCertifications([...certifications, certInput.trim()]);
      setCertInput('');
    }
  };

  const handleRemoveCert = (cert: string) => {
    setCertifications(certifications.filter((c) => c !== cert));
  };

  const handleToggleDomain = (domain: string) => {
    if (interestedRoles.includes(domain)) {
      setInterestedRoles(interestedRoles.filter((r) => r !== domain));
    } else {
      setInterestedRoles([...interestedRoles, domain]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: SeekerProfile = {
      fullName: fullName.trim() || 'Candidate',
      collegeName: collegeName.trim() || 'University',
      cgpa: Number(cgpa),
      certifications,
      passingYear,
      interestedRoles,
      linkedInUrl: linkedInUrl.trim(),
      portfolioUrl: portfolioUrl.trim(),
      isOnboarded: true,
    };
    onSave(updatedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 sm:p-8 shadow-2xl text-left transition-colors my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              {isMandatory ? 'MANDATORY ONBOARDING GATE' : 'PROFILE CONFIGURATION'}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
              Candidate Academic & Professional Dossier
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Please complete your academic details before accessing the job portal.
            </p>
          </div>
          {!isMandatory && (
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>


        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Row 1: Name and College */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-semibold mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Alex Morgan"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-semibold mb-1.5">
                College / University *
              </label>
              <input
                type="text"
                required
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. UC Berkeley / IIT Bombay"
              />
            </div>
          </div>

          {/* Row 2: CGPA and Passing Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-semibold">
                  Current CGPA (Scale 0.0 - 10.0)
                </label>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">{cgpa.toFixed(1)} / 10.0</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5.0"
                  max="10.0"
                  step="0.1"
                  value={cgpa}
                  onChange={(e) => setCgpa(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <input
                  type="number"
                  min="0.0"
                  max="10.0"
                  step="0.1"
                  value={cgpa}
                  onChange={(e) => setCgpa(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-center font-mono text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-semibold mb-1.5">
                Graduation / Passing Year
              </label>
              <select
                value={passingYear}
                onChange={(e) => setPassingYear(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="2024">2024 (Alumni / Recent Grad)</option>
                <option value="2025">2025 (Graduating Class)</option>
                <option value="2026">2026 (Penultimate Year)</option>
                <option value="2027">2027 (Undergraduate)</option>
                <option value="2028">2028</option>
              </select>
            </div>
          </div>

          {/* Row 3: LinkedIn & Portfolio Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                Portfolio / GitHub URL
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                placeholder="https://portfolio.dev"
              />
            </div>
          </div>

          {/* Certifications (Tags) */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-semibold mb-1.5">
              Certifications & Credentials
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCert();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                placeholder="Type credential name & press enter (e.g. AWS Solutions Architect)"
              />
              <button
                type="button"
                onClick={handleAddCert}
                className="px-3 py-1.5 text-xs font-mono rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {certifications.map((cert) => (
                <span
                  key={cert}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200"
                >
                  <Award className="w-3 h-3 text-emerald-500" />
                  {cert}
                  <button
                    type="button"
                    onClick={() => handleRemoveCert(cert)}
                    className="hover:text-red-500 ml-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Interested Domains */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-semibold mb-2">
              Interested Domains & Roles (Tags marked with "Recommended" in Feed)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_DOMAINS.map((domain) => {
                const isSelected = interestedRoles.includes(domain);
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => handleToggleDomain(domain)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-semibold'
                        : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:border-neutral-400'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {domain}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button

              type="submit"
              className="px-5 py-2 text-xs font-mono font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Save & Recalibrate Feed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
