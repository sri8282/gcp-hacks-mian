import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatToIST } from '../utils/istTime';

export const IstClock: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [timeStr, setTimeStr] = useState<string>(() => formatToIST(new Date(), true));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(formatToIST(new Date(), true));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-900/90 dark:bg-neutral-900/90 light:bg-neutral-100 border border-neutral-800 dark:border-neutral-800 light:border-neutral-300 font-mono text-[11px] text-neutral-300 dark:text-neutral-300 light:text-neutral-700 shadow-2xs select-none`}
      title="Live Indian Standard Time (IST, UTC+5:30)"
    >
      <div className="relative flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      </div>
      <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
      <span className="font-semibold tracking-tight whitespace-nowrap">
        {timeStr}
      </span>
    </div>
  );
};
