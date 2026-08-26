import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole | UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleStr = user.role as string;
  const isCandidate = roleStr === 'seeker' || roleStr === 'candidate';
  const isRecruiter = roleStr === 'recruiter';

  // Determine user's target dashboard
  const userDashboard = isCandidate
    ? '/seeker/dashboard'
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
