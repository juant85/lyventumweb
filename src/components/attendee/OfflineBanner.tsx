// src/components/attendee/OfflineBanner.tsx
import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { Wifi, CloudUpload } from 'lucide-react';

interface OfflineBannerProps {
    pendingActionsCount?: number;
}

export default function OfflineBanner({ pendingActionsCount = 0 }: OfflineBannerProps) {
    const { isOnline, wasOffline } = useOnlineStatus();

    // Show reconnection message briefly
    if (wasOffline && isOnline) {
        return (
            <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-3 shadow-lg animate-slide-down">
                <div className="container mx-auto flex items-center justify-center gap-2">
                    <Wifi className="h-5 w-5" />
                    <span className="font-medium">Connection restored!</span>
                    {pendingActionsCount > 0 && (
                        <span className="text-sm opacity-90">
                            Syncing {pendingActionsCount} pending {pendingActionsCount === 1 ? 'action' : 'actions'}...
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // Show offline message
    if (!isOnline) {
        return (
            <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white px-4 py-3 shadow-lg">
                <div className="container mx-auto flex items-center justify-center gap-2">
                    <Wifi className="h-5 w-5" />
                    <span className="font-medium">You're offline</span>
                    <span className="text-sm opacity-90">- Viewing cached data</span>
                    {pendingActionsCount > 0 && (
                        <div className="ml-4 flex items-center gap-2 bg-amber-700 px-3 py-1 rounded-full">
                            <CloudUpload className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                {pendingActionsCount} pending
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
