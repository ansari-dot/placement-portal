import React, { useState, useEffect, useCallback } from 'react';
import IndustryLayout from '../components/layout/IndustryLayout';
import IndustriesDashboard from '../components/industry/IndustriesDashboard';
import AddNewIndustryWizard from '../components/industry/AddNewIndustryWizard';
// CHANGED: ScoreTab import and Trophy icon removed - Score now lives on its own page (ScorePage.jsx)
import { fetchIndustries, createIndustry, updateIndustry, fetchIndustryStats, deleteIndustry } from '../api/industryApi';
import { toast } from 'react-toastify';
import { Building2 } from 'lucide-react';
import { fetchUsers } from '../api/userApi';

export default function IndustryPage() {

  // View: dashboard, random-industry form, or partner onboarding form.
  const [currentView, setCurrentView] = useState('dashboard');
  // Industries directory category tabs.
  const [activeTab, setActiveTab] = useState('random');
  const [users, setUsers] = useState([]);
  const [partnerForm, setPartnerForm] = useState({ industryName: '', industryType: '', address: '', suburb: '', state: '', postCode: '', country: 'Australia', contactPersonName: '', contactPhone: '', contactEmail: '', onboardedByName: '', onboardedBy: '', partnershipInfo: '', documents: [] });

  const [industries, setIndustries] = useState([]);
  const [stats, setStats] = useState({
    totalIndustries: 0,
    activeIndustries: 0,
    inactiveIndustries: 0,
    totalStudents: 0,
    totalJobs: 0,
  });

  const loadData = useCallback(async (filters = {}) => {
    try {
      const [indList, indStats] = await Promise.all([
        fetchIndustries(filters),
        fetchIndustryStats(),
      ]);
      if (indList.success && indList.data) setIndustries(indList.data);
      if (indStats.success && indStats.data) setStats(indStats.data);
    } catch (err) {
      console.error('Failed to load Industry data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    fetchUsers({ status: 'Active' }).then(r => setUsers(r.data || [])).catch(() => {});
  }, [loadData]);

  const handleCreatePartner = async (event) => {
    event.preventDefault();
    try {
      await createIndustry({ ...partnerForm, industryCategory: 'Partner' });
      toast.success('Partner Industry added');
      setPartnerForm({ industryName: '', industryType: '', address: '', suburb: '', state: '', postCode: '', country: 'Australia', contactPersonName: '', contactPhone: '', contactEmail: '', onboardedByName: '', onboardedBy: '', partnershipInfo: '', documents: [] });
      setCurrentView('dashboard');
      setActiveTab('partner');
      await loadData();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to add Partner Industry'); }
  };

  const handleCreateIndustry = useCallback(async (formData) => {
    try {
      await createIndustry(formData);
      toast.success('Industry created successfully');
      await loadData();
    } catch (err) {
      console.error('Failed to create Industry:', err);
      toast.error(err?.response?.data?.message || 'Failed to create Industry');
      throw err;
    }
  }, [loadData]);

  const handleUpdateIndustry = useCallback(async (id, updateData) => {
    try {
      const res = await updateIndustry(id, updateData);
      toast.success(res?.message || 'Industry updated successfully');
      await loadData();
    } catch (err) {
      console.error('Failed to update Industry:', err);
      toast.error(err?.response?.data?.message || 'Failed to update Industry');
      throw err;
    }
  }, [loadData]);

  const handleDeleteIndustry = useCallback(async (id, name) => {
    try {
      const res = await deleteIndustry(id);
      toast.success(res?.message || `${name || 'Industry'} deleted successfully`);
      await loadData();
    } catch (err) {
      console.error('Failed to delete Industry:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete Industry');
    }
  }, [loadData]);

  const handleAddNewIndustry = () => {
    setActiveTab('random');
    setCurrentView('add-wizard');
  };
  const updatePartner = (key, value) => setPartnerForm(old => ({ ...old, [key]: value }));

  const tabClass = (tab) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
      activeTab === tab
        ? 'border-indigo-600 text-indigo-600'
        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
    }`;

  return (
    <IndustryLayout
      title={currentView === 'dashboard' ? 'Industries' : 'Add New Industry'}
      breadcrumbs={
        currentView === 'dashboard'
          ? ['Dashboard', 'Partners', 'Industries']
          : ['Dashboard', 'Partners', 'Industries', 'Add New Industry']
      }
    >
      {currentView === 'add-partner' ? (
        <form onSubmit={handleCreatePartner} className="max-w-4xl mx-auto p-6 bg-white rounded-xl border border-slate-200 space-y-5">
          <div><h2 className="text-xl font-bold">Add Partner Industry</h2><p className="text-sm text-slate-500">Formal partner onboarding. No student is required.</p></div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ['industryName','Industry Name'],['industryType','Industry Type'],['address','Address'],['suburb','City/Suburb'],['state','State'],['postCode','Postcode'],['country','Country'],['contactPersonName','Contact Person Name'],['contactPhone','Contact Number'],['contactEmail','Email'],['onboardedByName','Onboarded By'],['partnershipInfo','MOU / Partnership Information']
            ].map(([key,label]) => <label key={key} className="text-xs font-semibold text-slate-600">{label} <span className="text-rose-500">*</span><input required value={partnerForm[key]} onChange={e=>updatePartner(key,e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" /></label>)}
            <label className="text-xs font-semibold text-slate-600">Portal User (optional)<select value={partnerForm.onboardedBy} onChange={e=>{const u=users.find(x=>x._id===e.target.value); setPartnerForm(old=>({...old,onboardedBy:e.target.value,onboardedByName:u?.name||old.onboardedByName}));}} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"><option value="">Link later</option>{users.map(u=><option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}</select></label>
            <label className="text-xs font-semibold text-slate-600">Documents <span className="text-rose-500">*</span><input required={partnerForm.documents.length === 0} type="file" multiple onChange={e=>{
              const files = Array.from(e.target.files || []);
              Promise.all(files.map(file => new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, fileName: file.name, file: reader.result, size: `${(file.size / 1024).toFixed(1)} KB`, uploadDate: new Date().toLocaleDateString() }); reader.readAsDataURL(file); }))).then(docs => updatePartner('documents', [...partnerForm.documents, ...docs]));
            }} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />{partnerForm.documents.length > 0 && <span className="block mt-1 text-slate-500">{partnerForm.documents.map(d=>d.name).join(', ')}</span>}</label>
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={()=>setCurrentView('dashboard')} className="px-4 py-2 border rounded-lg">Cancel</button><button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Add Partner Industry</button></div>
        </form>
      ) : currentView === 'add-wizard' ? (
        <div className="relative">
          <div className="max-w-7xl mx-auto px-2 pt-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-xs font-semibold text-blue-600 hover:underline mb-1 flex items-center space-x-1"
            >
              ← Back to Industry List
            </button>
          </div>
          <AddNewIndustryWizard
            onCancel={() => setCurrentView('dashboard')}
            onComplete={() => setCurrentView('dashboard')}
            onCreateIndustry={handleCreateIndustry}
          />
        </div>
      ) : (
        <div className="flex flex-col">

          {/* ── Tab bar: All Industries | My Industries ── */}
          <div className="px-6 pt-1 bg-white border-b border-slate-200">
            <div className="flex items-center gap-1 max-w-[1600px] mx-auto">
              <button onClick={() => setActiveTab('random')} className={tabClass('random')}>
                <Building2 className="w-4 h-4" />
                Random Industries
              </button>
              <button onClick={() => setActiveTab('partner')} className={tabClass('partner')}>
                <Building2 className="w-4 h-4" /> Partner Industries
              </button>
            </div>
          </div>

          {/* ── Tab content ── */}
          {(activeTab === 'random' || activeTab === 'partner') && (
            <IndustriesDashboard
              onAddNewIndustry={() => activeTab === 'partner' ? setCurrentView('add-partner') : handleAddNewIndustry()}
              industries={industries.filter(i => (i.industryCategory || 'Random') === (activeTab === 'partner' ? 'Partner' : 'Random'))}
              stats={stats}
              onFilterChange={loadData}
              onDeleteIndustry={handleDeleteIndustry}
              onUpdateIndustry={handleUpdateIndustry}
              onNavigateToPartners={() => setActiveTab('partner')}
              category={activeTab === 'partner' ? 'Partner' : 'Random'}
              users={users}
            />
          )}

        </div>
      )}
    </IndustryLayout>
  );
}
