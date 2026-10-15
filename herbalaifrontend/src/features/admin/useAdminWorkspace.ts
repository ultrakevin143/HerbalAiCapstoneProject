'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { cachedApiGet } from '@/lib/request-cache';
import { isActiveUserBan } from '@/features/admin/user-ban';
import type { Suggestion, Herb, SystemUser, KBItem, AuditLog, DashboardStats, SuggestionFilter } from './types';
import { getErrorMessage } from './admin-feedback';
import { createReviewActions } from './actions/review-actions';
import { createHerbActions } from './actions/herb-actions';
import { createKnowledgeBaseActions } from './actions/knowledge-base-actions';
import { createUserActions } from './actions/user-actions';

export function useAdminWorkspace() {
  const [reviewEditing, setReviewEditing] = useState<Suggestion | null>(null);

  const { user, loading, isAuthenticated, sessionUnavailable, checkSession, logout } = useAuth();

  const router = useRouter();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const [pendingCount, setPendingCount] = useState(0);

  const [suggestionsPage, setSuggestionsPage] = useState(1);

  const [suggestionFilter, setSuggestionFilter] = useState<SuggestionFilter>('Pending');

  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  const [allHerbs, setAllHerbs] = useState<Herb[]>([]);

  const [herbsPage, setHerbsPage] = useState(1);

  const [herbsTotal, setHerbsTotal] = useState(0);

  const [usersList, setUsersList] = useState<SystemUser[]>([]);

  const [usersPage, setUsersPage] = useState(1);

  const [usersTotal, setUsersTotal] = useState(0);

  const [usersAllTotal, setUsersAllTotal] = useState(0);

  const [usersLoading, setUsersLoading] = useState(true);

  const [usersLoadFailed, setUsersLoadFailed] = useState(false);

  const [usersRefresh, setUsersRefresh] = useState(0);

  const [banTarget, setBanTarget] = useState<SystemUser | null>(null);

  const [banClock, setBanClock] = useState(Date.now);

  const [kbList, setKbList] = useState<KBItem[]>([]);

  const [kbPage, setKbPage] = useState(1);

  const [kbTotal, setKbTotal] = useState(0);

  const [availableKbCategories, setAvailableKbCategories] = useState<string[]>([]);

  const [kbLoading, setKbLoading] = useState(true);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const auditPageSize = 50;

  const [auditLoading, setAuditLoading] = useState(true);

  const [auditLoadFailed, setAuditLoadFailed] = useState(false);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'pending' | 'library' | 'users' | 'knowledgebase' | 'audit'>('dashboard');

  useEffect(() => {
    if (activeTab !== 'users') return;
    const timer = window.setInterval(() => setBanClock(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  const usersWithBanStatus = usersList.map(account => ({ ...account, isBanned: isActiveUserBan(account, banClock) }));

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [logoutPending, setLogoutPending] = useState(false);

  const logoutInFlight = useRef(false);

  const [error, setError] = useState<string | null>(null);

  const [actioningId, setActioningId] = useState<number | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [reviewNotesById, setReviewNotesById] = useState<Record<number, string>>({});

  const [evidenceClassById, setEvidenceClassById] = useState<Record<number, string>>({});

  const [librarySearch, setLibrarySearch] = useState('');

  const [debouncedLibrarySearch, setDebouncedLibrarySearch] = useState('');

  const [kbSearch, setKbSearch] = useState('');

  const [debouncedKbSearch, setDebouncedKbSearch] = useState('');

  const [auditSearch, setAuditSearch] = useState('');
  const [debouncedAuditSearch, setDebouncedAuditSearch] = useState('');
  const trimmedAuditSearch = auditSearch.trim();

  const [isKbModalOpen, setIsKbModalOpen] = useState(false);

  const [editingKbItem, setEditingKbItem] = useState<KBItem | null>(null);

  const [kbQuestion, setKbQuestion] = useState('');

  const [kbAnswer, setKbAnswer] = useState('');

  const [kbCategory, setKbCategory] = useState('');

  const [kbTags, setKbTags] = useState('');

  const [kbSourceTitle, setKbSourceTitle] = useState('');

  const [kbSourcePublisher, setKbSourcePublisher] = useState('');

  const [kbSourceUrl, setKbSourceUrl] = useState('');

  const [isImportingKb, setIsImportingKb] = useState(false);

  const [kbCategoryFilter, setKbCategoryFilter] = useState<string>('ALL');

  const [kbStatusFilter, setKbStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [expandedKbIds, setExpandedKbIds] = useState<Set<string>>(new Set());

  const [copiedKbId, setCopiedKbId] = useState<string | null>(null);

  const filteredKbList = kbList;

  const [userSearch, setUserSearch] = useState('');

  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');

  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'admin' | 'contributor'>('ALL');

  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED'>('ALL');

  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);

  const filteredUsersList = usersWithBanStatus;

  const trimmedUserSearch = userSearch.trim();

  const usersBusy = usersLoading || trimmedUserSearch !== debouncedUserSearch;

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

  useEffect(() => {
    document.body.classList.add('admin-app');
    return () => {
      document.body.classList.remove('admin-app');
    };
  }, []);

  useEffect(() => {
    if (successMsg && !successMsg.startsWith('Changes requested and review notes saved.')) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedLibrarySearch(librarySearch.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [librarySearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedKbSearch(kbSearch.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [kbSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedUserSearch(trimmedUserSearch), 350);
    return () => window.clearTimeout(timer);
  }, [trimmedUserSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedAuditSearch(trimmedAuditSearch), 250);
    return () => window.clearTimeout(timer);
  }, [trimmedAuditSearch]);

  useEffect(() => {
    if (loading || !isAuthenticated || sessionUnavailable || user?.role !== 'admin' || activeTab !== 'users'
      || trimmedUserSearch !== debouncedUserSearch) return;
    let cancelled = false;
    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersLoadFailed(false);
      setUsersList([]);
      setError(null);
      try {
        const response = await api.get('/auth/users', { params: {
          page: usersPage, limit: 25, search: debouncedUserSearch, role: userRoleFilter, status: userStatusFilter,
        } });
        if (cancelled) return;
        if (response.data?.status !== 'success') throw new Error('Unable to load users.');
        setUsersList(response.data.data.users || []);
        setUsersTotal(response.data.data.total || 0);
        setUsersAllTotal(response.data.data.allTotal ?? response.data.data.total ?? 0);
        setUsersPage(response.data.data.page || 1);
      } catch (error: unknown) {
        if (!cancelled) {
          setUsersLoadFailed(true);
          setError(getErrorMessage(error, 'Unable to load users. Please retry.'));
        }
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };
    void fetchUsers();
    return () => { cancelled = true; };
  }, [loading, isAuthenticated, sessionUnavailable, user?.role, activeTab, usersPage, trimmedUserSearch,
    debouncedUserSearch, userRoleFilter, userStatusFilter, usersRefresh]);

  const refreshKbPage = async () => {
    const response = await api.get('/knowledge-base/page', { params: {
      page: kbPage, limit: 3, search: debouncedKbSearch,
      category: kbCategoryFilter === 'ALL' ? undefined : kbCategoryFilter, status: kbStatusFilter,
    } });
    if (response.data?.status === 'success') {
      setKbList(response.data.data.items || []);
      setKbTotal(response.data.data.total || 0);
      setAvailableKbCategories(response.data.data.categories || []);
      setKbPage(response.data.data.page || 1);
    }
  };

  const refreshSuggestions = React.useCallback(async () => {
    setSuggestionsLoading(true);
    try {
      const response = await api.get('/suggest');
      if (response.data?.status !== 'success') throw new Error('Unable to load suggestions.');
      const latestSuggestions: Suggestion[] = response.data.data.suggestions || [];
      setSuggestions(latestSuggestions);
      setPendingCount(latestSuggestions.filter((suggestion) => suggestion.status === 'Pending').length);
    } finally {
      setSuggestionsLoading(false);
      setSuggestionsLoaded(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setError(null);

        if (activeTab === 'pending') {
          await refreshSuggestions();
        }
        if (activeTab === 'dashboard') {
          setDashboardStats(null);
          const statsRes = await api.get('/stats/dashboard');
          if (cancelled) return;
          if (statsRes.data?.status !== 'success' || !statsRes.data.data) {
            throw new Error('Unable to load dashboard data. Please try again.');
          }
          setDashboardStats(statsRes.data.data);
          setPendingCount(statsRes.data.data.suggestionsByStatus.find((entry: { name: string; value: number }) => entry.name === 'Pending')?.value ?? 0);
        }
        if (activeTab === 'library') {
          const params = new URLSearchParams({ page: String(herbsPage), limit: '25' });
          if (debouncedLibrarySearch) params.set('search', debouncedLibrarySearch);
          const herbsRes = await cachedApiGet(`/herbs?${params}`, 60_000);
          if (cancelled) return;
          if (herbsRes.data?.status === 'success') {
            setAllHerbs(herbsRes.data.data.herbs || []);
            setHerbsTotal(herbsRes.data.data.total || 0);
          }
        }
        if (activeTab === 'knowledgebase') {
          setKbLoading(true);
          const kbRes = await api.get('/knowledge-base/page', { params: {
            page: kbPage, limit: 3, search: debouncedKbSearch,
            category: kbCategoryFilter === 'ALL' ? undefined : kbCategoryFilter, status: kbStatusFilter,
          } });
          if (cancelled) return;
          if (kbRes.data?.status === 'success') {
            setKbList(kbRes.data.data.items || []);
            setKbTotal(kbRes.data.data.total || 0);
            setAvailableKbCategories(kbRes.data.data.categories || []);
            setKbPage(kbRes.data.data.page || 1);
          } else {
            throw new Error('Unable to load knowledge base facts.');
          }
        }
        if (activeTab === 'audit') {
          setAuditLoading(true);
          setAuditLoadFailed(false);
          const auditRes = await api.get('/admin/audit-logs', { params: {
            limit: auditPageSize, offset: (auditPage - 1) * auditPageSize,
            search: debouncedAuditSearch || undefined,
          } });
          if (cancelled) return;
          if (auditRes.data?.status !== 'success') throw new Error('Unable to load audit logs.');
          setAuditLogs(auditRes.data.data.logs || []);
          setAuditTotal(auditRes.data.data.total || 0);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          if (activeTab === 'audit') setAuditLoadFailed(true);
          setError(getErrorMessage(error, activeTab === 'pending' ? 'Unable to load suggestions. Please try again.' : 'Error connecting to server.'));
        }
      } finally {
        if (!cancelled && activeTab === 'knowledgebase') setKbLoading(false);
        if (!cancelled && activeTab === 'audit') setAuditLoading(false);
      }
    };

    if (activeTab === 'audit' && trimmedAuditSearch !== debouncedAuditSearch) return;
    if (!loading) {
      if (!isAuthenticated && !sessionUnavailable) {
        router.push('/signin');
      } else if (user?.role === 'admin') {
        fetchData();
      }
    }

    return () => {
      cancelled = true;
    };
  }, [loading, isAuthenticated, sessionUnavailable, user?.role, router, activeTab, herbsPage, debouncedLibrarySearch, kbPage, debouncedKbSearch, kbCategoryFilter, kbStatusFilter, refreshSuggestions, auditPage, auditPageSize, trimmedAuditSearch, debouncedAuditSearch]);

  const { handleApprove, handleRequestChanges, handleReject } = createReviewActions({ actioningId, setActioningId, setError, setSuccessMsg, evidenceClassById, suggestions, reviewNotesById, refreshSuggestions, setDashboardStats });

  const { handleBanSaved, handleCopyEmail } = createUserActions({ setUsersList, setUsersRefresh, setSuccessMsg, setError, setBanTarget, setCopiedEmailId });

  const { handleDeleteHerb, openEditHerbModal, closeEditHerbModal, handleEditHerbSubmit } = createHerbActions({ setError, setSuccessMsg, setAllHerbs, setHerbsTotal, setEditingHerb, setHerbFormData, setIsHerbModalOpen, editingHerb, herbFormData });

  const { handleSaveKbItem, handleKbFileImport, handleDeleteKbItem, handleToggleKbActive, openKbModal, closeKbModal, toggleKbExpand, handleCopyKbFact, getKbPrimarySource } = createKnowledgeBaseActions({ kbQuestion, kbAnswer, setError, kbSourceTitle, kbSourcePublisher, kbSourceUrl, setSuccessMsg, editingKbItem, kbCategory, kbTags, refreshKbPage, setIsImportingKb, setEditingKbItem, setKbQuestion, setKbAnswer, setKbCategory, setKbTags, setKbSourceTitle, setKbSourcePublisher, setKbSourceUrl, setIsKbModalOpen, setExpandedKbIds, setCopiedKbId });

  const handleLogout = async () => {
    if (logoutInFlight.current) return;
    logoutInFlight.current = true;
    setLogoutPending(true);
    setError(null);
    try {
      await logout();
      setMobileNavOpen(false);
    } catch (logoutError) {
      setError(getErrorMessage(logoutError, 'Unable to log out. Please try again.'));
    } finally {
      logoutInFlight.current = false;
      setLogoutPending(false);
    }
  };

  const filteredSuggestions = suggestionFilter === 'All'
    ? suggestions
    : suggestions.filter((suggestion) => suggestion.status === suggestionFilter);

  const suggestionPageCount = Math.max(1, Math.ceil(filteredSuggestions.length / 10));

  const currentSuggestionsPage = Math.min(suggestionsPage, suggestionPageCount);

  const visibleSuggestions = filteredSuggestions.slice((currentSuggestionsPage - 1) * 10, currentSuggestionsPage * 10);

  const filteredHerbs = allHerbs;

  return {
    loading,
    sessionUnavailable,
    user,
    checkSession,
    error,
    router,
    handleLogout,
    logoutPending,
    suggestionFilter,
    suggestions,
    suggestionsPage,
    allHerbs,
    reviewEditing,
    setReviewEditing,
    setSuccessMsg,
    refreshSuggestions,
    setError,
    isAuthenticated,
    setMobileNavOpen,
    mobileNavOpen,
    pendingCount,
    activeTab,
    setActiveTab,
    successMsg,
    dashboardStats,
    suggestionsLoading,
    setSuggestionFilter,
    setSuggestionsPage,
    suggestionsLoaded,
    actioningId,
    evidenceClassById,
    setEvidenceClassById,
    reviewNotesById,
    setReviewNotesById,
    handleApprove,
    handleRequestChanges,
    handleReject,
    herbsTotal,
    librarySearch,
    setLibrarySearch,
    setHerbsPage,
    openEditHerbModal,
    handleDeleteHerb,
    herbsPage,
    usersAllTotal,
    userSearch,
    setUserSearch,
    setUsersPage,
    setUserStatusFilter,
    userStatusFilter,
    setUserRoleFilter,
    userRoleFilter,
    usersBusy,
    usersLoadFailed,
    filteredUsersList,
    usersTotal,
    setUsersRefresh,
    handleCopyEmail,
    copiedEmailId,
    setBanTarget,
    banTarget,
    usersPage,
    kbTotal,
    kbSearch,
    setKbSearch,
    setKbPage,
    setKbLoading,
    openKbModal,
    kbStatusFilter,
    setKbStatusFilter,
    availableKbCategories,
    kbCategoryFilter,
    setKbCategoryFilter,
    filteredKbList,
    isImportingKb,
    handleKbFileImport,
    kbLoading,
    getKbPrimarySource,
    expandedKbIds,
    handleToggleKbActive,
    handleCopyKbFact,
    copiedKbId,
    handleDeleteKbItem,
    toggleKbExpand,
    kbPage,
    auditSearch,
    setAuditSearch,
    trimmedAuditSearch,
    auditPage,
    setAuditPage,
    auditTotal,
    auditPageSize,
    setAuditLoading,
    auditLoading,
    auditLoadFailed,
    auditLogs,
    handleBanSaved,
    isHerbModalOpen,
    editingHerb,
    closeEditHerbModal,
    handleEditHerbSubmit,
    herbFormData,
    setHerbFormData,
    isKbModalOpen,
    editingKbItem,
    closeKbModal,
    handleSaveKbItem,
    kbQuestion,
    setKbQuestion,
    kbAnswer,
    setKbAnswer,
    kbSourceTitle,
    setKbSourceTitle,
    kbSourcePublisher,
    setKbSourcePublisher,
    kbSourceUrl,
    setKbSourceUrl,
    kbCategory,
    setKbCategory,
    kbTags,
    setKbTags,
    filteredSuggestions,
    suggestionPageCount,
    currentSuggestionsPage,
    visibleSuggestions,
    filteredHerbs,
  };
}
