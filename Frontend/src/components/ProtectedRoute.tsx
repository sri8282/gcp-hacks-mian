import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole | UserRole[];
  allowIncompleteProfile?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
  allowIncompleteProfile = false,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleStr = user.role as string;
  const isCandidate = roleStr === 'seeker' || roleStr === 'candidate';
  const isRecruiter = roleStr === 'recruiter';
  const isProfileIncomplete = isCandidate && (!user.avatarUrl || user.isProfileComplete === false);

  // If candidate's profile picture is not set, redirect to complete-profile page
  if (isCandidate && isProfileIncomplete && !allowIncompleteProfile) {
    return <Navigate to="/seeker/complete-profile" replace />;
  }

  // If candidate already set their profile picture, redirect away from complete-profile page
  if (isCandidate && !isProfileIncomplete && allowIncompleteProfile) {
    return <Navigate to="/seeker/dashboard" replace />;
  }

  // Determine user's target dashboard
  const userDashboard = isCandidate
    ? isProfileIncomplete
      ? '/seeker/complete-profile'
      : '/seeker/dashboard'
    : isRecruiter
    ? '/recruiter/dashboard'
    : '/admin/dashboard';

  // Role validation check
  if (allowedRole) {
    const rolesArray = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    const isAllowed = rolesArray.some(
      (r) => r === user.role || (r === 'seeker' && isCandidate)
    );

    if (!isAllowed) {
      return <Navigate to={userDashboard} replace />;
    }
  }

  return <>{children}</>;
};
