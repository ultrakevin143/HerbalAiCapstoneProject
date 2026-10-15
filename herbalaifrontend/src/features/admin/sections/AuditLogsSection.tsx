'use client';

import { Search, ClipboardList } from 'lucide-react';
import type React from 'react';
import type { AuditLog } from '../types';

interface AuditLogsSectionProps {
  auditSearch: string;
  setAuditSearch: React.Dispatch<React.SetStateAction<string>>;
  trimmedAuditSearch: string;
  auditPage: number;
  setAuditPage: React.Dispatch<React.SetStateAction<number>>;
  auditTotal: number;
  auditPageSize: number;
  setAuditLoading: React.Dispatch<React.SetStateAction<boolean>>;
  auditLoading: boolean;
  auditLoadFailed: boolean;
  auditLogs: AuditLog[];
}

export default function AuditLogsSection({
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
}: AuditLogsSectionProps) {
  return (
<div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-black text-ink italic">
                    Administrative Audit Logs
                  </h1>
                  <p className="text-xs text-muted font-medium mt-1">
                    Records selected administrator actions in Herbal-Ai. Direct database edits and routine activity are not logged.
                  </p>
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input name="auditSearch"
                    type="text"
                    placeholder="Search audit records..."
                    aria-label="Filter audit logs"
                    maxLength={200}
                    value={auditSearch}
                    onChange={(e) => { if (e.target.value.trim() !== trimmedAuditSearch || auditPage !== 1) setAuditLoading(true); setAuditSearch(e.target.value); setAuditPage(1); }}
                    className="w-full rounded-xl border border-input bg-panel py-2 pl-9 pr-4 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {auditLoading || auditLoadFailed || auditLogs.length === 0 ? (
                <div className="bg-panel p-12 text-center rounded-2xl border border-line shadow-sm flex flex-col items-center gap-3">
                  <ClipboardList className="h-10 w-10 text-muted stroke-[1.5]" />
                  <p role="status" className="text-sm font-bold text-muted">{auditLoading ? 'Loading audit logs…' : auditLoadFailed ? 'Audit logs could not be loaded. Please try again.' : trimmedAuditSearch ? 'No audit records match this search.' : 'No audit logs recorded yet'}</p>
                  {!auditLoading && !auditLoadFailed && trimmedAuditSearch && (
                    <button type="button" onClick={() => { setAuditSearch(''); setAuditPage(1); setAuditLoading(true); }} className="min-h-11 rounded-lg border border-line px-4 font-semibold">Clear search</button>
                  )}
                </div>
              ) : (
                <div className="bg-panel rounded-2xl border border-line shadow-sm overflow-x-auto">
                  <table className="admin-table w-full text-left">
                    <thead>
                      <tr className="border-b border-line bg-soft text-[11px] font-extrabold uppercase tracking-wider text-muted">
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Admin Actor</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Target</th>
                        <th className="py-3 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-xs font-semibold text-ink">
                      {auditLogs.map((log) => {
                          const getBadgeColor = (action: string) => {
                            if (action.includes('APPROVE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            if (action.includes('REJECT')) return 'bg-amber-50 text-amber-700 border-amber-200';
                            if (action.includes('BAN') && !action.includes('UNBAN')) return 'bg-rose-50 text-rose-700 border-rose-200';
                            if (action.includes('UNBAN')) return 'bg-teal-50 text-teal-700 border-teal-200';
                            if (action.includes('DELETE')) return 'bg-rose-50 text-rose-700 border-rose-200';
                            return 'bg-blue-50 text-blue-700 border-blue-200';
                          };

                          return (
                            <tr key={log.id} className="transition hover:bg-soft">
                              <td className="py-3 px-4 text-muted font-mono text-[11px] whitespace-nowrap">
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
                                    <div className="font-bold text-ink text-xs leading-none">{log.admin.name}</div>
                                    <div className="text-[10px] text-muted">{log.admin.email || log.admin.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-full border ${getBadgeColor(log.action)}`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-ink">{log.targetType}</span>
                                {log.targetId && (
                                  <span className="text-muted text-[11px] block font-mono">ID: {log.targetId}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 max-w-md text-sm text-muted">
                                {log.details ? (
                                  <details>
                                    <summary className="cursor-pointer font-semibold">View change details</summary>
                                    <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded border border-line bg-soft p-3 text-xs">
                                      {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                                    </pre>
                                  </details>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
              {!auditLoadFailed && (
                <nav aria-label="Audit log pages" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
                  <p role="status" aria-live="polite">{auditLoading ? 'Loading audit records…' : `Showing ${auditTotal ? (auditPage - 1) * auditPageSize + 1 : 0}–${Math.min(auditPage * auditPageSize, auditTotal)} of ${auditTotal}${trimmedAuditSearch ? ' matching' : ''} records`}</p>
                  <div className="flex items-center gap-3">
                    <button type="button" disabled={auditLoading || auditPage <= 1} onClick={() => { setAuditPage(page => page - 1); setAuditLoading(true); }} className="min-h-11 rounded-lg border border-line px-3 disabled:opacity-40">Previous</button>
                    <span>Page {auditPage} of {Math.max(1, Math.ceil(auditTotal / auditPageSize))}</span>
                    <button type="button" disabled={auditLoading || auditPage * auditPageSize >= auditTotal || auditPage * auditPageSize > 10000} onClick={() => { setAuditPage(page => page + 1); setAuditLoading(true); }} className="min-h-11 rounded-lg border border-line px-3 disabled:opacity-40">Next</button>
                  </div>
                </nav>
              )}
            </div>
  );
}
