// src/contexts/SelectedEventContext.tsx

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { Event, EventType } from '../types'; // NEW: Import EventType
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { mapEventFromDb } from '../utils/dataMappers';
import { Database } from '../database.types';

type EventUpdatePayload = Partial<Pick<Event, 'name' | 'startDate' | 'endDate' | 'location'>> & { planId?: string | null };

interface AddEventDetails {
  eventName: string;
  eventType?: EventType; // NEW: Event type field
  timezone?: string; // NEW: Timezone
  companyId: string | 'new'; // Can be an existing ID or the string 'new'
  newCompanyName?: string;
  companyLogoFile?: File | null;
  contacts?: Array<Partial<Database['public']['Tables']['contacts']['Row']>>; // New field for multiple contacts
  eventLogoFile?: File | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  planId?: string | null;
}

interface SelectedEventContextType {
  selectedEventId: string | null;
  setSelectedEventId: (eventId: string | null) => void;
  availableEvents: Event[];
  currentEvent: Event | null;
  loadingEvents: boolean;
  isInitializing: boolean;
  errorEvents: string | null;
  addEvent: (details: AddEventDetails) => Promise<{ success: boolean; message: string; newEvent?: Event }>;
  updateEvent: (eventId: string, updates: EventUpdatePayload, eventLogoFile?: File | null) => Promise<{ success: boolean; message: string; updatedEvent?: Event }>;
  deleteEvent: (eventId: string) => Promise<{ success: boolean; message: string }>;
  fetchAvailableEvents: () => Promise<void>;
  getUniqueCompanies: () => { id: string; name: string; logoUrl?: string | null }[];
  getEventsByCompany: (companyId: string) => Event[];
  getActiveEventsByCompany: (companyId: string) => Event[];
}

const SelectedEventContext = createContext<SelectedEventContextType | undefined>(undefined);

export const SelectedEventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { supabaseUser, loadingAuth, currentUser } = useAuth();
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [errorEvents, setErrorEvents] = useState<string | null>(null);
  const [availableEvents, setAvailableEventsState] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventIdState] = useState<string | null>(null);

  const LOCAL_STORAGE_SELECTED_EVENT_ID_KEY = 'selectedEventId';

  const fetchAvailableEvents = useCallback(async () => {
    console.log("SelectedEventContext: Fetching available events from Supabase...");
    setLoadingEvents(true);
    setErrorEvents(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // NOTE: RLS policies will automatically filter events based on user's access
      // SuperAdmin sees all events, organizers only see their assigned events
      // No additional filtering needed in the application layer
      const { data, error } = await supabase
        .from('events')
        .select('*, companies(*), plans!left(name)')
        .order('name', { ascending: true })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        if (error.name === 'AbortError') {
          throw new Error("Fetching events timed out. This can happen if RLS is enabled on the 'events' table without a policy allowing reads, or if the network is poor.");
        }
        throw error;
      }

      const fetchedEvents: Event[] = ((data as any[]) || []).map(d => mapEventFromDb(d));
      setAvailableEventsState(fetchedEvents);
      console.log("SelectedEventContext: Fetched events:", fetchedEvents.length);

      const storedSelectedId = localStorage.getItem(LOCAL_STORAGE_SELECTED_EVENT_ID_KEY);
      if (storedSelectedId && fetchedEvents.some(e => e.id === storedSelectedId)) {
        setSelectedEventIdState(storedSelectedId);
      } else if (fetchedEvents.length > 0) {
        // Only auto-select for organizers/admins, NOT for superadmins
        if (currentUser?.role === 'organizer' || currentUser?.role === 'admin') {
          setSelectedEventIdState(fetchedEvents[0].id);
          localStorage.setItem(LOCAL_STORAGE_SELECTED_EVENT_ID_KEY, fetchedEvents[0].id);
        }
        // SuperAdmins start with NO event selected
      } else {
        setSelectedEventIdState(null);
        localStorage.removeItem(LOCAL_STORAGE_SELECTED_EVENT_ID_KEY);
      }

      // Mark initialization as complete
      setIsInitializing(false);

    } catch (err: any) {
      console.error("SelectedEventContext: Error fetching events:", err);
      setErrorEvents(err.message || "Failed to load events from database.");
      setAvailableEventsState([]);
      setIsInitializing(false); // Also complete initialization on error
    } finally {
      setLoadingEvents(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!loadingAuth) {
      fetchAvailableEvents();
    }
  }, [loadingAuth, supabaseUser, fetchAvailableEvents]);

  const setSelectedEventId = (eventId: string | null) => {
    setSelectedEventIdState(eventId);
    if (eventId) {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_EVENT_ID_KEY, eventId);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SELECTED_EVENT_ID_KEY);
    }
  };

  const addEvent = useCallback(async (details: AddEventDetails) => {
    setLoadingEvents(true);
    let finalCompanyId = details.companyId;

    try {
      if (details.companyId === 'new') {
        if (!details.newCompanyName?.trim()) {
          return { success: false, message: 'New company name cannot be empty.' };
        }

        let companyLogoUrl: string | null = null;
        if (details.companyLogoFile) {
          const filePath = `public/${details.newCompanyName.replace(/\s+/g, '_')}_${Date.now()}`;
          const { error: uploadError } = await supabase.storage.from('company_logos').upload(filePath, details.companyLogoFile);
          if (uploadError) throw new Error(`Company logo upload failed: ${uploadError.message}`);
          const { data: { publicUrl } } = supabase.storage.from('company_logos').getPublicUrl(filePath);
          companyLogoUrl = publicUrl;
        }

        const companyToInsert: Database['public']['Tables']['companies']['Insert'] = {
          name: details.newCompanyName.trim(),
          logo_url: companyLogoUrl,
        };
        const { data: newCompany, error: companyError } = await (supabase
          .from('companies') as any)
          .insert([companyToInsert])
          .select('id')
          .single();
        if (companyError) throw companyError;
        finalCompanyId = newCompany.id;

        // --- NEW: Add contacts for the new company ---
        if (details.contacts && details.contacts.length > 0) {
          const contactsToInsert = details.contacts.map(contact => ({
            ...contact,
            company_id: finalCompanyId,
          }));
          const { error: contactsError } = await supabase.from('contacts').insert(contactsToInsert as any);
          if (contactsError) {
            // Rollback: try to delete the company we just created for consistency
            await supabase.from('companies').delete().eq('id', finalCompanyId);
            throw new Error(`Failed to create contacts: ${contactsError.message}`);
          }
        }
      }

      if (!finalCompanyId || finalCompanyId === 'new') {
        return { success: false, message: 'A company must be selected or created.' };
      }

      let eventLogoUrl: string | null = null;
      if (details.eventLogoFile) {
        const filePath = `public/${finalCompanyId}/${details.eventName.replace(/\s+/g, '_')}_${Date.now()}`;
        const { error: uploadError } = await supabase.storage.from('event_logos').upload(filePath, details.eventLogoFile);
        if (uploadError) throw new Error(`Event logo upload failed: ${uploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from('event_logos').getPublicUrl(filePath);
        eventLogoUrl = publicUrl;
      }

      const eventToInsert: Database['public']['Tables']['events']['Insert'] = {
        name: details.eventName.trim(),
        company_id: finalCompanyId,
        event_type: details.eventType || 'vendor_meetings', // NEW: Include event type with fallback
        timezone: details.timezone || 'America/Chicago', // NEW: Include timezone with fallback
        event_logo_url: eventLogoUrl,
        start_date: details.startDate || null,
        end_date: details.endDate || null,
        location: details.location?.trim() || null,
        created_by_user_id: supabaseUser?.id,
        plan_id: details.planId || null,
      } as any; // Typecast to handle event_type field

      const { data: newEventData, error } = await (supabase
        .from('events') as any)
        .insert([eventToInsert])
        .select('*, companies(*), plans!left(name)')
        .single();

      if (error) throw error;

      const newEventApp = mapEventFromDb(newEventData);
      await fetchAvailableEvents(); // Refetch to get the full updated list
      setSelectedEventId(newEventApp.id); // Select the newly created event

      return { success: true, message: `Event '${newEventApp.name}' created successfully.`, newEvent: newEventApp };

    } catch (err: any) {
      console.error("SelectedEventContext: Error adding event:", err);
      let message = err.message || "Failed to create event in database.";
      if (err.code === '23505' && err.message.includes('companies_name_key')) {
        message = `A company with the name "${details.newCompanyName}" already exists.`;
      } else if (err.code === '23505') {
        message = "This event name may already exist for the selected company.";
      }
      return { success: false, message };
    } finally {
      setLoadingEvents(false);
    }
  }, [supabaseUser, fetchAvailableEvents]);

  const updateEvent = useCallback(async (
    eventId: string,
    updates: EventUpdatePayload,
    eventLogoFile?: File | null
  ) => {
    if (updates.name && !updates.name.trim()) return { success: false, message: "Event name cannot be empty." };

    const currentEventDetails = availableEvents.find(e => e.id === eventId);
    if (!currentEventDetails) return { success: false, message: "Event not found for update." };

    let finalEventLogoUrl = currentEventDetails.eventLogoUrl;

    if (eventLogoFile) {
      if (currentEventDetails.eventLogoUrl) {
        const oldLogoPath = new URL(currentEventDetails.eventLogoUrl).pathname.split('/event_logos/')[1];
        if (oldLogoPath) await supabase.storage.from('event_logos').remove([oldLogoPath]);
      }
      const filePath = `public/${currentEventDetails.clientCompanyId}/${updates.name?.replace(/\s+/g, '_')}_${Date.now()}`;
      const { error: uploadError } = await supabase.storage.from('event_logos').upload(filePath, eventLogoFile);
      if (uploadError) return { success: false, message: `New event logo upload failed: ${uploadError.message}` };
      const { data: { publicUrl } } = supabase.storage.from('event_logos').getPublicUrl(filePath);
      finalEventLogoUrl = publicUrl;
    }

    const dbUpdates: Database['public']['Tables']['events']['Update'] = {
      name: updates.name,
      start_date: updates.startDate,
      end_date: updates.endDate,
      location: updates.location,
      plan_id: updates.planId,
      event_logo_url: finalEventLogoUrl,
    };

    const { data, error } = await (supabase
      .from('events') as any)
      .update(dbUpdates)
      .eq('id', eventId)
      .select('*, companies(*), plans!left(name)')
      .single();

    if (error || !data) return { success: false, message: `Failed to update event: ${error?.message}` };

    await fetchAvailableEvents(); // Refetch to ensure consistency
    return { success: true, message: `Event '${data.name}' updated successfully.`, updatedEvent: mapEventFromDb(data) };
  }, [availableEvents, fetchAvailableEvents]);

  const deleteEvent = useCallback(async (eventId: string): Promise<{ success: boolean; message: string }> => {
    const { error } = await supabase.rpc('delete_event_and_related_data', {
      event_id_to_delete: eventId
    });

    if (error) {
      console.error("Error calling delete_event_and_related_data RPC:", error);
      return { success: false, message: `Failed to delete event and its data: ${error.message}. Ensure the 'delete_event_and_related_data' function exists in your Supabase project.` };
    }

    await fetchAvailableEvents(); // Refetch the list after deletion

    return { success: true, message: 'Event and all associated data deleted successfully.' };
  }, [fetchAvailableEvents]);

  const getUniqueCompanies = useCallback(() => {
    const companyMap = new Map<string, { id: string, name: string, logoUrl?: string | null }>();
    availableEvents.forEach(e => {
      if (e.clientCompanyId && e.companyName) {
        if (!companyMap.has(e.clientCompanyId)) {
          companyMap.set(e.clientCompanyId, { id: e.clientCompanyId, name: e.companyName, logoUrl: e.companyLogoUrl });
        }
      }
    });
    return Array.from(companyMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [availableEvents]);

  const getEventsByCompany = useCallback((companyId: string) => {
    if (!companyId) return [];
    return availableEvents.filter(e => e.clientCompanyId === companyId);
  }, [availableEvents]);

  const getActiveEventsByCompany = useCallback((companyId: string) => {
    if (!companyId) return [];

    const today = new Date().toISOString().split('T')[0];

    return availableEvents.filter(e => {
      // Must belong to company
      if (e.clientCompanyId !== companyId) return false;

      // Must be active
      if (e.isActive === false) return false;

      // Must not be past (if has end_date)
      if (e.endDate) {
        const endDate = e.endDate.split('T')[0];
        if (endDate < today) return false;
      }

      return true;
    });
  }, [availableEvents]);

  const currentEvent = useMemo(() => availableEvents.find(e => e.id === selectedEventId) || null, [availableEvents, selectedEventId]);

  const contextValue = useMemo(() => ({
    selectedEventId,
    setSelectedEventId,
    availableEvents,
    currentEvent,
    loadingEvents,
    isInitializing,
    errorEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    fetchAvailableEvents,
    getUniqueCompanies,
    getEventsByCompany,
    getActiveEventsByCompany
  }), [
    selectedEventId,
    availableEvents,
    currentEvent,
    loadingEvents,
    isInitializing,
    errorEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    fetchAvailableEvents,
    getUniqueCompanies,
    getEventsByCompany,
    getActiveEventsByCompany
  ]);

  return (
    <SelectedEventContext.Provider value={contextValue}>
      {children}
    </SelectedEventContext.Provider>
  );
};

export const useSelectedEvent = (): SelectedEventContextType => {
  const context = useContext(SelectedEventContext);
  if (context === undefined) {
    throw new Error('useSelectedEvent must be used within a SelectedEventProvider');
  }
  return context;
};