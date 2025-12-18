// src/components/profiles/ProfileListView.tsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Attendee } from '../../types';
import { UserIcon, ChevronUpIcon, ChevronDownIcon, CheckCircleIcon, XCircleIcon, PaperAirplaneIcon } from '../Icons';
import { motion } from 'framer-motion';
import EmailStatusBadge from '../admin/EmailStatusBadge';

export interface ProfileListViewProps {
    attendees: (Attendee & { checkInTime: string | null })[];
    selectedIds: Set<string>;
    onSelect: (attendeeId: string, isSelected: boolean) => void;
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isVendorView?: boolean;
}

type SortField = 'name' | 'email' | 'organization' | 'checkIn' | 'lastEmail';
type SortDirection = 'asc' | 'desc';

export const ProfileListView: React.FC<ProfileListViewProps> = ({
    attendees,
    selectedIds,
    onSelect,
    onSelectAll,
    isVendorView = false,
}) => {
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedAttendees = useMemo(() => {
        return [...attendees].sort((a, b) => {
            let compareResult = 0;

            switch (sortField) {
                case 'name':
                    compareResult = (a.name || '').localeCompare(b.name || '');
                    break;
                case 'email':
                    compareResult = (a.email || '').localeCompare(b.email || '');
                    break;
                case 'organization':
                    compareResult = (a.organization || '').localeCompare(b.organization || '');
                    break;
                case 'checkIn':
                    const aTime = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
                    const bTime = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
                    compareResult = aTime - bTime;
                    break;
                case 'lastEmail':
                    const aEmailTime = a.lastEmailSentAt ? new Date(a.lastEmailSentAt).getTime() : 0;
                    const bEmailTime = b.lastEmailSentAt ? new Date(b.lastEmailSentAt).getTime() : 0;
                    compareResult = aEmailTime - bEmailTime;
                    break;
            }

            return sortDirection === 'asc' ? compareResult : -compareResult;
        });
    }, [attendees, sortField, sortDirection]);

    const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
        if (sortField !== field) {
            return <ChevronUpIcon className="w-4 h-4 opacity-30" />;
        }
        return sortDirection === 'asc'
            ? <ChevronUpIcon className="w-4 h-4 text-primary-500" />
            : <ChevronDownIcon className="w-4 h-4 text-primary-500" />;
    };

    const allSelected = attendees.length > 0 && selectedIds.size === attendees.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < attendees.length;

    return (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow-sm ring-1 ring-black/5 dark:ring-white/10 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                {/* Select All Checkbox */}
                                <th scope="col" className="relative w-12 px-4 sm:px-6">
                                    <input
                                        type="checkbox"
                                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                                        ref={(input) => {
                                            if (input) {
                                                input.indeterminate = someSelected;
                                            }
                                        }}
                                        checked={allSelected}
                                        onChange={onSelectAll}
                                        aria-label="Select all profiles"
                                    />
                                </th>

                                {/* Name Column */}
                                <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Name</span>
                                        <SortIcon field="name" />
                                    </div>
                                </th>

                                {/* Email Column */}
                                <th
                                    scope="col"
                                    className="hidden md:table-cell px-3 py-3.5 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                    onClick={() => handleSort('email')}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Email</span>
                                        <SortIcon field="email" />
                                    </div>
                                </th>

                                {/* Organization Column */}
                                <th
                                    scope="col"
                                    className="hidden lg:table-cell px-3 py-3.5 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                    onClick={() => handleSort('organization')}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{isVendorView ? 'Vendor Company' : 'Organization'}</span>
                                        <SortIcon field="organization" />
                                    </div>
                                </th>

                                {/* Check-in Status Column */}
                                <th
                                    scope="col"
                                    className="hidden sm:table-cell px-3 py-3.5 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                    onClick={() => handleSort('checkIn')}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Check-in</span>
                                        <SortIcon field="checkIn" />
                                    </div>
                                </th>

                                {/* Last Email Status Column - NEW */}
                                <th
                                    scope="col"
                                    className="hidden xl:table-cell px-3 py-3.5 text-left text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                    onClick={() => handleSort('lastEmail')}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>Last Email</span>
                                        <SortIcon field="lastEmail" />
                                    </div>
                                </th>

                                {/* Actions column (for future use) */}
                                <th scope="col" className="relative px-3 py-3.5">
                                    <span className="sr-only">View</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                            {sortedAttendees.map((attendee, index) => (
                                <motion.tr
                                    key={attendee.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
                                    className={`
                    hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
                    ${selectedIds.has(attendee.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                  `}
                                >
                                    {/* Checkbox Cell */}
                                    <td className="relative w-12 px-4 sm:px-6">
                                        <input
                                            type="checkbox"
                                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                                            checked={selectedIds.has(attendee.id)}
                                            onChange={(e) => onSelect(attendee.id, e.target.checked)}
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label={`Select ${attendee.name}`}
                                        />
                                    </td>

                                    {/* Name Cell */}
                                    <td className="whitespace-nowrap px-3 py-4">
                                        <Link
                                            to={`/attendee-profiles/${attendee.id}`}
                                            className="flex items-center gap-3 group"
                                        >
                                            {attendee.avatar_url ? (
                                                <img
                                                    src={attendee.avatar_url}
                                                    alt={attendee.name}
                                                    className="h-10 w-10 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-200 dark:ring-slate-700"
                                                />
                                            ) : (
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${isVendorView
                                                    ? 'bg-purple-100 dark:bg-purple-900/30'
                                                    : 'bg-primary-100 dark:bg-primary-900/30'
                                                    }`}>
                                                    <UserIcon className={`w-6 h-6 ${isVendorView
                                                        ? 'text-purple-600 dark:text-purple-400'
                                                        : 'text-primary-600 dark:text-primary-400'
                                                        }`} />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                                                    {attendee.name}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 md:hidden truncate">
                                                    {attendee.email || 'No email'}
                                                </p>
                                            </div>
                                        </Link>
                                    </td>

                                    {/* Email Cell (hidden on mobile) */}
                                    <td className="hidden md:table-cell whitespace-nowrap px-3 py-4">
                                        <Link
                                            to={`/attendee-profiles/${attendee.id}`}
                                            className="block text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate max-w-xs"
                                            title={attendee.email || 'No email'}
                                        >
                                            {attendee.email || '—'}
                                        </Link>
                                    </td>

                                    {/* Organization Cell (hidden on small screens) */}
                                    <td className="hidden lg:table-cell whitespace-nowrap px-3 py-4">
                                        <Link
                                            to={`/attendee-profiles/${attendee.id}`}
                                            className="block text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate max-w-xs"
                                            title={attendee.organization || 'No organization'}
                                        >
                                            {attendee.organization || '—'}
                                        </Link>
                                    </td>

                                    {/* Check-in Status Cell (hidden on mobile) */}
                                    <td className="hidden sm:table-cell whitespace-nowrap px-3 py-4">
                                        {attendee.checkInTime ? (
                                            <div className="flex items-center gap-2">
                                                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                <span className="text-xs text-slate-600 dark:text-slate-300">
                                                    {new Date(attendee.checkInTime).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <XCircleIcon className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                                                <span className="text-xs text-slate-400 dark:text-slate-500">Not checked in</span>
                                            </div>
                                        )}
                                    </td>

                                    {/* Last Email Status Cell (hidden on small screens) - NEW */}
                                    <td className="hidden xl:table-cell whitespace-nowrap px-3 py-4">
                                        {attendee.lastEmailStatus ? (
                                            <div className="flex flex-col gap-1 items-start">
                                                <EmailStatusBadge status={attendee.lastEmailStatus} />
                                                {attendee.lastEmailSentAt && (
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(attendee.lastEmailSentAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
                                    </td>

                                    {/* Actions Cell */}
                                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                                        <Link
                                            to={`/attendee-profiles/${attendee.id}`}
                                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
