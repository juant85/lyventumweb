import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { AppRoute } from '../../types';

interface AttendeeRow {
    id: string;
    name: string;
    email: string;
    event_id: string;
    event_name: string;
    has_code: boolean;
    code_status: 'active' | 'expired' | 'used' | 'none';
}

export default function SuperAdminAttendeesPage() {
    const navigate = useNavigate();
    const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [eventFilter, setEventFilter] = useState<string>('all');
    const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch attendees with their registrations to get event info
            const { data: registrationsData, error: registrationsError } = await supabase
                .from('session_registrations')
                .select(`
                    attendee_id,
                    attendees!inner (
                        id,
                        name,
                        email
                    ),
                    sessions!inner (
                        event_id,
                        events!inner (
                            id,
                            name
                        )
                    )
                `)
                .order('attendee_id');

            if (registrationsError) {
                console.error('Error fetching registrations:', registrationsError);
                throw registrationsError;
            }

            if (!registrationsData || registrationsData.length === 0) {
                setAttendees([]);
                setEvents([]);
                setLoading(false);
                return;
            }

            // Group by attendee + event
            const attendeeEventMap = new Map<string, {
                id: string;
                name: string;
                email: string;
                event_id: string;
                event_name: string;
            }>();

            registrationsData.forEach((reg: any) => {
                const key = `${reg.attendees.id}-${reg.sessions.events.id}`;
                if (!attendeeEventMap.has(key)) {
                    attendeeEventMap.set(key, {
                        id: reg.attendees.id,
                        name: reg.attendees.name,
                        email: reg.attendees.email,
                        event_id: reg.sessions.events.id,
                        event_name: reg.sessions.events.name,
                    });
                }
            });

            const attendeeEventPairs = Array.from(attendeeEventMap.values());

            // Fetch all access codes
            const { data: codesData } = await supabase
                .from('attendee_access_codes')
                .select('attendee_id, event_id, expires_at, used_at');

            // Combine data
            const rows: AttendeeRow[] = attendeeEventPairs.map(att => {
                const code = codesData?.find(
                    c => c.attendee_id === att.id && c.event_id === att.event_id
                );

                let code_status: AttendeeRow['code_status'] = 'none';
                if (code) {
                    const now = new Date();
                    const expires = new Date(code.expires_at);
                    if (code.used_at) {
                        code_status = 'used';
                    } else if (expires < now) {
                        code_status = 'expired';
                    } else {
                        code_status = 'active';
                    }
                }

                return {
                    id: att.id,
                    name: att.name || 'N/A',
                    email: att.email,
                    event_id: att.event_id,
                    event_name: att.event_name,
                    has_code: !!code,
                    code_status,
                };
            });

            setAttendees(rows);

            // Extract unique events for filter dropdown
            const uniqueEvents = Array.from(
                new Map(rows.map(r => [r.event_id, { id: r.event_id, name: r.event_name }])).values()
            );
            setEvents(uniqueEvents);

        } catch (error) {
            console.error('Error fetching attendees:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAttendees = attendees.filter(att => {
        const matchesSearch =
            att.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            att.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            att.event_name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesEvent = eventFilter === 'all' || att.event_id === eventFilter;

        return matchesSearch && matchesEvent;
    });

    const handleRowClick = (attendeeId: string, eventId: string) => {
        navigate(`${AppRoute.AttendeeProfiles}/${attendeeId}?event=${eventId}`);
    };

    const getStatusBadge = (status: AttendeeRow['code_status']) => {
        switch (status) {
            case 'active':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Active ✅
                    </span>
                );
            case 'expired':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        Expired ⏱
                    </span>
                );
            case 'used':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Used ✓
                    </span>
                );
            case 'none':
                return (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Not sent
                    </span>
                );
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        All Attendees
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Global registry across all events
                    </p>
                </div>

                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by name, email, or event..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                <select
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                >
                    <option value="all">All Events</option>
                    {events.map(event => (
                        <option key={event.id} value={event.id}>
                            {event.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="text-slate-600 dark:text-slate-400 mt-4">Loading attendees...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    Event
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    Code Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredAttendees.map(attendee => (
                                <tr
                                    key={`${attendee.id}-${attendee.event_id}`}
                                    onClick={() => handleRowClick(attendee.id, attendee.event_id)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {attendee.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                        {attendee.email}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                        {attendee.event_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {getStatusBadge(attendee.code_status)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredAttendees.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-600 dark:text-slate-400">
                                No attendees found
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Stats */}
            <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
                Showing {filteredAttendees.length} of {attendees.length} attendees
            </div>
        </div>
    );
}
