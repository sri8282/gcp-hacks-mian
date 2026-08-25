import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Sparkles,
  ShieldCheck,
  Building,
  Terminal,
  MapPin,
  TrendingUp,
  Cpu,
  ChevronRight,
  Code2,
  FileCheck2,
  Calendar,
  Clock,
  Briefcase,
  Users,
  Check,
  Zap,
  ArrowUpRight,
  Bell
} from 'lucide-react';

// Reusable scroll reveal component with IntersectionObserver
const RevealOnScroll: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8 pointer-events-none'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const { jobs, user } = useAuth();
  const navigate = useNavigate();

  const [heroMounted, setHeroMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const featuredJobs = jobs.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAFBFC] dark:bg-[#090D16] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black transition-colors duration-300">
      <Navbar />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (SurveySparrow Inspired Big Type + Accent Keyword + Floating Preview Card) */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden border-b border-neutral-200/80 dark:border-neutral-800/80">
        {/* Subtle background radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Big Confident Headline & CTAs */}
            <div
              className={`lg:col-span-7 text-left space-y-7 transition-all duration-700 ease-out transform ${
                heroMounted
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-6'
              }`}
            >
              {/* Category Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="tracking-wide uppercase">Direct University & Lateral Hiring Portal</span>
              </div>

              {/* 2-Line High Impact Headline (~60-70px on desktop) with Single Accent Keyword */}
              <h1 className="text-4xl sm:text-6xl lg:text-[4.15rem] font-extrabold font-heading tracking-tight leading-[1.08] text-neutral-950 dark:text-white">
                Stop guessing who&apos;s{' '}
                <span className="text-emerald-600 dark:text-emerald-400">
                  eligible.
                </span>
                <br />
                Hire with total clarity.
              </h1>

              {/* Muted Sub-line Description */}
              <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl font-normal leading-relaxed">
                HireHub replaces black-hole job applications with instant academic eligibility matching, transparent interview roadmaps, and real-time candidate pipeline tracking.
              </p>

              {/* Two CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Link
                  to="/login"
                  className="px-7 py-3.5 text-sm font-mono font-bold rounded-xl bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#roles-feed"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('roles-feed')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3.5 text-sm font-mono font-semibold rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  Browse Roles
                </a>
              </div>

              {/* Clean Trust Indicators */}
              <div className="pt-3 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Real-time CGPA verification
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Zero ghost applications
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Published rounds in IST
                </span>
              </div>
            </div>

            {/* Right Column: Live Floating Application Status Preview Card */}
            <div
              className={`lg:col-span-5 relative transition-all duration-1000 delay-200 ease-out transform ${
                heroMounted
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
            >
              {/* Floating Application Status Card (SurveySparrow testimonial/preview style) */}
              <div className="relative mx-auto max-w-md">
                {/* Background Shadow Card */}
                <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl filter blur-xl transform -rotate-1 scale-105 pointer-events-none" />

                {/* Main Card with subtle float animation */}
                <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-6 text-left shadow-2xl animate-float">
                  {/* Card Header: Live Tracker Indicator */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                        Live Application Dossier
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      MATCH SCORE 96%
                    </span>
                  </div>

                  {/* Candidate Identity */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black flex items-center justify-center font-bold text-base shrink-0 font-heading">
                      AM
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-neutral-900 dark:text-white text-sm font-heading truncate">
                          Alex Morgan
                        </h4>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          CGPA 8.4 / 10.0
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        IIT Bombay • Computer Science (Class of 2025)
                      </p>
                    </div>
                  </div>

                  {/* Applied Role Details */}
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 mb-4 font-mono text-xs">
                    <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] mb-1">
                      <span>APPLIED OPENING</span>
                      <span className="text-neutral-700 dark:text-neutral-300 font-semibold">₹18.0 - ₹24.0 LPA</span>
                    </div>
                    <div className="font-bold text-neutral-900 dark:text-white text-sm truncate">
                      Senior Frontend Engineer
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Stripeflow Payments • Bangalore (Hybrid)
                    </div>
                  </div>

                  {/* Current Stage & Status Badge */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider font-semibold">
                        Current Status
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <Clock className="w-3 h-3" />
                        Interview Round 2 Scheduled
                      </span>
                    </div>

                    {/* Progress Dots */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <div className="h-1.5 rounded-full bg-emerald-500" title="Applied - Completed" />
                      <div className="h-1.5 rounded-full bg-emerald-500" title="Online Assessment - Cleared" />
                      <div className="h-1.5 rounded-full bg-blue-500 animate-pulse" title="Technical Deep Dive - Current" />
                      <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800" title="Final Offer" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400 pt-1">
                      <span>Next: System Architecture</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tomorrow at 14:30 IST</span>
                    </div>
                  </div>
                </div>

                {/* Sub-Floating Mini Badge (SurveySparrow floating accent pill) */}
                <div className="absolute -bottom-4 -left-4 bg-neutral-950 dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl shadow-xl font-mono text-xs flex items-center gap-2 border border-neutral-800 dark:border-neutral-200 animate-float-delayed">
                  <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                  <span className="font-bold">100% Verified Academic Record</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STATS / PROOF BAR (Clean, Minimal Single Row of Big Numbers) */}
      {/* ========================================================================= */}
      <section className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-950/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-left">
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight text-neutral-950 dark:text-white">
                  14,500<span className="text-emerald-600 dark:text-emerald-400">+</span>
                </div>
                <div className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Verified Job Openings
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight text-neutral-950 dark:text-white">
                  ₹19.4 <span className="text-xs font-mono font-bold text-neutral-500 uppercase">LPA</span>
                </div>
                <div className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Average Candidate CTC
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight text-neutral-950 dark:text-white">
                  680<span className="text-emerald-600 dark:text-emerald-400">+</span>
                </div>
                <div className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Vetted Tech Companies
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight text-neutral-950 dark:text-white">
                  98.6<span className="text-emerald-600 dark:text-emerald-400">%</span>
                </div>
                <div className="text-xs font-mono font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  48-Hour Response Rate
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ALTERNATING FEATURE SECTIONS (SurveySparrow Inspired Full-Width Panels) */}
      {/* ========================================================================= */}
      
      {/* Feature 1: Instant Eligibility Matching */}
      <section id="features" className="py-24 border-b border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Pill + 2-Line Headline + Description + CTA */}
              <div className="lg:col-span-6 text-left space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                  <SlidersHorizontal className="w-3 h-3 text-emerald-500" />
                  <span>INSTANT ELIGIBILITY MATCHING</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold font-heading tracking-tight leading-[1.15] text-neutral-950 dark:text-white">
                  Cut through resume noise with{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    automated criteria scoring.</span>
                </h2>

                <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Candidates configure their verified academic CGPA, graduation batch, and technical specialties once. HireHub automatically matches them against strict job criteria in real-time, eliminating unqualified applications and manual recruiter triage.
                </p>

                <div className="pt-2">
                  <Link
                    to="/login?role=seeker"
                    className="inline-flex items-center gap-2 text-sm font-mono font-bold text-neutral-950 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 group transition-colors"
                  >
                    <span>Know more about eligibility engine</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Mockup Panel */}
              <div className="lg:col-span-6">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-7 text-left shadow-xl">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase">
                        CRITERIA EVALUATION MATRIX
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-500">
                      Profile CGPA: <strong className="text-neutral-900 dark:text-white">8.4</strong>
                    </span>
                  </div>

                  {/* Matching Rows */}
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-white">
                          Frontend Architect • Stripeflow
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          Min CGPA: 7.5 • Batch 2024-2025
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500 text-black font-bold text-[10px]">
                        ✓ ELIGIBLE (8.4 ≥ 7.5)
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-white">
                          Cloud Platform Engineer • CredFlow
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          Min CGPA: 8.0 • AWS / Kubernetes
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500 text-black font-bold text-[10px]">
                        ✓ ELIGIBLE (8.4 ≥ 8.0)
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-between opacity-80">
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-white">
                          AI Research Scientist • NeuroCore
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          Min CGPA: 9.0 • M.Tech / PhD Preferred
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 font-bold text-[10px]">
                        ✕ CUTOFF 9.0
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                    <span>Automated Pre-Screening</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Zero False Negatives</span>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Feature 2: Transparent Hiring Pipeline */}
      <section className="py-24 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-950/40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column (Desktop: Order 2): Mockup Panel */}
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-left shadow-xl font-mono">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase">
                        CANDIDATE STAGE RADAR
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold">
                      UPDATED 2 MIN AGO
                    </span>
                  </div>

                  {/* 4 Stage Kanban Mini Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-[11px]">
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                      <div className="text-[10px] text-neutral-500 uppercase font-semibold">Applied</div>
                      <div className="text-base font-bold text-neutral-900 dark:text-white mt-1">1</div>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                      <div className="text-[10px] text-neutral-500 uppercase font-semibold">In Review</div>
                      <div className="text-base font-bold text-neutral-900 dark:text-white mt-1">2</div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300">
                      <div className="text-[10px] uppercase font-bold">Interview</div>
                      <div className="text-base font-bold mt-1">1 Active</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                      <div className="text-[10px] uppercase font-bold">Offered</div>
                      <div className="text-base font-bold mt-1">1 Extended</div>
                    </div>
                  </div>

                  {/* Active Application Card */}
                  <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-neutral-900 dark:text-white">Fullstack Systems Engineer</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹22.5 LPA</span>
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Interview Scheduled • Round 2 System Design
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800/80 text-[10px] text-neutral-500">
                      <span>Interviewer: Lead Architect</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">Confirmed in IST</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (Desktop: Order 1): Pill + Headline + Description */}
              <div className="lg:col-span-6 order-1 lg:order-2 text-left space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                  <Layers className="w-3 h-3 text-emerald-500" />
                  <span>TRANSPARENT HIRING PIPELINE</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold font-heading tracking-tight leading-[1.15] text-neutral-950 dark:text-white">
                  Track every interview round with{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    zero ghosting or delays.</span>
                </h2>

                <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Never wonder what stage your application is in. The interactive pipeline board allows candidates and recruiters to track OA results, technical interview rounds in IST, and feedback notes with automatic inactivity alerts for stalled roles.
                </p>

                <div className="pt-2">
                  <Link
                    to="/seeker/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-mono font-bold text-neutral-950 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 group transition-colors"
                  >
                    <span>Know more about pipeline tracking</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Feature 3: Verified Company & Role Data */}
      <section className="py-24 border-b border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Pill + Headline + Description */}
              <div className="lg:col-span-6 text-left space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>VERIFIED COMPANY & ROLE DATA</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold font-heading tracking-tight leading-[1.15] text-neutral-950 dark:text-white">
                  Direct access to top engineering teams with{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    transparent salary bands.</span>
                </h2>

                <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Every position on HireHub has verified compensation packages in LPA, clear workplace expectations (Remote, Hybrid, Onsite), and exact application window deadlines calculated accurately in Indian Standard Time (IST).
                </p>

                <div className="pt-2">
                  <a
                    href="#roles-feed"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('roles-feed')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 text-sm font-mono font-bold text-neutral-950 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 group transition-colors"
                  >
                    <span>Know more about verified openings</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>

              {/* Right Column: Visual Mockup Panel */}
              <div className="lg:col-span-6">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-left shadow-xl font-mono">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase">
                        OFFICIAL RECRUITMENT DOSSIER
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      ADMIN VERIFIED
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 mb-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-white text-sm">
                          Senior Backend Platform Architect
                        </div>
                        <div className="text-xs text-neutral-500">
                          Razorpay Engineering • Bangalore / Hybrid
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ₹26.0 - ₹34.0 LPA
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px]">
                      <div>
                        <div className="text-neutral-500 text-[10px]">MIN CGPA</div>
                        <div className="font-bold text-neutral-800 dark:text-neutral-200">7.8+</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 text-[10px]">ROUNDS</div>
                        <div className="font-bold text-neutral-800 dark:text-neutral-200">3 Technical</div>
                      </div>
                      <div>
                        <div className="text-neutral-500 text-[10px]">DEADLINE (IST)</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">7 Days Left</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-500" /> 18 Applicants screened
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Direct Hiring Manager Contact
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW IT WORKS 3-STEP FLOW */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-24 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="text-left max-w-2xl mb-14 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
                <span>SEAMLESS WORKFLOW</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight text-neutral-950 dark:text-white">
                How HireHub Powers Modern Hiring
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400">
                A streamlined three-step pipeline connecting verified student profiles directly to active engineering teams.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-7 rounded-2xl bg-[#FAFBFC] dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-emerald-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-neutral-950 dark:bg-neutral-100 text-white dark:text-black flex items-center justify-center font-mono font-bold text-sm mb-5">
                  01
                </div>
                <h3 className="text-lg font-bold font-heading text-neutral-950 dark:text-white mb-2">
                  Calibrate Academic Profile
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-mono">
                  Input your verified university CGPA, graduation batch, engineering skills, and GitHub portfolio.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-[#FAFBFC] dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-emerald-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-neutral-950 dark:bg-neutral-100 text-white dark:text-black flex items-center justify-center font-mono font-bold text-sm mb-5">
                  02
                </div>
                <h3 className="text-lg font-bold font-heading text-neutral-950 dark:text-white mb-2">
                  Explore & Instant Apply
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-mono">
                  Discover openings matching your exact eligibility, preview interview formats, and submit without friction.
                </p>
              </div>

              <div className="p-7 rounded-2xl bg-[#FAFBFC] dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-emerald-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-neutral-950 dark:bg-neutral-100 text-white dark:text-black flex items-center justify-center font-mono font-bold text-sm mb-5">
                  03
                </div>
                <h3 className="text-lg font-bold font-heading text-neutral-950 dark:text-white mb-2">
                  Manage Pipeline & Offers
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-mono">
                  Track stage advancements, interview schedules in IST, recruiter feedback, and formal offer letters.
                </p>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FEATURED VERIFIED OPENINGS FEED */}
      {/* ========================================================================= */}
      <section id="roles-feed" className="py-24 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-[#FAFBFC] dark:bg-[#090D16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 text-left">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 mb-2">
                  <Briefcase className="w-3 h-3 text-emerald-500" />
                  <span>CURRENT OPPORTUNITIES</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading text-neutral-950 dark:text-white">
                  Featured Verified Openings
                </h2>
                <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1">
                  Live positions with confirmed salary bands and structured evaluation rounds.
                </p>
              </div>

              <Link
                to="/seeker/dashboard"
                className="px-5 py-2.5 text-xs font-mono font-bold rounded-xl bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black inline-flex items-center gap-2 self-start sm:self-auto transition-all shadow-xs"
              >
                <span>View All Open Roles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {featuredJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-left flex flex-col justify-between hover:border-neutral-400 dark:hover:border-neutral-600 transition-all shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {job.company}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                        {job.workplaceType}
                      </span>
                    </div>

                    <h3 className="text-base font-bold font-heading text-neutral-950 dark:text-white mb-2">
                      {job.title}
                    </h3>

                    <div className="text-xs font-mono text-neutral-600 dark:text-neutral-400 mb-4 flex items-center gap-3">
                      <span className="text-neutral-900 dark:text-white font-bold">{job.payRange}</span>
                      <span>•</span>
                      <span>Min CGPA: {job.minCgpa.toFixed(1)}+</span>
                      <span>•</span>
                      <span>{job.location}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 text-[10px] font-mono rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <Link
                      to="/seeker/dashboard"
                      className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      Apply Now <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SITEMAP FOOTER (Refined Multi-Column Structure) */}
      {/* ========================================================================= */}
      <footer className="pt-16 pb-12 bg-white dark:bg-neutral-950 text-left border-t border-neutral-200/80 dark:border-neutral-800/80 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-14">
            {/* Column 1: Brand Info */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-950 dark:bg-white text-white dark:text-black flex items-center justify-center font-mono font-bold text-xs">
                  H/H
                </div>
                <span className="font-bold text-neutral-950 dark:text-white text-sm font-heading">
                  HireHub
                </span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 text-xs leading-relaxed max-w-sm font-sans">
                Next-generation placement and direct hiring infrastructure. Designed for academic eligibility scoring, live application pipelines, and real-time candidate transparency.
              </p>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500">
                Operating System • Real-Time Placement Portal v3.0 (IST)
              </div>
            </div>

            {/* Column 2: Candidates */}
            <div className="space-y-3">
              <div className="font-bold text-neutral-950 dark:text-white uppercase text-[11px] tracking-wider">
                For Candidates
              </div>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <Link to="/seeker/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Browse All Roles
                  </Link>
                </li>
                <li>
                  <Link to="/login?role=seeker" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Academic Profiler
                  </Link>
                </li>
                <li>
                  <Link to="/seeker/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Live Pipeline Tracker
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Employers */}
            <div className="space-y-3">
              <div className="font-bold text-neutral-950 dark:text-white uppercase text-[11px] tracking-wider">
                For Employers
              </div>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <Link to="/recruiter/post-job" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Post a Verified Role
                  </Link>
                </li>
                <li>
                  <Link to="/recruiter/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Recruiter Console
                  </Link>
                </li>
                <li>
                  <Link to="/login?role=recruiter" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Candidate Screening
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Governance */}
            <div className="space-y-3">
              <div className="font-bold text-neutral-950 dark:text-white uppercase text-[11px] tracking-wider">
                Governance
              </div>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <Link to="/admin/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Admin Moderation
                  </Link>
                </li>
                <li>
                  <Link to="/login?role=admin" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    System Audit Logs
                  </Link>
                </li>
                <li>
                  <Link to="/admin/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    Candidate Dossiers
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-200/80 dark:border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
            <div>© 2026 HireHub Inc. All rights reserved. Zero telemetry.</div>
            <div className="flex items-center gap-4">
              <span className="hover:text-neutral-800 dark:hover:text-neutral-300 cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-neutral-800 dark:hover:text-neutral-300 cursor-pointer">Terms of Service</span>
              <span>•</span>
              <span className="hover:text-neutral-800 dark:hover:text-neutral-300 cursor-pointer">IST Time Standard</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
