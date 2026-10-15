'use client';

import DashboardSection from '@/features/admin/sections/DashboardSection';
import SuggestionsSection from '@/features/admin/sections/SuggestionsSection';
import HerbsSection from '@/features/admin/sections/HerbsSection';
import UsersSection from '@/features/admin/sections/UsersSection';
import KnowledgeBaseSection from '@/features/admin/sections/KnowledgeBaseSection';
import AuditLogsSection from '@/features/admin/sections/AuditLogsSection';

import type { SuggestionFilter } from './types';
import { useAdminWorkspace } from '@/features/admin/useAdminWorkspace';
import dynamic from 'next/dynamic';
import SessionUnavailable from '@/components/shared/SessionUnavailable';
import SuggestionReviewEditor from '@/features/suggestions/SuggestionReviewEditor';
import BrandMark from '@/components/core/BrandMark';
import { ThemeToggle } from '@/components/core/DisplayPreferences';
import UserBanDialog from '@/features/admin/UserBanDialog';
import Link from 'next/link';
import NotificationBell from '@/features/notifications/NotificationBell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Edit2,
  LayoutDashboard,
  Clock,
  Leaf,
  Users,
  BookOpen,
  ClipboardList,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Menu,
  X,
  UserRound,
  Sprout,
} from 'lucide-react';


const AdminDashboardCharts = dynamic(() => import('@/features/admin/AdminDashboardCharts'), {
  loading: () => (
    <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3" role="status" aria-label="Loading dashboard charts">
      {['Herbs by Category', 'Suggestions Status', 'Forum Discussions'].map((title) => (
        <Card key={title}>
          <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
          <CardContent className="pt-5"><div className="h-64 rounded-lg bg-secondary animate-pulse motion-reduce:animate-none" /></CardContent>
        </Card>
      ))}
    </div>
  ),
});


const suggestionFilters: { value: SuggestionFilter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'ChangesRequested', label: 'Revision Needed' },
];

export default function AdminPage() {
  const {
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
  } = useAdminWorkspace();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
        <p className="font-extrabold text-ink animate-pulse">Loading console...</p>
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
      <div className="min-h-screen flex flex-col justify-center items-center bg-canvas px-4">
        <div className="max-w-md w-full rounded-3xl border border-line bg-panel p-8 shadow-xl text-center">
          <span className="text-5xl mb-4 inline-block">🚫</span>
          <h2 className="text-2xl font-black text-ink mb-3">Access Denied</h2>
          <p className="text-sm font-semibold text-muted mb-6">
            You are currently logged in as <strong className="text-ink">{user.name}</strong> ({user.role}), but only Administrators can access this dashboard.
          </p>
          {error && <p role="alert" className="mb-4 text-sm font-semibold text-ink">{error}</p>}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="flat-button flat-button-primary w-full text-center"
            >
              Back to Home
            </button>
            <button
              onClick={handleLogout}
              disabled={logoutPending}
              className="flat-button flat-button-secondary w-full text-center !border-rose-700 !text-rose-700 hover:!bg-rose-50"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {reviewEditing && <SuggestionReviewEditor suggestion={reviewEditing} onClose={() => setReviewEditing(null)} onSaved={() => {
        setReviewEditing(null);
        setSuccessMsg('Review edits saved.');
        refreshSuggestions().catch(() => setError('Edits saved. Refresh to load the latest submissions.'));
      }} />}
      {/* Sidebar Console */}
      <aside className="admin-sidebar relative">
        {/* Brand bar / Mobile top header */}
        <div className="admin-brand flex items-center justify-between">
          <Link href="/" aria-label="Herbal Ai home" className="flex items-center gap-2">
            <BrandMark className="h-9 w-9 shrink-0 text-[#1b4332] dark:text-[#e6f1e7]" />
            <span className="font-sans text-xl font-extrabold tracking-tight text-[#1b4332] dark:text-ink whitespace-nowrap">
              Herbal-<span className="text-[#2d6a4f] dark:text-accent">Ai</span>
            </span>
            <span className="hidden lg:block text-muted text-xs font-bold ml-1">Admin Console</span>
          </Link>

          {/* Mobile top bar buttons (Identical to Home Navbar in screenshot) */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            {isAuthenticated && <NotificationBell />}
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 dark:border-line bg-white/80 dark:bg-panel text-[#1b4332] dark:text-ink cursor-pointer transition-colors"
              aria-label="Toggle admin navigation"
              aria-expanded={mobileNavOpen}
            >
              {mobileNavOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Floating Overlay (Exact Layout from user's screenshot) */}
        {mobileNavOpen && (
          <>
            <div
              className="fixed inset-0 top-[57px] z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute top-full left-0 right-0 z-50 lg:hidden max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-line bg-panel/95 backdrop-blur-xl px-4 py-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Row 1: Theme Card */}
              <div className="mb-3 rounded-xl border border-line bg-panel px-4 py-2.5">
                <ThemeToggle variant="row" />
              </div>

              {/* Row 2: 2-Column Grid of Navigation Tabs */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { tab: 'dashboard', label: 'Dashboard' },
                  { tab: 'pending', label: 'Suggestions', badge: pendingCount },
                  { tab: 'library', label: 'All Herbs' },
                  { tab: 'users', label: 'Users' },
                  { tab: 'knowledgebase', label: 'Knowledge Base' },
                  { tab: 'audit', label: 'Audit Logs' },
                ] as Array<{ tab: 'dashboard' | 'pending' | 'library' | 'users' | 'knowledgebase' | 'audit'; label: string; badge?: number }>).map(({ tab, label, badge }) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => { setActiveTab(tab); setMobileNavOpen(false); }}
                      className={`rounded-xl px-4 py-2.5 text-left text-sm font-extrabold transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-[#eef5f0] text-[#1b4332] ring-1 ring-[#2d6a4f]/20 dark:bg-soft dark:text-ink'
                          : 'text-[#2d6a4f] hover:bg-[#eef5f0] dark:text-muted dark:hover:bg-soft'
                      }`}
                    >
                      <span>{label}</span>
                      {badge !== undefined && badge > 0 && (
                        <span className="rounded-full bg-accent px-1.5 py-0.2 text-[10px] font-black text-white">{badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="mt-3 space-y-2 border-t border-black/10 pt-3 dark:border-line">
                <div className="flex w-full items-center gap-3 rounded-xl bg-white/60 px-3 py-2.5 text-left text-sm font-extrabold text-[#1b4332] dark:bg-soft dark:text-ink">
                  <UserRound size={18} aria-hidden="true" className="shrink-0 text-[#40916c]" />
                  <span className="min-w-0">
                    <span className="block truncate">{user.name}</span>
                    <span className="block text-xs font-semibold capitalize text-[#2d6a4f]/75 dark:text-muted">Admin</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setMobileNavOpen(false); router.push('/'); }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#40916c]/25 px-3 py-2.5 text-sm font-extrabold text-[#2d6a4f] dark:text-[#74c69d] cursor-pointer"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Public Site
                  </button>

                  <Link
                    href="/suggest"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#40916c]/25 px-3 py-2.5 text-sm font-extrabold text-[#2d6a4f] dark:text-[#74c69d]"
                  >
                    <Sprout size={16} aria-hidden="true" />
                    Suggest Herb
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => { setMobileNavOpen(false); handleLogout(); }}
                  disabled={logoutPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold text-[#b34f35] transition-colors hover:bg-[#b34f35]/10 dark:text-[#e58a70] cursor-pointer disabled:opacity-50"
                >
                  <LogOut size={16} aria-hidden="true" />
                  {logoutPending ? 'Logging out…' : 'Log Out'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Desktop Sidebar Body */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:min-h-0">
          <nav id="admin-navigation" className="admin-nav" aria-label="Admin navigation">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`admin-nav-link flex items-center gap-2.5 ${activeTab === 'dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              aria-label="Pending Suggestions"
              className={`admin-nav-link flex items-center gap-2.5 ${activeTab === 'pending' ? 'active' : ''}`}
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">Suggestions</span>
              {pendingCount > 0 && (
                <span className="admin-nav-badge">{pendingCount}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`admin-nav-link flex items-center gap-2.5 ${activeTab === 'library' ? 'active' : ''}`}
            >
              <Leaf className="h-4 w-4 shrink-0" />
              <span>All Herbs</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`admin-nav-link flex items-center gap-2.5 ${activeTab === 'users' ? 'active' : ''}`}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>Users</span>
            </button>
            <button
              onClick={() => setActiveTab('knowledgebase')}
              className={`admin-nav-link flex items-center gap-2.5 ${activeTab === 'knowledgebase' ? 'active' : ''}`}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>Knowledge Base</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
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
            <div className="admin-theme-box my-1 rounded-xl border border-line bg-soft/50 p-2">
              <ThemeToggle variant="row" className="px-1" />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutPending}
              aria-busy={logoutPending}
              className="admin-nav-link subtle flex items-center gap-2 disabled:cursor-wait disabled:opacity-60"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{logoutPending ? 'Logging out…' : 'Log out'}</span>
            </button>
            <div className="admin-user-chip border-t border-line pt-3 mt-2">
              <span className="block font-bold text-ink">{user.name}</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted">Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="admin-main">
        <main className="admin-content bg-canvas p-8">
          {error && (
            <div role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 font-bold shadow-sm flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 rounded-2xl border border-line-strong bg-soft p-4 text-ink font-bold shadow-sm flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
<DashboardSection dashboardStats={dashboardStats} AdminDashboardCharts={AdminDashboardCharts} error={error} />
          )}

          {/* TAB 2: SUGGESTIONS */}
          {activeTab === 'pending' && (
<SuggestionsSection suggestionsLoading={suggestionsLoading} suggestionFilters={suggestionFilters} suggestionFilter={suggestionFilter} setSuggestionFilter={setSuggestionFilter} setSuggestionsPage={setSuggestionsPage} suggestions={suggestions} suggestionsLoaded={suggestionsLoaded} error={error} visibleSuggestions={visibleSuggestions} actioningId={actioningId} setReviewEditing={setReviewEditing} evidenceClassById={evidenceClassById} setEvidenceClassById={setEvidenceClassById} reviewNotesById={reviewNotesById} setReviewNotesById={setReviewNotesById} handleApprove={handleApprove} handleRequestChanges={handleRequestChanges} handleReject={handleReject} filteredSuggestions={filteredSuggestions} currentSuggestionsPage={currentSuggestionsPage} suggestionPageCount={suggestionPageCount} />
          )}

          {/* TAB 3: ALL HERBS (DATABASE) */}
          {activeTab === 'library' && (
<HerbsSection herbsTotal={herbsTotal} librarySearch={librarySearch} setLibrarySearch={setLibrarySearch} setHerbsPage={setHerbsPage} filteredHerbs={filteredHerbs} openEditHerbModal={openEditHerbModal} router={router} handleDeleteHerb={handleDeleteHerb} herbsPage={herbsPage} />
          )}

          {/* TAB 4: USERS MANAGEMENT */}
          {activeTab === 'users' && (
<UsersSection usersAllTotal={usersAllTotal} userSearch={userSearch} setUserSearch={setUserSearch} setUsersPage={setUsersPage} setUserStatusFilter={setUserStatusFilter} userStatusFilter={userStatusFilter} setUserRoleFilter={setUserRoleFilter} userRoleFilter={userRoleFilter} usersBusy={usersBusy} usersLoadFailed={usersLoadFailed} filteredUsersList={filteredUsersList} usersTotal={usersTotal} setUsersRefresh={setUsersRefresh} user={user} handleCopyEmail={handleCopyEmail} copiedEmailId={copiedEmailId} setError={setError} setSuccessMsg={setSuccessMsg} setBanTarget={setBanTarget} banTarget={banTarget} usersPage={usersPage} />
          )}

          {/* TAB 5: KNOWLEDGE BASE FAQ MANAGER */}
          {activeTab === 'knowledgebase' && (
<KnowledgeBaseSection kbTotal={kbTotal} kbSearch={kbSearch} setKbSearch={setKbSearch} setKbPage={setKbPage} setKbLoading={setKbLoading} openKbModal={openKbModal} kbStatusFilter={kbStatusFilter} setKbStatusFilter={setKbStatusFilter} availableKbCategories={availableKbCategories} kbCategoryFilter={kbCategoryFilter} setKbCategoryFilter={setKbCategoryFilter} filteredKbList={filteredKbList} isImportingKb={isImportingKb} handleKbFileImport={handleKbFileImport} kbLoading={kbLoading} getKbPrimarySource={getKbPrimarySource} expandedKbIds={expandedKbIds} handleToggleKbActive={handleToggleKbActive} handleCopyKbFact={handleCopyKbFact} copiedKbId={copiedKbId} handleDeleteKbItem={handleDeleteKbItem} toggleKbExpand={toggleKbExpand} kbPage={kbPage} />
          )}

          {/* TAB 6: AUDIT LOGS */}
          {activeTab === 'audit' && (
<AuditLogsSection auditSearch={auditSearch} setAuditSearch={setAuditSearch} trimmedAuditSearch={trimmedAuditSearch} auditPage={auditPage} setAuditPage={setAuditPage} auditTotal={auditTotal} auditPageSize={auditPageSize} setAuditLoading={setAuditLoading} auditLoading={auditLoading} auditLoadFailed={auditLoadFailed} auditLogs={auditLogs} />
          )}
        </main>
      </div>

      {banTarget && <UserBanDialog user={banTarget} onSaved={handleBanSaved} onClose={() => setBanTarget(null)} />}

      {/* Edit Herb Modal */}
      {isHerbModalOpen && editingHerb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1b4332]/40 backdrop-blur-sm px-4 py-4">
          <div role="dialog" aria-modal="true" aria-labelledby="edit-herb-title" className="admin-editor flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
            <div className="bg-soft p-5 border-b border-line flex justify-between items-center">
              <h3 id="edit-herb-title" className="text-lg font-black text-ink flex items-center gap-2">
                <Edit2 className="h-5 w-5" /> Edit Herb
              </h3>
              <button onClick={closeEditHerbModal} aria-label="Close herb editor" className="text-gray-400 hover:text-rose-600 text-xl font-bold px-2">&times;</button>
            </div>

            <form onSubmit={handleEditHerbSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-herb-localName" className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Local Name *</label>
                  <input id="admin-herb-localName" name="localName"
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
                  <label htmlFor="admin-herb-cebuanoName" className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Common Name</label>
                  <input id="admin-herb-cebuanoName" name="cebuanoName"
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
                  <label htmlFor="admin-herb-scientificName" className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Scientific Name *</label>
                  <input id="admin-herb-scientificName" name="scientificName"
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
                  <label htmlFor="admin-herb-category" className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Category *</label>
                  <input id="admin-herb-category" name="category"
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
                <label htmlFor="admin-herb-medicinalUses" className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Medicinal Uses *</label>
                <textarea id="admin-herb-medicinalUses" name="medicinalUses"
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
                <label htmlFor="admin-herb-preparationMethod" className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Preparation Method</label>
                <textarea id="admin-herb-preparationMethod" name="preparationMethod"
                  aria-label="Preparation Method"
                  rows={2}
                  value={herbFormData.preparationMethod}
                  onChange={(e) => setHerbFormData({...herbFormData, preparationMethod: e.target.value})}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-[#1b4332] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]/50 resize-none"
                  placeholder="Describe how to prepare this herb..."
                />
              </div>

              <div>
                <label htmlFor="admin-herb-dosage" className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Dosage & Frequency</label>
                <textarea id="admin-herb-dosage" name="dosage"
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
                  <label htmlFor="admin-herb-regionFound" className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Region Found</label>
                  <input id="admin-herb-regionFound" name="regionFound"
                    aria-label="Region Found"
                    type="text"
                    value={herbFormData.regionFound}
                    onChange={(e) => setHerbFormData({...herbFormData, regionFound: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm font-semibold text-[#1b4332] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]/50"
                    placeholder="e.g., Common in tropical areas"
                  />
                </div>
                <div>
                  <label htmlFor="admin-herb-imageUrl" className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Image Path / URL</label>
                  <input id="admin-herb-imageUrl" name="imageUrl"
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
                <label htmlFor="admin-herb-warnings" className="block text-xs font-bold text-[#1b4332] uppercase tracking-wider mb-1">Important Warnings & Precautions</label>
                <textarea id="admin-herb-warnings" name="warnings"
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
          <div role="dialog" aria-modal="true" aria-labelledby="knowledge-editor-title" className="admin-editor flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl animate-in fade-in duration-200">

            <header className="px-6 py-4 border-b border-line flex items-center justify-between">
              <h3 id="knowledge-editor-title" className="font-extrabold text-lg text-ink">
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
                <label htmlFor="admin-kbQuestion" className="block text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  Question *
                </label>
                <input id="admin-kbQuestion" name="kbQuestion"
                  aria-label="Knowledge question"
                  type="text"
                  required
                  minLength={5}
                  placeholder="e.g. What is the traditional use of Yerba Buena?"
                  value={kbQuestion}
                  onChange={(e) => setKbQuestion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-[#1b4332] placeholder-emerald-800/20 focus:outline-none focus:border-[#2d6a4f]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="admin-kbAnswer" className="block text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  Detailed Answer *
                </label>
                <textarea id="admin-kbAnswer" name="kbAnswer"
                  aria-label="Knowledge answer"
                  required
                  minLength={10}
                  rows={4}
                  placeholder="Write an answer supported by the source below. Dr. Ai may use it as context."
                  value={kbAnswer}
                  onChange={(e) => setKbAnswer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-[#1b4332] placeholder-emerald-800/20 focus:outline-none focus:border-[#2d6a4f] resize-none"
                />
              </div>

              <fieldset className="space-y-3 border-t border-line pt-4">
                <legend className="text-xs font-extrabold uppercase tracking-wider text-muted">Philippine-relevant source *</legend>
                <p className="text-xs text-muted">Use a source that supports this answer. Dr. Ai may retrieve published entries.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="kb-source-title" className="mb-1 block text-xs font-bold text-ink">Source title</label>
                    <input id="kb-source-title" required value={kbSourceTitle} onChange={(event) => setKbSourceTitle(event.target.value)} className="w-full rounded-xl border border-line bg-canvas px-4 py-2 text-sm text-ink" />
                  </div>
                  <div>
                    <label htmlFor="kb-source-publisher" className="mb-1 block text-xs font-bold text-ink">Publisher</label>
                    <input id="kb-source-publisher" required value={kbSourcePublisher} onChange={(event) => setKbSourcePublisher(event.target.value)} className="w-full rounded-xl border border-line bg-canvas px-4 py-2 text-sm text-ink" />
                  </div>
                </div>
                <div>
                  <label htmlFor="kb-source-url" className="mb-1 block text-xs font-bold text-ink">Source URL</label>
                  <input id="kb-source-url" type="url" required value={kbSourceUrl} onChange={(event) => setKbSourceUrl(event.target.value)} placeholder="https://" className="w-full rounded-xl border border-line bg-canvas px-4 py-2 text-sm text-ink" />
                </div>
              </fieldset>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="admin-kbCategory" className="block text-xs font-extrabold uppercase tracking-wider text-gray-400">
                    Category (Optional)
                  </label>
                  <input id="admin-kbCategory" name="kbCategory"
                    aria-label="Knowledge category"
                    type="text"
                    placeholder="e.g. dosage, preparation"
                    value={kbCategory}
                    onChange={(e) => setKbCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-[#1b4332] placeholder-emerald-800/20 focus:outline-none focus:border-[#2d6a4f]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="admin-kbTags" className="block text-xs font-extrabold uppercase tracking-wider text-gray-400">
                    Tags (Comma Separated)
                  </label>
                  <input id="admin-kbTags" name="kbTags"
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
