import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { useBooths } from '../../../contexts/booths';
import { useAuth } from '../../../contexts/AuthContext';
import { Menu, X, User, LogOut } from 'lucide-react';
import SponsorBanner from '../../sponsors/SponsorBanner';

export default function AttendeeHeader() {
    const { currentEvent } = useSelectedEvent();
    const { booths } = useBooths();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    // Get attendee info from localStorage
    const attendeeLogin = localStorage.getItem('attendee_login');
    const attendeeData = attendeeLogin ? JSON.parse(attendeeLogin) : null;

    // Get platinum sponsor for this event
    const platinumSponsor = booths.find(b =>
        b.isSponsor && b.sponsorshipTier === 'platinum'
    );



    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <header className="sticky top-0 bg-gradient-to-r from-white via-gray-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                {/* Logos - Company + Event with Premium Layout */}
                <div className="flex items-center gap-4">
                    {/* Company Logo */}
                    {currentEvent?.companyLogoUrl ? (
                        <img
                            src={currentEvent.companyLogoUrl}
                            alt={currentEvent.companyName || 'Organizer'}
                            className="h-16 w-auto object-contain"
                            loading="eager"
                            draggable="false"
                        />
                    ) : currentEvent?.companyName ? (
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                            {currentEvent.companyName}
                        </h1>
                    ) : null}

                    {/* Elegant Separator */}
                    {(currentEvent?.companyLogoUrl || currentEvent?.companyName) && (currentEvent?.eventLogoUrl || currentEvent?.name) && (
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
                        </div>
                    )}

                    {/* Event Logo */}
                    {currentEvent?.eventLogoUrl ? (
                        <img
                            src={currentEvent.eventLogoUrl}
                            alt={currentEvent.name}
                            className="h-16 w-auto object-contain"
                            loading="eager"
                            draggable="false"
                        />
                    ) : currentEvent?.name ? (
                        <h1 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                            {currentEvent.name}
                        </h1>
                    ) : null}
                </div>

                {/* Right side buttons */}
                <div className="flex items-center gap-2">
                    {/* Hamburger Menu */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                        aria-label="Menu"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Dropdown Menu */}
            {menuOpen && (
                <div className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2">
                        {/* Profile Section */}
                        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {attendeeData?.attendeeName || 'Attendee'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {attendeeData?.attendeeEmail || ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Platinum Sponsor Banner */}
            {platinumSponsor && (
                <div className="border-t border-gray-200 dark:border-slate-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <SponsorBanner
                            sponsor={platinumSponsor}
                            placement="header"
                            size="lg"
                            className="w-full justify-center"
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
