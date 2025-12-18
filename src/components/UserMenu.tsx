import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserCircleIcon } from './Icons';
import Button from './ui/Button';

const UserMenu: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    if (!currentUser) return null;

    const handleLogout = async () => {
        setIsOpen(false);
        await logout();
        navigate('/');
    };

    const handleChangePassword = () => {
        setIsOpen(false);
        navigate('/change-password');
    };

    // Role badge color
    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'superadmin':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'admin':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'organizer':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    // Capitalize role for display
    const formatRole = (role: string) => {
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Dropdown Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                   bg-slate-100 hover:bg-slate-200 text-slate-700 
                   dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 
                   border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <UserCircleIcon className="w-5 h-5" />
                <div className="hidden sm:flex flex-col items-start">
                    <span className="font-semibold leading-tight">{currentUser.username}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                        {formatRole(currentUser.role)}
                    </span>
                </div>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg 
                     bg-white dark:bg-slate-800 
                     border border-slate-200 dark:border-slate-700 
                     overflow-hidden z-50"
                >
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <UserCircleIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {currentUser.username}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {currentUser.email || 'No email'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(currentUser.role)}`}>
                                {formatRole(currentUser.role)}
                            </span>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        <button
                            onClick={handleChangePassword}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-200 
                         hover:bg-slate-100 dark:hover:bg-slate-700 
                         transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Change Password
                        </button>

                        <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>

                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 
                         hover:bg-red-50 dark:hover:bg-red-900/20 
                         transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
