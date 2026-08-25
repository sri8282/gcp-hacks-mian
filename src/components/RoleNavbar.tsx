import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, LogOut, PlusCircle, Layers, UserCheck, Shield, ChevronRight, Home, Sparkles, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { IstClock } from './IstClock';
import { NotificationBellDropdown } from './NotificationBellDropdown';

interface RoleNavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenProfile?: () => void;
}

export const RoleNavbar: React.FC<RoleNavbarProps> = ({ activeTab, onTabChange, onOpenProfile }) => {
  const { user, logout, unreadNotificationCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'seeker':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            CANDIDATE
          </span>
        );
      case 'recruiter':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            RECRUITER
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600">
            <Shield className="w-3 h-3 text-emerald-500" />
            ADMIN
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/95 dark:bg-black/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors text-neutral-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Brand and Role */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded bg-black dark:bg-neutral-900 border border-neutral-700 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
                H/H
              </div>
              <span className="font-mono text-sm font-bold tracking-tight text-neutral-900 dark:text-white">
                HIREHUB
              </span>
            </Link>

            <div className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-neutral-400 hidden sm:block" />
              {getRoleBadge()}
            </div>
          </div>

          {/* Center Navigation Links based on Role (Desktop) */}
          <div className="hidden md:flex items-center space-x-1">
            {user?.role === 'seeker' && (
              <>
                <button
                  type="button"
                  onClick={() => onTabChange?.('jobs')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                    activeTab === 'jobs'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Job Discovery
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange?.('tracker')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                    activeTab === 'tracker'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Pipeline Tracker
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange?.('notifications')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors cursor-pointer relative flex items-center gap-1.5 ${
                    activeTab === 'notifications'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <span>Notifications</span>
                  {unreadNotificationCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              </>
            )}

            {user?.role === 'recruiter' && (
              <>
                <Link
                  to="/recruiter/dashboard"
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
                    location.pathname === '/recruiter/dashboard'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Active Roles
                </Link>
                <Link
                  to="/recruiter/post-job"
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors flex items-center gap-1.5 ${
                    location.pathname === '/recruiter/post-job'
                      ? 'bg-emerald-500 text-black font-semibold'
                      : 'text-emerald-600 dark:text-emerald-400 hover:opacity-80'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Post a Role
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link
                  to="/admin/dashboard"
                  className="px-3 py-1.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-md font-semibold"
                >
                  Overview & Moderation
                </Link>
              </>
            )}
          </div>

          {/* Right Action Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Live IST Clock */}
            <div className="hidden sm:block">
              <IstClock />
            </div>

            {/* Candidate Notification Bell Dropdown */}
            {user?.role === 'seeker' && (
              <NotificationBellDropdown onOpenNotificationsTab={() => onTabChange?.('notifications')} />
            )}

            <ThemeToggle />

            {/* Profile trigger (if Seeker) */}
            {user?.role === 'seeker' && onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Edit Academic & Skills Profile"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Profile (CGPA {user?.seekerProfile?.cgpa ?? 8.4})</span>
              </button>
            )}

            {/* Recruiter fast post CTA */}
            {user?.role === 'recruiter' && location.pathname !== '/recruiter/post-job' && (
              <Link
                to="/recruiter/post-job"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Post Job</span>
              </Link>
            )}

            {/* User Indicator */}
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-200 dark:border-neutral-800">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-neutral-300 dark:border-neutral-700 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-xs font-mono font-bold text-neutral-700 dark:text-neutral-200 shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-mono font-medium text-neutral-900 dark:text-white leading-none truncate max-w-[140px]">
                  {user?.name || 'Authenticated User'}
                </p>
                <p className="text-[10px] font-mono text-neutral-500 leading-tight truncate max-w-[140px]">
                  {user?.company || user?.email || 'Logged In'}
                </p>
              </div>
            </div>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3 space-y-2 text-xs font-mono">
          {user?.role === 'seeker' && (
            <>
              <button
                type="button"
                onClick={() => {
                  onTabChange?.('jobs');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'jobs'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Job Discovery Feed
              </button>
              <button
                type="button"
                onClick={() => {
                  onTabChange?.('tracker');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  activeTab === 'tracker'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Pipeline Tracker
              </button>
              <button
                type="button"
                onClick={() => {
                  onTabChange?.('notifications');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${
                  activeTab === 'notifications'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span>Notifications & Alerts</span>
                {unreadNotificationCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenProfile();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-emerald-600 dark:text-emerald-400 flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 mt-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Academic Profile (CGPA {user?.seekerProfile?.cgpa ?? 8.4})</span>
                </button>
              )}
            </>
          )}

          {user?.role === 'recruiter' && (
            <>
              <Link
                to="/recruiter/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
              >
                Active Roles Dashboard
              </Link>
              <Link
                to="/recruiter/post-job"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md bg-emerald-500 text-black font-bold text-center mt-1"
              >
                + Post a New Role
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
            >
              Overview & Moderation
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

