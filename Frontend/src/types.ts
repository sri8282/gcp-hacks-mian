export type UserRole = 'seeker' | 'recruiter' | 'admin';

export interface SeekerProfile {
  fullName: string;
  collegeName: string;
  cgpa: number;
  certifications: string[];
  passingYear: string;
  interestedRoles: string[];
  isOnboarded: boolean;
  linkedInUrl?: string;
  portfolioUrl?: string;
  skills?: string[];
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  title?: string;
  company?: string;
  avatarUrl?: string;
  sessionToken?: string;
  isProfileComplete?: boolean;
  seekerProfile?: SeekerProfile;
}


export interface DemoCredential {
  role: UserRole;
  id: string;
  pass: string;
  label: string;
  name: string;
  title: string;
}

export type WorkplaceType = 'Remote' | 'Hybrid' | 'Onsite';

export interface InterviewRound {
  name: string;
  date?: string;
  format: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyInitials: string;
  companyColor: string;
  companyLinkedInUrl?: string;
  payRange: string;
  minLpa?: number;
  maxLpa?: number;
  workplaceType: WorkplaceType;
  location: string;
  category: string;
  minCgpa: number;
  deadlineText?: string;
  openFrom: string;
  closeOn: string;
  openFromText?: string;
  closeOnText?: string;
  isClosed: boolean;
  adminForceStatus?: 'auto' | 'open' | 'closed';
  postedDate: string;
  description: string;
  responsibilities: string[];
  skills: string[];
  interviewRounds?: InterviewRound[];
  customQuestions?: string[];
}

export type ApplicationStatus = 'Applied' | 'Interviewing' | 'Offered' | 'Rejected';

export interface ApplicationAnswer {
  question: string;
  answer: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  company: string;
  role: string;
  appliedDate: string;
  lastUpdatedDate: string;
  daysInactive: number;
  status: ApplicationStatus;
  notes: string;
  payRange: string;
  location: string;
  resumeFileName?: string;
  resumeUrl?: string;
  answers?: ApplicationAnswer[];
  candidateName?: string;
  candidateEmail?: string;
  candidateCgpa?: number;
  candidateCollege?: string;
  candidatePassingYear?: string;
  candidateCertifications?: string[];
  candidateInterestedRoles?: string[];
  candidateLinkedInUrl?: string;
  candidatePortfolioUrl?: string;
  candidateSkills?: string[];
}

export interface BroadcastMessage {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  recipientCount: number;
  recipientNames: string[];
  subject: string;
  body: string;
  sentAt: string;
}

export interface AdminSeekerUser {
  id: string;
  name: string;
  email: string;
  college: string;
  cgpa: number;
  passingYear: string;
  interestedRoles: string[];
  skills: string[];
  certifications: string[];
  linkedInUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  joinedDate: string;
  isDeactivated?: boolean;
}

export interface AdminRecruiterUser {
  id: string;
  name: string;
  email: string;
  company: string;
  companyInitials: string;
  companyColor: string;
  companyLinkedInUrl?: string;
  category: string;
  location: string;
  joinedDate: string;
  tier: 'Enterprise' | 'Growth' | 'Early Stage';
  isDeactivated?: boolean;
}

export type NotificationTargetType = 'all' | 'specific';

export interface TargetCandidateOption {
  id: string;
  name: string;
  email: string;
  college?: string;
  cgpa?: number;
  roleApplied?: string;
  companyApplied?: string;
}

export interface AppNotification {
  id: string;
  senderRole: 'admin' | 'recruiter';
  senderName: string;
  senderCompany?: string;
  targetType: NotificationTargetType;
  targetCandidateEmails?: string[];
  targetCandidateNames?: string[];
  message: string;
  title?: string;
  jobTitle?: string;
  jobId?: string;
  sentAt: string; // IST Formatted timestamp
  createdAtMs: number;
  readBy: string[]; // array of candidate emails/IDs who have marked as read
}

export interface CandidateApplicationStats {
  totalApplied: number;
  interviewing: number;
  offered: number;
  rejected: number;
}
