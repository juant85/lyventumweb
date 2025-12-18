// src/pages/CheckInDeskPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventData } from '../contexts/EventDataContext';
import { useSelectedEvent } from '../contexts/SelectedEventContext';
import { Attendee, AppRoute } from '../types';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { ClipboardDocumentCheckIcon, UserIcon, ArrowPathIcon, DocumentTextIcon, PlusCircleIcon, CameraIcon } from '../components/Icons';
import { toast } from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import AttendeeBadge from '../components/AttendeeBadge';
import Checkbox from '../components/ui/Checkbox';
import CameraModal from '../components/CameraModal';
import { supabase } from '../supabaseClient';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import { Feature } from '../features';

const AttendeeRow: React.FC<{
  attendee: Attendee;
  onCheckIn: (id: string, name: string) => void;
  onUndoCheckIn: (id: string, name: string) => void;
  onOpenProfile: (attendee: Attendee) => void;
  onOpenDetails: (attendee: Attendee) => void;
  onTakePhoto: (attendee: Attendee) => void;
  isProcessing: boolean;
}> = ({ attendee, onCheckIn, onUndoCheckIn, onOpenProfile, onOpenDetails, onTakePhoto, isProcessing }) => {
  const isCheckedIn = !!attendee.checkInTime;
  const { isFeatureEnabled } = useFeatureFlags();
  const canTakePhoto = isFeatureEnabled(Feature.CHECK_IN_PHOTO);

  return (
    <div className={`p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 mb-3 border shadow-sm hover:shadow-md hover:scale-[1.005] ${isCheckedIn
        ? 'bg-green-50/50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50'
        : 'bg-white border-slate-200 hover:border-brandBlue/50 hover:bg-blue-50/50 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-brandBlue/50 dark:hover:bg-blue-900/10'
      }`}>
      <div className="flex items-center min-w-0 flex-grow w-full">
        {attendee.avatar_url ? (
          <img src={attendee.avatar_url} alt={attendee.name} className="w-12 h-12 rounded-full mr-4 flex-shrink-0 object-cover border-2 border-white shadow-sm" />
        ) : (
          <UserIcon className={`w-12 h-12 p-2 rounded-full mr-4 flex-shrink-0 ${isCheckedIn ? 'bg-green-100 text-green-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`} />
        )}
        <div className="min-w-0 flex-grow">
          <button onClick={() => onOpenProfile(attendee)} className="text-left hover:underline focus:outline-none focus:ring-1 focus:ring-primary-500 rounded-sm px-1 -ml-1">
            <p className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate" title={attendee.name}>{attendee.name}</p>
          </button>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate" title={attendee.organization}>{attendee.organization || 'No organization'}</p>
            {attendee.is_vendor && (
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full dark:bg-purple-900 dark:text-purple-300 uppercase tracking-wide">VENDOR</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center flex-shrink-0 w-full sm:w-auto justify-end pl-12 sm:pl-0 gap-2">
        <button
          onClick={() => onOpenDetails(attendee)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors border ${attendee.notes
              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
            }`}
          disabled={isProcessing}
        >
          <DocumentTextIcon className={`w-4 h-4 ${attendee.notes ? 'text-amber-500' : 'text-slate-400'}`} />
          <span>{attendee.notes ? 'Edit Notes' : 'Notes'}</span>
        </button>
        {canTakePhoto && (
          <button
            onClick={() => onTakePhoto(attendee)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors border ${attendee.avatar_url
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
              }`}
            disabled={isProcessing}
          >
            <CameraIcon className={`w-4 h-4 ${attendee.avatar_url ? 'text-blue-500' : 'text-slate-400'}`} />
            <span>{attendee.avatar_url ? 'Retake' : 'Photo'}</span>
          </button>
        )}
        {isCheckedIn ? (
          <div className="text-right w-28">
            <p className="text-xs font-bold text-green-600 dark:text-green-400">CHECKED-IN</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(attendee.checkInTime!).toLocaleTimeString()}</p>
            <Button size="sm" variant="link" onClick={() => onUndoCheckIn(attendee.id, attendee.name)} disabled={isProcessing}>
              Undo
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="primary" onClick={() => onCheckIn(attendee.id, attendee.name)} disabled={isProcessing} className="w-28 ml-2">
            Check In
          </Button>
        )}
      </div>
    </div>
  );
};


const CheckInDeskPage: React.FC = () => {
  const { attendees, checkInAttendee, undoCheckIn, updateAttendee, addWalkInAttendee, loadingData: loading, dataError: error } = useEventData();
  const { selectedEventId, currentEvent } = useSelectedEvent();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [selectedProfile, setSelectedProfile] = useState<Attendee | null>(null);
  const [selectedAttendeeForEdit, setSelectedAttendeeForEdit] = useState<Attendee | null>(null);
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentPreferences, setCurrentPreferences] = useState({ last_day_lunch: false, is_veggie: false, has_tour: false });
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAttendeeData, setNewAttendeeData] = useState({ name: '', organization: '', email: '', phone: '', notes: '', last_day_lunch: false, is_veggie: false, has_tour: false });
  const [isAdding, setIsAdding] = useState(false);

  const [photographingAttendee, setPhotographingAttendee] = useState<Attendee | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const filteredAttendees = useMemo(() => {
    if (!searchTerm) return attendees;
    const lowercasedFilter = searchTerm.toLowerCase();
    return attendees.filter(attendee =>
      attendee.name.toLowerCase().includes(lowercasedFilter) ||
      (attendee.organization || '').toLowerCase().includes(lowercasedFilter) ||
      attendee.id.toLowerCase().includes(lowercasedFilter)
    );
  }, [attendees, searchTerm]);

  const handleCheckIn = async (id: string, name: string) => {
    setProcessingId(id);
    const result = await checkInAttendee(id);
    if (result.success) {
      toast.success(`${name} checked in successfully!`);
    } else {
      toast.error(`Failed to check in ${name}: ${result.message}`);
    }
    setProcessingId(null);
  };

  const handleUndoCheckIn = async (id: string, name: string) => {
    setProcessingId(id);
    const result = await undoCheckIn(id);
    if (result.success) {
      toast.success(`Check-in for ${name} has been undone.`);
    } else {
      toast.error(`Failed to undo check-in for ${name}: ${result.message}`);
    }
    setProcessingId(null);
  };

  const handleOpenProfileModal = (attendee: Attendee) => setSelectedProfile(attendee);
  const handleOpenDetailsModal = (attendee: Attendee) => {
    setSelectedAttendeeForEdit(attendee);
    setCurrentNotes(attendee.notes || '');
    setCurrentPreferences({
      last_day_lunch: !!attendee.last_day_lunch,
      is_veggie: !!attendee.is_veggie,
      has_tour: !!attendee.has_tour
    });
  };

  const handleOpenAddModal = () => {
    setNewAttendeeData({
      name: '',
      organization: '',
      email: '',
      phone: '',
      notes: '',
      last_day_lunch: false,
      is_veggie: false,
      has_tour: false
    });
    setIsAddModalOpen(true);
  };

  const handleCloseModals = () => {
    setSelectedProfile(null);
    setSelectedAttendeeForEdit(null);
    setIsAddModalOpen(false);
    setPhotographingAttendee(null);
  };

  const handleSaveDetails = async () => {
    if (!selectedAttendeeForEdit) return;
    setIsSavingDetails(true);
    const result = await updateAttendee(selectedAttendeeForEdit.id, {
      notes: currentNotes,
      last_day_lunch: currentPreferences.last_day_lunch,
      is_veggie: currentPreferences.is_veggie,
      has_tour: currentPreferences.has_tour,
    });
    if (result.success) {
      toast.success(`Details for ${selectedAttendeeForEdit.name} saved.`);
      handleCloseModals();
    } else {
      toast.error(`Failed to save details: ${result.message}`);
    }
    setIsSavingDetails(false);
  };

  const handleAddNewAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendeeData.name.trim() || !newAttendeeData.organization.trim() || !newAttendeeData.email.trim()) {
      toast.error("Name, Organization, and Email are required.");
      return;
    }
    setIsAdding(true);

    const addResult = await addWalkInAttendee(newAttendeeData);
    if (addResult.success && addResult.newAttendee) {
      const newAttendee = addResult.newAttendee;
      const checkInResult = await checkInAttendee(newAttendee.id);

      if (checkInResult.success) {
        toast.success(`Successfully added and checked in ${newAttendee.name}!`);
        setIsAddModalOpen(false);
      } else {
        toast.error(`Attendee was added but check-in failed: ${checkInResult.message}`);
      }
    } else {
      toast.error(`Failed to add attendee: ${addResult.message}`);
    }
    setIsAdding(false);
  };

  const handleTakePhoto = (attendee: Attendee) => {
    setPhotographingAttendee(attendee);
  };

  const handleSavePhoto = async (imageBlob: Blob) => {
    if (!photographingAttendee) return;

    setIsSavingPhoto(true);
    const toastId = toast.loading(`Uploading photo for ${photographingAttendee.name}...`);

    try {
      const filePath = `public/${photographingAttendee.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('attendee-avatars')
        .upload(filePath, imageBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw new Error(`Storage error: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('attendee-avatars')
        .getPublicUrl(filePath);

      const result = await updateAttendee(photographingAttendee.id, { avatar_url: publicUrl });

      if (result.success) {
        toast.success('Photo saved and profile updated!', { id: toastId });
        handleCloseModals();
      } else {
        throw new Error(result.message);
      }

    } catch (err: any) {
      toast.error(`Failed to save photo: ${err.message}`, { id: toastId });
    } finally {
      setIsSavingPhoto(false);
    }
  };


  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-10">
          <ArrowPathIcon className="w-8 h-8 mx-auto text-primary-500 animate-spin" />
          <p className="mt-2 text-slate-500">Loading attendees for {currentEvent?.name}...</p>
        </div>
      );
    }
    if (error) {
      return <Alert type="error" message={`Error loading attendees: ${error}`} />;
    }
    if (!selectedEventId) {
      return <Alert type="warning" message="Please select an event to use the Check-in Desk." />;
    }
    if (attendees.length === 0) {
      return <Alert type="info" message={`No attendees found for "${currentEvent?.name}". Use Master Import or CSV Import to add attendees.`} />;
    }

    return (
      <div className="space-y-3">
        {filteredAttendees.length === 0 && (
          <Alert type="info" message="No attendees match your search." />
        )}
        {filteredAttendees.map(attendee => (
          <AttendeeRow
            key={attendee.id}
            attendee={attendee}
            onCheckIn={handleCheckIn}
            onUndoCheckIn={handleUndoCheckIn}
            onOpenProfile={handleOpenProfileModal}
            onOpenDetails={handleOpenDetailsModal}
            onTakePhoto={handleTakePhoto}
            isProcessing={processingId === attendee.id}
          />
        ))}
      </div>
    );
  };

  const checkedInCount = useMemo(() => attendees.filter(a => !!a.checkInTime).length, [attendees]);

  return (
    <>
      {/* Profile Quick View Modal */}
      <Modal isOpen={!!selectedProfile} onClose={handleCloseModals} title="Profile Quick View" size="sm">
        {selectedProfile && (
          <div className="space-y-4">
            <AttendeeBadge attendee={selectedProfile} />
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                navigate(AppRoute.AttendeeProfileDetail.replace(':attendeeId', selectedProfile.id));
                handleCloseModals();
              }}
            >
              Go to Full Profile
            </Button>
          </div>
        )}
      </Modal>

      {/* Edit Details Modal */}
      <Modal isOpen={!!selectedAttendeeForEdit} onClose={handleCloseModals} title={`Edit Details for ${selectedAttendeeForEdit?.name}`} size="lg">
        {selectedAttendeeForEdit && (
          <div className="space-y-4">
            <div>
              <label htmlFor="attendee-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat">Notes</label>
              <textarea
                id="attendee-notes"
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition duration-150 ease-in-out sm:text-sm font-sans dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-400"
                placeholder="Add notes here..."
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat">Preferences</label>
              <div className="p-4 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                <Checkbox label="Attending Last Day Lunch" checked={currentPreferences.last_day_lunch} onChange={(e) => setCurrentPreferences(p => ({ ...p, last_day_lunch: e.target.checked }))} disabled={isSavingDetails} />
                <Checkbox label="Vegetarian Meal Preference" checked={currentPreferences.is_veggie} onChange={(e) => setCurrentPreferences(p => ({ ...p, is_veggie: e.target.checked }))} disabled={isSavingDetails} />
                <Checkbox label="Participating in City Tour" checked={currentPreferences.has_tour} onChange={(e) => setCurrentPreferences(p => ({ ...p, has_tour: e.target.checked }))} disabled={isSavingDetails} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="neutral" onClick={handleCloseModals} disabled={isSavingDetails}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveDetails} disabled={isSavingDetails}>
                {isSavingDetails ? 'Saving...' : 'Save Details'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Attendee Modal */}
      <Modal isOpen={isAddModalOpen} onClose={handleCloseModals} title="Add Walk-in Attendee" size="md">
        <form onSubmit={handleAddNewAttendee} className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">A unique ID will be automatically generated by the system.</p>
          <Input
            label="Full Name (Required)"
            value={newAttendeeData.name}
            onChange={(e) => setNewAttendeeData(p => ({ ...p, name: e.target.value }))}
            required
            disabled={isAdding}
            autoFocus
          />
          <Input
            label="Organization (Required)"
            value={newAttendeeData.organization}
            onChange={(e) => setNewAttendeeData(p => ({ ...p, organization: e.target.value }))}
            required
            disabled={isAdding}
          />
          <Input
            label="Email (Required)"
            type="email"
            value={newAttendeeData.email}
            onChange={(e) => setNewAttendeeData(p => ({ ...p, email: e.target.value }))}
            required
            disabled={isAdding}
          />
          <Input
            label="Phone"
            value={newAttendeeData.phone}
            onChange={(e) => setNewAttendeeData(p => ({ ...p, phone: e.target.value }))}
            disabled={isAdding}
          />
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat">Preferences</label>
            <div className="p-4 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-3">
              <Checkbox name="last_day_lunch" label="Attending Last Day Lunch" checked={newAttendeeData.last_day_lunch} onChange={e => setNewAttendeeData(p => ({ ...p, last_day_lunch: e.target.checked }))} disabled={isAdding} />
              <Checkbox name="is_veggie" label="Vegetarian Meal Preference" checked={newAttendeeData.is_veggie} onChange={e => setNewAttendeeData(p => ({ ...p, is_veggie: e.target.checked }))} disabled={isAdding} />
              <Checkbox name="has_tour" label="Participating in City Tour" checked={newAttendeeData.has_tour} onChange={e => setNewAttendeeData(p => ({ ...p, has_tour: e.target.checked }))} disabled={isAdding} />
            </div>
          </div>
          <div>
            <label htmlFor="walkin-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat">Notes</label>
            <textarea
              id="walkin-notes"
              value={newAttendeeData.notes}
              onChange={(e) => setNewAttendeeData(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition duration-150 ease-in-out sm:text-sm font-sans disabled:bg-slate-50 dark:bg-slate-900"
              placeholder="Optional notes..."
              disabled={isAdding}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="neutral" onClick={handleCloseModals} disabled={isAdding}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Save & Check In'}
            </Button>
          </div>
        </form>
      </Modal>

      <CameraModal
        isOpen={!!photographingAttendee}
        onClose={handleCloseModals}
        onCapture={handleSavePhoto}
        isSaving={isSavingPhoto}
      />

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center font-montserrat">
          <ClipboardDocumentCheckIcon className="w-8 h-8 mr-3 text-primary-600" />
          Event Check-in Desk
        </h1>

        <Card>
          <div className="md:flex justify-between items-center gap-4 mb-4 border-b border-slate-200 dark:border-slate-700 pb-4">
            <Input
              id="attendee-search"
              placeholder="Search by name, organization, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading || !!error || !selectedEventId || attendees.length === 0}
              wrapperClassName="!mb-0 flex-grow"
            />
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Button
                onClick={handleOpenAddModal}
                variant="neutral"
                size="md"
                leftIcon={<PlusCircleIcon className="w-5 h-5" />}
                disabled={!selectedEventId}
                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                Add New Attendee
              </Button>
              <div className="text-center md:text-right bg-slate-100 dark:bg-slate-700 p-3 rounded-lg">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">ATTENDANCE</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {checkedInCount} / {attendees.length}
                </p>
              </div>
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {renderContent()}
          </div>
        </Card>
      </div>
    </>
  );
};

export default CheckInDeskPage;
