// src/pages/admin/SuperAdminClientDetailPage.tsx
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Database } from '../../database.types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Input from '../../components/ui/Input';
import { ArrowLeftIcon, BuildingStorefrontIcon, UsersGroupIcon, PlusCircleIcon, TrashIcon, StarIcon } from '../../components/Icons';
import { AppRoute } from '../../types';
import { toast } from 'react-hot-toast';

type CompanyRow = Database['public']['Tables']['companies']['Row'];
type ContactRow = Database['public']['Tables']['contacts']['Row'];
type EditableContact = Partial<ContactRow> & { tempId: string };

const SuperAdminClientDetailPage: React.FC = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const isNew = companyId === 'new';

    const [company, setCompany] = useState<Partial<CompanyRow>>({});
    const [contacts, setContacts] = useState<EditableContact[]>([]);
    const [originalContacts, setOriginalContacts] = useState<EditableContact[]>([]);

    const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
    const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);

    const [loading, setLoading] = useState(!isNew);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (isNew) return;
            setLoading(true);
            setError(null);
            try {
                const { data: companyData, error: companyError } = await supabase.from('companies').select('*').eq('id', companyId!).single();
                if (companyError) throw companyError;
                setCompany(companyData);
                setCompanyLogoPreview(companyData.logo_url || null);

                const { data: contactsData, error: contactsError } = await (supabase.from('contacts') as any).select('*').eq('company_id', companyId!).order('name');
                if (contactsError) throw contactsError;

                const editableContacts = (contactsData || []).map((c: ContactRow) => ({ ...c, tempId: c.id }));
                setContacts(editableContacts);
                setOriginalContacts(editableContacts);
            } catch (err: any) {
                setError(err.message);
                toast.error(`Failed to load data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [companyId, isNew]);

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCompany(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleContactChange = (tempId: string, field: keyof ContactRow, value: any) => {
        setContacts(prev => prev.map(c => c.tempId === tempId ? { ...c, [field]: value } : c));
    };

    const setPrimaryContact = (tempId: string) => {
        setContacts(prev => prev.map(c => ({ ...c, is_primary: c.tempId === tempId })));
    };

    const addContact = () => {
        const newContact: EditableContact = { tempId: `new-${Date.now()}`, name: '', position: '', email: '', phone: '', is_primary: contacts.length === 0 };
        setContacts(prev => [...prev, newContact]);
    };

    const removeContact = (tempId: string) => {
        setContacts(prev => {
            const newContacts = prev.filter(c => c.tempId !== tempId);
            // If the primary was removed, make the first one primary
            if (newContacts.length > 0 && !newContacts.some(c => c.is_primary)) {
                newContacts[0].is_primary = true;
            }
            return newContacts;
        });
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!company.name?.trim()) {
            toast.error("Company name is required.");
            return;
        }

        setIsSaving(true);
        try {
            let companyPayload = { ...company } as Partial<CompanyRow>;

            // --- Logo Upload Logic ---
            if (companyLogoFile) {
                if (company.logo_url) {
                    const oldLogoPath = new URL(company.logo_url).pathname.split('/company_logos/')[1];
                    if (oldLogoPath) {
                        await supabase.storage.from('company_logos').remove([oldLogoPath]);
                    }
                }
                const filePath = `public/${company.name?.replace(/\s+/g, '_')}_${Date.now()}`;
                const { error: uploadError } = await supabase.storage.from('company_logos').upload(filePath, companyLogoFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('company_logos').getPublicUrl(filePath);
                companyPayload.logo_url = publicUrl;
            }

            // Step 1: Upsert Company
            const { data: savedCompany, error: companyError } = await (supabase.from('companies') as any).upsert([companyPayload]).select().single();
            if (companyError) throw companyError;

            const savedCompanyId = savedCompany.id;

            // Step 2: Determine contacts to delete
            const currentContactIds = new Set(contacts.filter(c => c.id).map(c => c.id!));
            const contactsToDelete = originalContacts.filter(oc => oc.id && !currentContactIds.has(oc.id));

            if (contactsToDelete.length > 0) {
                const { error: deleteError } = await supabase.from('contacts').delete().in('id', contactsToDelete.map(c => c.id!));
                if (deleteError) throw deleteError;
            }

            // Step 3: Upsert current contacts
            if (contacts.length > 0) {
                const contactsToUpsert = contacts.map(({ tempId, ...contact }) => ({
                    ...contact,
                    company_id: savedCompanyId,
                }));
                const { error: upsertError } = await (supabase.from('contacts') as any).upsert(contactsToUpsert as Database['public']['Tables']['contacts']['Insert'][]);
                if (upsertError) throw upsertError;
            }

            toast.success(`Company "${savedCompany.name}" saved successfully!`);
            navigate(AppRoute.SuperAdminClients);

        } catch (err: any) {
            toast.error(`Save failed: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="text-center p-8"><p>Loading Client Details...</p></div>;
    if (error) return <Alert type="error" message={error} />;

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <Link to={AppRoute.SuperAdminClients} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to All Companies
                </Link>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : (isNew ? 'Create Company' : 'Save Changes')}
                </Button>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-3">
                <BuildingStorefrontIcon className="w-8 h-8 text-primary-600" />
                {isNew ? 'Create New Company' : `Edit: ${company.name}`}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Company Profile">
                        <Input label="Company Name (Required)" name="name" value={company.name || ''} onChange={handleCompanyChange} required />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-montserrat">Company Logo</label>
                            <Input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setCompanyLogoFile(file);
                                        setCompanyLogoPreview(URL.createObjectURL(file));
                                    }
                                }}
                                accept="image/*"
                            />
                            {companyLogoPreview && <img src={companyLogoPreview} alt="Logo Preview" className="mt-2 h-20 w-auto rounded-md bg-slate-100 dark:bg-slate-700 p-2 border border-slate-200 dark:border-slate-600" />}
                        </div>
                        <Input label="Website URL" name="website_url" value={company.website_url || ''} onChange={handleCompanyChange} placeholder="https://example.com" />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="City" name="city" value={company.city || ''} onChange={handleCompanyChange} />
                            <Input label="Country" name="country" value={company.country || ''} onChange={handleCompanyChange} />
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
                            <textarea id="notes" name="notes" value={company.notes || ''} onChange={handleCompanyChange} rows={4} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500/50 outline-none transition" />
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card title="Contacts" icon={<UsersGroupIcon className="w-6 h-6 text-primary-600" />}>
                        <div className="space-y-4">
                            {contacts.length === 0 ? (
                                <p className="text-center text-slate-500 py-4">No contacts added yet.</p>
                            ) : (
                                contacts.map((contact, index) => (
                                    <div key={contact.tempId} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 relative">
                                        <div className="absolute top-2 right-2 flex items-center gap-2">
                                            <label className="flex items-center text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                                                <input type="radio" name="is_primary" checked={contact.is_primary} onChange={() => setPrimaryContact(contact.tempId)} className="h-4 w-4 text-primary-600 focus:ring-primary-500" />
                                                <StarIcon className={`w-4 h-4 ml-1 ${contact.is_primary ? 'text-amber-500' : 'text-slate-400'}`} />
                                                <span className="ml-1">Primary</span>
                                            </label>
                                            <Button type="button" size="sm" variant="link" className="text-accent-500 p-1" onClick={() => removeContact(contact.tempId)}><TrashIcon className="w-4 h-4" /></Button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                            <Input label="Full Name" value={contact.name || ''} onChange={e => handleContactChange(contact.tempId, 'name', e.target.value)} required />
                                            <Input label="Position" value={contact.position || ''} onChange={e => handleContactChange(contact.tempId, 'position', e.target.value)} />
                                            <Input label="Email" type="email" value={contact.email || ''} onChange={e => handleContactChange(contact.tempId, 'email', e.target.value)} />
                                            <Input label="Phone" value={contact.phone || ''} onChange={e => handleContactChange(contact.tempId, 'phone', e.target.value)} />
                                        </div>
                                    </div>
                                ))
                            )}
                            <Button type="button" variant="neutral" onClick={addContact} leftIcon={<PlusCircleIcon className="w-5 h-5" />}>
                                Add Contact
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </form>
    );
};

export default SuperAdminClientDetailPage;
