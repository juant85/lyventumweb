import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppRoute, User } from '../types';
import { getHomePathForRole } from './Layout'; // Import helper from Layout
import { useLanguage } from '../contexts/LanguageContext';
import { localeKeys } from '../i18n/locales';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: User['role'][];
  boothAccess?: boolean; // For routes accessible ONLY by booth login
  boothAccessOrRoles?: boolean; // For routes accessible by booth OR specific user roles
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, boothAccess, boothAccessOrRoles }) => {
  const { currentUser, loadingAuth } = useAuth();
  const location = useLocation();
  const { t } = useLanguage();

  const scannerAuth = localStorage.getItem('scannerAuth'); // Updated from boothAuth
  const attendeeAuth = localStorage.getItem('attendee_login');

  // Check for attendee authentication (for attendee portal routes)
  if (allowedRoles?.includes('attendee') && attendeeAuth) {
    try {
      const attendeeData = JSON.parse(attendeeAuth);
      // Validate attendee session is still valid
      if (attendeeData.attendeeId && attendeeData.eventId) {
        return children; // Attendee is authenticated
      }
    } catch (e) {
      // Invalid attendee data, clear it
      localStorage.removeItem('attendee_login');
    }
  }

  if (boothAccessOrRoles) {
    if (scannerAuth) {
      return children; // Scanner user is allowed, bypass role checks.
    }
    // No scanner auth, fall through to the standard user role check below.
  } else if (boothAccess) {
    // This is a strict, scanner-only route.
    if (!scannerAuth) {
      return <Navigate to={AppRoute.BoothLogin} state={{ from: location }} replace />;
    }
    return children;
  }

  // --- Standard User Authentication Flow ---
  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-neutral-light">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <svg className="animate-spin h-8 w-8 text-brandBlue mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-montserrat text-gray-700">{t(localeKeys.verifying)}...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // If not authenticated, redirect to the Landing Page.
    // The `boothAccessOrRoles` flow reaches here if both scanner and user auth fail.
    const destination = boothAccess ? AppRoute.BoothLogin : AppRoute.Landing;
    return <Navigate to={destination} state={{ from: location }} replace />;
  }

  // If allowedRoles are specified, check if the currentUser's role is among them
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    // User is logged in but does not have the required role for this route
    const userHomePage = getHomePathForRole(currentUser.role);
    return <Navigate to={userHomePage} replace />;
  }

  return children;
};

export default ProtectedRoute;