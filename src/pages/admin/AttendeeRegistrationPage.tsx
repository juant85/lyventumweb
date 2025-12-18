
// src/pages/admin/AttendeeRegistrationPage.tsx
import React, { useState, ChangeEvent, useMemo, useEffect } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Select from '../../components/ui/Select';
import { UsersGroupIcon, ArrowPathIcon, TableCellsIcon, TrashIcon, PlusCircleIcon, InformationCircleIcon, DocumentArrowDownIcon } from '../../components/Icons';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { Attendee } from '../../types';

type ParsedRow = { [key: string]: any; _tempId: string };
type ColumnMapInfo = {
  type: string;
  customFieldName?: string;
};
type ColumnMapping = { [key: string]: ColumnMapInfo };

const KNOWN_FIELDS = [
    { value: 'firstName', label: 'First Name (Required)' },
    { value: 'lastName', label: 'Last Name (Required)' },
    { value: 'email', label: 'Email (Recommended)' },
    { value: 'organization', label: 'Organization (Required)' },
    { value: 'position', label: 'Position / Job Title' },
    { value: 'phone', label: 'Phone' },
    { value: 'notes', label: 'Notes' },
    { value: 'track', label: 'Track' },
];

const IGNORE_FIELD = 'ignore';
const CUSTOM_FIELD = 'custom_field';

const MAPPING_REQUIRED_FIELDS: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    organization: 'Organization',
};

const FINAL_IMPORT_REQUIRED_FIELDS: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    organization: 'Organization',
};

const AttendeeRegistrationPage: React.FC = () => {
  const { findOrCreateAttendeesBatch, findOrCreateTracksAndAssignAttendees, loadingData: eventDataLoading, fetchData } = useEventData();
  const { selectedEventId } = useSelectedEvent();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: React.ReactNode } | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [editableData, setEditableData] = useState<ParsedRow[]>([]);
  const [originalParsedData, setOriginalParsedData] = useState<ParsedRow[]>([]);
  const [reviewColumns, setReviewColumns] = useState<{ key: string, label: string }[]>([]);
  const [validationErrors, setValidationErrors] = useState<Map<string, Set<string>>>(new Map());


  const resetState = () => {
    setFeedback(null);
    setIsProcessingFile(false);
    setIsImporting(false);
    setFileHeaders([]);
    setColumnMapping({});
    setEditableData([]);
    setOriginalParsedData([]);
    setReviewColumns([]);
    setValidationErrors(new Map());
    const fileInput = document.getElementById('attendee-import-file') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };
  
  const handleFileImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetState();
    setIsProcessingFile(true);
    setFeedback({ type: 'info', message: 'Reading and processing your file...' });

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: Omit<ParsedRow, '_tempId'>[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });
            
            if (json.length === 0) throw new Error('The selected file is empty or in an unsupported format.');

            const headers = Object.keys(json[0]);
            setFileHeaders(headers);
            const dataWithIds = json.map((row, index) => ({...row, _tempId: `row-${Date.now()}-${index}`}));
            setOriginalParsedData(dataWithIds);
            
            // Auto-mapping logic
            const initialMapping: ColumnMapping = {};
            const mappedStandardFields = new Set<string>();

            headers.forEach(header => {
                const lowerHeader = header.toLowerCase().replace(/[\s_-]/g, '');
                let foundField = KNOWN_FIELDS.find(field => {
                    const fieldValLower = field.value.toLowerCase().replace(' (required)', '');
                    return lowerHeader.includes(fieldValLower);
                });
                 if (!foundField && (lowerHeader.includes('firstname') || lowerHeader.includes('primeronombre'))) foundField = KNOWN_FIELDS.find(f => f.value === 'firstName');
                 if (!foundField && (lowerHeader.includes('lastname') || lowerHeader.includes('apellido'))) foundField = KNOWN_FIELDS.find(f => f.value === 'lastName');
                 if (!foundField && lowerHeader.includes('track')) foundField = KNOWN_FIELDS.find(f => f.value === 'track');

                if (foundField && !mappedStandardFields.has(foundField.value)) {
                    initialMapping[header] = { type: foundField.value };
                    mappedStandardFields.add(foundField.value);
                } else {
                    initialMapping[header] = { type: CUSTOM_FIELD, customFieldName: header };
                }
            });
            setColumnMapping(initialMapping);
            setFeedback({ type: 'success', message: 'File processed. Please review column mappings and then edit the data below before importing.' });

        } catch (error: any) {
            console.error("File processing error:", error);
            setFeedback({ type: 'error', message: `Failed to process file: ${error.message}` });
        } finally {
            setIsProcessingFile(false);
        }
    };
    reader.onerror = () => {
        setFeedback({ type: 'error', message: 'Error reading the file.' });
        setIsProcessingFile(false);
    };
    reader.readAsBinaryString(file);
  };
  
  useEffect(() => {
    // Determine the columns for the review table
    const baseCols = KNOWN_FIELDS.map(f => ({ key: f.value, label: f.label.replace(' (Required)', '').replace(' (Recommended)', '') }));
    const customCols = Object.values(columnMapping)
        .filter(mapInfo => (mapInfo as ColumnMapInfo).type === CUSTOM_FIELD && (mapInfo as ColumnMapInfo).customFieldName)
        .map(mapInfo => ({ key: (mapInfo as ColumnMapInfo).customFieldName!, label: (mapInfo as ColumnMapInfo).customFieldName! }));

    const finalCols = [...baseCols];
    const baseKeys = new Set(baseCols.map(c => c.key));
    customCols.forEach(cc => { if (!baseKeys.has(cc.key)) finalCols.push(cc); });
    setReviewColumns(finalCols);

    // Transform the original data into the editable structure
    if (originalParsedData.length > 0) {
        const typeToHeaderMap = new Map<string, string>();
        Object.entries(columnMapping).forEach(([header, mapInfo]) => {
            if ((mapInfo as ColumnMapInfo).type !== IGNORE_FIELD && (mapInfo as ColumnMapInfo).type !== CUSTOM_FIELD) {
                typeToHeaderMap.set((mapInfo as ColumnMapInfo).type, header);
            }
        });
        
        const customFieldToHeaderMap = new Map<string, string>();
         Object.entries(columnMapping).forEach(([header, mapInfo]) => {
            if ((mapInfo as ColumnMapInfo).type === CUSTOM_FIELD && (mapInfo as ColumnMapInfo).customFieldName) {
                customFieldToHeaderMap.set((mapInfo as ColumnMapInfo).customFieldName!, header);
            }
        });

        const newEditableData = originalParsedData.map(originalRow => {
            const newRow: ParsedRow = { _tempId: originalRow._tempId };
            finalCols.forEach(col => {
                const standardHeader = typeToHeaderMap.get(col.key);
                const customHeader = customFieldToHeaderMap.get(col.key);
                
                if (standardHeader) {
                    newRow[col.key] = originalRow[standardHeader] ?? '';
                } else if (customHeader) {
                    newRow[col.key] = originalRow[customHeader] ?? '';
                } else {
                    newRow[col.key] = '';
                }
            });
            return newRow;
        });
        setEditableData(newEditableData);
    }
  }, [columnMapping, originalParsedData]);

  const handleMappingChange = (header: string, selectedField: string) => {
    setColumnMapping(prev => ({ ...prev, [header]: { type: selectedField, customFieldName: selectedField === CUSTOM_FIELD ? header : undefined } }));
  };
  
  const handleCustomNameChange = (header: string, newCustomName: string) => {
    setColumnMapping(prev => ({ ...prev, [header]: { ...(prev[header] as ColumnMapInfo), type: CUSTOM_FIELD, customFieldName: newCustomName } }));
  };
  
  const handleDataChange = (tempId: string, columnKey: string, value: string) => {
      setEditableData(currentData =>
          currentData.map(row => (row._tempId === tempId ? { ...row, [columnKey]: value } : row))
      );
      // Also clear validation error for this specific cell
      setValidationErrors(prev => {
        if (prev.has(tempId)) {
            const newSet = new Set(prev.get(tempId));
            newSet.delete(columnKey);
            if (newSet.size === 0) {
                prev.delete(tempId);
            } else {
                prev.set(tempId, newSet);
            }
            return new Map(prev);
        }
        return prev;
      });
  };

  const handleDeleteRow = (tempId: string) => {
      setEditableData(currentData => currentData.filter(row => row._tempId !== tempId));
      toast.success("Row removed.");
  };

  const handleAddRow = () => {
      const newRow: ParsedRow = { _tempId: `new-${Date.now()}` };
      reviewColumns.forEach(col => { newRow[col.key] = ''; });
      setEditableData(currentData => [...currentData, newRow]);
  };

  const missingRequiredMappings = useMemo(() => {
    const mappedTypes = new Set(Object.values(columnMapping).map(m => m.type));
    return Object.keys(MAPPING_REQUIRED_FIELDS).filter(fieldKey => !mappedTypes.has(fieldKey));
  }, [columnMapping]);

  const canImport = useMemo(() => {
    return editableData.length > 0 && !isImporting && missingRequiredMappings.length === 0;
  }, [editableData.length, isImporting, missingRequiredMappings]);


  const handleConfirmImport = async () => {
    if(!selectedEventId) { toast.error("No event selected."); return; }
    
    // --- Final validation on editableData ---
    const errors = new Map<string, Set<string>>();
    let firstErrorFieldId: string | null = null;
    editableData.forEach(row => {
        const rowErrors = new Set<string>();
        Object.keys(FINAL_IMPORT_REQUIRED_FIELDS).forEach(fieldKey => {
            if (!row[fieldKey] || String(row[fieldKey]).trim() === '') {
                rowErrors.add(fieldKey);
                 if (!firstErrorFieldId) { // Capture the very first error
                    firstErrorFieldId = `review-${row._tempId}-${fieldKey}`;
                }
            }
        });
        if(rowErrors.size > 0) errors.set(row._tempId, rowErrors);
    });
    
    setValidationErrors(errors);
    if(errors.size > 0) {
        toast.error("Validation failed. Please fill in all required fields marked in red.");
        setFeedback({ type: 'error', message: 'Please fill in all required fields (marked with *) before importing.'});
        
        if (firstErrorFieldId) {
            const el = document.getElementById(firstErrorFieldId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus();
            }
        }
        return;
    }

    setIsImporting(true);
    const toastId = toast.loading('Preparing attendee data...');

    // Group rows by unique attendee based on email, falling back to name+org for those without email.
    const uniqueAttendeesMap = new Map<string, any>();
    editableData.forEach(row => {
        const email = (row.email || '').toString().toLowerCase().trim();
        const key = email || `${(row.firstName || '').toString().toLowerCase().trim()}|${(row.lastName || '').toString().toLowerCase().trim()}|${(row.organization || '').toString().toLowerCase().trim()}`;
        
        if (!uniqueAttendeesMap.has(key)) {
            const customData: { [key: string]: any } = {};
            reviewColumns.forEach(col => {
                const value = row[col.key];
                if (!KNOWN_FIELDS.some(f => f.value === col.key) && col.key !== 'track') {
                    customData[col.key] = value;
                }
            });

            uniqueAttendeesMap.set(key, {
                firstName: row.firstName || '',
                lastName: row.lastName || '',
                email: row.email,
                organization: row.organization,
                position: row.position,
                phone: row.phone,
                notes: row.notes,
                metadata: customData,
            });
        }
    });
    
    const attendeesToProcess = Array.from(uniqueAttendeesMap.values());

    toast.loading(`Processing ${attendeesToProcess.length} unique attendee profiles...`, { id: toastId });
    const result = await findOrCreateAttendeesBatch(attendeesToProcess);
    
    if (result.success && result.attendees.length > 0) {
        const hasTrackColumn = reviewColumns.some(c => c.key === 'track');
        if (hasTrackColumn) {
            toast.loading('Assigning tracks...', { id: toastId });
            
            const attendeeMapByEmail = new Map<string, Attendee>();
            result.attendees.forEach(att => {
                if (att.email) {
                    attendeeMapByEmail.set(att.email.toLowerCase(), att);
                }
            });

            const trackAssignments: { attendeeId: string; trackName: string }[] = [];
            editableData.forEach(row => {
                const trackName = (row.track || '').toString().trim();
                const email = (row.email || '').toString().toLowerCase().trim();
                
                if (trackName && email) {
                    const attendee = attendeeMapByEmail.get(email);
                    if (attendee) {
                        trackAssignments.push({ attendeeId: attendee.id, trackName });
                    }
                }
            });

            if (trackAssignments.length > 0) {
                const trackResult = await findOrCreateTracksAndAssignAttendees(trackAssignments);
                if (!trackResult.success) {
                    result.errors.push(`Track Assignment Failed: ${trackResult.message}`);
                    toast.error(`Track assignment failed: ${trackResult.message}`, { duration: 5000 });
                }
            }
        }
    }

    if(result.errors.length === 0) {
        toast.success(`Successfully processed ${result.attendees.length} attendees!`, { id: toastId });
        resetState();
        fetchData(); 
        setFeedback({ type: 'success', message: `${result.attendees.length} attendee profiles were successfully created or updated.` });
    } else {
        toast.error(`Import finished with errors. ${result.errors.join('. ')}`, { id: toastId, duration: 6000 });
        setFeedback({ type: 'error', message: <><strong>Import Failed:</strong><ul>{result.errors.map((e,i) => <li key={i}>- {e}</li>)}</ul></> });
    }
    setIsImporting(false);
  };
  
  const importButtonTooltip = !canImport && fileHeaders.length > 0
    ? `Missing required column mappings: ${missingRequiredMappings.map(key => MAPPING_REQUIRED_FIELDS[key]).join(', ')}`
    : '';

  const handleDownloadTemplate = () => {
    const templateData = [
        { 
            firstName: "Maria", 
            lastName: "Rodriguez", 
            email: "maria.r@example.com", 
            organization: "Tech Corp", 
            position: "Lead Developer",
            phone: "555-123-4567",
            track: "Main Conference"
        },
        { 
            firstName: "Maria", 
            lastName: "Rodriguez", 
            email: "maria.r@example.com", 
            organization: "Tech Corp", 
            position: "Lead Developer",
            phone: "555-123-4567",
            track: "AI Workshop"
        },
        { 
            firstName: "Carlos", 
            lastName: "Sanchez", 
            email: "carlos.s@example.com", 
            organization: "Innovate Inc", 
            position: "Project Manager",
            phone: "555-987-6543",
            track: "Main Conference"
        },
        { 
            firstName: "Laura", 
            lastName: "Jimenez", 
            email: "laura.j@example.com", 
            organization: "Data Solutions", 
            position: "Data Analyst",
            phone: "555-111-2222",
            track: "" // Example of no track
        },
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendees");
    XLSX.writeFile(workbook, "Lyventum_Attendee_Template.xlsx");
    toast.success("Template downloaded!");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center font-montserrat">
        <UsersGroupIcon className="w-8 h-8 mr-3 text-brandBlue" /> Flexible Attendee Import
      </h1>

      {!selectedEventId && !eventDataLoading && (
         <Alert type="warning" message="No event selected. Please select an event from the header to import attendees." />
      )}
      {feedback && <Alert type={feedback.type} message={feedback.message} className="my-4" />}
      
      <Card title="How to Prepare Your File" icon={<InformationCircleIcon className="w-6 h-6 text-primary-500"/>}>
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <p>Follow these guidelines for a successful import:</p>
            <ul className="list-disc list-inside space-y-2 pl-2">
                <li><strong>Format:</strong> Your file must be Excel (.xlsx, .xls) or .csv. The first row must be the column headers (e.g., `firstName`, `email`, `track`).</li>
                <li><strong>Required Columns:</strong> Ensure you have columns for <strong>First Name</strong>, <strong>Last Name</strong>, and <strong>Organization</strong>. Using <strong>Email</strong> is highly recommended to prevent duplicate profiles.</li>
                <li>
                    <strong>Multiple Tracks per Attendee:</strong> To assign an attendee to multiple tracks, simply add a <strong>separate row for each track assignment</strong>. Repeat the attendee's information (name, email, etc.) in each of those rows and change only the value in the `track` column.
                </li>
            </ul>
            <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                <p className="font-semibold mb-2">Example Structure:</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-200 dark:bg-slate-600">
                            <tr>
                                <th className="p-2">firstName</th>
                                <th className="p-2">lastName</th>
                                <th className="p-2">email</th>
                                <th className="p-2">organization</th>
                                <th className="p-2">track</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-200 dark:border-slate-600">
                                <td className="p-2">Maria</td><td className="p-2">Rodriguez</td><td className="p-2">maria@email.com</td><td className="p-2">Tech Corp</td><td className="p-2">Main Conference</td>
                            </tr>
                            <tr className="border-b border-slate-200 dark:border-slate-600">
                                <td className="p-2">Maria</td><td className="p-2">Rodriguez</td><td className="p-2">maria@email.com</td><td className="p-2">Tech Corp</td><td className="p-2">AI Workshop</td>
                            </tr>
                            <tr className="border-b border-slate-200 dark:border-slate-600">
                                <td className="p-2">Carlos</td><td className="p-2">Sanchez</td><td className="p-2">carlos@email.com</td><td className="p-2">Innovate Inc</td><td className="p-2">Main Conference</td>
                            </tr>
                            <tr>
                                <td className="p-2">Laura</td><td className="p-2">Jimenez</td><td className="p-2">laura@email.com</td><td className="p-2">Data Solutions</td><td className="p-2"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-xs mt-2 italic text-slate-500 dark:text-slate-400">Note: Laura Jimenez will be imported but not assigned to any track.</p>
            </div>
            <Button onClick={handleDownloadTemplate} variant="secondary" size="sm" leftIcon={<DocumentArrowDownIcon className="w-4 h-4" />}>
                Download Template
            </Button>
        </div>
      </Card>

      <Card title="Step 1: Upload Attendee File" className="shadow-lg">
          <Input 
            type="file" id="attendee-import-file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            onChange={handleFileImport}
            className="text-sm p-1 border-inputBorder file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-brandBlue file:text-white hover:file:bg-blue-700 cursor-pointer" 
            wrapperClassName="!mb-0"
            disabled={isProcessingFile || !selectedEventId}
          />
           {isProcessingFile && <div className="flex items-center text-brandBlue font-semibold mt-3"><ArrowPathIcon className="w-5 h-5 mr-2 animate-spin"/> Processing file...</div>}
      </Card>
      
      {fileHeaders.length > 0 && (
        <>
            <Card title="Step 2: Map Columns" icon={<TableCellsIcon className="w-6 h-6 text-primary-600"/>}>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">Match columns from your file. <strong>First Name, Last Name, and Organization</strong> must be mapped. Other columns can be imported as custom fields or ignored.</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700">
                            <tr>
                                <th className="p-2 text-left font-semibold text-slate-600 dark:text-slate-300">Your File Header</th><th className="p-2 text-left font-semibold text-slate-600 dark:text-slate-300">Map to Field</th><th className="p-2 text-left font-semibold text-slate-600 dark:text-slate-300">Data Preview</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fileHeaders.map(header => (
                                <tr key={header} className="border-b border-slate-100 dark:border-slate-700">
                                    <td className="p-2 font-medium text-slate-800 dark:text-slate-200">{header}</td>
                                    <td className="p-2 align-top">
                                        <div className="flex flex-col gap-2">
                                            <Select
                                                value={columnMapping[header]?.type || IGNORE_FIELD}
                                                onChange={(e) => handleMappingChange(header, e.target.value)}
                                                options={[...KNOWN_FIELDS.map(f => ({value: f.value, label: f.label, disabled: Object.values(columnMapping).some(m => (m as ColumnMapInfo).type === f.value) && (columnMapping[header] as ColumnMapInfo)?.type !== f.value})), { value: CUSTOM_FIELD, label: 'Custom Field' }, { value: IGNORE_FIELD, label: 'Ignore this column' }]}
                                                wrapperClassName="!mb-0" className="text-xs !py-1"
                                            />
                                            {columnMapping[header]?.type === CUSTOM_FIELD && <Input placeholder="Enter custom field name" value={columnMapping[header]?.customFieldName || ''} onChange={(e) => handleCustomNameChange(header, e.target.value)} wrapperClassName="!mb-0" className="!py-1 text-xs" aria-label={`Custom field name for ${header}`} />}
                                        </div>
                                    </td>
                                    <td className="p-2 text-slate-500 dark:text-slate-400 italic truncate max-w-xs align-top" title={String(originalParsedData[0]?.[header] || '')}>{String(originalParsedData[0]?.[header] || '')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card title={`Step 3: Review & Edit Data (${editableData.length} records)`}>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">Review and edit the parsed attendee data. Add any missing information. All required fields (marked with *) must be filled for every row before importing.</p>
                <div className="overflow-x-auto max-h-[70vh]">
                    <table className="w-full text-sm">
                         <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0 z-10">
                            <tr>
                                {reviewColumns.map(col => (
                                    <th key={col.key} className="p-2 text-left font-semibold text-slate-600 dark:text-slate-300">
                                        {col.label}
                                        {Object.keys(FINAL_IMPORT_REQUIRED_FIELDS).includes(col.key) && <span className="text-red-500 ml-1">*</span>}
                                    </th>
                                ))}
                                <th className="p-2 text-left font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {editableData.map((row) => (
                                <tr key={row._tempId} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    {reviewColumns.map(col => (
                                        <td key={`${row._tempId}-${col.key}`} className="p-1">
                                            <Input
                                                id={`review-${row._tempId}-${col.key}`}
                                                value={String(row[col.key] || '')}
                                                onChange={(e) => handleDataChange(row._tempId, col.key, e.target.value)}
                                                wrapperClassName="!mb-0"
                                                className="!py-1 text-xs bg-white dark:bg-slate-800"
                                                error={validationErrors.has(row._tempId) && validationErrors.get(row._tempId)!.has(col.key) ? 'Required' : undefined}
                                            />
                                        </td>
                                    ))}
                                    <td className="p-1 text-center">
                                        <Button size="sm" variant="link" onClick={() => handleDeleteRow(row._tempId)} className="text-accent-500" title="Delete Row"><TrashIcon className="w-4 h-4" /></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="mt-4 flex justify-between items-center flex-wrap gap-4">
                    <Button size="sm" variant="neutral" onClick={handleAddRow} leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>Add Row</Button>
                    <div title={importButtonTooltip}>
                        <Button onClick={handleConfirmImport} disabled={!canImport} size="lg">
                            {isImporting ? 'Importing...' : 'Confirm and Start Import'}
                        </Button>
                    </div>
                </div>
            </Card>
        </>
      )}
    </div>
  );
};

export default AttendeeRegistrationPage;
