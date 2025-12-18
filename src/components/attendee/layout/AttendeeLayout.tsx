import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import BottomNav from './BottomNav';
import AttendeeHeader from './AttendeeHeader';
import Alert from '../../ui/Alert';
import OfflineBanner from '../OfflineBanner';
import { usePendingActions } from '../../../hooks/usePendingActions';

export default function AttendeeLayout() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const pendingActionsCount = usePendingActions();

    useEffect(() => {
        console.log('[AttendeeLayout] Mounted, currentUser:', currentUser);
        // Redirect if not an attendee
        if (currentUser && currentUser.role !== 'attendee') {
            console.log('[AttendeeLayout] User is not attendee, redirecting');
            navigate('/');
        }
    }, [currentUser, navigate]);

    console.log('[AttendeeLayout] Rendering...');

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Alert type="error" message="No user session found" />
            </div>
        );
    }

    if (currentUser.role !== 'attendee') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Alert type="error" message="Access denied - Attendee role required" />
            </div>
        );
    }

    return (
        <div className="attendee-layout min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
            <OfflineBanner pendingActionsCount={pendingActionsCount} />
            <AttendeeHeader />

            <main className="flex-1 overflow-y-auto pb-20 -webkit-overflow-scrolling-touch">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Outlet />
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
