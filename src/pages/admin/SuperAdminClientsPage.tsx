// src/pages/admin/SuperAdminClientsPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Database } from '../../database.types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import { UsersGroupIcon, PlusCircleIcon, PencilSquareIcon, TrashIcon } from '../../components/Icons';
import { toast } from 'react-hot-toast';
import { AppRoute } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

type CompanyRow = Database['public']['Tables']['companies']['Row'];

const SuperAdminClientsPage: React.FC = () => {
    const [companies, setCompanies] = useState<CompanyRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useLanguage();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase.from('companies').select('*').order('name');
            if (fetchError) throw fetchError;
            setCompanies(data || []);
        } catch (err: any) {
            setError(err.message);
            toast.error(`Failed to load companies: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDeleteCompany = async (company: CompanyRow) => {
        if (window.confirm(`Are you sure you want to delete "${company.name}"? This will not delete associated events, but will unlink them.`)) {
            const { error } = await supabase.from('companies').delete().eq('id', company.id);
            if (error) {
                toast.error(`Failed to delete company: ${error.message}`);
            } else {
                toast.success(`Company "${company.name}" deleted.`);
                fetchData();
            }
        }
    };
    
    const filteredCompanies = useMemo(() => {
        if (!searchTerm) return companies;
        const lowercasedFilter = searchTerm.toLowerCase();
        return companies.filter(c => 
            c.name.toLowerCase().includes(lowercasedFilter) ||
            (c.country || '').toLowerCase().includes(lowercasedFilter)
        );
    }, [companies, searchTerm]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold flex items-center"><UsersGroupIcon className="w-8 h-8 mr-3 text-primary-600" /> {t(localeKeys.superAdminClientsTitle)}</h1>
            {error && <Alert type="error" message={error} />}

            <Card>
                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                    <Input wrapperClassName="!mb-0 flex-grow" placeholder="Search by name or country..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} disabled={loading} />
                    <Link to={AppRoute.SuperAdminClientDetail.replace(':companyId', 'new')}>
                        <Button leftIcon={<PlusCircleIcon className="w-5 h-5"/>} disabled={loading}>
                            Add New Company
                        </Button>
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Website</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={4} className="p-4 text-center text-slate-500">Loading companies...</td></tr>
                            ) : filteredCompanies.length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-center text-slate-500">{searchTerm ? "No companies match your search." : "No companies found."}</td></tr>
                            ) : (
                                filteredCompanies.map(company => (
                                    <tr key={company.id}>
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                            {company.logo_url ? <img src={company.logo_url} alt="logo" className="h-8 w-8 object-contain rounded-sm"/> : <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-sm"></div>}
                                            <Link to={AppRoute.SuperAdminClientDetail.replace(':companyId', company.id)} className="hover:underline text-primary-600 dark:text-primary-400 font-bold">
                                                {company.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                            {company.website_url ? <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary-600">{company.website_url}</a> : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{[company.city, company.country].filter(Boolean).join(', ') || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm space-x-2">
                                            <Link to={AppRoute.SuperAdminClientDetail.replace(':companyId', company.id)}>
                                                <Button size="sm" variant="neutral" leftIcon={<PencilSquareIcon className="w-4 h-4"/>}>Details</Button>
                                            </Link>
                                            <Button size="sm" variant="accent" onClick={() => handleDeleteCompany(company)} leftIcon={<TrashIcon className="w-4 h-4"/>}>Delete</Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                         </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default SuperAdminClientsPage;