import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventData } from '../../contexts/EventDataContext';
import { Attendee, SessionRegistration, AppRoute } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { UserCircleIcon, ArrowLeftIcon, ArrowPathIcon, TrashIcon, EyeIcon, CameraIcon, CogIcon, ClockIcon, MapIcon, EnvelopeIcon, CheckCircleIcon } from '../../components/Icons';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import Input from '../../components/ui/Input';
import { toast } from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../supabaseClient';
import Checkbox from '../../components/ui/Checkbox';
import { Database } from '../../database.types';
import AttendeePortalPreviewModal from '../../components/AttendeePortalPreviewModal';
import { Feature } from '../../features';
import FeatureGuard from '../../components/FeatureGuard';
import CameraModal from '../../components/CameraModal';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext';
import { AttendeeTracksEditor } from '../../features/tracks/components/AttendeeTracksEditor';
import JourneyTimeline from '../../components/journey/JourneyTimeline';
import { useAttendeeJourney } from '../../hooks/useAttendeeJourney';
import AttendeeSessionManager from '../../components/admin/AttendeeSessionManager';
import EmailHistoryCard from '../../components/admin/EmailHistoryCard';
import AccessControlCard from '../../components/admin/attendee/AccessControlCard';
import Tabs from '../../components/ui/Tabs';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileFAB } from '../../components/mobile';
import { haptics } from '../../utils/haptics';

type AttendeeAgendaItem = SessionRegistration & {
  sessionName: string;
  sessionStartTime: string;
  boothName?: string
};

export default function AttendeeProfileDetailPage() {
  const { attendeeId } = useParams<{ attendeeId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { getAttendeeById, updateAttendee, deleteAttendee, loadingData: eventDataLoading, getSessionRegistrationsForAttendee } = useEventData();
  const { selectedEventId } = useSelectedEvent();
  const { isFeatureEnabled } = useFeatureFlags();

  // Use journey hook for unified journey data
  const { events: journeyEvents, isLoading: isJourneyLoading } = useAttendeeJourney(attendeeId ?? '', selectedEventId ?? '');

  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [formData, setFormData] = useState<Partial<Attendee & { avatar_url?: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [isCheckInLoading, setIsCheckInLoading] = useState(true);

  const [agenda, setAgenda] = useState<AttendeeAgendaItem[]>([]);
  const [isAgendaLoading, setIsAgendaLoading] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [photographingAttendee, setPhotographingAttendee] = useState<Attendee | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const canTakePhoto = isFeatureEnabled(Feature.CHECK_IN_PHOTO);

  const [isDeletePhotoModalOpen, setIsDeletePhotoModalOpen] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const [isMeetingManagerOpen, setIsMeetingManagerOpen] = useState(false);


  useEffect(() => {
    if (!attendeeId) {
      setError('No Attendee ID provided in URL.');
      setLoading(false);
      return;
    }

    const loadAttendeeDetails = async () => {
      setLoading(true);
      setError(null);
      const attendeeData = await getAttendeeById(attendeeId);
      if (attendeeData) {
        setAttendee(attendeeData);
        setFormData({ ...attendeeData });
        setAvatarPreview(attendeeData.avatar_url || null);

        setIsAgendaLoading(true);
        const agendaResult = await getSessionRegistrationsForAttendee(attendeeId);
        if (agendaResult.success) {
          setAgenda(agendaResult.data as AttendeeAgendaItem[]);
        } else {
          toast.error(agendaResult.message || "Failed to load attendee's agenda.");
        }
        setIsAgendaLoading(false);

      } else {
        setError(`Attendee with ID "${attendeeId}" not found.`);
        setLoading(false);
        setIsAgendaLoading(false);
        return; // Stop further execution if attendee not found
      }

      if (attendeeId && selectedEventId) {
        setIsCheckInLoading(true);
        const { data: checkInData, error: checkInError } = await supabase
          .from('event_attendees')
          .select('check_in_time')
          .eq('attendee_id', attendeeId)
          .eq('event_id', selectedEventId)
          .single();

        if (checkInError && checkInError.code !== 'PGRST116') { // Ignore not found error
          console.error("Error fetching check-in time:", checkInError.message);
        } else if (checkInData) {
          setCheckInTime((checkInData as any).check_in_time);
        }
        setIsCheckInLoading(false);
      } else {
        setIsCheckInLoading(false);
      }
      setLoading(false);
    };

    loadAttendeeDetails();
  }, [attendeeId, getAttendeeById, selectedEventId, getSessionRegistrationsForAttendee]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleTakePhoto = () => {
    setPhotographingAttendee(attendee);
  };

  const handleSavePhoto = async (imageBlob: Blob) => {
    if (!attendee) return;

    setIsSavingPhoto(true);
    const toastId = toast.loading(`Uploading photo for ${attendee.name}...`);

    try {
      const filePath = `public/${attendee.id}/${Date.now()}.jpg`;
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

      const result = await updateAttendee(attendee.id, { avatar_url: publicUrl });

      if (result.success) {
        toast.success('Photo saved and profile updated!', { id: toastId });
        const updatedAttendee = { ...attendee, avatar_url: publicUrl };
        setAttendee(updatedAttendee);
        setFormData(updatedAttendee);
        setAvatarPreview(publicUrl);
        setPhotographingAttendee(null);
      } else {
        throw new Error(result.message);
      }

    } catch (err: any) {
      toast.error(`Failed to save photo: ${err.message}`, { id: toastId });
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!attendee || !attendee.avatar_url) {
      toast.error("No photo to delete.");
      return;
    }

    setIsDeletingPhoto(true);
    const toastId = toast.loading("Deleting photo...");
    let storageErrorOccurred = false;

    try {
      const filePath = new URL(attendee.avatar_url).pathname.split('/attendee-avatars/')[1];
      if (filePath) {
        const { error: storageError } = await supabase.storage.from('attendee-avatars').remove([filePath]);
        if (storageError) {
          console.error("Storage deletion error:", storageError);
          storageErrorOccurred = true;
        }
      }

      const result = await updateAttendee(attendee.id, { avatar_url: null });
      if (result.success) {
        const successMessage = storageErrorOccurred
          ? "Photo link removed, but failed to delete file from storage."
          : "Photo deleted successfully.";
        toast.success(successMessage, { id: toastId });
        const updatedAttendee = { ...attendee, avatar_url: null as string | null };
        setAttendee(updatedAttendee);
        setFormData({ ...updatedAttendee });
        setAvatarPreview(null);
        setIsDeletePhotoModalOpen(false);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      toast.error(`Failed to delete photo: ${err.message}`, { id: toastId });
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!attendeeId) return;

    if (!formData.name?.trim() || !formData.organization?.trim()) {
      toast.error("Name and Organization are required fields.");
      return;
    }

    setIsSaving(true);
    const updates: Database['public']['Tables']['attendees']['Update'] = {
      name: formData.name,
      organization: formData.organization,
      email: formData.email,
      phone: formData.phone,
      position: formData.position,
      notes: formData.notes,
      linkedin_url: formData.linkedin_url,
      last_day_lunch: formData.last_day_lunch,
      is_veggie: formData.is_veggie,
      has_tour: formData.has_tour,
    };

    const result = await updateAttendee(attendeeId, updates);
    if (result.success) {
      haptics.success(); // Tactile feedback on save
      toast.success("Profile updated successfully!");
      if (result.updatedAttendee) {
        setAttendee(result.updatedAttendee);
        setAvatarPreview(result.updatedAttendee.avatar_url || null);
      }
    } else {
      toast.error(`Failed to update: ${result.message}`);
    }
    setIsSaving(false);
  };

  const handleDeleteConfirmed = async () => {
    if (!attendee) return;
    setIsSaving(true);
    haptics.error(); // Warning vibration on delete
    const result = await deleteAttendee(attendee.id);
    if (result.success) {
      toast.success(result.message);
      navigate(AppRoute.AttendeeProfiles, { replace: true });
    } else {
      toast.error(`Failed to delete: ${result.message}`);
      setIsSaving(false);
    }
  };

  const customFields = useMemo(() => {
    if (!attendee?.metadata) return [];
    return Object.entries(attendee.metadata);
  }, [attendee]);

  if (loading || eventDataLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center py-10">
          <ArrowPathIcon className="w-8 h-8 mx-auto mb-3 text-primary-500 animate-spin" />
          <p className="text-lg font-montserrat text-gray-600">Loading Attendee Profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button onClick={() => navigate(AppRoute.AttendeeProfiles)} variant="neutral" size="sm" leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
          Back to All Profiles
        </Button>
        <Alert type="error" message={error} />
      </div>
    );
  }

  if (!attendee) {
    return (
      <div className="space-y-4">
        <Button onClick={() => navigate(AppRoute.AttendeeProfiles)} variant="neutral" size="sm" leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
          Back to All Profiles
        </Button>
        <Alert type="info" message="Attendee data could not be loaded or does not exist." />
      </div>
    );
  }

  const preferences = [
    formData.last_day_lunch && 'Last Day Lunch',
    formData.is_veggie && 'Veggie Option',
    formData.has_tour && 'City Tour',
  ].filter(Boolean) as string[];

  // Define Tabs Content
  const tabContent = [
    {
      id: 'agenda',
      label: 'Agenda',
      icon: <ClockIcon className="w-5 h-5" />,
      content: (
        <Card title="Agenda" bodyClassName="!p-0">
          <div className="p-4">
            <div className="max-h-96 overflow-y-auto">
              {isAgendaLoading ? <p className="text-sm text-slate-500">Loading agenda...</p> : agenda.length === 0 ? <p className="text-sm text-slate-500 py-4 text-center">No scheduled meetings.</p> : (
                <ul className="space-y-3">
                  {(() => {
                    const sortedAgenda = [...agenda].sort((a, b) => new Date(a.sessionStartTime).getTime() - new Date(b.sessionStartTime).getTime());
                    const now = new Date();
                    const nextMeetingIndex = sortedAgenda.findIndex(item => new Date(item.sessionStartTime) > now);

                    return sortedAgenda.map((item, index) => {
                      const isNext = index === nextMeetingIndex;
                      return (
                        <li
                          key={item.id}
                          className={`p-3 rounded-lg border ${isNext
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-300 dark:ring-blue-700'
                            : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'
                            }`}
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{item.sessionName}</p>
                            {isNext && (
                              <span className="flex-shrink-0 text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900 shadow-sm ml-2">
                                Next Up
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(item.sessionStartTime).toLocaleString()}</p>
                            {item.boothName && <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{item.boothName}</span>}
                          </div>
                        </li>
                      );
                    });
                  })()}
                </ul>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
              <Button
                variant="secondary"
                onClick={() => setIsMeetingManagerOpen(true)}
                leftIcon={<CogIcon className="w-5 h-5" />}
                className="w-full"
              >
                Manage Meetings
              </Button>
            </div>
          </div>
        </Card>
      )
    },
    {
      id: 'emails',
      label: 'Emails',
      icon: <EnvelopeIcon className="w-5 h-5" />,
      content: selectedEventId ? (
        <EmailHistoryCard
          attendeeId={attendee.id}
          eventId={selectedEventId}
        />
      ) : <div>Select an event to view emails</div>
    },
    {
      id: 'journey',
      label: 'Journey',
      icon: <MapIcon className="w-5 h-5" />,
      content: (
        <FeatureGuard featureKey={Feature.ATTENDEE_JOURNEY_VIEW}>
          <Card title="Event Journey" bodyClassName="!p-0">
            <div className="p-4">
              {isJourneyLoading ? (
                <p className="text-sm text-slate-500">Loading journey...</p>
              ) : (
                <JourneyTimeline
                  events={journeyEvents}
                  mode="admin"
                  maxHeight="32rem"
                  showEmptyState={true}
                />
              )}
            </div>
          </Card>
        </FeatureGuard>
      )
    }
  ];

  if (isMobile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(AppRoute.AttendeeProfiles)} className="!p-1">
              <ArrowLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </Button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
              {attendee?.name || 'Loading...'}
            </h1>
          </div>
          <FeatureGuard featureKey={Feature.ATTENDEE_PORTAL_PREVIEW}>
            <Button size="sm" variant="secondary" onClick={() => setIsPreviewModalOpen(true)} className="!px-3 !py-1">
              <EyeIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </Button>
          </FeatureGuard>
        </div>

        {/* Action Modals */}
        <CameraModal
          isOpen={!!photographingAttendee}
          onClose={() => setPhotographingAttendee(null)}
          onCapture={handleSavePhoto}
          isSaving={isSavingPhoto}
        />
        <FeatureGuard featureKey={Feature.ATTENDEE_PORTAL_PREVIEW}>
          <AttendeePortalPreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            attendee={attendee}
          />
        </FeatureGuard>
        {/* Delete & Photo Modals (Reused from desktop definition) */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={`Delete Attendee`}>
          {/* Simplified Delete Modal Content for Mobile */}
          <div className="space-y-4">
            <Alert type="error" message={<strong>Permanent Action</strong>} />
            <p className="text-sm">Type <strong className="font-mono">delete</strong> to confirm.</p>
            <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="delete" autoFocus />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="neutral" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={handleDeleteConfirmed} disabled={deleteConfirmText.toLowerCase() !== 'delete'}>Delete</Button>
          </div>
        </Modal>
        <Modal isOpen={isDeletePhotoModalOpen} onClose={() => setIsDeletePhotoModalOpen(false)} title="Delete Photo?">
          <div className="space-y-4 pt-2">
            <p className="text-sm">Are you sure you want to remove the profile photo?</p>
            <div className="flex justify-end gap-2">
              <Button variant="neutral" onClick={() => setIsDeletePhotoModalOpen(false)}>Cancel</Button>
              <Button variant="accent" onClick={handleDeletePhoto} disabled={isDeletingPhoto}>Delete</Button>
            </div>
          </div>
        </Modal>

        {/* Content */}
        {!attendee ? (
          <div className="p-8 text-center text-slate-500">Attendee not found.</div>
        ) : (
          <div className="space-y-6 p-4">
            {/* Profile Hero */}
            <div className="flex flex-col items-center gap-4 bg-gradient-to-b from-primary-50/50 to-transparent dark:from-primary-900/10 py-6 -mx-4 px-4 rounded-2xl">
              <div className="relative group">
                {/* Gradient border ring */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full blur opacity-30 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-200">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={attendee.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <UserCircleIcon className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => canTakePhoto ? handleTakePhoto() : null}
                  className="absolute bottom-0 right-0 bg-gradient-to-br from-primary-600 to-primary-700 text-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <CameraIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{attendee.name}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{attendee.organization}</p>
                {attendee.position && <p className="text-slate-400 text-xs mt-1">{attendee.position}</p>}

                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {attendee.is_vendor && (
                    <span className="px-2 py-1 text-xs font-bold bg-purple-100 text-purple-800 rounded-full">VENDOR</span>
                  )}
                  {checkInTime ? (
                    <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-800 rounded-full">✓ Checked In</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-bold bg-slate-100 text-slate-600 rounded-full">Pending</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Tabs
                tabs={[
                  {
                    id: 'details',
                    label: 'Details',
                    icon: <UserCircleIcon className="w-4 h-4" />,
                    content: (
                      <form id="mobile-attendee-form" onSubmit={handleSave} className="p-4 space-y-4">
                        <Input label="Name" name="name" value={formData.name || ''} onChange={handleInputChange} required />
                        <Input label="Organization" name="organization" value={formData.organization || ''} onChange={handleInputChange} required />
                        <Input label="Email" type="email" name="email" value={formData.email || ''} onChange={handleInputChange} />
                        <Input label="Phone" name="phone" value={formData.phone || ''} onChange={handleInputChange} />
                        <Input label="Position" name="position" value={formData.position || ''} onChange={handleInputChange} />
                        <div className="space-y-3 pt-2">
                          <p className="text-xs font-bold uppercase text-slate-500">Preferences</p>
                          <Checkbox name="last_day_lunch" label="Last Day Lunch" checked={!!formData.last_day_lunch} onChange={handleInputChange} />
                          <Checkbox name="is_veggie" label="Vegetarian" checked={!!formData.is_veggie} onChange={handleInputChange} />
                          <Checkbox name="has_tour" label="City Tour" checked={!!formData.has_tour} onChange={handleInputChange} />
                        </div>
                        <div className="pt-6">
                          <Button type="button" variant="ghost" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => setIsDeleteModalOpen(true)}>
                            Delete Profile
                          </Button>
                        </div>
                      </form>
                    )
                  },
                  {
                    id: 'agenda',
                    label: 'Agenda',
                    icon: <ClockIcon className="w-4 h-4" />,
                    content: (
                      <div className="p-4 space-y-3">
                        {agenda.length === 0 ? (
                          <p className="text-center text-slate-500 py-8">No meetings scheduled.</p>
                        ) : (
                          agenda.map(item => (
                            <div key={item.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.sessionName}</p>
                              <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                                <span>{new Date(item.sessionStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {item.boothName && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{item.boothName}</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )
                  }
                ]}
                defaultTabId="details"
              />
            </div>
          </div>
        )}

        {/* Sticky Footer Action */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-30">
          <Button
            type="submit"
            form="mobile-attendee-form"
            variant="primary"
            className="w-full"
            disabled={isSaving}
            size="lg"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <CameraModal
        isOpen={!!photographingAttendee}
        onClose={() => setPhotographingAttendee(null)}
        onCapture={handleSavePhoto}
        isSaving={isSavingPhoto}
      />
      <FeatureGuard featureKey={Feature.ATTENDEE_PORTAL_PREVIEW}>
        <AttendeePortalPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          attendee={attendee}
        />
      </FeatureGuard>
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={`Delete Attendee: ${attendee.name}`}>
        <div className="space-y-4">
          <Alert type="error" message={<strong>This action is permanent and cannot be undone.</strong>} />
          <p className="font-sans text-sm text-slate-700 dark:text-slate-200">This will permanently delete the attendee <strong className="font-semibold">{attendee.name}</strong> and all of their associated data, including scan records and session registrations.</p>
          <p className="font-sans text-sm mt-4">To confirm, please type <strong className="font-mono text-accent-600">DELETE</strong> in the box below.</p>
          <Input id="delete-confirm" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="delete" disabled={isSaving} autoFocus />
        </div>
        <div className="flex items-center justify-end p-4 border-t border-slate-200 dark:border-slate-700 rounded-b -mx-6 -mb-6 mt-6 bg-slate-50 dark:bg-slate-700/50">
          <Button type="button" variant="neutral" onClick={() => setIsDeleteModalOpen(false)} disabled={isSaving} className="mr-3">Cancel</Button>
          <Button
            type="button"
            variant="accent"
            onClick={handleDeleteConfirmed}
            disabled={isSaving || deleteConfirmText.toLowerCase() !== 'delete'}
          >
            {isSaving ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={isDeletePhotoModalOpen}
        onClose={() => setIsDeletePhotoModalOpen(false)}
        title="Confirm Photo Deletion"
      >
        <div className="space-y-4">
          <Alert type="warning" message="Are you sure you want to permanently delete this attendee's profile photo? This action cannot be undone." />
          {attendee?.avatar_url && (
            <div className="text-center">
              <img src={attendee.avatar_url} alt="To be deleted" className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-slate-200" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 mt-4">
          <Button variant="neutral" onClick={() => setIsDeletePhotoModalOpen(false)} disabled={isDeletingPhoto}>
            Cancel
          </Button>
          <Button variant="accent" onClick={handleDeletePhoto} disabled={isDeletingPhoto} leftIcon={isDeletingPhoto ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}>
            {isDeletingPhoto ? 'Deleting...' : 'Delete Photo'}
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={isMeetingManagerOpen}
        onClose={() => setIsMeetingManagerOpen(false)}
        title={`Manage Meetings: ${attendee.name}`}
        size="lg"
      >
        {attendee && selectedEventId && (
          <AttendeeSessionManager
            attendee={attendee}
            eventId={selectedEventId}
            currentMeetings={agenda}
            onMeetingsChanged={async () => {
              const agendaResult = await getSessionRegistrationsForAttendee(attendee.id);
              if (agendaResult.success) {
                setAgenda(agendaResult.data as any);
              }
            }}
          />
        )}
      </Modal>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center font-montserrat break-all">
              <UserCircleIcon className="w-10 h-10 mr-3 text-brandBlue flex-shrink-0" /> Edit Profile: {attendee.name}
            </h1>
            {attendee.is_vendor && (
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                VENDOR
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FeatureGuard featureKey={Feature.ATTENDEE_PORTAL_PREVIEW}>
              <Button onClick={() => setIsPreviewModalOpen(true)} variant="secondary" size="sm" leftIcon={<EyeIcon className="w-4 h-4" />}>
                Portal Preview
              </Button>
            </FeatureGuard>
            <Button onClick={() => navigate(AppRoute.AttendeeProfiles)} variant="neutral" size="sm" leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
              Back to All Profiles
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Attendee Information">
              <form onSubmit={handleSave} className="space-y-4 font-sans text-sm">
                <div className="space-y-2">
                  {avatarPreview && (
                    <div className="text-center group relative w-24 h-24 mx-auto">
                      <img src={avatarPreview} alt="Attendee Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-200 shadow-md" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          onClick={() => setIsDeletePhotoModalOpen(true)}
                          variant="accent"
                          size="sm"
                          className="!p-2 !rounded-full"
                          title="Delete Photo"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {isCheckInLoading ? <div className="h-10 bg-slate-100 rounded-md animate-pulse"></div> : (
                    checkInTime ? (
                      <Alert type="success" message={<><strong>Checked-in at:</strong> {new Date(checkInTime).toLocaleString()}</>} />
                    ) : (
                      <Alert type="info" message="This attendee has not performed the main event check-in." />
                    )
                  )}
                  {preferences.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {preferences.map(pref => (
                        <span key={pref} className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3" />
                          {pref}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 p-2 rounded-md">ID: {attendee.id}</p>
                </div>
                <Input label="Name (Required)" name="name" value={formData.name || ''} onChange={handleInputChange} required disabled={isSaving} />
                <Input label="Organization (Required)" name="organization" value={formData.organization || ''} onChange={handleInputChange} required disabled={isSaving} />
                <Input label="Email" type="email" name="email" value={formData.email || ''} onChange={handleInputChange} disabled={isSaving} />
                <Input label="Phone" name="phone" value={formData.phone || ''} onChange={handleInputChange} disabled={isSaving} />
                <Input label="Position" name="position" value={formData.position || ''} onChange={handleInputChange} disabled={isSaving} />
                <div className="flex items-end gap-2">
                  <Input
                    label="LinkedIn Profile URL"
                    name="linkedin_url"
                    type="url"
                    value={formData.linkedin_url || ''}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    placeholder="https://www.linkedin.com/in/..."
                    wrapperClassName="flex-grow !mb-0"
                  />
                  {canTakePhoto && (
                    <Button
                      type="button"
                      onClick={handleTakePhoto}
                      variant="neutral"
                      title="Take Photo with Camera"
                      disabled={isSaving}
                    >
                      <CameraIcon className="w-5 h-5" />
                      <span className="ml-2 hidden sm:inline">
                        {avatarPreview ? 'Retake Photo' : 'Take Photo'}
                      </span>
                    </Button>
                  )}
                </div>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  placeholder="Internal notes about the attendee..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/50 outline-none transition"
                  disabled={isSaving}
                />
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h4 className="text-md font-semibold text-gray-700 dark:text-slate-200 font-montserrat mb-2">Preferences</h4>
                  <div className="space-y-2">
                    <Checkbox name="last_day_lunch" label="Attending Last Day Lunch" checked={!!formData.last_day_lunch} onChange={handleInputChange} disabled={isSaving} />
                    <Checkbox name="is_veggie" label="Vegetarian Meal Preference" checked={!!formData.is_veggie} onChange={handleInputChange} disabled={isSaving} />
                    <Checkbox name="has_tour" label="Participating in City Tour" checked={!!formData.has_tour} onChange={handleInputChange} disabled={isSaving} />
                  </div>
                </div>

                {isFeatureEnabled(Feature.TRACKS) && selectedEventId && attendeeId && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <AttendeeTracksEditor attendeeId={attendeeId} eventId={selectedEventId} />
                  </div>
                )}

                {customFields.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 className="text-md font-semibold text-gray-700 dark:text-slate-200 font-montserrat mb-2">Custom Data</h4>
                    <div className="space-y-2 text-sm">
                      {customFields.map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-semibold text-slate-500 dark:text-slate-400 w-1/3">{key}:</span>
                          <span className="text-slate-800 dark:text-slate-200">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button type="button" variant="accent" onClick={() => setIsDeleteModalOpen(true)} disabled={isSaving} leftIcon={<TrashIcon className="w-4 h-4" />}>
                    Delete Profile
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {selectedEventId && (
              <AccessControlCard
                attendee={attendee}
                eventId={selectedEventId}
              />
            )}
          </div>
        </div>

        {/* Full Width Tabs Section */}
        <div className="w-full">
          <Tabs
            tabs={tabContent}
            defaultTabId="agenda"
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
          />
        </div>
      </div>
    </>
  );
}