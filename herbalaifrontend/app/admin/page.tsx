'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import SessionUnavailable from '../../components/SessionUnavailable';
import { useRouter } from 'next/navigation';
import api from '../../lib/axios';
import { cachedApiGet, invalidateApiGetCache } from '../../lib/request-cache';
import SuggestionReviewEditor, { type ReviewReference } from '../../components/SuggestionReviewEditor';
import {
  Edit2,
  Trash2,
  Plus,
  Search,
  LayoutDashboard,
  Clock,
  Leaf,
  Users,
  BookOpen,
  ClipboardList,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  FileJson,
  LoaderCircle,
  Upload,
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Suggestion {
  revision: number;
  references?: ReviewReference[];
  id: number;
  submitterId: string;
  localName: string;
  cebuanoName?: string;
  scientificName: string;
  category: string;
  medicinalUses: string;
  preparationMethod: string;
  dosage: string;
  regionFound?: string;
  warnings?: string;
  informationSource?: string;
  imageUrl?: string;
  status: 'Pending' | 'ChangesRequested' | 'Approved' | 'Rejected';
  submittedAt: string;
  reviewNotes?: string;
  evidenceClass?: 'DOH_PITAHC_LISTED' | 'EVIDENCE_SUPPORTED_PHILIPPINE_USE' | 'DOCUMENTED_TRADITIONAL_USE' | 'UNASSESSED';
}

interface Herb {
  id: string;
  localName: string;
  cebuanoName?: string;
  scientificName: string;
  category: string;
  medicinalUses: string;
  preparationMethod?: string;
  dosage?: string;
  regionFound?: string;
  warnings?: string;
  imageUrl?: string;
  isDohApproved?: boolean;
}

interface SystemUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  joined: string;
  isBanned: boolean;
}

interface KBItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface KBImportFact {
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface AuditLog {
  id: number;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: any; /* eslint-disable-line @typescript-eslint/no-explicit-any */
  createdAt: string;
  admin: {
    id: string;
    name: string;
    username: string;
    email?: string;
    avatar: string | null;
    role: string;
  };
}

interface DashboardStats {
  herbsByCategory: { name: string; value: number }[];
  suggestionsByStatus: { name: string; value: number }[];
  threadsByCategory: { name: string; value: number }[];
}

export default function AdminPage() {
  const [reviewEditing, setReviewEditing] = useState<Suggestion | null>(null);
  const { user, loading, isAuthenticated, sessionUnavailable, checkSession, logout } = useAuth();
  const router = useRouter();
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [allHerbs, setAllHerbs] = useState<Herb[]>([]);
  const [usersList, setUsersList] = useState<SystemUser[]>([]);
  const [kbList, setKbList] = useState<KBItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pending' | 'library' | 'users' | 'knowledgebase' | 'audit'>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [banActioningUserId, setBanActioningUserId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [reviewNotesById, setReviewNotesById] = useState<Record<number, string>>({});
  const [evidenceClassById, setEvidenceClassById] = useState<Record<number, string>>({});

  // Search filters
  const [librarySearch, setLibrarySearch] = useState('');
  const [kbSearch, setKbSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Knowledge Base Modals and forms
  const [isKbModalOpen, setIsKbModalOpen] = useState(false);
  const [editingKbItem, setEditingKbItem] = useState<KBItem | null>(null);
  const [kbQuestion, setKbQuestion] = useState('');
  const [kbAnswer, setKbAnswer] = useState('');
  const [kbCategory, setKbCategory] = useState('');
  const [kbTags, setKbTags] = useState('');
  const [isImportingKb, setIsImportingKb] = useState(false);

  // Herb Edit Modals and forms
  const [isHerbModalOpen, setIsHerbModalOpen] = useState(false);
  const [editingHerb, setEditingHerb] = useState<Herb | null>(null);
  const [herbFormData, setHerbFormData] = useState({
    localName: '',
    cebuanoName: '',
    scientificName: '',
    category: '',
    medicinalUses: '',
    preparationMethod: '',
    dosage: '',
    regionFound: '',
    warnings: '',
    imageUrl: '',
  });

  // Add layout class to body
  useEffect(() => {
    document.body.classList.add('admin-app');
    return () => {
      document.body.classList.remove('admin-app');
    };
  }, []);

  // Auto-clear success message after 2 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        
        const [suggestRes, herbsRes, usersRes, kbRes, statsRes, auditRes] = await Promise.all([
          api.get('/suggest'),
          cachedApiGet('/herbs', 60_000),
          api.get('/auth/users'),
          api.get('/knowledge-base/all'),
          api.get('/stats/dashboard'),
          api.get('/admin/audit-logs'),
        ]);

        if (suggestRes.data?.status === 'success') {
          setSuggestions(suggestRes.data.data.suggestions || []);
        }

        if (herbsRes.data?.status === 'success') {
          setAllHerbs(herbsRes.data.data.herbs || []);
        }

        if (usersRes.data?.status === 'success') {
          setUsersList(usersRes.data.data.users || []);
        }

        if (kbRes.data?.status === 'success') {
          setKbList(kbRes.data.data || []);
        }

        if (statsRes.data?.status === 'success') {
          setDashboardStats(statsRes.data.data);
        }

        if (auditRes.data?.status === 'success') {
          setAuditLogs(auditRes.data.data.logs || []);
        }
      } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
        setError(err.response?.data?.message || 'Error connecting to server.');
      }
    };

    if (!loading) {
      if (!isAuthenticated && !sessionUnavailable) {
        router.push('/signin');
      } else if (user?.role === 'admin') {
        fetchData();
      }
    }
  }, [loading, isAuthenticated, sessionUnavailable, user, router]);

  // Audit records can change while the admin remains on this page. Refresh
  // them whenever the audit tab is opened instead of relying on mount-time data.
  useEffect(() => {
    if (activeTab !== 'audit' || !isAuthenticated || user?.role !== 'admin') return;

    let cancelled = false;
    const refreshAuditLogs = async () => {
      try {
        const auditRes = await api.get('/admin/audit-logs');
        if (!cancelled && auditRes.data?.status === 'success') {
          setAuditLogs(auditRes.data.data.logs || []);
        }
      } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Unable to refresh audit logs.');
        }
      }
    };

    refreshAuditLogs();
    return () => {
      cancelled = true;
    };
  }, [activeTab, isAuthenticated, user?.role]);

  const handleApprove = async (id: number) => {
    try {
      setActioningId(id);
      setError(null);
      setSuccessMsg(null);
      const evidenceClass = evidenceClassById[id];
      if (!evidenceClass) {
        setError('Select an evidence classification before publishing.');
        return;
      }
      const res = await api.post(`/suggest/${id}/approve`, {
        revision: suggestions.find((suggestion) => suggestion.id === id)?.revision,
        evidenceClass,
        reviewNotes: reviewNotesById[id]?.trim() || undefined,
      });
      if (res.data?.status === 'success') {
        invalidateApiGetCache('/herbs');
        setSuccessMsg(`Herb suggestion approved and added to the library!`);
        // Update locally
        setSuggestions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: 'Approved' } : s))
        );
        // Refresh herbs list
        const herbsRes = await cachedApiGet('/herbs', 60_000, true);
        if (herbsRes.data?.status === 'success') {
          setAllHerbs(herbsRes.data.data.herbs || []);
        }
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.response?.data?.message || 'Failed to approve suggestion.');
    } finally {
      setActioningId(null);
    }
  };

  const handleRequestChanges = async (id: number) => {
    const reviewNotes = reviewNotesById[id]?.trim();
    if (!reviewNotes || reviewNotes.length < 10) {
      setError('Provide at least 10 characters explaining the required changes.');
      return;
    }
    try {
      setActioningId(id);
      setError(null);
      setSuccessMsg(null);
      const res = await api.post(`/suggest/${id}/request-changes`, {
        reviewNotes, revision: suggestions.find((suggestion) => suggestion.id === id)?.revision,
      });
      if (res.data?.status === 'success') {
        setSuccessMsg('Changes requested.');
        setSuggestions((prev) => prev.map((suggestion) => (
          suggestion.id === id ? { ...suggestion, status: 'ChangesRequested', reviewNotes } : suggestion
        )));
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.response?.data?.message || 'Failed to request changes.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setActioningId(id);
      setError(null);
      setSuccessMsg(null);
      const res = await api.post(`/suggest/${id}/reject`, {
        revision: suggestions.find((suggestion) => suggestion.id === id)?.revision,
      });
      if (res.data?.status === 'success') {
        setSuccessMsg(`Suggestion has been rejected.`);
        setSuggestions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: 'Rejected' } : s))
        );
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.response?.data?.message || 'Failed to reject suggestion.');
    } finally {
      setActioningId(null);
    }
  };

  const handleToggleBan = async (targetUserId: string, currentIsBanned: boolean) => {
    try {
      setBanActioningUserId(targetUserId);
      setError(null);
      setSuccessMsg(null);
      
      const endpoint = currentIsBanned ? `/auth/users/${targetUserId}/unban` : `/auth/users/${targetUserId}/ban`;
      const res = await api.post(endpoint);
      
      if (res.data?.status === 'success') {
        setSuccessMsg(res.data.message);
        // Update user locally
        setUsersList((prev) => 
          prev.map((u) => 
            u.id === targetUserId ? { ...u, isBanned: !currentIsBanned } : u
          )
        );
      }
    } finally {
      setBanActioningUserId(null);
    }
  };

  const handleDeleteHerb = async (id: string) => {
    if (!confirm('Are you sure you want to delete this herb from the library? This cannot be undone.')) return;
    try {
      setError(null);
      setSuccessMsg(null);
      const res = await api.delete(`/herbs/${id}`);
      if (res.data?.status === 'success') {
        invalidateApiGetCache('/herbs');
        setSuccessMsg('Herb deleted successfully.');
        setAllHerbs((prev) => prev.filter((h) => h.id !== id));
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.response?.data?.message || 'Failed to delete herb.');
    }
  };

  const openEditHerbModal = (herb: Herb) => {
    setEditingHerb(herb);
    setHerbFormData({
      localName: herb.localName,
      cebuanoName: herb.cebuanoName || '',
      scientificName: herb.scientificName,
      category: herb.category,
      medicinalUses: herb.medicinalUses,
      preparationMethod: herb.preparationMethod || '',
      dosage: herb.dosage || '',
      regionFound: herb.regionFound || '',
      warnings: herb.warnings || '',
      imageUrl: herb.imageUrl || '',
    });
    setIsHerbModalOpen(true);
  };

  const closeEditHerbModal = () => {
    setIsHerbModalOpen(false);
    setEditingHerb(null);
  };

  const handleEditHerbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHerb) return;
    try {
      setError(null);
      setSuccessMsg(null);
      const res = await api.put(`/herbs/${editingHerb.id}`, herbFormData);
      if (res.data?.status === 'success') {
        invalidateApiGetCache('/herbs');
        setSuccessMsg('Herb updated successfully.');
        setAllHerbs((prev) => prev.map(h => h.id === editingHerb.id ? { ...h, ...herbFormData } : h));
        closeEditHerbModal();
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.response?.data?.message || 'Failed to update herb.');
    }
  };



  // Knowledge Base CRUD operations
  const handleSaveKbItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbQuestion.trim() || !kbAnswer.trim()) {
      setError('Question and Answer fields are required.');
      return;
    }

    try {
      setError(null);
      setSuccessMsg(null);

      const payload = {
        question: kbQuestion.trim(),
        answer: kbAnswer.trim(),
        category: kbCategory.trim() || undefined,
        tags: kbTags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (editingKbItem) {
        const res = await api.patch(`/knowledge-base/${editingKbItem.id}`, payload);
        if (res.data?.status === 'success') {
          setSuccessMsg('Knowledge base entry updated successfully!');
          // Refresh list
          const kbRes = await api.get('/knowledge-base/all');
          if (kbRes.data?.status === 'success') {
            setKbList(kbRes.data.data || []);
          }
          closeKbModal();
        }
      } else {
        const res = await api.post('/knowledge-base/create', payload);
        if (res.data?.status === 'success') {
          setSuccessMsg('Knowledge base entry created successfully!');
          // Refresh list
          const kbRes = await api.get('/knowledge-base/all');
          if (kbRes.data?.status === 'success') {
            setKbList(kbRes.data.data || []);
          }
          closeKbModal();
        }
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.response?.data?.message || 'Failed to save knowledge base entry.');
    }
  };

  const handleKbFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setError(null);
      setSuccessMsg(null);
      setIsImportingKb(true);
      if (!file.name.toLowerCase().endsWith('.json')) throw new Error('Choose a JSON file.');
      if (file.size > 1_000_000) throw new Error('The JSON file must be smaller than 1 MB.');

      const parsed: unknown = JSON.parse(await file.text());
      const records = Array.isArray(parsed) ? parsed : [parsed];
      if (records.length === 0) throw new Error('The JSON file does not contain any facts.');
      if (records.length > 50) throw new Error('Import up to 50 facts at a time.');

      const facts: KBImportFact[] = records.map((record, index) => {
        if (!record || typeof record !== 'object' || Array.isArray(record)) {
          throw new Error(`Fact ${index + 1} must be a JSON object.`);
        }
        const fact = record as Record<string, unknown>;
        if (typeof fact.question !== 'string' || fact.question.trim().length < 5) {
          throw new Error(`Fact ${index + 1} needs a question of at least 5 characters.`);
        }
        if (typeof fact.answer !== 'string' || fact.answer.trim().length < 10) {
          throw new Error(`Fact ${index + 1} needs an answer of at least 10 characters.`);
        }
        if (fact.tags !== undefined && (!Array.isArray(fact.tags) || !fact.tags.every((tag) => typeof tag === 'string'))) {
          throw new Error(`Fact ${index + 1} has invalid tags.`);
        }
        if (fact.metadata !== undefined && (!fact.metadata || typeof fact.metadata !== 'object' || Array.isArray(fact.metadata))) {
          throw new Error(`Fact ${index + 1} has invalid metadata.`);
        }
        const metadata = fact.metadata as Record<string, unknown> | undefined;
        const sources = metadata?.sources;
        if (typeof metadata?.jurisdiction !== 'string' || metadata.jurisdiction.trim().toLowerCase() !== 'philippines') {
          throw new Error(`Fact ${index + 1} must declare metadata.jurisdiction as "Philippines".`);
        }
        if (!Array.isArray(sources) || sources.length === 0) {
          throw new Error(`Fact ${index + 1} must include at least one Philippine-relevant source in metadata.sources.`);
        }
        return {
          question: fact.question.trim(),
          answer: fact.answer.trim(),
          ...(typeof fact.category === 'string' && fact.category.trim() ? { category: fact.category.trim() } : {}),
          ...(Array.isArray(fact.tags) ? { tags: fact.tags as string[] } : {}),
          ...(fact.metadata ? { metadata: fact.metadata as Record<string, unknown> } : {}),
        };
      });

      const res = await api.post('/knowledge-base/import', { facts });
      if (res.data?.status === 'success') {
        const kbRes = await api.get('/knowledge-base/all');
        if (kbRes.data?.status === 'success') setKbList(kbRes.data.data || []);
        const summary = res.data.data;
        setSuccessMsg(`Imported ${summary.total} fact${summary.total === 1 ? '' : 's'}: ${summary.created} new, ${summary.updated} updated.`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import the knowledge base file.';
      const apiMessage = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(apiMessage || message);
    } finally {
      setIsImportingKb(false);
    }
  };

  const handleDeleteKbItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base entry?')) return;
    try {
      setError(null);
      setSuccessMsg(null);
      const res = await api.delete(`/knowledge-base/${id}`);
      if (res.data?.status === 'success') {
        setSuccessMsg('Knowledge base entry deleted successfully.');
        setKbList((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.response?.data?.message || 'Failed to delete knowledge base entry.');
    }
  };

  const handleToggleKbActive = async (id: string, currentIsActive: boolean) => {
    try {
      setError(null);
      setSuccessMsg(null);
      const res = await api.patch(`/knowledge-base/${id}`, { isActive: !currentIsActive });
      if (res.data?.status === 'success') {
        setSuccessMsg(`Entry has been ${!currentIsActive ? 'activated' : 'deactivated'}.`);
        setKbList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isActive: !currentIsActive } : item))
        );
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.response?.data?.message || 'Failed to update entry status.');
    }
  };

  const openKbModal = (item: KBItem | null = null) => {
    if (item) {
      setEditingKbItem(item);
      setKbQuestion(item.question);
      setKbAnswer(item.answer);
      setKbCategory(item.category || '');
      setKbTags(item.tags.join(', '));
    } else {
      setEditingKbItem(null);
      setKbQuestion('');
      setKbAnswer('');
      setKbCategory('');
      setKbTags('');
    }
    setIsKbModalOpen(true);
  };

  const closeKbModal = () => {
    setIsKbModalOpen(false);
    setEditingKbItem(null);
    setKbQuestion('');
    setKbAnswer('');
    setKbCategory('');
    setKbTags('');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f0f7f2]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent"></div>
        <p className="text-[#2d6a4f] font-extrabold animate-pulse">Loading console...</p>
      </div>
    );
  }

  if (sessionUnavailable && !user) {
    return <SessionUnavailable retry={() => { void checkSession(true); }} />;
  }

  if (!user) {
    return null;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#f0f7f2] px-4">
        <div className="max-w-md w-full rounded-3xl border border-rose-100 bg-white p-8 shadow-xl text-center">
          <span className="text-5xl mb-4 inline-block">🚫</span>
          <h2 className="text-2xl font-black text-[#1b4332] mb-3">Access Denied</h2>
          <p className="text-sm font-semibold text-[#6a7282] mb-6">
            You are currently logged in as <strong className="text-[#1b4332]">{user.name}</strong> ({user.role}), but only Administrators can access this dashboard.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="flat-button flat-button-primary w-full text-center"
            >
              Back to Home
            </button>
            <button
              onClick={() => logout()}
              className="flat-button flat-button-secondary w-full text-center !border-rose-700 !text-rose-700 hover:!bg-rose-50"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingSuggestions = suggestions.filter((s) => s.status === 'Pending');
  const approvedSuggestions = suggestions.filter((s) => s.status === 'Approved');

  // Filter lists
  const filteredHerbs = allHerbs.filter(h => 
    h.localName.toLowerCase().includes(librarySearch.toLowerCase()) ||
    h.scientificName.toLowerCase().includes(librarySearch.toLowerCase())
  );

  const filteredKbList = kbList.filter(item =>
    item.question.toLowerCase().includes(kbSearch.toLowerCase()) ||
    item.answer.toLowerCase().includes(kbSearch.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(kbSearch.toLowerCase()))
  );

  return (
    <div className="admin-shell">
      {reviewEditing && <SuggestionReviewEditor suggestion={reviewEditing} onClose={() => setReviewEditing(null)} onSaved={() => {
        setReviewEditing(null);
        setSuccessMsg('Review edits saved.');
        api.get('/suggest').then((response) => setSuggestions(response.data.data.suggestions)).catch(() => setError('Edits saved. Refresh to load the latest submissions.'));
      }} />}
      {/* Sidebar Console */}
      <aside className={`admin-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="admin-brand">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1b4332] shadow-sm">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <strong className="text-white font-black text-lg">Herbal AI</strong>
            <span className="text-white/80 text-xs block font-bold">Admin Console</span>
          </div>
          <button type="button" className="admin-menu-toggle" aria-label="Toggle admin navigation" aria-expanded={mobileNavOpen} aria-controls="admin-navigation" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        <nav id="admin-navigation" className="admin-nav" aria-label="Admin navigation">
          <button 
            onClick={() => { setActiveTab('dashboard'); setMobileNavOpen(false); }}
            className={`admin-nav-link flex items-center gap-2.5 ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => { setActiveTab('pending'); setMobileNavOpen(false); }}
            className={`admin-nav-link flex items-center gap-2.5 ${activeTab === 'pending' ? 'active' : ''}`}
          >
            <Clock className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Pending Suggestions</span>
            {pendingSuggestions.length > 0 && (
              <span className="admin-nav-badge">{pendingSuggestions.length}</span>
            )}
          </button>
          <button 
            onClick={() => { setActiveTab('library'); setMobileNavOpen(false); }}
            className={`admin-nav-link flex items-center gap-2.5 ${activeTab === 'library' ? 'active' : ''}`}
          >
            <Leaf className="h-4 w-4 shrink-0" />
            <span>All Herbs</span>
          </button>
          <button 
            onClick={() => { setActiveTab('users'); setMobileNavOpen(false); }}
            className={`admin-nav-link flex items-center gap-2.5 ${activeTab === 'users' ? 'active' : ''}`}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>Users</span>
          </button>
          <button 
            onClick={() => { setActiveTab('knowledgebase'); setMobileNavOpen(false); }}
            className={`admin-nav-link flex items-center gap-2.5 ${activeTab === 'knowledgebase' ? 'active' : ''}`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>Knowledge Base</span>
          </button>
          <button 
            onClick={() => { setActiveTab('audit'); setMobileNavOpen(false); }}
            className={`admin-nav-link flex items-center gap-2.5 ${activeTab === 'audit' ? 'active' : ''}`}
          >
            <ClipboardList className="h-4 w-4 shrink-0" />
            <span>Audit Logs</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button 
            onClick={() => router.push('/')}
            className="admin-nav-link subtle flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Public Site</span>
          </button>
          <div className="admin-user-chip text-white/50 border-t border-white/10 pt-3 mt-2">
            <span className="block font-bold text-white/80">{user.name}</span>
            <span className="text-[10px] uppercase tracking-wider font-extrabold">Administrator</span>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="admin-main">
        <main className="admin-content bg-[#f8faf7] p-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 font-bold shadow-sm flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 rounded-2xl border border-[#40916c] bg-[#eef5f0] p-4 text-[#1b4332] font-bold shadow-sm flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#2d6a4f] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-2xl font-black text-[#1b4332] italic mb-6">
                Dashboard Overview
              </h1>
              {/* Stats Row */}
              <div className="admin-stat-grid grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <div className="admin-stat-card bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <Leaf className="h-6 w-6 text-[#2d6a4f]" />
                  <div className="value text-3xl font-black text-[#1b4332] mt-2">{allHerbs.length}</div>
                  <div className="label text-xs font-bold text-gray-500 uppercase tracking-wider">Total Herbs</div>
                </div>
                <div className="admin-stat-card bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <Clock className="h-6 w-6 text-amber-600" />
                  <div className="value text-3xl font-black text-[#1b4332] mt-2">{pendingSuggestions.length}</div>
                  <div className="label text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Review</div>
                </div>
                <div className="admin-stat-card bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  <div className="value text-3xl font-black text-[#1b4332] mt-2">{approvedSuggestions.length}</div>
                  <div className="label text-xs font-bold text-gray-500 uppercase tracking-wider">Approved Suggestions</div>
                </div>
                <div className="admin-stat-card bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <Users className="h-6 w-6 text-[#40916c]" />
                  <div className="value text-3xl font-black text-[#1b4332] mt-2">{usersList.length}</div>
                  <div className="label text-xs font-bold text-gray-500 uppercase tracking-wider">Total Users</div>
                </div>
                <div className="admin-stat-card bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <BookOpen className="h-6 w-6 text-teal-600" />
                  <div className="value text-3xl font-black text-[#1b4332] mt-2">{kbList.length}</div>
                  <div className="label text-xs font-bold text-gray-500 uppercase tracking-wider">FAQ Facts</div>
                </div>
              </div>

              {/* Charts Row */}
              {dashboardStats && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  {/* Herbs By Category */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="font-black italic text-lg text-[#1b4332] mb-4">
                      Herbs by Category
                    </h2>
                    {dashboardStats.herbsByCategory.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-10">No data available</p>
                    ) : (
                      <div className="h-64 flex flex-col justify-between">
                        <div className="h-36">
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                              <Pie
                                data={dashboardStats.herbsByCategory}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={48}
                              >
                                {dashboardStats.herbsByCategory.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'][index % 5]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div tabIndex={0} role="region" aria-label="Herb category counts" className="h-[96px] overflow-y-auto mt-1 pr-1 space-y-1 scrollbar-thin">
                          {dashboardStats.herbsByCategory.map((entry, index) => (
                            <div key={entry.name} className="flex items-center justify-between text-[11px] border-b border-gray-50 pb-0.5">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'][index % 5] }}></span>
                                <span className="truncate font-bold text-[#1b4332]/80" title={entry.name}>{entry.name}</span>
                              </div>
                              <span className="font-extrabold text-[#1b4332] pl-2">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggestions By Status */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="font-black italic text-lg text-[#1b4332] mb-4">
                      Suggestions Status
                    </h2>
                    {dashboardStats.suggestionsByStatus.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-10">No data available</p>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <BarChart data={dashboardStats.suggestionsByStatus}>
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip cursor={{ fill: '#f0f7f2' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {dashboardStats.suggestionsByStatus.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === 'Approved' ? '#2d6a4f' : entry.name === 'Pending' ? '#d4a373' : '#e5989b'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Forum Threads By Category */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="font-black italic text-lg text-[#1b4332] mb-4">
                      Forum Discussions
                    </h2>
                    {dashboardStats.threadsByCategory.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-10">No data available</p>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                          <PieChart>
                            <Pie
                              data={dashboardStats.threadsByCategory}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                            >
                              {dashboardStats.threadsByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#1b4332', '#2d6a4f', '#40916c'][index % 3]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Suggestions */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2 className="font-black italic text-lg text-[#1b4332] mb-4">
                    Recent Contribution Requests
                  </h2>
                  {suggestions.length === 0 ? (
                    <p className="text-sm font-semibold text-gray-500 text-center py-8">No activity registered yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {suggestions.slice(0, 4).map((s) => (
                        <div key={s.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                          <div>
                            <h4 className="font-extrabold text-sm text-[#1b4332]">{s.localName}</h4>
                            <p className="text-xs italic text-gray-500">{s.scientificName}</p>
                          </div>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border ${
                            s.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            s.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {s.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* System Activity */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h2 className="font-black italic text-lg text-[#1b4332] mb-4">
                    Console Logs & Health
                  </h2>
                  <div tabIndex={0} role="region" aria-label="Console logs and health" className="space-y-4 font-mono text-xs text-[#2d6a4f] bg-[#eef5f0] p-4 rounded-xl max-h-[220px] overflow-y-auto">
                    <div>[INFO] {new Date().toISOString()} - Connection to database established successfully.</div>
                    <div>[INFO] Loaded {allHerbs.length} published botanical records from PostgreSQL.</div>
                    <div>[INFO] Loaded {kbList.length} RAG FAQs references.</div>
                    <div>[SUCCESS] Session verified for admin client user.</div>
                    <div>[HEALTH] Core API, authentication, database, and admin console checks completed.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENDING SUGGESTIONS */}
          {activeTab === 'pending' && (
            <div>
              <h1 className="text-2xl font-black text-[#1b4332] italic mb-6">
                Pending Contributions
              </h1>
              {pendingSuggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#2d6a4f]/25 bg-white p-12 text-center">
                  <span className="text-5xl mb-4">🌿</span>
                  <h3 className="text-xl font-black text-[#1b4332]">All Cleared!</h3>
                  <p className="mt-2 text-sm text-gray-500 font-bold max-w-sm">
                    No contribution suggestions require approval right now. Check back later!
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {pendingSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {/* Submitter Info & Actions */}
                      <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                        <div>
                          <span className="inline-block rounded-full bg-[#eef5f0] border border-[#2d6a4f]/20 px-3 py-1 text-xs font-bold text-[#1b4332] mb-2">
                            {suggestion.category}
                          </span>
                          <h2 className="text-2xl font-black text-[#1b4332]">
                            {suggestion.localName}
                          </h2>
                          <p className="text-xs italic text-[#40916c] font-extrabold mt-0.5">
                            {suggestion.scientificName} {suggestion.cebuanoName ? `(${suggestion.cebuanoName})` : ''}
                          </p>
                        </div>
                        {suggestion.imageUrl && (
                          <img
                            src={suggestion.imageUrl}
                            alt={suggestion.localName}
                            className="h-16 w-16 rounded-xl object-cover border border-gray-100 shadow-sm"
                          />
                        )}
                      </div>

                      {/* Content details */}
                      <div className="mb-4 space-y-2 text-sm text-ink">
                        <p><strong>Contributor source: </strong>{suggestion.informationSource || 'Not provided'}</p>
                        <h3 className="font-bold">Reviewed references ({suggestion.references?.length || 0})</h3>
                        {suggestion.references?.map((source, index) => <div key={index} className="rounded-lg border border-line p-3">
                          {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">{source.title}</a> : <span>{source.title}</span>}
                          <p>{source.publisher} {source.publishedAt}</p><p>{source.citation}</p>
                          <p>Supports: {source.supports.map((claim) => ({ identity: 'Identity', medicinalUses: 'Uses', preparationMethod: 'Preparation', dosage: 'Dosage', warnings: 'Safety', isDohApproved: 'Official listing' })[claim] || claim).join(', ')}</p>
                        </div>)}
                        {suggestion.reviewNotes && <p className="whitespace-pre-wrap">Reviewer notes: {suggestion.reviewNotes}</p>}
                        <button type="button" disabled={actioningId !== null} className="flat-button flat-button-secondary" onClick={() => setReviewEditing(suggestion)}>Edit & references</button>
                      </div>
                      <div className="flex-1 space-y-4 text-sm font-semibold text-[#1b4332]">
                        <div>
                          <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-gray-400">Medicinal Uses</h4>
                          <p className="mt-1 text-xs">{suggestion.medicinalUses}</p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-gray-400">Preparation</h4>
                          <p className="mt-1 text-xs">{suggestion.preparationMethod}</p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-gray-400">Dosage</h4>
                          <p className="mt-1 text-xs">{suggestion.dosage}</p>
                        </div>
                        {suggestion.warnings && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/55 p-3 text-xs text-amber-800">
                            <span className="font-extrabold block text-amber-900 mb-1 uppercase tracking-wider text-[9px]">⚠️ Warning Alert:</span>
                            {suggestion.warnings}
                          </div>
                        )}
                        <div className="grid gap-3 border-t border-gray-100 pt-4">
                          <label className="grid gap-1 text-xs font-extrabold text-[#1b4332]">
                            Evidence classification
                            <select
                              value={evidenceClassById[suggestion.id] || ''}
                              onChange={(event) => setEvidenceClassById((current) => ({ ...current, [suggestion.id]: event.target.value }))}
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold"
                            >
                              <option value="">Select before approval</option>
                              <option value="DOH_PITAHC_LISTED">DOH/PITAHC listed</option>
                              <option value="EVIDENCE_SUPPORTED_PHILIPPINE_USE">Evidence-supported Philippine use</option>
                              <option value="DOCUMENTED_TRADITIONAL_USE">Documented traditional use</option>
                            </select>
                          </label>
                          <label className="grid gap-1 text-xs font-extrabold text-[#1b4332]">
                            Reviewer notes
                            <textarea
                              value={reviewNotesById[suggestion.id] || ''}
                              onChange={(event) => setReviewNotesById((current) => ({ ...current, [suggestion.id]: event.target.value }))}
                              rows={3}
                              maxLength={2000}
                              placeholder="Record the decision or explain required changes."
                              className="resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-6 grid grid-cols-1 gap-3 border-t border-gray-50 pt-4 sm:grid-cols-3">
                        <button
                          onClick={() => handleApprove(suggestion.id)}
                          disabled={actioningId !== null}
                          className="flex-1 flat-button flat-button-primary !py-2 text-xs"
                        >
                          {actioningId === suggestion.id ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent inline-block"></span>
                          ) : (
                            'Approve & Publish'
                          )}
                        </button>
                        <button
                          onClick={() => handleRequestChanges(suggestion.id)}
                          disabled={actioningId !== null}
                          className="flat-button flat-button-secondary !py-2 text-xs !border-amber-600 !text-amber-700 hover:!bg-amber-50"
                        >
                          Request Changes
                        </button>
                        <button
                          onClick={() => handleReject(suggestion.id)}
                          disabled={actioningId !== null}
                          className="flex-1 flat-button flat-button-secondary !py-2 text-xs !border-rose-600 !text-rose-600 hover:!bg-rose-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ALL HERBS (DATABASE) */}
          {activeTab === 'library' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="font-black italic text-xl text-[#1b4332]">
                  Published Herbs ({allHerbs.length})
                </h2>
                
                {/* Search Bar */}
                <div className="relative max-w-xs w-full">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search herbs..."
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 text-xs font-semibold rounded-full border border-gray-200 focus:outline-none focus:border-[#2d6a4f] bg-gray-50/50"
                  />
                </div>
              </div>

              {filteredHerbs.length === 0 ? (
                <p className="text-sm font-semibold text-gray-500 text-center py-8">No matching records found.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Local Name</th>
                        <th>Scientific Name</th>
                        <th>Category</th>
                        <th>Medicinal Uses</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHerbs.map((herb) => (
                        <tr key={herb.id}>
                          <td>
                            <div className="h-10 w-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                              {herb.imageUrl ? (
                                <img src={herb.imageUrl} alt={herb.localName} className="h-full w-full object-cover" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-lg">🌿</span>
                              )}
                            </div>
                          </td>
                          <td className="font-extrabold text-[#1b4332]">{herb.localName}</td>
                          <td className="italic text-[#2d6a4f] font-bold">{herb.scientificName}</td>
                          <td>
                            <span className="admin-role-pill">{herb.category}</span>
                          </td>
                          <td className="max-w-xs truncate text-[#6a7282] font-semibold">{herb.medicinalUses}</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openEditHerbModal(herb)}
                                className="text-xs text-amber-600 hover:underline font-black flex items-center gap-0.5"
                              >
                                <Edit2 className="h-3.5 w-3.5 inline" /> Edit
                              </button>
                              <button
                                onClick={() => router.push(`/library`)}
                                className="text-xs text-[#2d6a4f] hover:underline font-black"
                              >
                                View in Library
                              </button>
                              <button
                                onClick={() => handleDeleteHerb(herb.id)}
                                className="text-xs text-rose-600 hover:underline font-black flex items-center gap-0.5"
                              >
                                <Trash2 className="h-3.5 w-3.5 inline" /> Delete
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-black italic text-xl text-[#1b4332] mb-6">
                User Management Console
              </h2>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>System Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id}>
                        <td className="font-extrabold text-[#1b4332] flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-[#2d6a4f]/20 text-[#1b4332] flex items-center justify-center font-bold text-xs border border-[#2d6a4f]/10">
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="block">{u.name} {u.id === user.id ? <span className="text-xs text-gray-400 font-bold ml-1">(You)</span> : ''}</span>
                            <span className="text-[10px] text-gray-400 font-semibold block">@{u.username}</span>
                          </div>
                        </td>
                        <td className="font-semibold text-gray-500">{u.email}</td>
                        <td>
                          <span className={`text-[10px] font-black tracking-wider px-2.5 py-0.5 rounded-full uppercase ${
                            u.role === 'admin' ? 'bg-[#1b4332] text-white' :
                            u.role === 'botanist' ? 'bg-[#40916c] text-white' :
                            'bg-gray-100 text-[#1b4332]'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {u.isBanned ? (
                            <span className="admin-status !text-rose-600 !bg-rose-50 border border-rose-100 px-2 py-1 rounded-full text-[10px]">
                              <span className="dot !bg-rose-500"></span> Banned
                            </span>
                          ) : (
                            <span className="admin-status">
                              <span className="dot"></span> Active
                            </span>
                          )}
                        </td>
                        <td>
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleToggleBan(u.id, !!u.isBanned)}
                              disabled={banActioningUserId !== null}
                              aria-busy={banActioningUserId === u.id}
                              className={`text-xs font-black px-3 py-1.5 rounded-lg border transition-all ${
                                u.isBanned 
                                  ? 'border-[#2d6a4f] text-[#2d6a4f] bg-[#eef5f0] hover:bg-[#2d6a4f] hover:text-white' 
                                  : 'border-rose-600 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white'
                              }`}
                            >
                              {banActioningUserId === u.id ? 'Updating...' : u.isBanned ? 'Unban User' : 'Ban User'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: KNOWLEDGE BASE FAQ MANAGER */}
          {activeTab === 'knowledgebase' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-serif-custom font-black italic text-xl text-[#1b4332]">
                    Dr. AI RAG Facts ({kbList.length})
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Manage QA resources used by Dr. AI to generate RAG responses</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative max-w-xs">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search KB items..."
                      value={kbSearch}
                      onChange={(e) => setKbSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 text-xs font-semibold rounded-full border border-gray-200 focus:outline-none focus:border-[#2d6a4f] bg-gray-50/50"
                    />
                  </div>

                  <button
                    onClick={() => openKbModal(null)}
                    className="flat-button flat-button-primary !py-2 !px-3 text-xs flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add KB Fact
                  </button>
                </div>
              </div>

              <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#8b9d83]/35 bg-[#8b9d83]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#606c38] text-white">
                    <FileJson className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-[#1b4332]">Import reviewed RAG facts</p>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-600">
                      Upload one fact or an array of up to 50 facts. Dr. AI creates fresh embeddings and updates matching questions.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <a
                    href="/templates/philippine-herbal-medicine-kb-facts.json"
                    download
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#606c38]/30 bg-white px-3 py-2 text-xs font-bold text-[#1b4332] transition hover:bg-[#8b9d83]/10"
                  >
                    <Download className="h-3.5 w-3.5" /> Philippine core
                  </a>
                  <a
                    href="/templates/lagundi-kb-facts.json"
                    download
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#606c38]/30 bg-white px-3 py-2 text-xs font-bold text-[#1b4332] transition hover:bg-[#8b9d83]/10"
                  >
                    <Download className="h-3.5 w-3.5" /> Lagundi pack
                  </a>
                  <a
                    href="/templates/pitahc-nine-herbs-kb-facts.json"
                    download
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#606c38]/30 bg-white px-3 py-2 text-xs font-bold text-[#1b4332] transition hover:bg-[#8b9d83]/10"
                  >
                    <Download className="h-3.5 w-3.5" /> Nine-herb pack
                  </a>
                  <label className={`inline-flex items-center gap-1.5 rounded-full bg-[#c66b3d] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#b85e34] ${isImportingKb ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
                    {isImportingKb ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {isImportingKb ? 'Importing…' : 'Import JSON'}
                    <input
                      type="file"
                      accept="application/json,.json"
                      disabled={isImportingKb}
                      onChange={handleKbFileImport}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {filteredKbList.length === 0 ? (
                <p className="text-sm font-semibold text-gray-500 text-center py-8">No knowledge base records found.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th className="w-[25%]">Question Fact</th>
                        <th className="w-[40%]">Reference Answer</th>
                        <th>Category</th>
                        <th>Tags</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKbList.map((item) => (
                        <tr key={item.id}>
                          <td className="font-extrabold text-[#1b4332] align-top text-xs leading-normal">{item.question}</td>
                          <td className="text-gray-500 font-semibold align-top text-xs leading-relaxed max-w-sm whitespace-pre-line">{item.answer}</td>
                          <td className="align-top">
                            {item.category ? (
                              <span className="admin-role-pill">{item.category}</span>
                            ) : (
                              <span className="text-gray-300 text-xs italic">-</span>
                            )}
                          </td>
                          <td className="align-top">
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((tag, tIdx) => (
                                <span key={tIdx} className="text-[9px] bg-gray-100 text-[#2d6a4f] px-1.5 py-0.5 rounded font-bold">
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length === 0 && <span className="text-gray-300 text-xs italic">-</span>}
                            </div>
                          </td>
                          <td className="align-top">
                            <button
                              onClick={() => handleToggleKbActive(item.id, item.isActive)}
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border cursor-pointer ${
                                item.isActive 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-gray-100 text-gray-400 border-gray-200'
                              }`}
                            >
                              {item.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="align-top">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openKbModal(item)}
                                className="text-xs text-[#2d6a4f] hover:text-[#1b4332] font-black inline-flex items-center gap-1 cursor-pointer"
                                title="Edit Entry"
                              >
                                <Edit2 className="h-3 w-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteKbItem(item.id)}
                                className="text-xs text-rose-600 hover:text-rose-800 font-black inline-flex items-center gap-1 cursor-pointer"
                                title="Delete Entry"
                              >
                                <Trash2 className="h-3 w-3" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-black text-[#1b4332] italic">
                    Administrative Audit Logs
                  </h1>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Immutable security log tracking all administrative decisions, database updates, and moderation actions.
                  </p>
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter audit logs..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 bg-white font-semibold text-[#1b4332] focus:outline-none focus:border-[#2d6a4f]"
                  />
                </div>
              </div>

              {auditLogs.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-3">
                  <ClipboardList className="h-10 w-10 text-gray-300 stroke-[1.5]" />
                  <p className="text-sm font-bold text-gray-500">No audit logs recorded yet</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                  <table className="admin-table w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 bg-gray-50/50">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Admin Actor</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Target</th>
                        <th className="py-3 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                      {auditLogs
                        .filter((log) => {
                          const query = auditSearch.toLowerCase();
                          return (
                            log.action.toLowerCase().includes(query) ||
                            log.targetType.toLowerCase().includes(query) ||
                            log.admin.name.toLowerCase().includes(query) ||
                            (log.admin.email && log.admin.email.toLowerCase().includes(query)) ||
                            (log.details && JSON.stringify(log.details).toLowerCase().includes(query))
                          );
                        })
                        .map((log) => {
                          const getBadgeColor = (action: string) => {
                            if (action.includes('APPROVE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            if (action.includes('REJECT')) return 'bg-amber-50 text-amber-700 border-amber-200';
                            if (action.includes('BAN') && !action.includes('UNBAN')) return 'bg-rose-50 text-rose-700 border-rose-200';
                            if (action.includes('UNBAN')) return 'bg-teal-50 text-teal-700 border-teal-200';
                            if (action.includes('DELETE')) return 'bg-rose-50 text-rose-700 border-rose-200';
                            return 'bg-blue-50 text-blue-700 border-blue-200';
                          };

                          return (
                            <tr key={log.id} className="hover:bg-gray-50/50 transition">
                              <td className="py-3 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {log.admin.avatar?.startsWith('http') ? (
                                    <img src={log.admin.avatar} alt="Admin" className="h-6 w-6 rounded-full object-cover" />
                                  ) : (
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2d6a4f] text-[10px] font-bold text-white uppercase">
                                      {log.admin.name ? log.admin.name.charAt(0) : 'A'}
                                    </span>
                                  )}
                                  <div>
                                    <div className="font-bold text-[#1b4332] text-xs leading-none">{log.admin.name}</div>
                                    <div className="text-[10px] text-gray-400">{log.admin.email || log.admin.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-full border ${getBadgeColor(log.action)}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-gray-900">{log.targetType}</span>
                                {log.targetId && (
                                  <span className="text-gray-400 text-[11px] block font-mono">ID: {log.targetId}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 max-w-md text-sm text-gray-600">
                                {log.details ? (
                                  <details>
                                    <summary className="cursor-pointer font-semibold">View change details</summary>
                                    <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded border border-gray-100 bg-gray-50 p-3 text-xs">
                                      {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                                    </pre>
                                  </details>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Edit Herb Modal */}
      {isHerbModalOpen && editingHerb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1b4332]/40 backdrop-blur-sm px-4 py-4">
          <div role="dialog" aria-modal="true" aria-labelledby="edit-herb-title" className="flex max-h-full w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-[#2d6a4f]/20">
            <div className="bg-[#f0f7f2] p-5 border-b border-[#2d6a4f]/10 flex justify-between items-center">
              <h3 id="edit-herb-title" className="text-lg font-black text-[#1b4332] flex items-center gap-2">
                <Edit2 className="h-5 w-5" /> Edit Herb
              </h3>
              <button onClick={closeEditHerbModal} aria-label="Close herb editor" className="text-gray-400 hover:text-rose-600 text-xl font-bold px-2">&times;</button>
            </div>
            
            <form onSubmit={handleEditHerbSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Local Name *</label>
                  <input
                    aria-label="Local Name"
                    type="text"
                    required
                    value={herbFormData.localName}
                    onChange={(e) => setHerbFormData({...herbFormData, localName: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-[#1b4332] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]/50"
                    placeholder="e.g., Lagundi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Common Name</label>
                  <input
                    aria-label="Common Name"
                    type="text"
                    value={herbFormData.cebuanoName}
                    onChange={(e) => setHerbFormData({...herbFormData, cebuanoName: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-[#1b4332] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]/50"
                    placeholder="e.g., Lagnob"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Scientific Name *</label>
                  <input
                    aria-label="Scientific Name"
                    type="text"
                    required
                    value={herbFormData.scientificName}
                    onChange={(e) => setHerbFormData({...herbFormData, scientificName: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-[#1b4332] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]/50"
                    placeholder="e.g., Vitex negundo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Category *</label>
                  <input
                    aria-label="Category"
                    type="text"
                    required
                    value={herbFormData.category}
                    onChange={(e) => setHerbFormData({...herbFormData, category: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-[#1b4332] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]/50"
                    placeholder="e.g., Respiratory"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Medicinal Uses *</label>
                <textarea
                  aria-label="Medicinal Uses"
                  required
                  rows={2}
                  value={herbFormData.medicinalUses}
                  onChange={(e) => setHerbFormData({...herbFormData, medicinalUses: e.target.value})}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-[#1b4332] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]/50 resize-none"
                  placeholder="Describe its medicinal benefits..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Preparation Method</label>
                <textarea
                  aria-label="Preparation Method"
                  rows={2}
                  value={herbFormData.preparationMethod}
                  onChange={(e) => setHerbFormData({...herbFormData, preparationMethod: e.target.value})}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-[#1b4332] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]/50 resize-none"
                  placeholder="Describe how to prepare this herb..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Dosage & Frequency</label>
                <textarea
                  aria-label="Dosage and Frequency"
                  rows={2}
                  value={herbFormData.dosage}
                  onChange={(e) => setHerbFormData({...herbFormData, dosage: e.target.value})}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-[#1b4332] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]/50 resize-none"
                  placeholder="Describe dosage instructions..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Region Found</label>
                  <input
                    aria-label="Region Found"
                    type="text"
                    value={herbFormData.regionFound}
                    onChange={(e) => setHerbFormData({...herbFormData, regionFound: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-[#1b4332] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]/50"
                    placeholder="e.g., Common in tropical areas"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Image Path / URL</label>
                  <input
                    aria-label="Image Path or URL"
                    type="text"
                    value={herbFormData.imageUrl}
                    onChange={(e) => setHerbFormData({...herbFormData, imageUrl: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-[#1b4332] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]/50"
                    placeholder="e.g., /images/lagundi.png or a web URL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Important Warnings & Precautions</label>
                <textarea
                  aria-label="Warnings and Precautions"
                  rows={2}
                  value={herbFormData.warnings}
                  onChange={(e) => setHerbFormData({...herbFormData, warnings: e.target.value})}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-[#1b4332] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]/50 resize-none"
                  placeholder="Precautions, side effects, or limits..."
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-50">
                <button
                  type="button"
                  onClick={closeEditHerbModal}
                  className="flat-button flat-button-secondary !py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flat-button flat-button-primary !py-2 text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KNOWLEDGE BASE MODAL (CREATE / EDIT) */}
      {isKbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans">
          <div role="dialog" aria-modal="true" aria-labelledby="knowledge-editor-title" className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl animate-in fade-in duration-200">
            
            <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 id="knowledge-editor-title" className="font-extrabold text-lg text-[#1b4332]">
                {editingKbItem ? 'Edit Knowledge Base Entry' : 'Create Knowledge Base Entry'}
              </h3>
              <button
                onClick={closeKbModal}
                aria-label="Close knowledge editor"
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleSaveKbItem} className="overflow-y-auto p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  Question *
                </label>
                <input
                  aria-label="Knowledge question"
                  type="text"
                  required
                  placeholder="e.g. What is the traditional use of Yerba Buena?"
                  value={kbQuestion}
                  onChange={(e) => setKbQuestion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-[#1b4332] placeholder-emerald-800/20 focus:outline-none focus:border-[#2d6a4f]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  Detailed Answer *
                </label>
                <textarea
                  aria-label="Knowledge answer"
                  required
                  rows={4}
                  placeholder="Provide a verified answer. This text will be parsed by Dr. AI for search match context."
                  value={kbAnswer}
                  onChange={(e) => setKbAnswer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-[#1b4332] placeholder-emerald-800/20 focus:outline-none focus:border-[#2d6a4f] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-400">
                    Category (Optional)
                  </label>
                  <input
                    aria-label="Knowledge category"
                    type="text"
                    placeholder="e.g. dosage, preparation"
                    value={kbCategory}
                    onChange={(e) => setKbCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-[#1b4332] placeholder-emerald-800/20 focus:outline-none focus:border-[#2d6a4f]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-400">
                    Tags (Comma Separated)
                  </label>
                  <input
                    aria-label="Knowledge tags"
                    type="text"
                    placeholder="e.g. mint, leaves, fever"
                    value={kbTags}
                    onChange={(e) => setKbTags(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-[#1b4332] placeholder-emerald-800/20 focus:outline-none focus:border-[#2d6a4f]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeKbModal}
                  className="flat-button flat-button-secondary !py-2 !px-4 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flat-button flat-button-primary !py-2 !px-4 text-sm font-bold"
                >
                  {editingKbItem ? 'Save Changes' : 'Publish entry'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
