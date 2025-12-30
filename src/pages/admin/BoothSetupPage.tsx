// src/pages/admin/BoothSetupPage.tsx

import React, { useState, FormEvent, useEffect } from 'react';
import { useBooths } from '../../contexts/booths';
import { useAttendees } from '../../contexts/attendees';
import { Booth, Attendee } from '../../types';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, CogIcon, DocumentDuplicateIcon, ArrowPathIcon, UserIcon, ArrowLeftIcon } from '../../components/Icons';
import { Icon } from '../../components/ui/Icon';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';
import { supabase } from '../../supabaseClient';
import { useIsMobile } from '../../hooks/useIsMobile';
import MobileCard from '../../components/mobile/MobileCard';
import SwipeableCard from '../../components/ui/SwipeableCard';
import { BuildingStorefrontIcon } from '../../components/Icons'; // Ensure icon is imported

const BoothProfileModal: React.FC<{
  booth: Booth | null;
  onClose: () => void;
  onSave: (boothData: Booth) => Promise<any>;
}> = ({ booth, onClose, onSave }) => {
  const { getVendorsForBooth, addWalkInAttendee } = useAttendees();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<Booth>>({});
  const [vendors, setVendors] = useState<Attendee[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [isAddingVendor, setIsAddingVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSponsorSectionOpen, setIsSponsorSectionOpen] = useState(false);
  const [sponsorLogoFile, setSponsorLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (booth) {
      setFormData(booth);
      setIsLoadingVendors(true);
      getVendorsForBooth(booth.companyName)
        .then(setVendors)
        .finally(() => setIsLoadingVendors(false));
    }
  }, [booth, getVendorsForBooth]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveClick = async () => {
    if (!formData.companyName?.trim() || !formData.physicalId?.trim()) {
      toast.error('Company Name and Physical ID are required.');
      return;
    }
    setIsSubmitting(true);

    // Upload sponsor logo if file selected
    if (sponsorLogoFile && booth?.id) {
      try {
        const fileExt = sponsorLogoFile.name.split('.').pop();
        const filePath = `sponsor_logos/${booth.id}_${Date.now()}.${fileExt}`;

        // Remove old logo if exists
        if (formData.sponsorLogoUrl) {
          const oldPath = formData.sponsorLogoUrl.split('/').slice(-2).join('/');
          await supabase.storage.from('sponsor_logos').remove([oldPath]);
        }

        const { error: uploadError } = await supabase.storage
          .from('sponsor_logos')
          .upload(filePath, sponsorLogoFile);

        if (uploadError) {
          toast.error(`Failed to upload logo: ${uploadError.message}`);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('sponsor_logos')
            .getPublicUrl(filePath);

          formData.sponsorLogoUrl = publicUrl;
        }
      } catch (err: any) {
        toast.error(`Logo upload error: ${err.message}`);
      }
    }

    await onSave(formData as Booth);
    setIsSubmitting(false);
    onClose();
  };

  const handleAddVendor = async (e: FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim() || !booth) return;

    setIsAddingVendor(true);
    const newAttendeeData: Omit<Partial<Attendee>, 'id' | 'checkInTime' | 'organization'> & { name: string; email: string; organization: string } = {
      name: newVendorName.trim(),
      email: `${newVendorName.trim().replace(/\s/g, '.').toLowerCase()}@${booth.companyName.replace(/\s/g, '')}.vendor`,
      organization: booth.companyName,
      is_vendor: true
    };

    const result = await addWalkInAttendee(newAttendeeData);
    if (result.success) {
      toast.success(`${newVendorName} added as vendor for ${booth.companyName}.`);
      setVendors(prev => [...prev, result.newAttendee!]);
      setNewVendorName('');
    } else {
      toast.error(`Failed to add vendor: ${result.message}`);
    }
    setIsAddingVendor(false);
  };

  if (!booth) return null;

  return (
    <Modal isOpen={!!booth} onClose={onClose} title={`${t(localeKeys.editingBooth)}: ${booth.companyName}`} size="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t(localeKeys.companyName)} name="companyName" value={formData.companyName || ''} onChange={handleInputChange} required />
          <Input label={t(localeKeys.physicalId)} name="physicalId" value={formData.physicalId || ''} onChange={handleInputChange} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t(localeKeys.emailLabel)} name="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
          <Input label={t(localeKeys.contactPhone)} name="phone" value={formData.phone || ''} onChange={handleInputChange} />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat">{t(localeKeys.notesLabel)}</label>
          <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition duration-150 ease-in-out sm:text-sm font-sans dark:bg-slate-900" />
        </div>

        <Card title={t(localeKeys.navLinkVendorStaff)} className="bg-slate-50 shadow-inner">
          {isLoadingVendors ? <p>{t(localeKeys.loading)}</p> : (
            <div className="space-y-3">
              {vendors.length === 0 ? <p className="text-sm text-slate-500">No staff members found.</p> : (
                <ul className="max-h-40 overflow-y-auto space-y-2 pr-2">
                  {vendors.map(v => <li key={v.id} className="text-sm p-2 rounded-md bg-white flex items-center"><UserIcon className="w-4 h-4 mr-2 text-slate-500" /> {v.name}</li>)}
                </ul>
              )}
              <form onSubmit={handleAddVendor} className="flex items-end gap-2 pt-3 border-t">
                <Input wrapperClassName="!mb-0 flex-grow" label="Add Staff Member" value={newVendorName} onChange={e => setNewVendorName(e.target.value)} placeholder="Full Name" />
                <Button type="submit" variant="secondary" size="md" disabled={isAddingVendor || !newVendorName.trim()}>{isAddingVendor ? t(localeKeys.adding) : t(localeKeys.add)}</Button>
              </form>
            </div>
          )}
        </Card>

        {/* SPONSOR SETTINGS SECTION (NEW) - Fixed with custom div */}
        <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setIsSponsorSectionOpen(!isSponsorSectionOpen)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors bg-slate-50/80 dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700"
            type="button"
          >
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100 font-montserrat">
              <span>📢</span>
              <span>Sponsor Settings</span>
            </div>
            <span className="text-slate-500 text-sm">{isSponsorSectionOpen ? '▲ Collapse' : '▼ Expand'}</span>
          </button>

          {isSponsorSectionOpen && (
            <div className="px-5 py-4 space-y-4">
              {/* Is Sponsor Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isSponsor"
                  checked={formData.isSponsor || false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    isSponsor: e.target.checked,
                    sponsorshipTier: e.target.checked ? prev.sponsorshipTier : null
                  }))}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="isSponsor" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Mark as Sponsor
                </label>
              </div>

              {/* Sponsor Tier (only if is sponsor) */}
              {formData.isSponsor && (
                <>
                  <Select
                    label="Sponsorship Tier"
                    value={formData.sponsorshipTier || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sponsorshipTier: (e.target.value as 'platinum' | 'gold' | 'silver') || null
                    }))}
                    options={[
                      { value: '', label: 'Select tier...' },
                      { value: 'platinum', label: '💎 Platinum (Main Sponsor)' },
                      { value: 'gold', label: '🥇 Gold' },
                      { value: 'silver', label: '🥈 Silver' },
                    ]}
                  />

                  {/* Logo Upload (NEW) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Sponsor Logo
                    </label>

                    {/* Current or Preview Logo */}
                    {(logoPreview || formData.sponsorLogoUrl) && (
                      <div className="mb-2">
                        <img
                          src={logoPreview || formData.sponsorLogoUrl || ''}
                          alt="Sponsor logo"
                          className="h-20 w-auto object-contain border border-slate-300 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-900"
                        />
                        {logoPreview && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">New logo ready to upload</p>
                        )}
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSponsorLogoFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLogoPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400 dark:hover:file:bg-primary-900/50"
                    />
                    <p className="text-xs text-slate-500 mt-1">Upload a logo for this sponsor (will override company logo)</p>
                  </div>

                  <Input
                    label="Custom Website URL (optional)"
                    name="sponsorWebsiteUrl"
                    value={formData.sponsorWebsiteUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, sponsorWebsiteUrl: e.target.value }))}
                    placeholder="https://sponsor.com"
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Sponsor Description (optional)
                    </label>
                    <textarea
                      value={formData.sponsorDescription || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, sponsorDescription: e.target.value }))}
                      rows={2}
                      placeholder="Brief description for sponsor display..."
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition duration-150 ease-in-out sm:text-sm dark:bg-slate-900"
                    />
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                    <p className="font-medium mb-1">Tier Benefits:</p>
                    <ul className="text-xs space-y-1 ml-4">
                      {formData.sponsorshipTier === 'platinum' && (
                        <li>• Portal header, emails, login pages (1 per event)</li>
                      )}
                      {formData.sponsorshipTier === 'gold' && (
                        <li>• Attendee badges, agenda banners</li>
                      )}
                      {formData.sponsorshipTier === 'silver' && (
                        <li>• Portal footer sponsor grid</li>
                      )}
                      {!formData.sponsorshipTier && (
                        <li className="text-amber-600 dark:text-amber-400">Select a tier to see benefits</li>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveClick} disabled={isSubmitting}>{isSubmitting ? t(localeKeys.saving) : t(localeKeys.saveChanges)}</Button>
        </div>
      </div>
    </Modal>
  );
};



const BoothSetupPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { booths, addBooth, updateBooth, deleteBooth, loading, regenerateAllBoothAccessCodes } = useBooths();
  const { selectedEventId } = useSelectedEvent();
  const { t } = useLanguage();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBooth, setEditingBooth] = useState<Booth | null>(null);
  const [newPhysicalId, setNewPhysicalId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ... handlers (handleAddBooth, handleUpdateBooth, handleDeleteBooth, handleCopyCode, handleRegenerateCodes)
  // ... Need to include them in replacement or target carefully.
  // Since I need to change the render significantly, I'll probably replace the whole component body.

  const handleAddBooth = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPhysicalId.trim() || !newCompanyName.trim()) {
      toast.error('Physical ID and Company Name are required.');
      return;
    }
    setIsSubmitting(true);
    const result = await addBooth(newPhysicalId, newCompanyName);
    if (result.success) {
      toast.success(result.message);
      setIsAddModalOpen(false);
      setNewPhysicalId(''); setNewCompanyName('');
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  const handleUpdateBooth = async (boothData: Booth) => {
    setIsSubmitting(true);
    const result = await updateBooth(boothData);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  }

  const handleDeleteBooth = async (booth: Booth) => {
    if (window.confirm(`Are you sure you want to delete booth "${booth.companyName}"?`)) {
      const toastId = toast.loading('Deleting booth...');
      const result = await deleteBooth(booth.id);
      if (result.success) {
        toast.success(result.message, { id: toastId });
      } else {
        toast.error(result.message, { id: toastId });
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code "${code}" copied to clipboard!`);
  }

  const handleRegenerateCodes = async () => {
    if (window.confirm("Are you sure you want to regenerate ALL booth access codes? This action will invalidate all existing codes.")) {
      const toastId = toast.loading('Regenerating codes...');
      const result = await regenerateAllBoothAccessCodes();
      if (result.success) {
        toast.success(result.message, { id: toastId });
      } else {
        toast.error(result.message, { id: toastId });
      }
    }
  }

  const filteredBooths = booths.filter(booth =>
    booth.physicalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booth.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // State for mobile view mode
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'detail'>('list');
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);

  const selectedBooth = booths.find(b => b.id === selectedBoothId);

  const handleMobileDetail = (boothId: string) => {
    setSelectedBoothId(boothId);
    setMobileViewMode('detail');
  };

  const handleMobileBack = () => {
    setMobileViewMode('list');
    setSelectedBoothId(null);
  };

  if (!selectedEventId && !loading) {
    return <Alert type="warning" message={t(localeKeys.noEventSelected)} />
  }

  return (
    <>
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={t(localeKeys.addNewBooth)}>
        <form onSubmit={handleAddBooth} className="space-y-4">
          <Input label={t(localeKeys.physicalId)} value={newPhysicalId} onChange={e => setNewPhysicalId(e.target.value)} required autoFocus />
          <Input label={t(localeKeys.companyName)} value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} required />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="neutral" onClick={() => setIsAddModalOpen(false)}>{t(localeKeys.cancel)}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t(localeKeys.adding) : t(localeKeys.addBooth)}</Button>
          </div>
        </form>
      </Modal>
      {/* Ensure BoothProfileModal can still be opened on top of detail view */}
      <BoothProfileModal booth={editingBooth} onClose={() => setEditingBooth(null)} onSave={handleUpdateBooth} />

      {isMobile ? (
        <div className="pb-20">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm flex items-center justify-between safe-area-top">
            {mobileViewMode === 'detail' ? (
              <div className="flex items-center w-full">
                <button onClick={handleMobileBack} className="p-2 mr-2 -ml-2 text-slate-600 dark:text-slate-300">
                  <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold truncate">Booth Details</h1>
                <button
                  onClick={() => selectedBooth && setEditingBooth(selectedBooth)}
                  className="ml-auto p-2 text-primary-600 dark:text-primary-400 font-semibold text-sm"
                >
                  Edit
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <h1 className="text-xl font-bold flex items-center"><CogIcon className="w-6 h-6 mr-2 text-primary-600" /> Booths</h1>
                <Button size="sm" onClick={() => setIsAddModalOpen(true)} leftIcon={<PlusCircleIcon className="w-4 h-4" />}>Add</Button>
              </div>
            )}
          </div>

          <div className="p-4">
            {mobileViewMode === 'list' && (
              <div className="space-y-4">
                {/* Search */}
                <Input wrapperClassName="!mb-0" placeholder={t(localeKeys.searchByIdOrCompany)} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

                <div className="flex gap-2">
                  <Button onClick={handleRegenerateCodes} variant="secondary" className="w-full text-xs" size="sm" leftIcon={<ArrowPathIcon className="w-4 h-4" />}>{t(localeKeys.regenerateCode)}</Button>
                </div>

                {loading ? <p className="text-center py-4 text-slate-500">Loading booths...</p> : filteredBooths.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500">{searchTerm ? 'No matches found.' : 'No booths yet.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBooths.map(booth => (
                      <div key={booth.id} onClick={() => handleMobileDetail(booth.id)}>
                        <SwipeableCard
                          leftAction={{
                            icon: <PencilSquareIcon className="w-5 h-5" />,
                            color: 'blue',
                            label: 'Edit',
                            onTrigger: () => setEditingBooth(booth)
                          }}
                          rightAction={{
                            icon: <TrashIcon className="w-5 h-5" />,
                            color: 'red',
                            label: 'Delete',
                            onTrigger: () => handleDeleteBooth(booth)
                          }}
                        >
                          <MobileCard
                            title={booth.companyName}
                            subtitle={`ID: ${booth.physicalId}`}
                            icon={<BuildingStorefrontIcon className="w-5 h-5 text-primary-600" />}
                            badge={booth.isSponsor ? (
                              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">
                                Sponsor
                              </span>
                            ) : undefined}
                            actions={
                              <div className="flex items-center justify-between w-full mt-2">
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded">
                                  <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">{booth.accessCode}</span>
                                  <button onClick={(e) => { e.stopPropagation(); handleCopyCode(booth.accessCode); }} className="text-slate-400 hover:text-slate-600">
                                    <DocumentDuplicateIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            }
                          />
                        </SwipeableCard>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mobileViewMode === 'detail' && selectedBooth && (
              <div className="space-y-6">
                <Card className="!p-0 overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800 p-6 flex flex-col items-center text-center border-b border-slate-200 dark:border-slate-700">
                    <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm mb-4 overflow-hidden relative">
                      {selectedBooth.sponsorLogoUrl ? (
                        <img src={selectedBooth.sponsorLogoUrl} alt={selectedBooth.companyName} className="w-full h-full object-contain p-2" />
                      ) : (
                        <BuildingStorefrontIcon className="w-8 h-8 text-primary-500" />
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedBooth.companyName}</h2>
                    {selectedBooth.isSponsor && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800`}>
                        {selectedBooth.sponsorshipTier ? `${selectedBooth.sponsorshipTier.toUpperCase()} SPONSOR` : 'SPONSOR'}
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <div className="w-8 flex justify-center"><span className="text-lg font-bold text-slate-400">#</span></div>
                      <div>
                        <p className="font-semibold text-sm">Physical ID</p>
                        <p className="text-sm font-mono">{selectedBooth.physicalId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <div className="w-8 flex justify-center"><Icon name="key" className="w-5 h-5 text-slate-400" /></div>
                      <div className="w-full">
                        <p className="font-semibold text-sm">Access Code</p>
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2 rounded mt-1">
                          <p className="text-sm font-mono font-bold tracking-widest">{selectedBooth.accessCode}</p>
                          <button onClick={() => handleCopyCode(selectedBooth.accessCode)} className="text-primary-600">
                            <DocumentDuplicateIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {(selectedBooth.email || selectedBooth.phone) && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-3">
                        {selectedBooth.email && (
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <div className="w-8 flex justify-center"><Icon name="mail" className="w-5 h-5 text-slate-400" /></div>
                            <p className="text-sm">{selectedBooth.email}</p>
                          </div>
                        )}
                        {selectedBooth.phone && (
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <div className="w-8 flex justify-center"><Icon name="phone" className="w-5 h-5 text-slate-400" /></div>
                            <p className="text-sm">{selectedBooth.phone}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedBooth.notes && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <p className="text-sm text-slate-500 italic">"{selectedBooth.notes}"</p>
                      </div>
                    )}
                  </div>
                </Card>

                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-2">Need to update vendors or settings?</p>
                  <Button variant="secondary" className="w-full justify-center" onClick={() => setEditingBooth(selectedBooth)}>
                    Manage Booth Settings
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DESKTOP VIEW */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold flex items-center"><CogIcon className="w-8 h-8 mr-3 text-primary-600" /> {t(localeKeys.boothSetupTitle)}</h1>
          </div>

          <Card>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
              <Input wrapperClassName="!mb-0 w-full sm:flex-grow" placeholder={t(localeKeys.searchByIdOrCompany)} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={() => setIsAddModalOpen(true)} leftIcon={<PlusCircleIcon className="w-5 h-5" />}>{t(localeKeys.addNewBooth)}</Button>
                <Button onClick={handleRegenerateCodes} variant="secondary" leftIcon={<ArrowPathIcon className="w-5 h-5" />} title="Regenerate all access codes">{t(localeKeys.regenerateCode)}</Button>
              </div>
            </div>

            {loading ? <p>{t(localeKeys.loadingBooths)}</p> : (
              filteredBooths.length === 0 ? <Alert type="info" message={searchTerm ? 'No booths match your search.' : 'No booths configured yet. Click "Add New Booth" to start.'} /> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t(localeKeys.physicalId)}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t(localeKeys.companyName)}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t(localeKeys.accessCode)}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t(localeKeys.actions)}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredBooths.map(booth => (
                        <tr key={booth.id}>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{booth.physicalId}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{booth.companyName}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-md">{booth.accessCode}</span>
                              <Button size="sm" variant="link" onClick={() => handleCopyCode(booth.accessCode)} title={t(localeKeys.copyCode)}><DocumentDuplicateIcon className="w-4 h-4" /></Button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm space-x-2">
                            <Button size="sm" variant="neutral" onClick={() => setEditingBooth(booth)} leftIcon={<PencilSquareIcon className="w-4 h-4" />}>{t(localeKeys.edit)}</Button>
                            <Button size="sm" variant="accent" onClick={() => handleDeleteBooth(booth)} leftIcon={<TrashIcon className="w-4 h-4" />}>{t(localeKeys.delete)}</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </Card>
        </div>
      )}
    </>
  );
};

export default BoothSetupPage;