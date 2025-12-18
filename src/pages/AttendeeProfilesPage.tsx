import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEventData } from '../contexts/EventDataContext';
import { useSelectedEvent } from '../contexts/SelectedEventContext';
import { Attendee, AppRoute } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { UsersGroupIcon, UserIcon, DocumentDuplicateIcon, ExclamationTriangleIcon, CheckCircleIcon, DocumentArrowDownIcon, DocumentTextIcon, UserPlusIcon } from '../components/Icons';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import QRCodeLib from 'qrcode';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import { Feature } from '../features';

const DuplicateReviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  duplicates: Attendee[];
  onMerge: (primaryId: string, duplicateIds: string[]) => Promise<void>;
}> = ({ isOpen, onClose, duplicates, onMerge }) => {
  const [primaryId, setPrimaryId] = useState<string>('');
  const [isMerging, setIsMerging] = useState(false);

  React.useEffect(() => {
    if (duplicates.length > 0) {
      setPrimaryId(duplicates[0].id);
    }
  }, [duplicates]);

  const handleMerge = async () => {
    if (!primaryId) {
      toast.error('You must select a primary record.');
      return;
    }
    setIsMerging(true);
    const duplicateIds = duplicates.map(d => d.id).filter(id => id !== primaryId);
    await onMerge(primaryId, duplicateIds);
    setIsMerging(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review and Merge Duplicates" size="xl">
      <div className="space-y-4">
        <Alert type="warning" message="Select one record as the 'Primary'. All data from other records will be merged into it, and the others will be deleted." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {duplicates.map(attendee => (
            <div key={attendee.id} className={`p-3 rounded-lg border-2 transition-all ${primaryId === attendee.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/40' : 'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700'}`}>
              <label className="flex items-center font-bold text-lg cursor-pointer text-slate-800 dark:text-slate-100">
                <input
                  type="radio"
                  name="primary-attendee"
                  checked={primaryId === attendee.id}
                  onChange={() => setPrimaryId(attendee.id)}
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-slate-400 mr-3"
                />
                {primaryId === attendee.id && <CheckCircleIcon className="w-5 h-5 text-primary-600 mr-2" />}
                Profile
              </label>
              <div className="mt-2 pl-4 border-l-2 border-slate-200 dark:border-slate-600 ml-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <p><strong>Name:</strong> {attendee.name}</p>
                <p><strong>Org:</strong> {attendee.organization || 'N/A'}</p>
                <p><strong>Email:</strong> {attendee.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {attendee.phone || 'N/A'}</p>
                <p><strong>Notes:</strong> {attendee.notes || 'N/A'}</p>
                <p><strong>ID:</strong> <span className="text-xs font-mono">{attendee.id}</span></p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={handleMerge} disabled={isMerging} variant="primary">
            {isMerging ? 'Merging...' : `Merge ${duplicates.length - 1} into 1`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};


const AttendeeProfilesPage: React.FC = () => {
  const { attendees, mergeAttendees, scans, sessions, getBoothName, markAttendeesAsVendors, loadingData: eventDataLoading, dataError: error } = useEventData();
  const { selectedEventId, currentEvent, loadingEvents } = useSelectedEvent();
  const { isFeatureEnabled } = useFeatureFlags();

  const [searchTerm, setSearchTerm] = useState('');
  const [reviewingGroup, setReviewingGroup] = useState<Attendee[] | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState<null | 'pdf' | 'csv'>(null);
  const [isMarking, setIsMarking] = useState(false);

  const duplicateGroups = useMemo(() => {
    if (!attendees || attendees.length < 2) return [];
    const regularAttendees = attendees.filter(a => !a.is_vendor);
    const groups = new Map<string, Attendee[]>();
    regularAttendees.forEach(att => {
      if (att.email?.trim()) {
        const key = `email:${att.email.toLowerCase().trim()}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(att);
      }
      if (att.name?.trim() && att.organization?.trim()) {
        const key = `nameorg:${att.name.toLowerCase().trim()}|${att.organization.toLowerCase().trim()}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(att);
      }
    });
    return Array.from(groups.values()).filter(group => group.length > 1);
  }, [attendees]);

  const filteredAttendees = useMemo(() => {
    const regularAttendees = attendees.filter(attendee => !attendee.is_vendor);
    if (!searchTerm) return regularAttendees;
    const lowercasedFilter = searchTerm.toLowerCase();
    return regularAttendees.filter(attendee =>
      attendee.name.toLowerCase().includes(lowercasedFilter) ||
      (attendee.email || '').toLowerCase().includes(lowercasedFilter) ||
      (attendee.organization || '').toLowerCase().includes(lowercasedFilter) ||
      (attendee.position || '').toLowerCase().includes(lowercasedFilter) ||
      attendee.id.toLowerCase().includes(lowercasedFilter)
    );
  }, [attendees, searchTerm]);

  const handleMerge = async (primaryId: string, duplicateIds: string[]) => {
    const toastId = toast.loading('Merging profiles...');
    const result = await mergeAttendees(primaryId, duplicateIds);
    if (result.success) {
      toast.success('Merge successful!', { id: toastId });
    } else {
      toast.error(`Merge failed: ${result.message}`, { id: toastId });
    }
  };

  const handleMarkAsVendors = async () => {
    if (selectedAttendees.size === 0) {
      toast.error("No attendees selected.");
      return;
    }

    setIsMarking(true);
    const toastId = toast.loading(`Marking ${selectedAttendees.size} attendee(s) as vendors...`);
    const result = await markAttendeesAsVendors(Array.from(selectedAttendees));

    if (result.success) {
      toast.success(result.message, { id: toastId });
      setSelectedAttendees(new Set());
    } else {
      toast.error(`Failed to mark vendors: ${result.message}`, { id: toastId });
    }
    setIsMarking(false);
  };

  const handleSelectAttendee = (attendeeId: string, isSelected: boolean) => {
    setSelectedAttendees(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(attendeeId);
      } else {
        newSet.delete(attendeeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAttendees(new Set(filteredAttendees.map(a => a.id)));
    } else {
      setSelectedAttendees(new Set());
    }
  };

  const handleGeneratePdf = async () => {
    if (selectedAttendees.size === 0) {
      toast.error('No attendees selected.');
      return;
    }
    setIsGenerating('pdf');
    const toastId = toast.loading(`Generating PDF for ${selectedAttendees.size} attendee(s)...`);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [3.5, 5.5]
      });
      doc.deletePage(1);

      const attendeesToPrint = attendees.filter(a => selectedAttendees.has(a.id));

      for (const attendee of attendeesToPrint) {
        doc.addPage();

        const pageWidth = doc.internal.pageSize.getWidth();

        const qrDataURL = await QRCodeLib.toDataURL(attendee.id, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 200
        });
        doc.addImage(qrDataURL, 'PNG', (pageWidth - 2) / 2, 0.5, 2, 2);

        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        const nameLines = doc.splitTextToSize(attendee.name, pageWidth - 1);
        doc.text(nameLines, pageWidth / 2, 3, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        const orgY = 3 + (nameLines.length * 0.35);
        const orgLines = doc.splitTextToSize(attendee.organization || 'No Organization', pageWidth - 1);
        doc.text(orgLines, pageWidth / 2, orgY, { align: 'center' });
      }

      doc.save(`LyVenTum_Badges_${currentEvent?.name.replace(/\s/g, '_') || 'Event'}.pdf`);
      toast.success('PDF generated successfully!', { id: toastId });

    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Could not generate PDF.', { id: toastId });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleExportActivity = () => {
    setIsGenerating('csv');
    const toastId = toast.loading('Preparing activity data for export...');

    try {
      const headers = ["ID", "Name", "Email", "Organization", "Position", "Phone", "Notes", "CheckedInAt", "VisitedBooths", "AttendedSessions", "LastDayLunch", "Vegetarian", "Tour"];
      const rows = attendees.map(attendee => {
        const attendeeScans = scans.filter(s => s.attendeeId === attendee.id);

        const visitedBoothIds = new Set(attendeeScans.map(s => s.boothId).filter((id): id is string => id !== null));
        const attendedSessionIds = new Set(attendeeScans.map(s => s.sessionId).filter(Boolean) as string[]);

        const visitedBooths = Array.from(visitedBoothIds).map(id => getBoothName(id) || `ID:${id}`).join(', ');
        const attendedSessions = Array.from(attendedSessionIds).map(id => sessions.find(s => s.id === id)?.name || `ID:${id}`).join(', ');

        const escapeCsv = (val: string | undefined | null) => val ? `"${String(val).replace(/"/g, '""')}"` : '';
        const boolToYesNo = (val: boolean | undefined | null): "Yes" | "No" => val ? "Yes" : "No";

        return [
          escapeCsv(attendee.id),
          escapeCsv(attendee.name),
          escapeCsv(attendee.email),
          escapeCsv(attendee.organization),
          escapeCsv(attendee.position),
          escapeCsv(attendee.phone),
          escapeCsv(attendee.notes),
          escapeCsv(attendee.checkInTime ? new Date(attendee.checkInTime).toLocaleString() : 'N/A'),
          escapeCsv(visitedBooths),
          escapeCsv(attendedSessions),
          boolToYesNo(attendee.last_day_lunch),
          boolToYesNo(attendee.is_veggie),
          boolToYesNo(attendee.has_tour),
        ].join(',');
      });

      const csvString = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `LyVenTum_AttendeeActivity_${currentEvent?.name.replace(/\s/g, '_') || 'Event'}.csv`);
        link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
        toast.success("Activity data exported successfully!", { id: toastId });
      } else {
        toast.error("CSV export not supported by your browser.", { id: toastId });
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("An error occurred during CSV export.", { id: toastId });
    } finally {
      setIsGenerating(null);
    }
  };


  const renderContent = () => {
    if (eventDataLoading || loadingEvents) {
      return <div className="text-center py-10"><p className="text-lg font-montserrat">Loading Attendees...</p></div>;
    }
    if (error) {
      return <Alert type="error" message={`Error loading attendees: ${error}`} />;
    }
    if (!selectedEventId) {
      return <Alert type="info" message="Please select an event to view attendee profiles." />;
    }
    if (attendees.length === 0) {
      return <Alert type="info" message={`No attendees found for the event: "${currentEvent?.name}". Go to Attendee Registration or Master Import to add attendees.`} />;
    }
    if (filteredAttendees.length === 0 && attendees.length > 0) {
      return <Alert type="info" message="No attendees match your search criteria." />;
    }
    return (
      <>
        {filteredAttendees.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="select-all"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                onChange={handleSelectAll}
                checked={filteredAttendees.length > 0 && selectedAttendees.size === filteredAttendees.length}
                aria-label="Select all visible attendees"
              />
              <label htmlFor="select-all" className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-200">Select All Visible ({filteredAttendees.length})</label>
            </div>
            <div className="flex-grow flex items-center justify-end gap-2">
              <Button
                onClick={handleMarkAsVendors}
                disabled={isMarking || selectedAttendees.size === 0}
                leftIcon={<UserPlusIcon className="w-4 h-4" />}
                size="sm"
                variant="neutral"
                className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700 dark:hover:bg-purple-900"
              >
                {isMarking ? 'Marking...' : `Mark Selected as Vendors (${selectedAttendees.size})`}
              </Button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAttendees.map(attendee => (
            <div key={attendee.id} className="relative">
              <div className="absolute top-2 left-2 z-10 bg-white/50 dark:bg-slate-800/50 rounded-full">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded-md border-slate-400 text-primary-600 focus:ring-primary-500"
                  checked={selectedAttendees.has(attendee.id)}
                  onChange={(e) => handleSelectAttendee(attendee.id, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${attendee.name}`}
                />
              </div>
              {attendee.notes && (
                <div className="absolute bottom-2 right-2" title={attendee.notes}>
                  <DocumentTextIcon className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <Link
                to={`/attendee-profiles/${attendee.id}`}
                className="block bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border dark:border-slate-700 h-full"
                aria-label={`View profile for ${attendee.name}`}
              >
                <div className="flex items-center pt-4">
                  <UserIcon className="w-8 h-8 text-brandBlue mr-3 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-slate-100 font-montserrat truncate">{attendee.name}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-300 truncate" title={attendee.email}>{attendee.email || 'No email'}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate" title={attendee.organization}>{attendee.organization || 'No organization'}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <>
      <DuplicateReviewModal
        isOpen={!!reviewingGroup}
        onClose={() => setReviewingGroup(null)}
        duplicates={reviewingGroup || []}
        onMerge={handleMerge}
      />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center font-montserrat">
          <UsersGroupIcon className="w-8 h-8 mr-3 text-brandBlue" /> <span className="text-gradient">Attendee Profiles</span>
        </h1>

        {duplicateGroups.length > 0 && (
          <Card title="Duplicate Records Found" className="border-amber-400 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-500/50">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-10 h-10 text-amber-500 mr-4 flex-shrink-0" />
              <div>
                <p className="text-amber-800 dark:text-amber-200 font-semibold">
                  {duplicateGroups.length} potential duplicate group(s) detected based on matching emails or name/organization combinations.
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Reviewing and merging these records is recommended to ensure data accuracy.</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {duplicateGroups.map((group, index) => (
                <div key={index} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-800 dark:text-slate-200">
                    <DocumentDuplicateIcon className="w-4 h-4 inline-block mr-2 text-slate-500" />
                    <strong>{group.length} records:</strong> {group.map(g => g.name).join(', ')}
                  </div>
                  <Button size="sm" onClick={() => setReviewingGroup(group)}>Review</Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <div className="mb-4 md:flex justify-between items-center gap-4">
            <Input
              id="attendee-search"
              label="Search Attendees"
              placeholder="Search by name, email, organization, position, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={eventDataLoading || !!error || !selectedEventId || attendees.length === 0}
              wrapperClassName="!mb-0 flex-grow"
            />
            <div className="flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0">
              {isFeatureEnabled(Feature.REPORTS) && (
                <>
                  <Button
                    onClick={handleGeneratePdf}
                    disabled={!!isGenerating || selectedAttendees.size === 0}
                    leftIcon={<DocumentArrowDownIcon className="w-5 h-5" />}
                  >
                    {isGenerating === 'pdf' ? 'Generating...' : `Generate Badges (${selectedAttendees.size})`}
                  </Button>
                  <Button
                    onClick={handleExportActivity}
                    disabled={!!isGenerating || attendees.length === 0}
                    variant="secondary"
                    leftIcon={<DocumentArrowDownIcon className="w-5 h-5" />}
                    title="Export detailed activity for all attendees"
                  >
                    Export Activity
                  </Button>
                </>
              )}
            </div>
          </div>
          {renderContent()}
        </Card>
      </div>
    </>
  );
};

export default AttendeeProfilesPage;