// src/pages/admin/SuperAdminEventsPage.tsx
import React, { useState, FormEvent, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import DateTimePicker from '../../components/ui/DateTimePicker'; // NEW
import { Icon } from '../../components/ui/Icon'; // FIXED: Re-add Icon import
import { PlusCircleIcon, CogIcon, ArrowPathIcon, PencilSquareIcon, TrashIcon, StarIcon, MagnifyingGlassIcon } from '../../components/Icons';
import { useNavigate } from 'react-router-dom';
import { AppRoute, EventType } from '../../types'; // NEW: Import EventType
import Select from '../../components/ui/Select';
import { supabase } from '../../supabaseClient'; // FIXED: Correct import path
import { Database } from '../../database.types';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import COMMON_TIMEZONES from '../../utils/timezones'; // NEW
import PlanSelector from '../../components/plans/PlanSelector';
import PlanComparisonModal from '../../components/plans/PlanComparisonModal';
import EmptyState from '../../components/ui/EmptyState';
import { InboxIcon } from 'lucide-react';
import EventOrganizersModal from '../../components/EventOrganizersModal';
import { UsersGroupIcon } from '../../components/Icons';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileCard, MobileFAB, MobileSearchBar, MobileEmptyState, SpeedDialFAB } from '../../components/mobile';
import SwipeableCard from '../../components/ui/SwipeableCard';
import { Building2, Calendar, Edit2, Trash2 } from 'lucide-react';

type PlanRow = Database['public']['Tables']['plans']['Row'];
type CompanyRow = Database['public']['Tables']['companies']['Row'];
type ContactRow = Database['public']['Tables']['contacts']['Row'];
type EditableContact = Partial<ContactRow> & { tempId: string };
type EventWithCounts = Database['public']['Functions']['get_all_events_with_counts']['Returns'][0];

const SuperAdminEventsPage: React.FC = () => {
  const { addEvent, updateEvent, deleteEvent, setSelectedEventId } = useSelectedEvent();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [events, setEvents] = useState<EventWithCounts[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorEvents, setErrorEvents] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'existing' | 'new'>('existing');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  const [newEventName, setNewEventName] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>('vendor_meetings'); // NEW: Event type state
  const [newEventTimezone, setNewEventTimezone] = useState('America/Chicago'); // NEW: Timezone state

  // State for new company creation within the modal
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyLogoFile, setNewCompanyLogoFile] = useState<File | null>(null);
  const [newCompanyLogoPreview, setNewCompanyLogoPreview] = useState<string | null>(null);
  const [newCompanyContacts, setNewCompanyContacts] = useState<EditableContact[]>([]);

  const [newEventLogoFile, setNewEventLogoFile] = useState<File | null>(null);
  const [newEventLogoPreview, setNewEventLogoPreview] = useState<string | null>(null);

  const [newEventStartDate, setNewEventStartDate] = useState('');
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newPlanId, setNewPlanId] = useState('');

  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [allPlans, setAllPlans] = useState<PlanRow[]>([]);
  const [editingEvent, setEditingEvent] = useState<EventWithCounts | null>(null);
  const [editFormState, setEditFormState] = useState({ name: '', startDate: '', endDate: '', location: '', planId: '', timezone: 'America/Chicago' });
  const [editEventLogoFile, setEditEventLogoFile] = useState<File | null>(null);
  const [editEventLogoPreview, setEditEventLogoPreview] = useState<string | null>(null);

  const [deletingEvent, setDeletingEvent] = useState<EventWithCounts | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [confirmingToggle, setConfirmingToggle] = useState<{ eventId: string; currentValue: boolean } | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const companyLogoRef = useRef<HTMLInputElement>(null);
  const eventLogoRef = useRef<HTMLInputElement>(null);
  const editEventLogoRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ column: keyof EventWithCounts | null; direction: 'asc' | 'desc' }>({ column: 'name', direction: 'asc' });
  const [showPlanComparison, setShowPlanComparison] = useState(false);

  // Event Organizers Modal State
  const [managingOrganizersFor, setManagingOrganizersFor] = useState<EventWithCounts | null>(null);

  // Mobile detection
  const isMobile = useIsMobile();


  const fetchAllData = useCallback(async () => {
    setLoadingEvents(true);
    setErrorEvents(null);
    const { data: eventsData, error: eventsError } = await supabase.rpc('get_all_events_with_counts');
    const { data: plansData, error: plansError } = await supabase.from('plans').select('*').order('name');
    const { data: companiesData, error: companiesError } = await supabase.from('companies').select('*').order('name');

    if (eventsError) {
      toast.error(`Could not load event data: ${eventsError.message}`);
      setErrorEvents(eventsError.message);
      setEvents([]);
    } else {
      if (Array.isArray(eventsData)) {
        setEvents(eventsData);
      } else {
        setEvents([]);
      }
    }

    if (plansError) toast.error(`Could not fetch plans: ${plansError.message}`);
    setAllPlans(plansData || []);

    if (companiesError) toast.error(`Could not fetch companies: ${companiesError.message}`);
    setCompanies(companiesData || []);

    setLoadingEvents(false);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // FIX: Pre-select the first company when the list loads to prevent selection issues.
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    if (editingEvent) {
      setEditFormState({
        name: editingEvent.name || '',
        startDate: editingEvent.start_date ? editingEvent.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: editingEvent.end_date ? editingEvent.end_date.split('T')[0] : new Date().toISOString().split('T')[0],
        location: editingEvent.location || '',
        planId: editingEvent.plan_id || '',
        timezone: (editingEvent as any).timezone || 'America/Chicago', // NEW: Timezone
      });
      setEditEventLogoPreview(editingEvent.event_logo_url || null);
      setEditEventLogoFile(null);
    }
  }, [editingEvent]);

  const sortedAndFilteredEvents = useMemo(() => {
    let filtered = [...events];

    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        (event.name || '').toLowerCase().includes(lowercasedFilter) ||
        (event.company_name || '').toLowerCase().includes(lowercasedFilter) ||
        (event.plan_name || '').toLowerCase().includes(lowercasedFilter) ||
        (event.start_date || '').toLowerCase().includes(lowercasedFilter) ||
        String(event.booth_count).includes(lowercasedFilter) ||
        String(event.attendee_count).includes(lowercasedFilter)
      );
    }

    if (sortConfig.column) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.column!];
        const bValue = b[sortConfig.column!];

        if (aValue == null) return 1;
        if (bValue == null) return -1;

        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (sortConfig.column === 'start_date' || sortConfig.column === 'end_date') {
            comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
          } else {
            comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
          }
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [events, searchTerm, sortConfig]);

  const handleSort = (column: keyof EventWithCounts) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });
  };


  const resetCreateForm = () => {
    setNewEventName('');
    setNewEventType('vendor_meetings'); // NEW: Reset event type
    setNewEventTimezone('America/Chicago'); // NEW: Reset timezone
    setNewCompanyName('');
    setSelectedCompanyId(companies[0]?.id || '');
    setNewCompanyLogoFile(null);
    setNewCompanyLogoPreview(null);
    setNewEventLogoFile(null);
    setNewEventLogoPreview(null);
    if (companyLogoRef.current) companyLogoRef.current.value = '';
    if (eventLogoRef.current) eventLogoRef.current.value = '';
    setNewEventStartDate('');
    setNewEventEndDate('');
    setNewEventLocation('');
    setNewPlanId(allPlans[0]?.id || '');
    setNewCompanyContacts([]);
    setIsCreateModalOpen(false);
  };

  const handleContactChange = (tempId: string, field: keyof ContactRow, value: any) => setNewCompanyContacts(prev => prev.map(c => c.tempId === tempId ? { ...c, [field]: value } : c));
  const setPrimaryContact = (tempId: string) => setNewCompanyContacts(prev => prev.map(c => ({ ...c, is_primary: c.tempId === tempId })));
  const addContact = () => setNewCompanyContacts(prev => [...prev, { tempId: `new-${Date.now()}`, name: '', position: '', email: '', phone: '', is_primary: prev.length === 0 }]);
  const removeContact = (tempId: string) => setNewCompanyContacts(prev => prev.filter(c => c.tempId !== tempId));

  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!newEventName.trim()) { toast.error('Event Name is required.'); return; }
    if (createMode === 'new' && !newCompanyName.trim()) { toast.error('New Company Name is required.'); return; }
    if (createMode === 'existing' && !selectedCompanyId) { toast.error('Please select an existing company.'); return; }
    if (newEventStartDate && newEventEndDate && new Date(newEventEndDate) < new Date(newEventStartDate)) { toast.error('End date cannot be before start date.'); return; }

    setIsSubmitting(true);
    const result = await addEvent({
      eventName: newEventName,
      eventType: newEventType, // NEW: Include event type
      timezone: newEventTimezone, // NEW: Include timezone
      companyId: createMode === 'new' ? 'new' : selectedCompanyId,
      newCompanyName: createMode === 'new' ? newCompanyName : undefined,
      companyLogoFile: newCompanyLogoFile,
      contacts: newCompanyContacts.map(({ tempId, ...contact }) => contact),
      eventLogoFile: newEventLogoFile,
      startDate: newEventStartDate || null,
      endDate: newEventEndDate || null,
      location: newEventLocation || null,
      planId: newPlanId || null,
    });

    if (result.success) {
      toast.success(result.message);
      resetCreateForm();
      fetchAllData();
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const handleUpdateEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    if (editFormState.startDate && editFormState.endDate && new Date(editFormState.endDate) < new Date(editFormState.startDate)) {
      toast.error('End date cannot be before start date.'); return;
    }
    setIsSubmitting(true);
    const result = await updateEvent(
      editingEvent.id,
      {
        name: editFormState.name,
        startDate: editFormState.startDate || undefined,
        endDate: editFormState.endDate || undefined,
        location: editFormState.location || null,
        planId: editFormState.planId || null,
      },
      editEventLogoFile
    );
    if (result.success) {
      toast.success(result.message);
      setEditingEvent(null);
      fetchAllData();
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    setIsSubmitting(true);
    const result = await deleteEvent(deletingEvent.id);
    if (result.success) {
      toast.success(result.message);
      setDeletingEvent(null);
      fetchAllData();
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const handleRefreshEvents = () => {
    toast.promise(fetchAllData(), {
      loading: 'Refreshing event list...',
      success: 'Event list updated!',
      error: 'Failed to refresh events.',
    });
  };


  const handleToggleActive = async (eventId: string, currentValue: boolean) => {
    setConfirmingToggle({ eventId, currentValue });
  };

  const confirmToggleActive = async () => {
    if (!confirmingToggle) return;

    const { eventId, currentValue } = confirmingToggle;
    const newValue = !currentValue;

    const { error } = await supabase
      .from('events')
      .update({ is_active: newValue })
      .eq('id', eventId);

    if (error) {
      toast.error(`Failed to update event: ${error.message}`);
      return;
    }

    toast.success(newValue ? 'Event activated' : 'Event deactivated');
    await fetchAllData();
    setConfirmingToggle(null);
  };

  const formatDateForDisplay = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    try {
      // If it's already an ISO string (contains T), use it directly
      // Otherwise assume YYYY-MM-DD and treat as UTC to avoid timezone shifts
      const dateToParse = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
      return new Date(dateToParse).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
    }
    catch (e) { return 'Invalid Date'; }
  };

  const handleManageEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    navigate(AppRoute.Dashboard);
  };

  const getPortalStatus = (event: EventWithCounts) => {
    if (!(event as any).is_active) {
      return {
        status: 'inactive',
        icon: '🔒',
        color: 'text-slate-400 dark:text-slate-500',
        label: 'Inactive',
        tooltip: 'Event is deactivated and won\'t appear in client portal'
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const endDate = event.end_date?.split('T')[0];

    if (!endDate) {
      return {
        status: 'visible',
        icon: '✅',
        color: 'text-green-600 dark:text-green-400',
        label: 'Visible',
        tooltip: 'Event is active and visible in client portal (no end date set)'
      };
    }

    if (endDate < today) {
      const formattedDate = formatDateForDisplay(event.end_date);
      return {
        status: 'hidden-past',
        icon: '⚠️',
        color: 'text-amber-600 dark:text-amber-400',
        label: 'Hidden',
        sublabel: '(Past date)',
        tooltip: `Event won't appear in client portal because end date (${formattedDate}) has passed. Update dates to make it visible.`
      };
    }

    return {
      status: 'visible',
      icon: '✅',
      color: 'text-green-600 dark:text-green-400',
      label: 'Visible',
      tooltip: 'Event is active and visible in client portal'
    };
  };

  const planOptions = useMemo(() => allPlans.map(p => ({ value: p.id, label: p.name })), [allPlans]);
  const companyOptions = useMemo(() => companies.map(c => ({ value: c.id, label: c.name })), [companies]);

  const cardTitleActions = (
    <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<PlusCircleIcon className="w-5 h-5" />} disabled={loadingEvents}>
      {t(localeKeys.createNewEvent)}
    </Button>
  );

  const SortableHeader: React.FC<{ column: keyof EventWithCounts; title: string }> = ({ column, title }) => (
    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
      <button onClick={() => handleSort(column)} className="flex items-center gap-1 group transition-colors hover:text-slate-800 dark:hover:text-slate-100">
        <span>{title}</span>
        {sortConfig.column === column ? (
          <Icon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} className="w-4 h-4" />
        ) : (
          <span className="opacity-0 group-hover:opacity-60 transition-opacity">
            <Icon name="chevronUp" className="w-4 h-4 text-slate-400" />
          </span>
        )}
      </button>
    </th>
  );

  // Shared modal definitions (used by both mobile and desktop)
  const createEventModalContent = isCreateModalOpen && (
    <Modal
      isOpen={true}
      onClose={resetCreateForm}
      title={t(localeKeys.modalCreateTitle)}
      size="xl"
      footerContent={
        <div className="flex justify-end gap-3 w-full">
          <Button type="button" variant="neutral" onClick={resetCreateForm}>{t('cancel')}</Button>
          <Button type="submit" variant="primary" form="create-event-form" disabled={isSubmitting}>
            {isSubmitting ? t(localeKeys.adding) : t(localeKeys.createSession)}
          </Button>
        </div>
      }
    >
      <form id="create-event-form" onSubmit={handleCreateEvent} className="space-y-4">
        <Input label={t(localeKeys.headerEventName)} value={newEventName} onChange={(e) => setNewEventName(e.target.value)} required disabled={isSubmitting} />

        {/* Event Type - Visible on Mobile too */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat">Event Type</label>
          <Select
            value={newEventType}
            onChange={(e) => setNewEventType(e.target.value as EventType)}
            options={[
              { value: 'vendor_meetings', label: '🤝 Vendor Meetings' },
              { value: 'conference', label: '🎤 Conference' },
              { value: 'trade_show', label: '🏢 Trade Show' },
              { value: 'hybrid', label: '🔄 Hybrid' }
            ]}
            disabled={isSubmitting}
          />
        </div>

        {!isMobile && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat">Event Timezone</label>
            <Select
              value={newEventTimezone}
              onChange={(e) => setNewEventTimezone(e.target.value)}
              options={COMMON_TIMEZONES.map(tz => ({ value: tz.value, label: tz.label }))}
              disabled={isSubmitting}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat">{t(localeKeys.headerCompany)}</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center"><input type="radio" name="createMode" value="existing" checked={createMode === 'existing'} onChange={() => setCreateMode('existing')} className="h-4 w-4 text-primary-600 focus:ring-primary-500" /> <span className="ml-2 text-sm">Existing</span></label>
            <label className="flex items-center"><input type="radio" name="createMode" value="new" checked={createMode === 'new'} onChange={() => setCreateMode('new')} className="h-4 w-4 text-primary-600 focus:ring-primary-500" /> <span className="ml-2 text-sm">New</span></label>
          </div>
        </div>
        {createMode === 'existing' && <Select label={t('selectCompany')} value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)} options={companyOptions} disabled={isSubmitting || companies.length === 0} />}

        <Select
          label={t(localeKeys.subscriptionPlan)}
          value={newPlanId}
          onChange={(e) => setNewPlanId(e.target.value)}
          options={[{ value: '', label: 'No Plan' }, ...planOptions]}
          disabled={isSubmitting}
        />
      </form>
    </Modal>
  );

  const editEventModalContent = editingEvent && (
    <Modal
      isOpen={!!editingEvent}
      onClose={() => setEditingEvent(null)}
      title={t(localeKeys.modalEditTitle, { eventName: editingEvent?.name || '' })}
      size="lg"
      footerContent={
        <div className="flex justify-end gap-3 w-full">
          <Button type="button" variant="neutral" onClick={() => setEditingEvent(null)} disabled={isSubmitting}>{t(localeKeys.cancel)}</Button>
          <Button type="submit" variant="primary" form="edit-event-form" disabled={isSubmitting}>{isSubmitting ? t(localeKeys.saving) : t(localeKeys.saveChanges)}</Button>
        </div>
      }
    >
      <form id="edit-event-form" onSubmit={handleUpdateEvent} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto max-h-[65vh] p-1 space-y-4">
          <Input label={t(localeKeys.headerEventName)} id="edit-event-name" value={editFormState.name} onChange={(e) => setEditFormState({ ...editFormState, name: e.target.value })} required disabled={isSubmitting} />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat">{t('eventLogo')}</label>
            <Input type="file" ref={editEventLogoRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEditEventLogoFile(f); setEditEventLogoPreview(URL.createObjectURL(f)); } }} accept="image/*" disabled={isSubmitting} />
            {editEventLogoPreview && <img src={editEventLogoPreview} alt="Logo Preview" className="mt-2 h-16 w-auto rounded-md bg-slate-100 dark:bg-slate-700 p-2 border" />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <DateTimePicker
                label={t('startDate')}
                value={editFormState.startDate ? new Date(editFormState.startDate) : null}
                onChange={(date) => setEditFormState({ ...editFormState, startDate: date ? date.toISOString().split('T')[0] : '' })}
                disabled={isSubmitting}
                placeholderText="Select start date"
                minDate={new Date()}
              />
              <button type="button" onClick={() => setEditFormState({ ...editFormState, startDate: new Date().toISOString().split('T')[0] })} className="absolute top-[34px] right-3 text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium bg-white dark:bg-slate-800 px-2 py-1 rounded">Today</button>
            </div>
            <div className="relative">
              <DateTimePicker
                label={t('endDate')}
                value={editFormState.endDate ? new Date(editFormState.endDate) : null}
                onChange={(date) => setEditFormState({ ...editFormState, endDate: date ? date.toISOString().split('T')[0] : '' })}
                disabled={isSubmitting}
                placeholderText="Select end date"
                minDate={editFormState.startDate ? new Date(editFormState.startDate) : new Date()}
              />
              <button type="button" onClick={() => setEditFormState({ ...editFormState, endDate: new Date().toISOString().split('T')[0] })} className="absolute top-[34px] right-3 text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium bg-white dark:bg-slate-800 px-2 py-1 rounded">Today</button>
            </div>
          </div>
          <Input label={t(localeKeys.location)} id="edit-event-location" value={editFormState.location} onChange={(e) => setEditFormState({ ...editFormState, location: e.target.value })} disabled={isSubmitting} />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat">Event Timezone</label>
            <Select
              value={editFormState.timezone}
              onChange={(e) => setEditFormState({ ...editFormState, timezone: e.target.value })}
              options={COMMON_TIMEZONES.map(tz => ({ value: tz.value, label: tz.label }))}
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              🌍 All times will be displayed in this timezone
            </p>
          </div>

          <Select
            label={t(localeKeys.subscriptionPlan)}
            id="event-plan"
            value={editFormState.planId}
            onChange={(e) => setEditFormState({ ...editFormState, planId: e.target.value })}
            options={[{ value: '', label: 'No Plan' }, ...planOptions]}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );

  const deleteEventModalContent = deletingEvent && (
    <Modal
      isOpen={!!deletingEvent}
      onClose={() => setDeletingEvent(null)}
      title={t(localeKeys.modalDeleteTitle, { eventName: deletingEvent?.name || '' })}
      size="lg"
      footerContent={
        <div className="flex justify-end gap-3 w-full">
          <Button type="button" variant="neutral" onClick={() => setDeletingEvent(null)} disabled={isSubmitting}>{t(localeKeys.cancel)}</Button>
          <Button type="button" variant="accent" onClick={handleDeleteEvent} disabled={isSubmitting || deleteConfirmText.trim().toLowerCase() !== 'delete'}>
            {isSubmitting ? t(localeKeys.deleting) : t(localeKeys.deleteButton)}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Alert type="error" message={<strong>{t('permanentActionWarning')}</strong>} />
        <p className="font-sans text-sm text-gray-700 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: t('deleteConfirmationPrompt', { eventName: deletingEvent.name }) }} />
        <p className="font-sans text-sm mt-4" dangerouslySetInnerHTML={{ __html: t('typeToDelete') }} />
        <Input id="delete-confirm" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="delete" disabled={isSubmitting} autoFocus />
      </div>
    </Modal>
  );

  const toggleEventModalContent = confirmingToggle && (
    <Modal
      isOpen={!!confirmingToggle}
      onClose={() => setConfirmingToggle(null)}
      title={confirmingToggle?.currentValue ? 'Deactivate Event?' : 'Activate Event?'}
      size="md"
      footerContent={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="neutral" onClick={() => setConfirmingToggle(null)}>Cancel</Button>
          <Button variant={confirmingToggle.currentValue ? 'accent' : 'primary'} onClick={confirmToggleActive}>
            {confirmingToggle.currentValue ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-slate-700 dark:text-slate-200">
          {confirmingToggle.currentValue ? (
            <>
              <strong>Deactivating this event will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Hide it from the Client Portal</li>
                <li>Prevent attendee and booth logins</li>
                <li>Disable real-time features</li>
                <li className="text-green-600 dark:text-green-400">✓ Historical data will be preserved</li>
              </ul>
            </>
          ) : (
            <>
              <strong>Activating this event will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Make it visible in the Client Portal</li>
                <li>Enable attendee and booth logins</li>
                <li>Activate all plan features</li>
                <li>Start real-time tracking</li>
              </ul>
            </>
          )}
        </p>
      </div>
    </Modal>
  );

  // ✨ MOBILE VIEW
  if (isMobile) {
    return (
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="px-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Events</h1>
          <MobileSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search events..."
          />
        </div>

        {/* Events List */}
        <div className="px-4 space-y-3">
          {loadingEvents ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : sortedAndFilteredEvents.length > 0 ? (
            sortedAndFilteredEvents.map(event => {
              const portalStatus = getPortalStatus(event);
              return (
                <SwipeableCard
                  key={event.id}
                  leftAction={{
                    icon: <Edit2 className="w-5 h-5" />,
                    label: "Edit",
                    color: "blue",
                    onTrigger: () => setEditingEvent(event)
                  }}
                  rightAction={{
                    icon: <Trash2 className="w-5 h-5" />,
                    label: "Delete",
                    color: "red",
                    onTrigger: () => setDeletingEvent(event)
                  }}
                >
                  <MobileCard
                    title={event.name}
                    subtitle={`${event.company_name || 'No Company'} • ${formatDateForDisplay(event.start_date)}`}
                    icon={<Building2 className="w-5 h-5 text-primary-600" />}
                    badge={
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{portalStatus.icon}</span>
                        <span className={`text-xs font-bold ${portalStatus.color}`}>
                          {portalStatus.label}
                        </span>
                      </div>
                    }
                    onClick={() => handleManageEvent(event.id)}
                    actions={
                      <div className="flex gap-2 items-center flex-wrap">
                        {/* Organizers Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setManagingOrganizersFor(event);
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-semibold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          <UsersGroupIcon className="w-3 h-3" />
                          <span>Organizers</span>
                        </button>

                        {/* Stats */}
                        <span className="text-xs text-slate-500 dark:text-slate-400">📊 {event.booth_count || 0} booths</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">👥 {event.attendee_count || 0} attendees</span>
                        {event.plan_name && (
                          <>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
                              {event.plan_name}
                            </span>
                          </>
                        )}
                      </div>
                    }
                  />
                </SwipeableCard>
              );
            })
          ) : (
            <MobileEmptyState
              icon={<InboxIcon className="w-8 h-8" />}
              title={searchTerm ? "No events found" : "No events yet"}
              description={searchTerm ? `No results for "${searchTerm}"` : "Create your first event to get started"}
              action={!searchTerm ? {
                label: "Create Event",
                onClick: () => setIsCreateModalOpen(true)
              } : undefined}
            />
          )}
        </div>

        {/* Speed Dial FAB */}
        <SpeedDialFAB
          actions={[
            {
              icon: 'calendar',
              label: 'New Event',
              onClick: () => setIsCreateModalOpen(true),
              color: 'primary'
            },
            {
              icon: 'users',
              label: 'Add Attendee',
              onClick: () => navigate(AppRoute.AttendeeProfiles),
              color: 'secondary'
            },
            {
              icon: 'scan',
              label: 'Quick Scan',
              onClick: () => navigate(AppRoute.QRScanner),
              color: 'success'
            }
          ]}
        />

        {/* Modals */}
        {/* Modals */}
        {createEventModalContent}
        {editEventModalContent}
        {deleteEventModalContent}
        {toggleEventModalContent}
      </div>
    );
  }

  // DESKTOP VIEW - Original render
  return (
    <>
      {/* Shared Modals */}
      {createEventModalContent}
      {editEventModalContent}
      {deleteEventModalContent}
      {toggleEventModalContent}

      {/* Plan Comparison Modal */}
      <PlanComparisonModal
        isOpen={showPlanComparison}
        onClose={() => setShowPlanComparison(false)}
      />

      {/* Event Organizers Modal */}
      <EventOrganizersModal
        isOpen={!!managingOrganizersFor}
        onClose={() => setManagingOrganizersFor(null)}
        eventId={managingOrganizersFor?.id || ''}
        eventName={managingOrganizersFor?.name || ''}
      />

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center font-montserrat"><CogIcon className="w-8 h-8 mr-3 text-brandBlue" /> {t(localeKeys.superAdminEventsTitle)}</h1>
        {feedback && <Alert type={feedback.type} message={feedback.message} className="my-4" />}
        {errorEvents && !loadingEvents && (<Alert type="error" message={<>Error loading events: {errorEvents}. <Button onClick={handleRefreshEvents} variant="link" size="sm" className="p-0">Try Again</Button></>} className="my-4" />)}

        <Card title={t(localeKeys.allEventsCardTitle)} titleActions={cardTitleActions}>
          <div className="relative mb-4">
            <Input wrapperClassName="!mb-0" placeholder={t(localeKeys.searchEventsPlaceholder)} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={loadingEvents} className="pl-10" />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          {loadingEvents ? <p>{t(localeKeys.loading)}...</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <SortableHeader column="name" title={t(localeKeys.headerEventName)} />
                    <SortableHeader column="company_name" title={t(localeKeys.headerCompany)} />
                    <SortableHeader column="plan_name" title={t(localeKeys.headerPlan)} />
                    <SortableHeader column="start_date" title={t(localeKeys.headerDates)} />
                    <SortableHeader column="booth_count" title={t(localeKeys.headerBooths)} />
                    <SortableHeader column="attendee_count" title={t(localeKeys.headerAttendees)} />
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('Visibility')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Portal Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t(localeKeys.headerActions)}</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {sortedAndFilteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <EmptyState
                          icon={InboxIcon}
                          title={searchTerm ? "No events match your search" : "No events yet"}
                          description={searchTerm ? `Try adjusting your search term "${searchTerm}" to find what you're looking for.` : "Create your first event to get started managing attendees, booths, and sessions."}
                          actionLabel={!searchTerm ? "Create Event" : undefined}
                          onAction={!searchTerm ? () => setIsCreateModalOpen(true) : undefined}
                        />
                      </td>
                    </tr>
                  )}
                  {sortedAndFilteredEvents.map((event, index) => (
                    <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-smooth fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{event.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                        <div className="flex items-center gap-3">
                          {event.company_logo_url ? (
                            <img
                              src={event.company_logo_url}
                              alt="logo"
                              className="h-12 w-auto max-w-[120px] object-contain rounded-md bg-white p-1 border border-slate-200 dark:border-slate-700 shadow-sm"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                              No Logo
                            </div>
                          )}
                          <span className="font-medium text-slate-900 dark:text-slate-100">{event.company_name || <span className="text-slate-400 italic">N/A</span>}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {event.plan_name ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 inline-block w-fit">
                              {event.plan_name}
                            </span>
                            <span className="text-xs text-slate-400">
                              Plan assigned
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400">
                            No Plan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDateForDisplay(event.start_date)} - {formatDateForDisplay(event.end_date)}</td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-300">{event.booth_count}</td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-300">{event.attendee_count}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold uppercase min-w-[60px] ${(event as any).is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {(event as any).is_active ? '✓ Active' : '✗ Inactive'}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer" title={(event as any).is_active ? 'Click to deactivate' : 'Click to activate'}>
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={(event as any).is_active}
                              onChange={() => handleToggleActive(event.id, (event as any).is_active)}
                            />
                            <div className="w-11 h-6 bg-red-200 dark:bg-red-900/50 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-500 dark:peer-checked:bg-green-600"></div>
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(() => {
                          const portalStatus = getPortalStatus(event);
                          return (
                            <div className="flex items-center gap-2" title={portalStatus.tooltip}>
                              <span className="text-lg">{portalStatus.icon}</span>
                              <div className="flex flex-col">
                                <span className={`text-xs font-bold ${portalStatus.color}`}>
                                  {portalStatus.label}
                                </span>
                                {portalStatus.sublabel && (
                                  <span className={`text-xs ${portalStatus.color}`}>
                                    {portalStatus.sublabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button size="sm" onClick={() => handleManageEvent(event.id)}>{t(localeKeys.manageButton)}</Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setManagingOrganizersFor(event)}
                            leftIcon={<UsersGroupIcon className="w-4 h-4" />}
                            title="Manage Organizers"
                          >
                            Organizers
                          </Button>
                          <Button size="sm" variant="neutral" onClick={() => setEditingEvent(event)} leftIcon={<PencilSquareIcon className="w-4 h-4" />}>{t(localeKeys.editButton)}</Button>
                          <Button size="sm" variant="accent" onClick={() => setDeletingEvent(event)} leftIcon={<TrashIcon className="w-4 h-4" />}>{t(localeKeys.deleteButton)}</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default SuperAdminEventsPage;