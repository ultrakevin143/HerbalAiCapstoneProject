'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import io, { Socket } from 'socket.io-client';
import { Bell, Check, CheckCheck, ShieldCheck, FileText, ExternalLink, MessageCircle, MessageSquare } from 'lucide-react';
import api from '../lib/axios';
import { cachedApiGet, invalidateApiGetCache } from '../lib/request-cache';
import { playNotificationSound, prepareNotificationSound } from '../lib/notification-sound';
import { useAuth } from '../context/AuthContext';
import { createRefreshCoordinator } from '../lib/refresh-coordinator';
import { isOwnedNotification, notificationSnapshot, type NotificationItem } from '../lib/notification-state';

export type { NotificationItem } from '../lib/notification-state';

type NotificationCategory = 'all' | 'community' | 'messages';

const getNotificationCategory = (type: string): Exclude<NotificationCategory, 'all'> | 'other' => {
  if (type === 'DIRECT_MESSAGE') return 'messages';
  if (type.startsWith('COMMUNITY_') || type === 'FORUM_REPLY') return 'community';
  return 'other';
};

export default function NotificationBell() {
  const { user } = useAuth();
  return user ? <AccountNotificationBell key={user.id} userId={user.id} /> : null;
}

function AccountNotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const panelRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);
  const refreshRef = useRef<(() => Promise<void>) | null>(null);
  const pendingReads = useRef(new Set<number | 'all'>());
  const [readingIds, setReadingIds] = useState<Set<number | 'all'>>(() => new Set());

  const categoryCounts = useMemo(() => ({
    all: notifications.filter((notification) => !notification.isRead).length,
    community: notifications.filter((notification) => !notification.isRead && getNotificationCategory(notification.type) === 'community').length,
    messages: notifications.filter((notification) => !notification.isRead && getNotificationCategory(notification.type) === 'messages').length,
  }), [notifications]);

  const visibleNotifications = useMemo(() => notifications.filter((notification) => (
    activeCategory === 'all' || getNotificationCategory(notification.type) === activeCategory
  )), [activeCategory, notifications]);

  useEffect(() => {
    let isMounted = true;
    activeRef.current = true;
    let sequence = 0;
    const knownIds = new Set<number>();
    const controller = new AbortController();
    const prepareSound = () => {
      try { prepareNotificationSound(); } catch { console.error('Notification sound is unavailable.'); }
    };
    window.addEventListener('pointerdown', prepareSound, { once: true });
    window.addEventListener('keydown', prepareSound, { once: true });

    const loadNotifications = async (force = false) => {
      const requestSequence = ++sequence;
      try {
        const res = await cachedApiGet('/notifications', 10_000, force, userId);
        if (isMounted && requestSequence === sequence && res.data?.status === 'success') {
          const snapshot = notificationSnapshot(res.data.data, userId);
          for (const notification of snapshot.notifications) knownIds.add(notification.id);
          setNotifications(snapshot.notifications);
          setUnreadCount(snapshot.unreadCount);
        }
      } catch (err) {
        if (isMounted && requestSequence === sequence) console.error('Failed to fetch notifications:', err);
      } finally {
        if (isMounted && requestSequence === sequence) {
          setLoading(false);
        }
      }
    };

    const refresh = createRefreshCoordinator(() => loadNotifications(true), () => isMounted);
    refreshRef.current = refresh;
    void loadNotifications();
    const resume = () => {
      if (isMounted && document.visibilityState !== 'hidden') {
        void refresh();
        if (!socket.connected) socket.connect();
      }
    };
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', resume);

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socket: Socket = io(socketUrl, {
      autoConnect: false,
      auth: (complete) => {
        void api.get('/auth/socket-token', { signal: controller.signal }).then((response) => {
          if (isMounted) complete({ token: response.data.data.token });
        }).catch(() => {
          if (isMounted) {
            console.error('Failed to authenticate notification connection.');
            complete({});
          }
        });
      },
    });
    socket.on('connect', () => { if (isMounted) void refresh(); });

    socket.on('notification', (newNotif: NotificationItem) => {
      if (isMounted && isOwnedNotification(newNotif, userId)) {
        invalidateApiGetCache('/notifications');
        if (!knownIds.has(newNotif.id)) {
          knownIds.add(newNotif.id);
          if (!newNotif.isRead && newNotif.type === 'DIRECT_MESSAGE') void playNotificationSound(newNotif.id).catch(() => undefined);
        }
        void refresh();
      }
    });
    socket.connect();

    return () => {
      isMounted = false;
      activeRef.current = false;
      refreshRef.current = null;
      controller.abort();
      window.removeEventListener('pointerdown', prepareSound);
      window.removeEventListener('keydown', prepareSound);
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', resume);
      socket.disconnect();
    };
  }, [userId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const performRead = async (key: number | 'all', path: string) => {
    if (!activeRef.current || pendingReads.current.has('all') || pendingReads.current.has(key) || (key === 'all' && pendingReads.current.size > 0)) return;
    pendingReads.current.add(key);
    setReadingIds((current) => new Set(current).add(key));
    try {
      await api.patch(path);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      try {
        invalidateApiGetCache('/notifications');
        if (activeRef.current) await refreshRef.current?.();
      } finally {
        pendingReads.current.delete(key);
        if (activeRef.current) setReadingIds((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    }
  };

  const handleMarkAsRead = async (id: number, link?: string | null) => {
    await performRead(id, `/notifications/${id}/read`);
    if (link && activeRef.current) {
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await performRead('all', '/notifications/read-all');
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-panel text-ink shadow-sm transition hover:bg-soft"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-forest px-1 text-xs font-bold text-white shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Drawer */}
      {isOpen && (
        <div className="fixed left-3 right-3 top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain xl:absolute xl:left-auto xl:right-0 xl:top-full xl:mt-2 xl:w-96 rounded-2xl border border-line bg-panel p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-line pb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-soft px-2 py-0.5 text-sm font-bold text-ink">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={readingIds.size > 0}
                aria-busy={readingIds.has('all')}
                className="flex items-center gap-1 text-sm font-semibold text-ink hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-soft p-1" role="tablist" aria-label="Notification categories">
            {(['all', 'community', 'messages'] as NotificationCategory[]).map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-bold capitalize transition ${
                  activeCategory === category
                    ? 'bg-panel text-ink shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <span className="truncate">{category}</span>
                {categoryCounts[category] > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-forest px-1 text-[10px] font-bold text-white">
                    {categoryCounts[category] > 99 ? '99+' : categoryCounts[category]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-2 max-h-80 overflow-y-auto space-y-1.5 divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted font-medium">
                Loading notifications...
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center gap-2 text-muted">
                <Bell className="h-7 w-7 stroke-[1.5]" />
                <span className="text-sm font-medium">
                  No {activeCategory === 'all' ? '' : `${activeCategory} `}notifications yet
                </span>
              </div>
            ) : (
              visibleNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex flex-col gap-1 p-2.5 rounded-xl transition ${
                    notif.isRead
                      ? 'bg-panel hover:bg-panel'
                      : 'bg-canvas border border-line hover:bg-soft'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {notif.type === 'SUGGESTION_UPDATE' ? (
                        <ShieldCheck className="h-4 w-4 text-ink shrink-0" />
                      ) : notif.type === 'DIRECT_MESSAGE' ? (
                        <MessageCircle className="h-4 w-4 text-ink shrink-0" />
                      ) : getNotificationCategory(notif.type) === 'community' ? (
                        <MessageSquare className="h-4 w-4 text-ink shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted shrink-0" />
                      )}
                      <span className="text-sm font-bold text-ink leading-tight">
                        {notif.title}
                      </span>
                    </div>
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notif.id)}
                        disabled={readingIds.has('all') || readingIds.has(notif.id)}
                        aria-busy={readingIds.has('all') || readingIds.has(notif.id)}
                        title="Mark as read"
                        className="text-muted hover:text-ink p-0.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-muted leading-relaxed pl-5">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between pl-5 pt-1 text-sm text-muted font-medium">
                    <span>
                      {new Date(notif.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {notif.link && (
                      <Link
                        href={notif.link}
                        onClick={() => handleMarkAsRead(notif.id, notif.link)}
                        className="inline-flex items-center gap-1 font-bold text-ink hover:underline"
                      >
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
