import { Job } from '../types';

/**
 * IST (Indian Standard Time) is UTC + 5:30
 */
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Returns a Date object shifted into IST context or calculates parts from UTC+5:30
 */
export const getIstDateParts = (dateInput?: string | number | Date) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  // Safe check
  if (isNaN(d.getTime())) {
    return {
      year: 2026,
      monthIndex: 7,
      monthStr: 'Aug',
      day: 24,
      hours24: 20,
      hours12: 8,
      minutes: 30,
      seconds: 0,
      ampm: 'PM',
      dayStr: '24',
      hoursStr: '08',
      minutesStr: '30',
      secondsStr: '00',
    };
  }

  // Use Intl.DateTimeFormat with Asia/Kolkata timezone to extract exact IST numbers
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(d);

  let year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  let hour = 12;
  let minute = 0;
  let second = 0;
  let dayPeriod = 'PM';

  parts.forEach((p) => {
    if (p.type === 'year') year = parseInt(p.value, 10);
    if (p.type === 'month') month = parseInt(p.value, 10);
    if (p.type === 'day') day = parseInt(p.value, 10);
    if (p.type === 'hour') hour = parseInt(p.value, 10);
    if (p.type === 'minute') minute = parseInt(p.value, 10);
    if (p.type === 'second') second = parseInt(p.value, 10);
    if (p.type === 'dayPeriod') dayPeriod = p.value.toUpperCase();
  });

  const monthIndex = month - 1;
  const monthStr = MONTH_NAMES_SHORT[monthIndex] || 'Aug';
  const dayStr = day < 10 ? `0${day}` : `${day}`;
  const hoursStr = hour < 10 ? `0${hour}` : `${hour}`;
  const minutesStr = minute < 10 ? `0${minute}` : `${minute}`;
  const secondsStr = second < 10 ? `0${second}` : `${second}`;

  return {
    year,
    monthIndex,
    monthStr,
    day,
    hours24: dayPeriod === 'PM' && hour !== 12 ? hour + 12 : dayPeriod === 'AM' && hour === 12 ? 0 : hour,
    hours12: hour,
    minutes: minute,
    seconds: second,
    ampm: dayPeriod,
    dayStr,
    hoursStr,
    minutesStr,
    secondsStr,
  };
};

/**
 * Format to "DD MMM YYYY, hh:mm AM/PM IST"
 */
export const formatToIST = (dateInput?: string | number | Date, includeSeconds = false): string => {
  if (!dateInput) return 'N/A';
  const { dayStr, monthStr, year, hoursStr, minutesStr, secondsStr, ampm } = getIstDateParts(dateInput);
  if (includeSeconds) {
    return `${dayStr} ${monthStr} ${year}, ${hoursStr}:${minutesStr}:${secondsStr} ${ampm} IST`;
  }
  return `${dayStr} ${monthStr} ${year}, ${hoursStr}:${minutesStr} ${ampm} IST`;
};

/**
 * Format to "DD MMM YYYY"
 */
export const formatToISTDateOnly = (dateInput?: string | number | Date): string => {
  if (!dateInput) return 'N/A';
  const { dayStr, monthStr, year } = getIstDateParts(dateInput);
  return `${dayStr} ${monthStr} ${year}`;
};

/**
 * Convert ISO / Date to datetime-local input string YYYY-MM-DDTHH:mm
 */
export const toIstDatetimeLocalString = (dateInput?: string | number | Date): string => {
  const { year, monthIndex, dayStr, hoursStr, minutesStr, ampm, hours12 } = getIstDateParts(dateInput);
  const m = monthIndex + 1;
  const monthPad = m < 10 ? `0${m}` : `${m}`;
  let h24 = hours12;
  if (ampm === 'PM' && hours12 !== 12) h24 += 12;
  if (ampm === 'AM' && hours12 === 12) h24 = 0;
  const hPad = h24 < 10 ? `0${h24}` : `${h24}`;
  return `${year}-${monthPad}-${dayStr}T${hPad}:${minutesStr}`;
};

/**
 * Live duration countdown formatting (e.g. "1d 4h", "3h 25m", "14m 20s")
 */
export const formatCountdown = (diffMs: number): string => {
  if (diffMs <= 0) return '0m';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

export interface ApplicationWindowStatus {
  isOpen: boolean;
  status: 'open' | 'closed' | 'upcoming';
  badgeLabel: string;
  countdownText?: string;
  reason: string;
  isOverriddenByAdmin: boolean;
}

/**
 * Computes live application window status against current IST time
 */
export const getApplicationWindowStatus = (job: Job, nowMs?: number): ApplicationWindowStatus => {
  const now = nowMs ?? Date.now();

  const openTime = job.openFrom ? new Date(job.openFrom).getTime() : 0;
  const closeTime = job.closeOn ? new Date(job.closeOn).getTime() : Number.MAX_SAFE_INTEGER;
  const isInsideWindow = now >= openTime && now <= closeTime;

  // 1. Admin Override takes absolute highest priority:
  // - If admin has force-closed a job, it shows Closed everywhere regardless of recruiter toggle or window dates.
  // - If admin has force-opened, it overrides recruiter's closed toggle, but should still respect application window dates.
  if (job.adminForceStatus === 'closed') {
    return {
      isOpen: false,
      status: 'closed',
      badgeLabel: 'Closed (Admin Override)',
      reason: 'Admin has forcefully closed this listing.',
      isOverriddenByAdmin: true,
    };
  }

  if (job.adminForceStatus === 'open') {
    if (now < openTime) {
      const diff = openTime - now;
      return {
        isOpen: false,
        status: 'upcoming',
        badgeLabel: 'Opening Soon (Admin Force-Open Active)',
        countdownText: `Opens in ${formatCountdown(diff)}`,
        reason: `Admin force-opened this role. Applications will open on ${formatToIST(job.openFrom)}`,
        isOverriddenByAdmin: true,
      };
    }
    if (now > closeTime) {
      return {
        isOpen: false,
        status: 'closed',
        badgeLabel: 'Window Closed (Admin Force-Open Active)',
        reason: `Admin force-opened this role, but window closed on ${formatToIST(job.closeOn)}`,
        isOverriddenByAdmin: true,
      };
    }
    const remaining = closeTime - now;
    return {
      isOpen: true,
      status: 'open',
      badgeLabel: 'Open (Admin Override)',
      countdownText: `Closes in ${formatCountdown(remaining)}`,
      reason: 'Admin has forcefully opened this listing (overriding recruiter pause).',
      isOverriddenByAdmin: true,
    };
  }

  // 2. Recruiter manual early close (checked if no admin override)
  if (job.isClosed) {
    return {
      isOpen: false,
      status: 'closed',
      badgeLabel: 'Closed by Recruiter',
      reason: 'Recruiter has paused applications for this opening.',
      isOverriddenByAdmin: false,
    };
  }

  // 3. Real-time application window check
  // Before window start
  if (now < openTime) {
    const diff = openTime - now;
    return {
      isOpen: false,
      status: 'upcoming',
      badgeLabel: 'Opening Soon',
      countdownText: `Opens in ${formatCountdown(diff)}`,
      reason: `Applications open on ${formatToIST(job.openFrom)}`,
      isOverriddenByAdmin: false,
    };
  }

  // After window close
  if (now > closeTime) {
    return {
      isOpen: false,
      status: 'closed',
      badgeLabel: 'Window Closed',
      reason: `Application window closed on ${formatToIST(job.closeOn)}`,
      isOverriddenByAdmin: false,
    };
  }

  // Inside active window
  const remaining = closeTime - now;
  return {
    isOpen: true,
    status: 'open',
    badgeLabel: 'Applications Open',
    countdownText: `Closes in ${formatCountdown(remaining)}`,
    reason: `Applications close on ${formatToIST(job.closeOn)}`,
    isOverriddenByAdmin: false,
  };
};

/**
 * Format LPA range helper
 */
export const formatLpa = (minLpa: number, maxLpa: number): string => {
  return `₹${minLpa} - ₹${maxLpa} LPA`;
};
