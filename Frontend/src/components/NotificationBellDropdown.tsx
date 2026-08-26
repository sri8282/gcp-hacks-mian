import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  Shield,
  Briefcase,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Building,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';

interface NotificationBellDropdownProps {
  onOpenNotificationsTab?: () => void;
}

export const NotificationBellDropdown: React.FC<NotificationBellDropdownProps> = ({ onOpenNotificationsTab }) => {
  const { notifications, unreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setExpandedNotifId(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleExpand = (notif: AppNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedNotifId === notif.id) {
      setExpandedNotifId(null);
    } else {
      setExpandedNotifId(notif.id);
      markNotificationAsRead(notif.id);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) setExpandedNotifId(null);
        }}
        className="relative p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-800"
        title="Notifications & Alerts"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-mono font-bold text-black ring-2 ring-white dark:ring-neutral-900 animate-pulse">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel (Single Unified Component with Inline Accordion) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 md:w-[420px] rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl z-50 overflow-hidden text-neutral-900 dark:text-neutral-100 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/50">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-tight text-neutral-900 dark:text-white uppercase">
                Notifications
              </span>
              {unreadNotificationCount > 0 ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                  {unreadNotificationCount} unread
                </span>
              ) : (
                <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                  All caught up
                </span>
              )}
            </div>

            {unreadNotificationCount > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsAsRead()}
                className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List of Notifications with Internal Scroll and Inline Accordion */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 dark:text-neutral-500 font-mono text-xs">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
                No notifications at this time.
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = notif.readBy.length === 0;
                const isAdmin = notif.senderRole === 'admin';
                const isExpanded = expandedNotifId === notif.id;

                return (
                  <div
                    key={notif.id}
                    className={`transition-colors text-left relative ${
                      isUnread
                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10'
                        : isExpanded
                        ? 'bg-neutral-50/80 dark:bg-neutral-900/60'
                        : 'hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40'
                    }`}
                  >
                    {/* Compact Clickable Summary Row */}
                    <div
                      onClick={(e) => handleToggleExpand(notif, e)}
                      className="p-3.5 pl-4 cursor-pointer select-none flex items-start justify-between gap-2.5"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Header info: Sender + Time + Unread indicator */}
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                          <div className="flex items-center gap-1.5 font-bold truncate">
                            {isUnread && (
                              <span
                                className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                                title="Unread"
                              />
                            )}
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-1 text-neutral-800 dark:text-neutral-200">
                                <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="truncate">{notif.senderCompany || 'Platform Admin'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <Briefcase className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="truncate">{notif.senderCompany || notif.senderName}</span>
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-neutral-400 shrink-0 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {(notif.sentAt || '').includes(',') ? notif.sentAt.split(',')[1] : (notif.sentAt || 'Recently')}
                          </span>

                        </div>

                        {/* Title if present */}
                        {notif.title && (
                          <h5 className="text-xs font-heading font-semibold text-neutral-900 dark:text-white line-clamp-1">
                            {notif.title}
                          </h5>
                        )}

                        {/* Short Preview (Collapsed state only) */}
                        {!isExpanded && (
                          <p className="text-xs font-sans text-neutral-600 dark:text-neutral-400 line-clamp-1 leading-normal">
                            {notif.message}
                          </p>
                        )}
                      </div>

                      {/* Accordion Chevron Icon */}
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Collapse message' : 'Expand message'}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors shrink-0 mt-0.5"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Inline Accordion Expanded Details (NO separate popup modal) */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 space-y-3 font-mono text-xs animate-in fade-in duration-150 border-t border-neutral-100 dark:border-neutral-800/60">
                        {/* Sender metadata banner */}
                        <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                            <span className="text-neutral-400">From:</span>
                            <span className="font-bold text-neutral-900 dark:text-white">{notif.senderName}</span>
                            {notif.senderCompany && (
                              <>
                                <span className="text-neutral-400">•</span>
                                <span className="text-emerald-600 dark:text-emerald-400">{notif.senderCompany}</span>
                              </>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400">{notif.sentAt}</span>
                        </div>

                        {/* Job reference tag if present */}
                        {notif.jobTitle && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-neutral-400">Related Position:</span>
                            <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold border border-neutral-200 dark:border-neutral-700 truncate">
                              {notif.jobTitle}
                            </span>
                          </div>
                        )}

                        {/* Full Message Text */}
                        <div className="p-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs font-sans text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                          {notif.message}
                        </div>

                        {/* Quick Collapse Button */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedNotifId(null);
                            }}
                            className="text-[11px] font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                          >
                            ▲ Collapse
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: View All Notifications */}
          <div className="p-2.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/40 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setExpandedNotifId(null);
                onOpenNotificationsTab?.();
              }}
              className="w-full py-1.5 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View All Notifications ({notifications.length})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
