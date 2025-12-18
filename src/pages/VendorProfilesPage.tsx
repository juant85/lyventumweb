import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEventData } from '../contexts/EventDataContext';
import { useSelectedEvent } from '../contexts/SelectedEventContext';
import { Attendee } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { BuildingStorefrontIcon, UserIcon, DocumentDuplicateIcon, ExclamationTriangleIcon, CheckCircleIcon, DocumentArrowDownIcon, DocumentTextIcon, UserMinusIcon } from '../components/Icons';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import QRCodeLib from 'qrcode';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import { Feature } from '../features';
import { ProfileListView } from '../components/profiles/ProfileListView';

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


const VendorProfilesPage: React.FC = () => {
  const { attendees, mergeAttendees, markAttendeesAsNonVendors, loadingData: eventDataLoading, dataError: error } = useEventData();
  const { selectedEventId, currentEvent, loadingEvents } = useSelectedEvent();
  const { isFeatureEnabled } = useFeatureFlags();

  const [searchTerm, setSearchTerm] = useState('');
  const [reviewingGroup, setReviewingGroup] = useState<Attendee[] | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState<null | 'pdf' | 'csv'>(null);
  const [isMarking, setIsMarking] = useState(false);

  const duplicateGroups = useMemo(() => {
    if (!attendees || attendees.length < 2) return [];
    const vendorAttendees = attendees.filter(a => a.is_vendor);
    const groups = new Map<string, Attendee[]>();
    vendorAttendees.forEach(att => {
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
    const vendorAttendees = attendees.filter(attendee => attendee.is_vendor);
    if (!searchTerm) return vendorAttendees;
    const lowercasedFilter = searchTerm.toLowerCase();
    return vendorAttendees.filter(attendee =>
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

  const handleMarkAsAttendees = async () => {
    if (selectedAttendees.size === 0) {
      toast.error("No vendors selected.");
      return;
    }

    setIsMarking(true);
    const toastId = toast.loading(`Reverting ${selectedAttendees.size} profile(s) to regular attendees...`);
    const result = await markAttendeesAsNonVendors(Array.from(selectedAttendees));

    if (result.success) {
      toast.success(result.message, { id: toastId });
      setSelectedAttendees(new Set());
    } else {
      toast.error(`Failed to update profiles: ${result.message}`, { id: toastId });
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

  const renderContent = () => {
    if (eventDataLoading || loadingEvents) {
      return <div className="text-center py-10"><p className="text-lg font-montserrat">Loading Vendor Staff...</p></div>;
    }
    if (error) {
      return <Alert type="error" message={`Error loading profiles: ${error}`} />;
    }
    if (!selectedEventId) {
      return <Alert type="info" message="Please select an event to view vendor staff." />;
    }
    if (attendees.filter(a => a.is_vendor).length === 0) {
      return <Alert type="info" message={`No vendor staff found for "${currentEvent?.name}". Mark attendees as vendors or use Master Import to add them.`} />;
    }
    if (filteredAttendees.length === 0) {
      return <Alert type="info" message="No vendors match your search criteria." />;
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
                aria-label="Select all visible vendors"
              />
              <label htmlFor="select-all" className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-200">Select All Visible ({filteredAttendees.length})</label>
            </div>
            <div className="flex-grow flex items-center justify-end gap-2">
              <Button
                onClick={handleMarkAsAttendees}
                disabled={isMarking || selectedAttendees.size === 0}
                leftIcon={<UserMinusIcon className="w-4 h-4" />}
                size="sm"
                variant="neutral"
                className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700 dark:hover:bg-red-900"
              >
                {isMarking ? 'Updating...' : `Mark as Attendee (${selectedAttendees.size})`}
              </Button>
            </div>
          </div>
        )}
        <ProfileListView
          attendees={filteredAttendees}
          selectedIds={selectedAttendees}
          onSelect={handleSelectAttendee}
          onSelectAll={handleSelectAll}
          isVendorView={true}
        />
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center font-montserrat">
          <BuildingStorefrontIcon className="w-8 h-8 mr-3 text-brandBlue" /> Vendor Staff Profiles
        </h1>

        {duplicateGroups.length > 0 && (
          <Card title="Duplicate Vendor Records Found" className="border-amber-400 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-500/50">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-10 h-10 text-amber-500 mr-4 flex-shrink-0" />
              <div>
                <p className="text-amber-800 dark:text-amber-200 font-semibold">
                  {duplicateGroups.length} potential duplicate vendor profile(s) detected.
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Reviewing these is recommended to ensure data accuracy.</p>
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
              label="Search Vendor Staff"
              placeholder="Search by name, email, or organization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={eventDataLoading || !!error || !selectedEventId || attendees.length === 0}
              wrapperClassName="!mb-0 flex-grow"
            />
          </div>
          {renderContent()}
        </Card>
      </div>
    </>
  );
};

export default VendorProfilesPage;