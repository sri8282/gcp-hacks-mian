import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, Menu, X, ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { IstClock } from './IstClock';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleDashboardRedirect = () => {
    if (user) {
      navigate(`/${user.role}/dashboard`);
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 dark:bg-neutral-950/90 border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 border border-neutral-800 dark:border-neutral-200 flex items-center justify-center text-emerald-400 dark:text-emerald-600 font-mono font-bold shadow-xs">
                <span className="text-xs tracking-tighter">H/H</span>
              </div>
              <span className="text-base font-bold tracking-tight text-neutral-950 dark:text-white flex items-center gap-1.5 font-heading">
                HireHub
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </span>
            </Link>

            {/* Desktop Navigation Links - "Proof" Removed */}
            <nav className="hidden md:flex items-center space-x-8 text-xs font-mono font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              <a
                href="#roles-feed"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('roles-feed')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-neutral-950 dark:hover:text-white transition-colors"
              >
                Browse Roles
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-neutral-950 dark:hover:text-white transition-colors"
              >
                Workflow
              </a>
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-neutral-950 dark:hover:text-white transition-colors"
              >
                Engine
              </a>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-3">
            <IstClock />
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDashboardRedirect}
                  className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {user.name.split(' ')[0]} ({user.role})
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login?role=recruiter"
                  className="px-3.5 py-1.5 text-xs font-mono font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
                >
                  Post a Role
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-xs font-mono rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-950 font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  Enter Portal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 px-4 pt-3 pb-6 space-y-3">
          <a
            href="#roles-feed"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-mono text-neutral-700 dark:text-neutral-300 py-1.5 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Browse Roles
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-mono text-neutral-700 dark:text-neutral-300 py-1.5 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Workflow
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-mono text-neutral-700 dark:text-neutral-300 py-1.5 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Engine Features
          </a>
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
            {user ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleDashboardRedirect();
                  }}
                  className="w-full py-2 text-center text-xs font-mono font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black"
                >
                  Go to {user.role.toUpperCase()} Dashboard
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2 text-center text-xs font-mono text-neutral-500"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login?role=seeker"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 text-center text-xs font-mono rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black font-semibold"
                >
                  Candidate Login
                </Link>
                <Link
                  to="/login?role=recruiter"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 text-center text-xs font-mono rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700"
                >
                  Recruiter / Post a Job
                </Link>
                <Link
                  to="/login?role=admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 text-center text-xs font-mono text-neutral-500"
                >
                  Admin Access
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
