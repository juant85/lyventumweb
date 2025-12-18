import React, { useState, useMemo } from 'react';
import { useEventData } from '../../contexts/EventDataContext';
import { ScanRecord, Booth } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { TrashIcon, DocumentArrowDownIcon, PencilSquareIcon, ClockIcon, ArrowPathIcon } from '../../components/Icons';
import { useSelectedEvent } from '../../contexts/SelectedEventContext'; // Import to check if event is selected
import { toast } from 'react-hot-toast';
import { APP_NAME } from '../../constants';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext';
import { Feature } from '../../features';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

const DataEditorPage: React.FC = () => {
  // `getBoothById` is now event-specific via EventDataContext
  const { scans, deleteScan, getBoothById, getBoothName, sessions, loadingData, dataError, fetchData } = useEventData();
  const { selectedEventId: contextSelectedEventId, currentEvent } = useSelectedEvent();
  const { isFeatureEnabled } = useFeatureFlags();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingScan, setEditingScan] = useState<ScanRecord | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const getSessionNameById = (sessionId: string | null): string => {
    if (!sessionId) return "Out of Schedule";
    if (loadingData || !sessions) return t(localeKeys.loading);
    const session = sessions.find(s => s.id === sessionId);
    return session?.name || sessionId;
  };

  const filteredScans = useMemo(() => {
    if (loadingData || !scans || !sessions || !contextSelectedEventId) return [];

    return scans // Scans are already filtered by event in EventDataContext
      .map(scan => {
        const booth = getBoothById(scan.boothId ?? '');
        return {
          ...scan,
          currentBoothPhysicalId: booth?.physicalId,
          sessionDisplayName: getSessionNameById(scan.sessionId ?? null),
          resolvedAttendeeName: scan.attendeeName
        };
      })
      .filter(scan => {
        const term = searchTerm.toLowerCase();
        return (
          (scan.resolvedAttendeeName || '').toLowerCase().includes(term) ||
          (scan.boothName || '').toLowerCase().includes(term) ||
          (scan.currentBoothPhysicalId || '').toLowerCase().includes(term) ||
          (getBoothName(scan.boothId ?? '') || '').toLowerCase().includes(term) ||
          (scan.notes || '').toLowerCase().includes(term) ||
          scan.id.toLowerCase().includes(term) ||
          scan.scanType.toLowerCase().includes(term) ||
          scan.sessionDisplayName.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [scans, searchTerm, getBoothById, getBoothName, sessions, loadingData, contextSelectedEventId]);

  const handleDelete = async (scanId: string) => {
    if (!contextSelectedEventId) {
      setFeedback({ type: 'error', message: 'No event selected. Cannot delete scan.' });
      return;
    }
    if (window.confirm('Are you sure you want to delete this scan record? This action cannot be undone.')) {
      setIsSubmitting(true);
      const result = await deleteScan(scanId); // deleteScan in context is now event-aware
      setIsSubmitting(false);
      setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
    }
  };

  const handleEdit = (scan: ScanRecord) => {
    setEditingScan(scan);
    toast(`Editing scan ID: ${scan.id}. Full edit functionality is a future enhancement.`, {
      duration: 4000
    });
  };

  const exportToCSV = () => {
    if (filteredScans.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const headers = ["Scan ID", "Attendee ID", "Attendee Name", "Booth ID (Config)", "Company Name (at scan)", "Physical ID (current)", "Session", "Scan Type", "Timestamp", "Notes"];
    const csvRows = [
      headers.join(','),
      ...filteredScans.map(scan => {
        const booth = getBoothById(scan.boothId ?? '');
        return [
          scan.id, scan.attendeeId, `"${(scan.resolvedAttendeeName || '').replace(/"/g, '""')}"`,
          scan.boothId, `"${(scan.boothName || getBoothName(scan.boothId ?? '') || '').replace(/"/g, '""')}"`,
          `"${(booth?.physicalId || 'N/A').replace(/"/g, '""')}"`,
          `"${scan.sessionDisplayName.replace(/"/g, '""')}"`, scan.scanType,
          `"${new Date(scan.timestamp).toLocaleString()}"`, `"${(scan.notes || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `lyventum_scans_export_${currentEvent?.name.replace(/\s+/g, '_') || 'current_event'}.csv`);
      link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast.success("Data exported to CSV successfully.");
    } else {
      toast.error("Export not supported by your browser.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 font-montserrat">{t(localeKeys.dataEditorTitle)} {currentEvent ? `for ${currentEvent.name}` : ''}</h1>

      {!contextSelectedEventId && !loadingData && (
        <Alert type="warning" message={t(localeKeys.noEventSelected)} />
      )}
      {feedback && <Alert type={feedback.type} message={feedback.message} className="my-4" />}

      <Card className="shadow-md" bodyClassName="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-100 mb-3 font-montserrat">{t(localeKeys.actionsHeader)}</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast('Batch delete is not yet implemented.')} className="bg-accent-600 hover:bg-accent-700 text-white m-2" disabled={isSubmitting || loadingData || !!dataError || !contextSelectedEventId}>
              {t(localeKeys.deleteSelected)}
            </Button>
            {isFeatureEnabled(Feature.REPORTS) && (
              <Button onClick={exportToCSV} className="bg-secondary-600 hover:bg-secondary-700 text-white m-2" leftIcon={<DocumentArrowDownIcon className="w-5 h-5" />}
                disabled={isSubmitting || loadingData || !!dataError || filteredScans.length === 0 || !contextSelectedEventId}>
                {t(localeKeys.exportFiltered)}
              </Button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-100 mb-3 font-montserrat" id="scan-records-heading">{t(localeKeys.scanRecords)}</h2>
          <label htmlFor="search-scan-records" className="sr-only">{t(localeKeys.searchScans)}</label>
          <Input
            id="search-scan-records" wrapperClassName="flex-grow w-full sm:w-auto mb-4"
            placeholder={t(localeKeys.searchScans)}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="border-inputBorder rounded-md p-2.5" aria-controls="scan-records-table"
            disabled={loadingData || !!dataError || !contextSelectedEventId}
          />
          {editingScan && (<Alert type="info" message={`Editing scan: ${editingScan.id}. (Full edit form is future enhancement)`} className="mb-4" />)}

          {loadingData && contextSelectedEventId && (
            <div className="text-center py-5">
              <svg className="animate-spin h-6 w-6 text-brandBlue mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500 dark:text-slate-300 font-sans">Loading scan records for {currentEvent?.name || 'current event'}...</p>
            </div>
          )}
          {!loadingData && dataError && contextSelectedEventId && (
            <Alert type="error" message={<>Failed to load scan records: {dataError}.
              <Button onClick={() => fetchData()} variant="link" size="sm" className="p-0 ml-2">Try Again</Button></>} className="my-4" />
          )}


          {!loadingData && !dataError && contextSelectedEventId && (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow">
                <table id="scan-records-table" className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" aria-labelledby="scan-records-heading">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider font-montserrat">Attendee</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider font-montserrat">Booth (Company @ Location)</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider font-montserrat">Session</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider font-montserrat">Scan Type</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider font-montserrat">Time</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider font-montserrat">Notes</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider font-montserrat">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 font-sans">
                    {filteredScans.length > 0 ? filteredScans.map(scan => (
                      <tr key={scan.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100 break-words">{scan.resolvedAttendeeName || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-200 break-words">
                          {scan.boothName || getBoothName(scan.boothId ?? '') || 'N/A'}
                          {scan.currentBoothPhysicalId && ` (@${scan.currentBoothPhysicalId})`}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300 break-words">{scan.sessionDisplayName}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${scan.scanType === 'regular' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {scan.scanType === 'regular' ? 'Regular' : 'Out of Schedule'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300">{new Date(scan.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 break-words" title={scan.notes}>{scan.notes || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                          <Button onClick={() => handleEdit(scan)} variant="link" size="sm" className="text-amber-500 hover:text-amber-600 p-1" aria-label={`Edit scan ${scan.id}`} disabled={isSubmitting}> <PencilSquareIcon className="w-4 h-4" /> </Button>
                          <Button onClick={() => handleDelete(scan.id)} variant="link" size="sm" className="text-accent-600 hover:text-red-700 p-1" aria-label={`Delete scan ${scan.id}`} disabled={isSubmitting}> <TrashIcon className="w-4 h-4" /> </Button>
                        </td>
                      </tr>
                    )) : (<tr><td colSpan={7} className="px-6 py-4 text-center text-sm text-slate-500 dark:text-slate-300"> No scan records found{searchTerm ? ' matching your search' : ''} for "{currentEvent?.name || 'this event'}". </td></tr>)}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredScans.length > 0 ? filteredScans.map(scan => (
                  <div key={scan.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{scan.resolvedAttendeeName || 'N/A'}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {scan.boothName || getBoothName(scan.boothId ?? '') || 'N/A'}
                          {scan.currentBoothPhysicalId && ` (@${scan.currentBoothPhysicalId})`}
                        </p>
                      </div>
                      <div className="flex-shrink-0 space-x-0">
                        <Button onClick={() => handleEdit(scan)} variant="link" size="sm" className="text-amber-500 hover:text-amber-600 p-1" aria-label={`Edit scan ${scan.id}`} disabled={isSubmitting}> <PencilSquareIcon className="w-5 h-5" /> </Button>
                        <Button onClick={() => handleDelete(scan.id)} variant="link" size="sm" className="text-accent-600 hover:text-red-700 p-1" aria-label={`Delete scan ${scan.id}`} disabled={isSubmitting}> <TrashIcon className="w-5 h-5" /> </Button>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1 text-sm">
                      <p><strong className="font-medium text-slate-500 dark:text-slate-400">Session:</strong> <span className="text-slate-700 dark:text-slate-200">{scan.sessionDisplayName}</span></p>
                      <p><strong className="font-medium text-slate-500 dark:text-slate-400">Type:</strong> <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${scan.scanType === 'regular' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {scan.scanType === 'regular' ? 'Regular' : 'Out of Schedule'}
                      </span></p>
                      <p><strong className="font-medium text-slate-500 dark:text-slate-400">Time:</strong> <span className="text-slate-700 dark:text-slate-200">{new Date(scan.timestamp).toLocaleString()}</span></p>
                      {scan.notes && <p><strong className="font-medium text-slate-500 dark:text-slate-400">Notes:</strong> <span className="text-slate-700 dark:text-slate-200">{scan.notes}</span></p>}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-sm text-slate-500 dark:text-slate-300">No scan records found{searchTerm ? ' matching your search' : ''}.</div>
                )}
              </div>

              {filteredScans.length > 0 && <p className="mt-4 text-sm text-gray-500 dark:text-slate-400" aria-live="polite">Showing {filteredScans.length} of {scans.length} total records for this event.</p>}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DataEditorPage;