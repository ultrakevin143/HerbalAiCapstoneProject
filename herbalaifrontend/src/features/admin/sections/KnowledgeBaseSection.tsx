'use client';

import { Edit2, Trash2, Plus, Search, BookOpen, Download, FileJson, LoaderCircle, Upload, ExternalLink, ChevronDown, ChevronUp, Copy, Check, Filter } from 'lucide-react';
import type React from 'react';
import type { KBItem } from '../types';
import type { KnowledgeSource } from '../knowledge-source';

interface KnowledgeBaseSectionProps {
  kbTotal: number;
  kbSearch: string;
  setKbSearch: React.Dispatch<React.SetStateAction<string>>;
  setKbPage: React.Dispatch<React.SetStateAction<number>>;
  setKbLoading: React.Dispatch<React.SetStateAction<boolean>>;
  openKbModal: (item?: KBItem | null) => void;
  kbStatusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  setKbStatusFilter: React.Dispatch<React.SetStateAction<"ALL" | "ACTIVE" | "INACTIVE">>;
  availableKbCategories: string[];
  kbCategoryFilter: string;
  setKbCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
  filteredKbList: KBItem[];
  isImportingKb: boolean;
  handleKbFileImport: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  kbLoading: boolean;
  getKbPrimarySource: (item: KBItem) => KnowledgeSource | null;
  expandedKbIds: Set<string>;
  handleToggleKbActive: (id: string, currentIsActive: boolean) => Promise<void>;
  handleCopyKbFact: (item: KBItem) => Promise<void>;
  copiedKbId: string | null;
  handleDeleteKbItem: (id: string) => Promise<void>;
  toggleKbExpand: (id: string) => void;
  kbPage: number;
}

export default function KnowledgeBaseSection({
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
}: KnowledgeBaseSectionProps) {
  return (
<div className="rounded-2xl border border-line bg-panel p-6 shadow-sm font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-serif-custom font-black italic text-xl text-ink">
                    Dr. AI RAG Facts ({kbTotal})
                  </h2>
                  <p className="text-xs text-muted mt-1">Manage QA resources used by Dr. AI to generate RAG responses</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    <input name="kbSearch"
                      type="text"
                      placeholder="Search KB items..."
                      value={kbSearch}
                      onChange={(e) => { setKbSearch(e.target.value); setKbPage(1); setKbLoading(true); }}
                      aria-label="Search knowledge base facts"
                      className="w-full rounded-xl border border-input bg-panel py-2 pl-9 pr-4 text-xs font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <button
                    onClick={() => openKbModal(null)}
                    className="flat-button flat-button-primary !py-2 !px-3 text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add KB Fact
                  </button>
                </div>
              </div>

              {/* Filter Toolbar: Category & Status */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-soft/50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-muted mr-1">
                    <Filter className="h-3.5 w-3.5 text-muted" /> Filter:
                  </div>

                  {/* Status Pills */}
                  <div className="inline-flex rounded-lg border border-line bg-panel p-0.5 text-xs">
                    {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => { if (status !== kbStatusFilter) { setKbStatusFilter(status); setKbPage(1); setKbLoading(true); } }}
                        aria-pressed={kbStatusFilter === status}
                        className={`rounded-md px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                          kbStatusFilter === status
                            ? 'bg-[#606c38] text-white shadow-sm'
                            : 'text-muted hover:text-ink'
                        }`}
                      >
                        {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </button>
                    ))}
                  </div>

                  {/* Category Dropdown */}
                  {availableKbCategories.length > 0 && (
                    <div className="relative">
                      <select name="kbCategoryFilter"
                        aria-label="Filter by Category"
                        value={kbCategoryFilter}
                        onChange={(e) => { setKbCategoryFilter(e.target.value); setKbPage(1); setKbLoading(true); }}
                        className="rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      >
                        <option value="ALL">All Categories ({availableKbCategories.length})</option>
                        {availableKbCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(kbCategoryFilter !== 'ALL' || kbStatusFilter !== 'ALL' || kbSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setKbCategoryFilter('ALL');
                        setKbStatusFilter('ALL');
                        setKbSearch('');
                        setKbPage(1);
                        setKbLoading(true);
                      }}
                      className="text-xs font-bold text-accent hover:underline ml-1 cursor-pointer"
                    >
                      Reset filters
                    </button>
                  )}
                </div>

                <div className="text-xs font-semibold text-muted">
                  Showing <strong className="text-ink">{filteredKbList.length}</strong> of {kbTotal} facts
                </div>
              </div>

              <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-line bg-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#606c38] text-white">
                    <FileJson className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-ink">Import reviewed RAG facts</p>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
                      Upload one fact or an array of up to 50 facts. Dr. AI creates fresh embeddings and updates matching questions.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <a
                    href="/templates/philippine-herbal-medicine-kb-facts.json"
                    download
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-2 text-xs font-bold text-ink transition hover:bg-soft"
                  >
                    <Download className="h-3.5 w-3.5" /> Philippine core
                  </a>
                  <a
                    href="/templates/lagundi-kb-facts.json"
                    download
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-2 text-xs font-bold text-ink transition hover:bg-soft"
                  >
                    <Download className="h-3.5 w-3.5" /> Lagundi pack
                  </a>
                  <a
                    href="/templates/pitahc-nine-herbs-kb-facts.json"
                    download
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-2 text-xs font-bold text-ink transition hover:bg-soft"
                  >
                    <Download className="h-3.5 w-3.5" /> Nine-herb pack
                  </a>
                  <label className={`inline-flex items-center gap-1.5 rounded-full bg-[#c66b3d] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#b85e34] ${isImportingKb ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
                    {isImportingKb ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {isImportingKb ? 'Importing…' : 'Import JSON'}
                    <input name="knowledgeImport"
                      type="file"
                      accept="application/json,.json"
                      disabled={isImportingKb}
                      onChange={handleKbFileImport}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {kbLoading ? (
                <p role="status" className="py-8 text-center text-sm text-muted">Loading knowledge base facts…</p>
              ) : filteredKbList.length === 0 ? (
                <div className="rounded-2xl border border-line bg-panel p-12 text-center shadow-sm">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-muted">
                    <BookOpen className="h-6 w-6 stroke-[1.5]" />
                  </div>
                  <p className="text-sm font-bold text-ink">No knowledge base facts found</p>
                  <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                    Try adjusting your search terms or filter selections.
                  </p>
                  {(kbSearch || kbCategoryFilter !== 'ALL' || kbStatusFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setKbSearch('');
                        setKbCategoryFilter('ALL');
                        setKbStatusFilter('ALL');
                        setKbPage(1);
                        setKbLoading(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-bold text-accent hover:bg-soft cursor-pointer"
                    >
                      Clear search & filters
                    </button>
                  )}
                </div>
              ) : (
                <div role="table" aria-label="Dr. AI Knowledge Base Facts" className="grid grid-cols-1 gap-4">
                  {filteredKbList.map((item) => {
                    const primarySource = getKbPrimarySource(item);
                    const isLongAnswer = item.answer.length > 220;
                    const isExpanded = expandedKbIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        role="row"
                        className="group relative flex flex-col rounded-2xl border border-line bg-panel p-5 shadow-sm transition hover:border-[#606c38]/40 hover:shadow-md"
                      >
                        {/* Header: Category Badge + Active/Inactive + Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line/60">
                          <div className="flex flex-wrap items-center gap-2">
                            {item.category ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#606c38]/10 text-[#606c38] dark:text-[#a3b18a] border border-[#606c38]/20">
                                {item.category}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-soft text-muted border border-line">
                                General
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleToggleKbActive(item.id, item.isActive)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border transition cursor-pointer ${
                                item.isActive
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : 'bg-soft text-muted border-line hover:bg-panel'
                              }`}
                              title={`Click to ${item.isActive ? 'deactivate' : 'activate'}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? 'bg-emerald-500 animate-pulse motion-reduce:animate-none' : 'bg-muted'}`} />
                              {item.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyKbFact(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-bold text-ink transition hover:bg-soft cursor-pointer"
                              title="Copy question and answer"
                            >
                              {copiedKbId === item.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="text-emerald-600">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5 text-muted" />
                                  <span className="hidden sm:inline">Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => openKbModal(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-bold text-accent transition hover:bg-soft cursor-pointer"
                              title="Edit Entry"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteKbItem(item.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Question Content */}
                        <div className="pt-3.5 pb-2">
                          <div className="flex items-start gap-2.5">
                            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#283618] text-xs font-black text-white dark:bg-[#606c38] mt-0.5">
                              Q
                            </span>
                            <h3 className="font-extrabold text-ink text-sm sm:text-base leading-snug">
                              {item.question}
                            </h3>
                          </div>
                        </div>

                        {/* Answer Content */}
                        <div className="mt-2 rounded-xl border border-line/60 bg-soft/40 p-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted flex items-center gap-1">
                              <BookOpen className="h-3 w-3 text-muted" /> Reference Answer
                            </span>
                            {isLongAnswer && (
                              <button
                                type="button"
                                onClick={() => toggleKbExpand(item.id)}
                                className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>Show less <ChevronUp className="h-3 w-3" /></>
                                ) : (
                                  <>Read full answer <ChevronDown className="h-3 w-3" /></>
                                )}
                              </button>
                            )}
                          </div>

                          <p className={`text-xs sm:text-sm text-ink/90 font-medium leading-relaxed whitespace-pre-line ${
                            !isExpanded && isLongAnswer ? 'line-clamp-3' : ''
                          }`}>
                            {item.answer}
                          </p>
                        </div>

                        {/* Footer Bar: Tags & Philippine Provenance */}
                        <div className="mt-3.5 pt-3 border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.tags.length > 0 ? (
                              item.tags.map((tag, tIdx) => (
                                <span key={tIdx} className="rounded-md border border-line bg-panel px-2 py-0.5 text-[10px] font-bold text-ink">
                                  #{tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted text-[11px] italic">No tags</span>
                            )}
                          </div>

                          {primarySource && (primarySource.title || primarySource.publisher) && (
                            <div className="flex items-center gap-1.5 text-muted text-[11px]">
                              <span className="font-bold text-ink">Source:</span>
                              {primarySource.url ? (
                                <a
                                  href={primarySource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-semibold text-accent hover:underline max-w-[280px] sm:max-w-xs truncate"
                                  title={`${primarySource.title} (${primarySource.publisher || 'Philippines'})`}
                                >
                                  <span className="truncate">{primarySource.publisher || primarySource.title}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                              ) : (
                                <span className="truncate max-w-[280px] sm:max-w-xs">{primarySource.publisher || primarySource.title}</span>
                              )}
                            </div>
                          )}
                          {primarySource?.unavailable && (
                            <p className="mt-2 w-full text-xs text-muted whitespace-pre-wrap break-words">
                              {primarySource.availabilityNote}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between text-sm text-ink">
                <span>Page {kbPage} of {Math.max(1, Math.ceil(kbTotal / 3))}</span>
                <div className="flex gap-2">
                  <button type="button" disabled={kbLoading || kbPage === 1} onClick={() => { setKbPage((page) => page - 1); setKbLoading(true); }} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Previous</button>
                  <button type="button" disabled={kbLoading || kbPage * 3 >= kbTotal} onClick={() => { setKbPage((page) => page + 1); setKbLoading(true); }} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Next</button>
                </div>
              </div>
            </div>
  );
}
