import React, { useState } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import {
  Clock,
  AlertTriangle,
  Trash2,
  Edit3,
  Check,
  MapPin,
  Building,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles
} from 'lucide-react';

import { getStatusMessage } from '../utils/istTime';

interface ApplicationTrackerProps {
  applications: JobApplication[];
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
}


const COLUMNS: { key: ApplicationStatus; label: string; badgeColor: string }[] = [
  { key: 'Applied', label: 'Submitted', badgeColor: 'bg-neutral-800 text-neutral-300 border-neutral-700' },
  { key: 'Interviewing', label: 'In Progress', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { key: 'Offered', label: 'Offer Received', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { key: 'Rejected', label: 'Archived', badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30' },
];

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  applications,
  onStatusChange,
  onNotesChange,
  onDelete,
}) => {
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const handleStartEdit = (app: JobApplication) => {
    setEditingNotesId(app.id);
    setNotesDraft(app.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    onNotesChange(id, notesDraft);
    setEditingNotesId(null);
  };

  // Group by status
  const getAppsByStatus = (status: ApplicationStatus) =>
    applications.filter((a) => a.status === status);

  const appliedCount = getAppsByStatus('Applied').length;
  const interviewingCount = getAppsByStatus('Interviewing').length;
  const offeredCount = getAppsByStatus('Offered').length;
  const rejectedCount = getAppsByStatus('Rejected').length;

  return (
    <div className="space-y-6">
      {/* Top Live Counters Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
            1. Applied / Submitted
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
            {appliedCount}
          </div>
        </div>
        <div className="p-3.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 uppercase font-semibold">
            2. Active Interviews
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
            {interviewingCount}
          </div>
        </div>
        <div className="p-3.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-semibold">
            3. Offers Extended
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {offeredCount}
          </div>
        </div>
        <div className="p-3.5 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
            4. Archived / Rejected
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-600 dark:text-neutral-400 mt-1">
            {rejectedCount}
          </div>
        </div>
      </div>

      {/* 4-Column Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(({ key, label }) => {
          const colApps = getAppsByStatus(key);

          return (
            <div
              key={key}
              className="flex flex-col bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 min-h-[480px] transition-colors"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white uppercase">
                    {label}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                    {colApps.length}
                  </span>
                </div>
              </div>

              {/* Applications List */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                {colApps.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-lg text-neutral-400 dark:text-neutral-500 text-xs font-mono">
                    No applications in {key.toLowerCase()} stage
                  </div>
                ) : (
                  colApps.map((app) => {
                    const isStale = app.daysInactive >= 7;
                    const isExpanded = expandedAppId === app.id;

                    return (
                      <div
                        key={app.id}
                        className={`p-3.5 rounded-lg text-left transition-all relative ${
                          isStale
                            ? 'border-2 border-amber-500 bg-amber-50/60 dark:bg-neutral-900/90'
                            : 'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-neutral-400 dark:hover:border-neutral-700 shadow-xs'
                        }`}
                      >
                        {/* Stale Alert Banner */}
                        {isStale && (
                          <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded mb-2 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span>Stale ({app.daysInactive} days inactive)</span>
                          </div>
                        )}

                        {/* Card Header: Role and Company */}
                        <div className="mb-2">
                          <h4 className="text-xs font-mono font-bold text-neutral-900 dark:text-white leading-snug line-clamp-2">
                            {app.role}
                          </h4>
                          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            {app.company}
                          </div>
                          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span className="truncate">{app.location}</span>
                          </div>
                        </div>

                        {/* Status Message Banner */}
                        <div className="mb-2.5 p-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                          <span>{getStatusMessage(app.status)}</span>
                        </div>


                        {/* Applied Date & Resume Name */}
                        <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 space-y-1 mb-2.5 pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
                          <div className="flex items-center justify-between">
                            <span>Applied: {app.appliedDate}</span>
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{app.payRange}</span>
                          </div>
                          {app.resumeFileName && (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 truncate">
                              <FileText className="w-3 h-3 shrink-0" />
                              <span className="truncate">{app.resumeFileName}</span>
                            </div>
                          )}
                        </div>

                        {/* Expandable Answers Section */}
                        {app.answers && app.answers.length > 0 && (
                          <div className="mb-2.5">
                            <button
                              type="button"
                              onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                              className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              {isExpanded ? 'Hide Submitted Responses' : `View Responses (${app.answers.length})`}
                            </button>

                            {isExpanded && (
                              <div className="mt-2 space-y-2 p-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-[10px] font-mono">
                                {app.answers.map((ans, idx) => (
                                  <div key={idx} className="space-y-0.5">
                                    <div className="text-neutral-600 dark:text-neutral-400 font-semibold">
                                      Q: {ans.question}
                                    </div>
                                    <div className="text-neutral-900 dark:text-neutral-200 bg-white dark:bg-neutral-900 p-1 rounded border border-neutral-200 dark:border-neutral-800">
                                      {ans.answer}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Editable Notes Box */}
                        <div className="mb-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mb-1">
                            <span>Candidate Notes</span>
                            {editingNotesId !== app.id && (
                              <button
                                onClick={() => handleStartEdit(app)}
                                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                              >
                                <Edit3 className="w-2.5 h-2.5" /> Edit
                              </button>
                            )}
                          </div>

                          {editingNotesId === app.id ? (
                            <div className="space-y-1.5">
                              <textarea
                                value={notesDraft}
                                onChange={(e) => setNotesDraft(e.target.value)}
                                rows={2}
                                className="w-full text-xs font-mono p-1.5 bg-white dark:bg-neutral-950 border border-emerald-500 rounded text-neutral-900 dark:text-white focus:outline-none"
                                placeholder="Add notes (e.g. interviewer names, feedback)..."
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingNotesId(null)}
                                  className="px-2 py-0.5 text-[10px] font-mono rounded text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(app.id)}
                                  className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500 text-black font-semibold flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" /> Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-950/60 p-1.5 rounded border border-neutral-200 dark:border-neutral-800 italic line-clamp-2">
                              {app.notes || 'No notes added yet.'}
                            </p>
                          )}
                        </div>

                        {/* Status Mover & Delete */}
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-neutral-500">Stage:</span>
                            <select
                              value={app.status}
                              onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
                              className="text-[11px] font-mono bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-0.5 text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                            >
                              <option value="Applied">Applied</option>
                              <option value="Interviewing">Interviewing</option>
                              <option value="Offered">Offered</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => onDelete(app.id)}
                            className="text-[11px] font-mono text-neutral-400 hover:text-red-500 hover:bg-red-500/10 px-2 py-1 rounded border border-transparent hover:border-red-500/30 flex items-center gap-1 transition-all cursor-pointer"
                            title="Remove application entry"
                            aria-label="Remove application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Entry</span>
                          </button>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
