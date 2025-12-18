// src/pages/MasterImportPage.tsx
import React, { useState, ChangeEvent, useMemo } from 'react';
import { useEventData } from '../contexts/EventDataContext';
import { useSelectedEvent } from '../contexts/SelectedEventContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import { DocumentTextIcon, ArrowPathIcon, TrashIcon, PlusCircleIcon, ExclamationTriangleIcon, PresentationChartLineIcon, BuildingStorefrontIcon, UsersGroupIcon, CheckCircleIcon, XMarkIcon, DocumentDuplicateIcon, TableCellsIcon } from '../components/Icons';
import { parseEventScheduleExcel, ParsedExcelData } from '../utils/excelParser';
import { Session, Booth, SessionRegistration, Attendee } from '../types';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { Database } from '../database.types';

type EditableSession = ParsedExcelData['sessions'][0] & { tempId: string };
type EditableBooth = ParsedExcelData['booths'][0] & { tempId: string };
type EditableRegistration = ParsedExcelData['registrations'][0] & { tempId: string };

interface ImportSummary {
  booths: { success: number; failed: number; errors: string[] };
  sessions: { success: number; failed: number; errors: string[] };
  boothSessionLinks: { success: number; failed: number; errors: string[] };
  attendees: { success: number; failed: number; errors: string[] };
  registrations: { success: number; failed: number; skipped: number; errors: string[] };
}

const formatDateForInput = (dateValue: string | Date): string => {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};


const MasterImportPage: React.FC = () => {
  const {
    addBoothsBatch,
    addSessionsBatch,
    addSessionBoothCapacitiesBatch,
    findOrCreateAttendeesBatch,
    markAttendeesAsVendors,
    addSessionRegistrationsBatch,
    fetchData: refreshEventData
  } = useEventData();
  const { selectedEventId, currentEvent, updateEvent } = useSelectedEvent();

  const [hasParsed, setHasParsed] = useState(false);
  const [parsingErrors, setParsingErrors] = useState<string[]>([]);

  const [editableSessions, setEditableSessions] = useState<EditableSession[]>([]);
  const [editableBooths, setEditableBooths] = useState<EditableBooth[]>([]);
  const [editableRegistrations, setEditableRegistrations] = useState<EditableRegistration[]>([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: React.ReactNode } | null>(null);

  const resetState = () => {
    setHasParsed(false);
    setParsingErrors([]);
    setEditableSessions([]);
    setEditableBooths([]);
    setEditableRegistrations([]);
    setFeedback(null);
    setImportSummary(null);
    const fileInput = document.getElementById('master-import-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      resetState();
      return;
    }

    setIsProcessing(true);
    resetState();
    setFeedback({ type: 'info', message: 'Reading and parsing Excel file...' });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const data = parseEventScheduleExcel(buffer);

        setEditableSessions(data.sessions.map((s, i) => ({ ...s, tempId: `sess-${Date.now()}-${i}` })));
        setEditableBooths(data.booths.map((b, i) => ({ ...b, tempId: `booth-${Date.now()}-${i}` })));
        setEditableRegistrations(data.registrations.map((r, i) => ({ ...r, tempId: `reg-${Date.now()}-${i}` })));

        setHasParsed(true);
        setParsingErrors(data.errors);

        if (data.sessions.length === 0 && data.booths.length === 0 && data.registrations.length === 0) {
          setFeedback({ type: 'error', message: 'Parser could not find any valid sessions, booths, or registrations. Please check the file format and content.' });
        } else if (data.errors.length > 0) {
          setFeedback({ type: 'warning', message: `File parsed with ${data.errors.length} issue(s). Please review the summary and errors below before importing.` });
        } else {
          setFeedback({ type: 'success', message: `File parsed successfully! Review the summary and details below, then confirm the import.` });
        }

      } catch (error: any) {
        setFeedback({ type: 'error', message: `Failed to parse file: ${String(error.message)}` });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'Error reading file.' });
      setIsProcessing(false);
    }
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleFieldChange = <T,>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    tempId: string,
    field: keyof T,
    value: any
  ) => {
    setter(current => current.map(item => {
      if ((item as any).tempId === tempId) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'startTime' || field === 'endTime') {
          if ('dateNeedsReview' in updatedItem) (updatedItem as any).dateNeedsReview = false;
          if ('timeNeedsReview' in updatedItem) (updatedItem as any).timeNeedsReview = false;
        }
        if (field === 'name') {
          if ('wasDuplicate' in updatedItem) (updatedItem as any).wasDuplicate = false;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleDeleteRow = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, tempId: string) => {
    setter(current => current.filter((item: any) => item.tempId !== tempId));
  };

  const handleAddRow = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, newRow: T) => {
    setter(current => [...current, newRow]);
  };

  const sessionNameErrors = useMemo(() => {
    const errors = new Map<string, string>();
    const names = new Map<string, string[]>();
    editableSessions.forEach((session) => {
      const lowerName = session.name.toLowerCase();
      if (!names.has(lowerName)) names.set(lowerName, []);
      names.get(lowerName)!.push(session.tempId);
    });
    for (const [name, tempIds] of names.entries()) {
      if (tempIds.length > 1) {
        tempIds.forEach(tempId => errors.set(tempId, 'This session name is a duplicate.'));
      }
    }
    return errors;
  }, [editableSessions]);

  const boothIdErrors = useMemo(() => {
    const errors = new Map<string, string>();
    const ids = new Map<string, string[]>();
    editableBooths.forEach((booth) => {
      const lowerId = booth.physicalId.toLowerCase();
      if (!ids.has(lowerId)) ids.set(lowerId, []);
      ids.get(lowerId)!.push(booth.tempId);
    });
    for (const [id, tempIds] of ids.entries()) {
      if (tempIds.length > 1) {
        tempIds.forEach(tempId => errors.set(tempId, 'This Physical ID is a duplicate.'));
      }
    }
    return errors;
  }, [editableBooths]);


  const handleConfirmImport = async () => {
    if (!hasParsed || !selectedEventId || !currentEvent) {
      toast.error('No data to import or no event selected.');
      return;
    }

    setIsProcessing(true);
    setFeedback(null);
    setImportSummary(null);

    const summary: ImportSummary = {
      booths: { success: 0, failed: 0, errors: [] },
      sessions: { success: 0, failed: 0, errors: [] },
      boothSessionLinks: { success: 0, failed: 0, errors: [] },
      attendees: { success: 0, failed: 0, errors: [] },
      registrations: { success: 0, failed: 0, skipped: 0, errors: [] },
    };

    const toastId = toast.loading('Starting import...');

    try {
      // ---- STEP 1: BOOTHS ----
      let createdBooths: Booth[] = [];
      if (editableBooths.length > 0) {
        toast.loading(`Importing ${editableBooths.length} booths...`, { id: toastId });
        const boothResult = await addBoothsBatch(editableBooths);
        summary.booths.success = boothResult.data.length;
        summary.booths.failed = boothResult.errors.length;
        summary.booths.errors = boothResult.errors.map(e => `Booth "${e.physicalId}": ${e.error}`);
        if (!boothResult.success && boothResult.errors.length > 0) {
          throw new Error(`Failed to import booths. Error: ${boothResult.errors[0].error}`);
        }
        createdBooths = boothResult.data;
      }

      // ---- STEP 2: SESSIONS ----
      let createdSessions: Session[] = [];
      if (editableSessions.length > 0) {
        toast.loading(`Importing ${editableSessions.length} sessions...`, { id: toastId });
        const sessionResult = await addSessionsBatch(editableSessions.map(s => ({ name: s.name, startTime: s.startTime, endTime: s.endTime })));
        summary.sessions.success = sessionResult.data.length;
        summary.sessions.failed = sessionResult.errors.length;
        summary.sessions.errors = sessionResult.errors.map(e => `Session "${e.name}": ${e.error}`);
        if (!sessionResult.success && sessionResult.errors.length > 0) {
          throw new Error(`Failed to import sessions. Error: ${sessionResult.errors[0].error}`);
        }
        createdSessions = sessionResult.data;
      }

      // ---- STEP 3: BOOTH-SESSION CAPACITIES (LINKING) ----
      if (createdSessions.length > 0 && createdBooths.length > 0) {
        toast.loading(`Calculating capacities & linking booths to sessions...`, { id: toastId });

        const sessionMap = new Map(createdSessions.map(s => [s.name.toLowerCase(), s.id]));
        const boothMap = new Map(createdBooths.map(b => [b.physicalId.toLowerCase(), b.id]));

        // First, calculate all registration counts from the excel data
        const registrationCounts = new Map<string, number>();
        editableRegistrations.forEach(reg => {
          const sessionId = sessionMap.get(reg.sessionName.toLowerCase());
          const boothId = reg.expectedBoothPhysicalId ? boothMap.get(reg.expectedBoothPhysicalId.toLowerCase()) : undefined;
          if (sessionId && boothId) {
            const key = `${sessionId}|${boothId}`;
            registrationCounts.set(key, (registrationCounts.get(key) || 0) + 1);
          }
        });

        // Now, create a capacity link for ALL booths in ALL sessions.
        const capacitiesToInsert: Database['public']['Tables']['session_booth_capacities']['Insert'][] = [];
        createdSessions.forEach(session => {
          createdBooths.forEach(booth => {
            const key = `${session.id}|${booth.id}`;
            // The capacity is the number of people registered for this specific booth in this specific session.
            // If no one is registered, the capacity will be 0.
            const capacity = registrationCounts.get(key) || 0;

            capacitiesToInsert.push({
              session_id: session.id,
              booth_id: booth.id,
              capacity: capacity
            });
          });
        });

        if (capacitiesToInsert.length > 0) {
          toast.loading(`Creating ${capacitiesToInsert.length} booth-session links...`, { id: toastId });
          const capacityResult = await addSessionBoothCapacitiesBatch(capacitiesToInsert);
          summary.boothSessionLinks.success = capacityResult.createdCount;
          if (!capacityResult.success) {
            summary.boothSessionLinks.failed = capacitiesToInsert.length - capacityResult.createdCount;
            summary.boothSessionLinks.errors.push(capacityResult.message);
          }
        }
      }

      // ---- STEP 4: ATTENDEES ----
      const attendeesToProcess: { firstName: string; lastName: string; organization: string }[] = Array.from(new Map<string, { firstName: string; lastName: string; organization: string }>(
        editableRegistrations.map(r => {
          const key = `${r.firstName.toLowerCase()}|${r.lastName.toLowerCase()}|${r.attendeeOrganization.toLowerCase()}`;
          return [key, {
            firstName: r.firstName,
            lastName: r.lastName,
            organization: r.attendeeOrganization
          }];
        })
      ).values());

      let createdOrFoundAttendees: Attendee[] = [];
      if (attendeesToProcess.length > 0) {
        toast.loading(`Processing ${attendeesToProcess.length} attendee profiles...`, { id: toastId });
        const attendeeResult = await findOrCreateAttendeesBatch(attendeesToProcess);
        summary.attendees.success = attendeeResult.attendees.length;
        summary.attendees.failed = attendeeResult.errors.length;
        summary.attendees.errors = attendeeResult.errors;
        createdOrFoundAttendees = attendeeResult.attendees;
        if (!attendeeResult.success) {
          toast.error(`Attendee processing failed. Some registrations may not be created.`, { duration: 5000 });
        }
      }

      // ---- STEP 4.5: MARK VENDORS ----
      const vendorKeys = new Set(
        editableRegistrations
          .filter(reg => reg.isVendor)
          .map(reg => `${reg.firstName.toLowerCase()}|${reg.lastName.toLowerCase()}|${reg.attendeeOrganization.toLowerCase()}`)
      );

      const vendorIdsToMark = createdOrFoundAttendees
        .filter(att => {
          const nameParts = att.name.split(' ');
          const lastName = nameParts.pop() || '';
          const firstName = nameParts.join(' ');
          const key = `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${(att.organization || '').toLowerCase()}`;
          return vendorKeys.has(key);
        })
        .map(att => att.id);

      if (vendorIdsToMark.length > 0) {
        toast.loading(`Marking ${vendorIdsToMark.length} attendees as vendors...`, { id: toastId });
        const vendorResult = await markAttendeesAsVendors(vendorIdsToMark);
        if (!vendorResult.success) {
          summary.attendees.errors.push(`Failed to mark vendors: ${vendorResult.message}`);
          toast.error(`Vendor marking failed: ${vendorResult.message}`, { duration: 5000 });
        }
      }

      // ---- STEP 5: REGISTRATIONS ----
      if (editableRegistrations.length > 0) {
        toast.loading(`Creating ${editableRegistrations.length} registrations...`, { id: toastId });

        const dbSessionMap = new Map(createdSessions.map(s => [s.name.toLowerCase(), s.id]));
        const dbBoothMap = new Map(createdBooths.map(b => [b.physicalId.toLowerCase(), b.id]));
        const attendeeMapByNameOrg = new Map(createdOrFoundAttendees.map(a => {
          const nameParts = a.name.split(' ');
          const lastName = nameParts.pop() || '';
          const firstName = nameParts.join(' ');
          const key = `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${(a.organization || '').toLowerCase()}`;
          return [key, a.id];
        }));

        const registrationsToCreate: Omit<SessionRegistration, 'id' | 'registrationTime' | 'attendeeName'>[] = [];
        editableRegistrations.forEach(reg => {
          const sessionId = dbSessionMap.get(reg.sessionName.toLowerCase());
          const boothId = reg.expectedBoothPhysicalId ? dbBoothMap.get(reg.expectedBoothPhysicalId.toLowerCase()) : null;
          const attendeeKey = `${reg.firstName.toLowerCase()}|${reg.lastName.toLowerCase()}|${reg.attendeeOrganization.toLowerCase()}`;
          const attendeeId = attendeeMapByNameOrg.get(attendeeKey);

          if (!sessionId) {
            summary.registrations.skipped++;
            summary.registrations.errors.push(`Skipped reg for ${reg.firstName} ${reg.lastName}: Session '${reg.sessionName}' not found.`);
          } else if (reg.expectedBoothPhysicalId && !boothId) {
            summary.registrations.skipped++;
            summary.registrations.errors.push(`Skipped reg for ${reg.firstName} ${reg.lastName}: Booth ID '${reg.expectedBoothPhysicalId}' not found.`);
          } else if (!attendeeId) {
            summary.registrations.skipped++;
            summary.registrations.errors.push(`Skipped reg for ${reg.firstName} ${reg.lastName}: Corresponding attendee profile not found/created.`);
          } else {
            registrationsToCreate.push({ eventId: selectedEventId, sessionId, attendeeId, expectedBoothId: boothId || undefined, status: 'Registered' });
          }
        });

        if (registrationsToCreate.length > 0) {
          const regResult = await addSessionRegistrationsBatch(registrationsToCreate);
          summary.registrations.success = regResult.createdCount;
          if (!regResult.success) {
            summary.registrations.failed = registrationsToCreate.length - regResult.createdCount;
            summary.registrations.errors.push(regResult.message);
          }
        }
      }

      // ---- STEP 6: UPDATE EVENT DATES ----
      if (createdSessions.length > 0) {
        toast.loading('Updating event start/end dates...', { id: toastId });
        const startTimes = editableSessions.map(s => new Date(s.startTime).getTime());
        const endTimes = editableSessions.map(s => new Date(s.endTime).getTime());

        const overallStartDate = new Date(Math.min(...startTimes));
        const overallEndDate = new Date(Math.max(...endTimes));

        const currentStartDate = currentEvent.startDate ? new Date(currentEvent.startDate) : null;
        const currentEndDate = currentEvent.endDate ? new Date(currentEvent.endDate) : null;

        if (currentStartDate?.getTime() !== overallStartDate.getTime() || currentEndDate?.getTime() !== overallEndDate.getTime()) {
          await updateEvent(selectedEventId, {
            name: currentEvent.name,
            startDate: overallStartDate.toISOString().split('T')[0], // YYYY-MM-DD
            endDate: overallEndDate.toISOString().split('T')[0],   // YYYY-MM-DD
          });
        }
      }

      await refreshEventData();
      toast.success('Import process finished!', { id: toastId, duration: 4000 });
      resetState();
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`, { id: toastId, duration: 6000 });
      summary.booths.errors.push(error.message);
    } finally {
      setImportSummary(summary);
      setIsProcessing(false);
    }
  };

  const handleValidationAndImport = () => {
    // Check for session name duplicates
    if (sessionNameErrors.size > 0) {
      const firstErrorTempId = sessionNameErrors.keys().next().value;
      const elementId = `session-name-${firstErrorTempId}`;
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      toast.error('Please fix duplicate session names before importing.');
      return;
    }

    // Check for booth ID duplicates
    if (boothIdErrors.size > 0) {
      const firstErrorTempId = boothIdErrors.keys().next().value;
      const elementId = `booth-id-${firstErrorTempId}`;
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      toast.error('Please fix duplicate booth physical IDs before importing.');
      return;
    }

    // If all validations pass, proceed with the import
    handleConfirmImport();
  };

  return (
    <>
      <Modal isOpen={isProcessing && !importSummary} onClose={() => { }} title="Import in Progress" size="md">
        <div className="text-center p-4">
          <ArrowPathIcon className="w-12 h-12 text-primary-600 mx-auto animate-spin" />
          <p className="text-lg font-semibold mt-4">Importing Data...</p>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="font-bold text-amber-700">Please do not close this window.</p>
            <p className="text-sm text-amber-600">This process may take several minutes.</p>
          </div>
        </div>
      </Modal>

      <div className="space-y-8">
        <h1 className="text-3xl font-bold flex items-center">
          <DocumentTextIcon className="w-8 h-8 mr-3 text-primary-600" /> Master Event Import
        </h1>

        {!selectedEventId && !isProcessing && <Alert type="warning" message="No event selected. Please select an event from the header to import data into it." />}
        {feedback && <Alert type={feedback.type} message={feedback.message} className="my-4" />}

        {importSummary && (
          <Card title="Import Report" className={`mt-6 border-2 ${importSummary.booths.failed > 0 || importSummary.sessions.failed > 0 || importSummary.attendees.failed > 0 || importSummary.registrations.failed > 0 || importSummary.registrations.skipped > 0 || importSummary.boothSessionLinks.failed > 0 ? 'border-accent-200 bg-accent-50/50' : 'border-secondary-200 bg-secondary-50/50'}`}>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { title: 'Booths', icon: <BuildingStorefrontIcon className="w-6 h-6 mx-auto mb-1" />, data: importSummary.booths },
                { title: 'Sessions', icon: <PresentationChartLineIcon className="w-6 h-6 mx-auto mb-1" />, data: importSummary.sessions },
                { title: 'Booth Links', icon: <TableCellsIcon className="w-6 h-6 mx-auto mb-1" />, data: importSummary.boothSessionLinks },
                { title: 'Attendees', icon: <UsersGroupIcon className="w-6 h-6 mx-auto mb-1" />, data: importSummary.attendees },
                { title: 'Registrations', icon: <DocumentTextIcon className="w-6 h-6 mx-auto mb-1" />, data: importSummary.registrations }
              ].map(({ title, icon, data }) => {
                const skipped = 'skipped' in data ? (data as ImportSummary['registrations']).skipped : undefined;

                return (
                  <div key={title} className={`p-3 rounded-lg text-center bg-white border`}>
                    <div className="text-primary-600">{icon}</div>
                    <p className="text-sm font-semibold text-slate-600">{title}</p>
                    <p className="text-2xl font-bold text-slate-800">{data.success}</p>
                    <div className="flex justify-center items-center text-xs space-x-2">
                      {data.failed > 0 && <span className="text-accent-600 font-semibold flex items-center"><XMarkIcon className="w-3 h-3 mr-0.5" /> {data.failed} Failed</span>}
                      {skipped !== undefined && skipped > 0 && <span className="text-amber-600 font-semibold flex items-center"><ExclamationTriangleIcon className="w-3 h-3 mr-0.5" /> {skipped} Skipped</span>}
                      {data.failed === 0 && (skipped === undefined || skipped === 0) && <span className="text-secondary-600 font-semibold flex items-center"><CheckCircleIcon className="w-3 h-3 mr-0.5" /> Success</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {[...importSummary.booths.errors, ...importSummary.sessions.errors, ...importSummary.attendees.errors, ...importSummary.registrations.errors, ...importSummary.boothSessionLinks.errors].length > 0 && (
              <div className="mt-4">
                <h4 className="font-bold text-accent-800">Error Details:</h4>
                <pre className="text-xs bg-accent-50 p-2 rounded-md max-h-40 overflow-y-auto mt-1 border border-accent-100">
                  {[...importSummary.booths.errors, ...importSummary.sessions.errors, ...importSummary.attendees.errors, ...importSummary.registrations.errors, ...importSummary.boothSessionLinks.errors].join('\n')}
                </pre>
              </div>
            )}
          </Card>
        )}

        <Card title="Upload Event Schedule (.xlsx)" className="shadow-lg">
          <p className="text-sm text-slate-600 mb-4">
            Upload an Excel file to configure sessions, booths, and pre-register attendees for: <strong>{currentEvent?.name || 'N/A'}</strong>. You can review and edit the parsed data before the final import.
          </p>
          <div className="flex items-center space-x-4">
            <label htmlFor="master-import-file" className="sr-only">Upload Excel File</label>
            <Input
              id="master-import-file" type="file" accept=".xlsx"
              onChange={handleFileChange}
              className="text-sm p-1 border-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
              wrapperClassName="!mb-0 flex-grow"
              disabled={isProcessing || !selectedEventId}
            />
            <Button variant="neutral" onClick={resetState} disabled={isProcessing}>Reset</Button>
          </div>

          {isProcessing && !importSummary && !feedback && <div className="flex items-center text-primary-600 font-semibold mt-3"><ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> Please wait...</div>}

          {hasParsed && (
            <div className="mt-6 space-y-6">
              <Card title="Import Summary" className="bg-slate-50 border-slate-200 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-white rounded-lg border">
                    <PresentationChartLineIcon className="w-8 h-8 mx-auto mb-2 text-primary-500" />
                    <p className="text-3xl font-bold text-slate-800">{editableSessions.length}</p>
                    <p className="text-sm font-semibold text-slate-600">Sessions Found</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <BuildingStorefrontIcon className="w-8 h-8 mx-auto mb-2 text-primary-500" />
                    <p className="text-3xl font-bold text-slate-800">{editableBooths.length}</p>
                    <p className="text-sm font-semibold text-slate-600">Booths Found</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border">
                    <UsersGroupIcon className="w-8 h-8 mx-auto mb-2 text-primary-500" />
                    <p className="text-3xl font-bold text-slate-800">{editableRegistrations.length}</p>
                    <p className="text-sm font-semibold text-slate-600">Registrations Found</p>
                  </div>
                </div>
              </Card>

              {parsingErrors.length > 0 && (
                <Alert type="error" message={<div><p className="font-bold">The parser found {parsingErrors.length} issue(s):</p><ul className="list-disc list-inside mt-2 text-xs max-h-40 overflow-y-auto">{parsingErrors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>} />
              )}

              <Card title={`Sessions Detected (${editableSessions.length})`} bodyClassName="!p-0">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="font-montserrat"><tr className="border-b border-slate-200">
                      <th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100">Session Name</th><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100">Start Time</th><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100">End Time</th><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100"></th>
                    </tr></thead>
                    <tbody>{editableSessions.map((item) => {
                      const liveDuplicateError = sessionNameErrors.get(item.tempId);
                      const wasAutoRenamed = item.wasDuplicate && !liveDuplicateError;
                      const needsReview = item.timeNeedsReview || item.dateNeedsReview;
                      const rowClass = liveDuplicateError ? 'bg-red-100' : wasAutoRenamed ? 'bg-amber-100' : (needsReview ? 'bg-amber-50' : '');
                      const autoRenameWarning = `Original name '${item.originalName}' was a duplicate and auto-renamed.`;
                      const timeReviewWarning = item.dateNeedsReview ? 'Date from sheet name is invalid. Please confirm.' : item.timeNeedsReview ? 'Time from session name is invalid. Please confirm.' : undefined;

                      return (
                        <tr key={item.tempId} className={rowClass}>
                          <td className="p-1 border-t border-slate-200"><div className="flex items-center">
                            {wasAutoRenamed && <DocumentDuplicateIcon className="w-4 h-4 mx-2 text-amber-600 flex-shrink-0" title={autoRenameWarning} />}
                            {needsReview && !wasAutoRenamed && <ExclamationTriangleIcon className="w-4 h-4 mx-2 text-amber-600 flex-shrink-0" title={timeReviewWarning} />}
                            <Input id={`session-name-${item.tempId}`} wrapperClassName="!mb-0 w-full" value={item.name} onChange={e => handleFieldChange(setEditableSessions, item.tempId, 'name', e.target.value)} error={liveDuplicateError} />
                          </div></td>
                          <td className="p-1 border-t border-slate-200"><Input wrapperClassName="!mb-0" type="datetime-local" value={formatDateForInput(item.startTime)} onChange={e => handleFieldChange(setEditableSessions, item.tempId, 'startTime', new Date(e.target.value).toISOString())} warning={needsReview ? timeReviewWarning : undefined} /></td>
                          <td className="p-1 border-t border-slate-200"><Input wrapperClassName="!mb-0" type="datetime-local" value={formatDateForInput(item.endTime)} onChange={e => handleFieldChange(setEditableSessions, item.tempId, 'endTime', new Date(e.target.value).toISOString())} warning={needsReview ? timeReviewWarning : undefined} /></td>
                          <td className="p-1 border-t border-slate-200"><Button size="sm" variant="link" className="text-accent-500" onClick={() => handleDeleteRow(setEditableSessions, item.tempId)}><TrashIcon className="w-4 h-4" /></Button></td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-3 p-3 bg-slate-50">
                  {editableSessions.map((item) => {
                    const liveDuplicateError = sessionNameErrors.get(item.tempId);
                    const wasAutoRenamed = item.wasDuplicate && !liveDuplicateError;
                    const needsReview = item.timeNeedsReview || item.dateNeedsReview;
                    const rowClass = liveDuplicateError ? 'bg-red-100 border-red-300' : wasAutoRenamed ? 'bg-amber-100 border-amber-300' : (needsReview ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200');
                    const autoRenameWarning = `Original name '${item.originalName}' was a duplicate and auto-renamed.`;
                    const timeReviewWarning = item.dateNeedsReview ? 'Date invalid. Please confirm.' : item.timeNeedsReview ? 'Time invalid. Please confirm.' : undefined;

                    return (
                      <div key={item.tempId} className={`p-3 rounded-lg border ${rowClass}`}>
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-bold text-slate-700">Edit Session</p>
                          <Button size="sm" variant="link" className="text-accent-500" onClick={() => handleDeleteRow(setEditableSessions, item.tempId)}><TrashIcon className="w-5 h-5" /></Button>
                        </div>
                        <Input label="Session Name" wrapperClassName="!mb-2" value={item.name} onChange={e => handleFieldChange(setEditableSessions, item.tempId, 'name', e.target.value)} error={liveDuplicateError} warning={wasAutoRenamed ? autoRenameWarning : undefined} />
                        <Input label="Start Time" wrapperClassName="!mb-2" type="datetime-local" value={formatDateForInput(item.startTime)} onChange={e => handleFieldChange(setEditableSessions, item.tempId, 'startTime', new Date(e.target.value).toISOString())} warning={needsReview ? timeReviewWarning : undefined} />
                        <Input label="End Time" wrapperClassName="!mb-0" type="datetime-local" value={formatDateForInput(item.endTime)} onChange={e => handleFieldChange(setEditableSessions, item.tempId, 'endTime', new Date(e.target.value).toISOString())} warning={needsReview ? timeReviewWarning : undefined} />
                      </div>
                    )
                  })}
                </div>
                <div className="p-2 bg-slate-50 border-t border-slate-200"><Button size="sm" variant="link" leftIcon={<PlusCircleIcon className="w-4 h-4" />} onClick={() => handleAddRow(setEditableSessions, { tempId: `s-${Date.now()}`, name: 'New Session', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 30 * 60000).toISOString(), timeNeedsReview: true, dateNeedsReview: true, wasDuplicate: false, originalName: 'New Session' } as EditableSession)}>Add Session</Button></div>
              </Card>

              <Card title={`Booths Detected (${editableBooths.length})`} bodyClassName="!p-0">
                <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm">
                  <thead className="font-montserrat"><tr className="border-b border-slate-200"><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100">Physical ID</th><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100">Company Name</th><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100"></th></tr></thead>
                  <tbody>{editableBooths.map((item) => {
                    const liveDuplicateError = boothIdErrors.get(item.tempId);
                    return (
                      <tr key={item.tempId} className={liveDuplicateError ? 'bg-red-100' : ''}>
                        <td className="p-1 border-t border-slate-200"><Input id={`booth-id-${item.tempId}`} wrapperClassName="!mb-0" value={item.physicalId} onChange={e => handleFieldChange(setEditableBooths, item.tempId, 'physicalId', e.target.value)} error={liveDuplicateError} /></td>
                        <td className="p-1 border-t border-slate-200"><Input wrapperClassName="!mb-0" value={item.companyName} onChange={e => handleFieldChange(setEditableBooths, item.tempId, 'companyName', e.target.value)} /></td>
                        <td className="p-1 border-t border-slate-200"><Button size="sm" variant="link" className="text-accent-500" onClick={() => handleDeleteRow(setEditableBooths, item.tempId)}><TrashIcon className="w-4 h-4" /></Button></td>
                      </tr>
                    );
                  })}</tbody>
                </table></div>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-3 p-3 bg-slate-50">
                  {editableBooths.map((item) => {
                    const liveDuplicateError = boothIdErrors.get(item.tempId);
                    return (
                      <div key={item.tempId} className={`p-3 rounded-lg border ${liveDuplicateError ? 'bg-red-100 border-red-300' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-bold text-slate-700">Edit Booth</p>
                          <Button size="sm" variant="link" className="text-accent-500" onClick={() => handleDeleteRow(setEditableBooths, item.tempId)}><TrashIcon className="w-5 h-5" /></Button>
                        </div>
                        <Input label="Physical ID" wrapperClassName="!mb-2" value={item.physicalId} onChange={e => handleFieldChange(setEditableBooths, item.tempId, 'physicalId', e.target.value)} error={liveDuplicateError} />
                        <Input label="Company Name" wrapperClassName="!mb-0" value={item.companyName} onChange={e => handleFieldChange(setEditableBooths, item.tempId, 'companyName', e.target.value)} />
                      </div>
                    )
                  })}
                </div>
                <div className="p-2 bg-slate-50 border-t border-slate-200"><Button size="sm" variant="link" leftIcon={<PlusCircleIcon className="w-4 h-4" />} onClick={() => handleAddRow(setEditableBooths, { tempId: `b-${Date.now()}`, physicalId: 'NEW_ID', companyName: 'New Company' })}>Add Booth</Button></div>
              </Card>

              <Card title={`Registrations Found (${editableRegistrations.length})`} bodyClassName="!p-0">
                <div className="hidden md:block overflow-x-auto max-h-96"><table className="w-full text-sm">
                  <thead className="font-montserrat sticky top-0 z-10"><tr className="border-b border-slate-200"><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100">Session Name</th><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100">First Name</th><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100">Last Name</th><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100">Organization</th><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100">Booth Physical ID</th><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100">Is Vendor?</th><th className="p-2 text-left text-xs font-semibold text-slate-600 uppercase bg-slate-100"></th></tr></thead>
                  <tbody>{editableRegistrations.map((item, index) => (<tr key={item.tempId}><td className="p-1 border-t border-slate-200"><Input wrapperClassName="!mb-0" value={item.sessionName} onChange={e => handleFieldChange(setEditableRegistrations, item.tempId, 'sessionName', e.target.value)} /></td><td className="p-1 border-t border-slate-200"><Input wrapperClassName="!mb-0" value={item.firstName} onChange={e => handleFieldChange(setEditableRegistrations, item.tempId, 'firstName', e.target.value)} /></td><td className="p-1 border-t border-slate-200"><Input wrapperClassName="!mb-0" value={item.lastName} onChange={e => handleFieldChange(setEditableRegistrations, item.tempId, 'lastName', e.target.value)} /></td><td className="p-1 border-t border-slate-200"><Input wrapperClassName="!mb-0" value={item.attendeeOrganization} onChange={e => handleFieldChange(setEditableRegistrations, item.tempId, 'attendeeOrganization', e.target.value)} /></td><td className="p-1 border-t border-slate-200"><Input wrapperClassName="!mb-0" value={item.expectedBoothPhysicalId} onChange={e => handleFieldChange(setEditableRegistrations, item.tempId, 'expectedBoothPhysicalId', e.target.value)} /></td><td className="p-1 border-t border-slate-200 text-center"><input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={item.isVendor} onChange={e => handleFieldChange(setEditableRegistrations, item.tempId, 'isVendor', e.target.checked)} /></td><td className="p-1 border-t border-slate-200"><Button size="sm" variant="link" className="text-accent-500" onClick={() => handleDeleteRow(setEditableRegistrations, item.tempId)}><TrashIcon className="w-4 h-4" /></Button></td></tr>))}</tbody>
                </table></div>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-3 p-3 bg-slate-50 max-h-96 overflow-y-auto">
                  {editableRegistrations.map((item, index) => (
                    <div key={item.tempId} className="p-3 rounded-lg border bg-white border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-slate-700 truncate">{item.firstName} {item.lastName || 'New Registration'}</p>
                        <Button size="sm" variant="link" className="text-accent-500" onClick={() => handleDeleteRow(setEditableRegistrations, item.tempId)}><TrashIcon className="w-5 h-5" /></Button>
                      </div>
                      <Input label="Session Name" wrapperClassName="!mb-0" value={item.sessionName} onChange={e => handleFieldChange(setEditableRegistrations, item.tempId, 'sessionName', e.target.value)} />
                      <Input label="First Name" wrapperClassName="!mb-0" value={item.firstName} onChange={e => handleFieldChange(setEditableRegistrations, item.tempId, 'firstName', e.target.value)} />
                      <Input label="Last Name" wrapperClassName="!mb-0" value={item.lastName} onChange={e => handleFieldChange(setEditableRegistrations, item.tempId, 'lastName', e.target.value)} />
                      <Input label="Organization" wrapperClassName="!mb-0" value={item.attendeeOrganization} onChange={e => handleFieldChange(setEditableRegistrations, item.tempId, 'attendeeOrganization', e.target.value)} />
                      <Input label="Booth Physical ID" wrapperClassName="!mb-0" value={item.expectedBoothPhysicalId} onChange={e => handleFieldChange(setEditableRegistrations, item.tempId, 'expectedBoothPhysicalId', e.target.value)} />
                      <div className="flex items-center space-x-2 pt-1">
                        <input id={`staff-${item.tempId}`} type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" checked={item.isVendor} onChange={e => handleFieldChange(setEditableRegistrations, item.tempId, 'isVendor', e.target.checked)} />
                        <label htmlFor={`staff-${item.tempId}`} className="text-sm font-medium text-slate-700">Is Vendor Staff?</label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-slate-50 border-t border-slate-200"><Button size="sm" variant="link" leftIcon={<PlusCircleIcon className="w-4 h-4" />} onClick={() => handleAddRow(setEditableRegistrations, { tempId: `r-${Date.now()}`, sessionName: '', firstName: '', lastName: '', attendeeOrganization: '', expectedBoothPhysicalId: '', isVendor: false })}>Add Registration</Button></div>
              </Card>

              <div className="pt-4"><Button
                onClick={handleValidationAndImport}
                variant="primary" className="w-full !py-3"
                disabled={isProcessing || (editableSessions.length === 0 && editableBooths.length === 0)}
              >{isProcessing ? 'Importing...' : 'Confirm and Import Edited Data'}</Button></div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default MasterImportPage;