import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  ArrowLeft,
  AlertCircle,
  KeyRound,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; email: string; pass: string; subtitle: string; description: string }
> = {
  seeker: {
    label: 'Candidate',
    email: 'candidate@gmail.com',
    pass: '12345',
    subtitle: 'Candidate Access Portal',
    description: 'Explore verified job feed, track application pipelines in IST, and review technical rounds.',
  },
  recruiter: {
    label: 'Recruiter',
    email: 'recruiter@gmail.com',
    pass: '12345',
    subtitle: 'Recruiter & Employer Workspace',
    description: 'Post job listings, manage applicant pipelines, review candidates, and send broadcast updates.',
  },
  admin: {
    label: 'Admin',
    email: 'admin@gmail.com',
    pass: '12345',
    subtitle: 'Super Admin Governance Console',
    description: 'Global user management, job listing oversight, and IST window override controls.',
  },
};

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as UserRole) || 'seeker';

  const [activeRole, setActiveRole] = useState<UserRole>(
    ['seeker', 'recruiter', 'admin'].includes(initialRole) ? initialRole : 'seeker'
  );
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false);

  const { login, loginWithGoogle, registerNewUser, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(`/${user.role}/dashboard`);
    }
  }, [user, navigate]);

  // Clear error & reset auth mode to signin when switching to admin or recruiter
  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setErrorMessage('');
    if (role !== 'seeker') {
      setAuthMode('signin');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!trimmedPass) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (activeRole === 'seeker' && authMode === 'register') {
      registerNewUser('seeker', {
        name: name.trim() || 'Candidate',
        email: trimmedEmail,
        id: `user_${Date.now()}`,
        pass: trimmedPass,
      });
      navigate('/seeker/dashboard');
    } else {
      const success = login(activeRole, trimmedEmail, trimmedPass);
      if (success) {
        navigate(`/${activeRole}/dashboard`);
      } else {
        setErrorMessage(
          `Invalid credentials for ${ROLE_CONFIG[activeRole].label}. Please verify your email and password.`
        );
      }
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsGoogleAuthenticating(true);

    try {
      // Simulate authentic Google OAuth popup flow & verification
      await new Promise((resolve) => setTimeout(resolve, 600));

      const success = loginWithGoogle(activeRole, {
        name:
          activeRole === 'seeker'
            ? 'Alex Morgan (Google)'
            : activeRole === 'recruiter'
            ? 'Sarah Jenkins (Google)'
            : 'David Vance (Admin)',
        email:
          activeRole === 'seeker'
            ? 'candidate@gmail.com'
            : activeRole === 'recruiter'
            ? 'recruiter@gmail.com'
            : 'admin@gmail.com',
      });

      if (success) {
        navigate(`/${activeRole}/dashboard`);
      } else {
        setErrorMessage('Google Authentication failed. Please try again.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during Google Sign In.');
    } finally {
      setIsGoogleAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white flex flex-col font-sans transition-colors">
      {/* Top Header Bar */}
      <header className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md py-3.5 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to HireHub</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl text-left">
          
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-neutral-900 dark:bg-neutral-900 border border-neutral-800 text-emerald-400 font-mono font-bold text-sm mb-3.5 shadow-sm">
              H/H
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-neutral-900 dark:text-white">
              {activeRole === 'seeker' && authMode === 'register'
                ? 'Create Candidate Account'
                : `Sign in as ${ROLE_CONFIG[activeRole].label}`}
            </h1>
            <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1.5">
              {ROLE_CONFIG[activeRole].description}
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl mb-6 border border-neutral-200 dark:border-neutral-800">
            {(['seeker', 'recruiter', 'admin'] as UserRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`py-2 text-xs font-mono rounded-lg transition-all cursor-pointer text-center ${
                  activeRole === role
                    ? 'bg-white dark:bg-black text-neutral-900 dark:text-white font-bold shadow-xs border border-neutral-200 dark:border-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {ROLE_CONFIG[role].label}
              </button>
            ))}
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Login / Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {activeRole === 'seeker' && authMode === 'register' && (
              <div className="space-y-1.5">
                <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Address / User ID */}
            <div className="space-y-1.5">
              <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                Email / User ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder={`e.g. ${ROLE_CONFIG[activeRole].email}`}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block font-bold text-neutral-700 dark:text-neutral-300">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Enter password..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-2 py-3 text-xs font-mono font-bold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <span>
                {activeRole === 'seeker' && authMode === 'register'
                  ? 'Create Candidate Account'
                  : `Sign In as ${ROLE_CONFIG[activeRole].label}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* ========================================================================= */}
          {/* DIVIDER & OFFICIAL GOOGLE SIGN-IN BUTTON */}
          {/* ========================================================================= */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-[11px] font-mono uppercase">
              <span className="bg-white dark:bg-neutral-950 px-3 text-neutral-400 dark:text-neutral-500 font-semibold">
                or
              </span>
            </div>
          </div>

          {/* Official Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleAuthenticating}
            className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center gap-3 font-sans text-xs font-medium shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGoogleAuthenticating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span className="font-mono text-xs">Authenticating with Google...</span>
              </>
            ) : (
              <>
                {/* Official Google 4-Color G Mark SVG */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="font-medium tracking-normal text-neutral-800 dark:text-neutral-200">
                  Continue with Google
                </span>
              </>
            )}
          </button>

          {/* Test Credentials Helper */}
          <div className="mt-5 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-neutral-700 dark:text-neutral-300">
              <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
              <span>Default Credentials ({ROLE_CONFIG[activeRole].label}):</span>
            </div>
            <div className="text-neutral-600 dark:text-neutral-400">
              Email: <code className="text-neutral-900 dark:text-white font-bold">{ROLE_CONFIG[activeRole].email}</code>
              {' • '}
              Password: <code className="text-neutral-900 dark:text-white font-bold">{ROLE_CONFIG[activeRole].pass}</code>
            </div>
          </div>

          {/* Candidate-only Toggle between Sign In & Register */}
          {activeRole === 'seeker' && (
            <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-center font-mono text-xs">
              {authMode === 'signin' ? (
                <p className="text-neutral-600 dark:text-neutral-400">
                  New candidate?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setErrorMessage('');
                    }}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold ml-1 cursor-pointer"
                  >
                    Create candidate account
                  </button>
                </p>
              ) : (
                <p className="text-neutral-600 dark:text-neutral-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setErrorMessage('');
                    }}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold ml-1 cursor-pointer"
                  >
                    Sign in instead
                  </button>
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
