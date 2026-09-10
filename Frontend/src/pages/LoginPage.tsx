import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
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
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';

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

// Google Client ID read directly from environment
const googleClientId =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) || '';

interface GoogleAuthSectionProps {
  activeRole: UserRole;
  onError: (msg: string) => void;
  onSuccess: (session: { token: string; user: any }) => void;
  isAuthenticating: boolean;
  setIsAuthenticating: (val: boolean) => void;
}

const GoogleAuthSection: React.FC<GoogleAuthSectionProps> = ({
  activeRole,
  onError,
  onSuccess,
  isAuthenticating,
  setIsAuthenticating,
}) => {
  // Send token received from Google to backend for verification
  const verifyTokenWithBackend = async (rawToken: string) => {
    setIsAuthenticating(true);
    onError('');

    try {
      // Send token to real centralized API endpoint (POST /auth/google)
      const data = await api.auth.googleLogin(rawToken);

      if (!data || !data.token || !data.user) {
        throw new Error(
          (data as any)?.message ||
            'Backend failed to verify your Google identity token. Please ensure the account is valid.'
        );
      }

      // Verified successfully: pass session payload to handler
      onSuccess({
        token: data.token,
        user: data.user,
      });
    } catch (err: any) {
      console.error('Google OAuth backend verification error:', err);
      onError(
        err.message ||
          'Failed to verify Google credentials with backend. Please check network or try again.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="w-full">
      {isAuthenticating ? (
        <div className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center gap-3 font-mono text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          <span>Verifying with Google identity servers...</span>
        </div>
      ) : (
        <div className="w-full flex justify-center [&>div]:w-full">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                await verifyTokenWithBackend(credentialResponse.credential);
              } else {
                onError('Google credential token was not received.');
              }
            }}
            onError={() => {
              setIsAuthenticating(false);
              onError('Google Sign In was cancelled or failed.');
            }}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="100%"
          />
        </div>
      )}
    </div>
  );
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false);

  const { login, loginWithVerifiedSession, registerNewUser, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if ((user.role === 'seeker' || (user.role as string) === 'candidate') && user.isProfileComplete === false) {
        navigate('/seeker/complete-profile');
      } else {
        navigate(`/${user.role}/dashboard`);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    if (!trimmedPass) {
      setErrorMessage('Please enter your password.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (activeRole === 'seeker' && authMode === 'register') {
        const res = await registerNewUser('seeker', {
          name: name.trim() || 'Candidate',
          email: trimmedEmail,
          id: `user_${Date.now()}`,
          pass: trimmedPass,
        });
        if (res.success) {
          navigate('/seeker/complete-profile');
        } else {
          setErrorMessage(res.message || 'Registration failed. Please try again.');
        }
      } else {
        const res = await login(activeRole, trimmedEmail, trimmedPass);
        if (res.success) {
          const isCandidateRole = activeRole === 'seeker' || (activeRole as string) === 'candidate';
          const isProfileIncomplete = isCandidateRole && user?.isProfileComplete === false;
          if (isCandidateRole && isProfileIncomplete) {
            navigate('/seeker/complete-profile');
          } else {
            navigate(`/${activeRole}/dashboard`);
          }
        } else {
          setErrorMessage(
            res.message ||
              `Invalid credentials for ${ROLE_CONFIG[activeRole].label}. Please verify your email and password.`
          );
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Called ONLY upon successful backend verification of the real Google token
  const handleGoogleAuthSuccess = (session: { token: string; user: any }) => {
    const success = loginWithVerifiedSession(session);
    if (success) {
      const isCandidateRole = activeRole === 'seeker' || (activeRole as string) === 'candidate';
      const isProfileIncomplete = isCandidateRole && session.user.isProfileComplete === false;
      if (isCandidateRole && isProfileIncomplete) {
        navigate('/seeker/complete-profile');
      } else {
        navigate(`/${activeRole}/dashboard`);
      }
    } else {
      setErrorMessage('Failed to initialize session after Google verification.');
    }
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
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
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 font-mono animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
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
                    placeholder="name@example.com"
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
                disabled={isSubmitting}
                className="w-full mt-2 py-3 text-xs font-mono font-bold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    <span>Processing Authentication...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {activeRole === 'seeker' && authMode === 'register'
                        ? 'Create Candidate Account'
                        : `Sign In as ${ROLE_CONFIG[activeRole].label}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* ========================================================================= */}
            {/* DIVIDER & REAL GOOGLE OAUTH FLOW (Candidate Only) */}
            {/* ========================================================================= */}
            {activeRole === 'seeker' && (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                  </div>
                  <div className="relative flex justify-center text-[11px] font-mono uppercase">
                    <span className="bg-white dark:bg-neutral-950 px-3 text-neutral-400 dark:text-neutral-500 font-semibold">
                      or sign in with Google
                    </span>
                  </div>
                </div>

                {/* Real Google OAuth Provider Component */}
                <GoogleAuthSection
                  activeRole={activeRole}
                  onError={(msg) => setErrorMessage(msg)}
                  onSuccess={handleGoogleAuthSuccess}
                  isAuthenticating={isGoogleAuthenticating}
                  setIsAuthenticating={setIsGoogleAuthenticating}
                />
              </>
            )}


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
    </GoogleOAuthProvider>
  );
};
