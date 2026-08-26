import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Search,
  Filter,
  Shield,
  Briefcase,
  Clock,
  Check,
  Sparkles,
  RotateCw,
  Eye,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';

export const CandidateNotificationsView: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshCandidateStats,
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'admin' | 'recruiter'>('all');
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCandidateStats();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredNotifications = notifications.filter((n) => {
    const isUnread = n.readBy.length === 0;
    if (filterType === 'unread' && !isUnread) return false;
    if (filterType === 'admin' && n.senderRole !== 'admin') return false;
    if (filterType === 'recruiter' && n.senderRole !== 'recruiter') return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (n.title && n.title.toLowerCase().includes(term)) ||
      n.message.toLowerCase().includes(term) ||
      n.senderName.toLowerCase().includes(term) ||
      (n.senderCompany && n.senderCompany.toLowerCase().includes(term)) ||
      (n.jobTitle && n.jobTitle.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              COMMUNICATION HUB
            </span>
            {unreadNotificationCount > 0 ? (
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {unreadNotificationCount} Unread
              </span>
            ) : (
              <span className="text-xs font-mono text-neutral-500">All caught up</span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-neutral-900 dark:text-white">
            Notifications & Interview Alerts
          </h2>
          <p className="text-xs font-mono text-neutral-500 mt-1">
            Real-time stage updates, technical assessment links, and campus recruiting announcements in IST.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-emerald-500 transition-colors cursor-pointer"
            title="Refresh from server"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {unreadNotificationCount > 0 && (
            <button
              type="button"
              onClick={() => markAllNotificationsAsRead()}
              className="px-3.5 py-2 text-xs font-mono font-bold rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notifications by keyword, sender, job title..."
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'unread', 'recruiter', 'admin'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg capitalize transition-colors cursor-pointer shrink-0 ${
                filterType === type
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {type === 'all'
                ? `All (${notifications.length})`
                : type === 'unread'
                ? `Unread (${unreadNotificationCount})`
                : type === 'recruiter'
                ? 'From Recruiters'
                : 'From Admin'}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-950">
            <Bell className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
            <h3 className="text-sm font-mono font-bold text-neutral-900 dark:text-white">
              No notifications found
            </h3>
            <p className="text-xs font-mono text-neutral-500 mt-1">
              Try adjusting your filter or search query.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = notif.readBy.length === 0;
            const isAdmin = notif.senderRole === 'admin';

            return (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-4 sm:p-5 rounded-xl border transition-all text-left relative ${
                  isUnread
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {isUnread && (
                  <span className="absolute left-3 top-5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}

                <div className="pl-3 sm:pl-4 space-y-2">
                  {/* Top Bar: Sender & Time */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isAdmin
                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isAdmin ? 'ADMIN BROADCAST' : 'RECRUITER UPDATE'}
                      </span>

                      <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white flex items-center gap-1">
                        {isAdmin ? <Shield className="w-3.5 h-3.5 text-emerald-500" /> : <Briefcase className="w-3.5 h-3.5 text-emerald-500" />}
                        {notif.senderCompany || notif.senderName}
                      </span>

                      {notif.jobTitle && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                          {notif.jobTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span>{notif.sentAt}</span>
                    </div>
                  </div>

                  {/* Subject Title */}
                  {notif.title && (
                    <h4 className="text-base font-bold font-heading text-neutral-900 dark:text-white">
                      {notif.title}
                    </h4>
                  )}

                  {/* Message Body */}
                  <div className="text-xs sm:text-sm font-sans text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {notif.message}
                  </div>

                  {/* Actions Strip */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-[11px] text-neutral-400">
                      Sender: {notif.senderName} ({notif.senderRole})
                    </span>

                    {isUnread ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationAsRead(notif.id);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark as read
                      </button>
                    ) : (
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <CheckCheck className="w-3 h-3 text-emerald-500" /> Read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
