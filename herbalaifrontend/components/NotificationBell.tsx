'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import io, { Socket } from 'socket.io-client';
import { Bell, Check, CheckCheck, ShieldCheck, FileText, ExternalLink } from 'lucide-react';
import api from '../lib/axios';
import { cachedApiGet, invalidateApiGetCache } from '../lib/request-cache';

export interface NotificationItem {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const res = await cachedApiGet('/notifications', 10_000);
        if (isMounted && res.data?.status === 'success') {
          const notifs = res.data.data.notifications || [];
          setNotifications(notifs);
          setUnreadCount(notifs.filter((n: NotificationItem) => !n.isRead).length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socket: Socket = io(socketUrl, { withCredentials: true });

    socket.on('notification', (newNotif: NotificationItem) => {
      if (isMounted) {
        invalidateApiGetCache('/notifications');
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

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

  const handleMarkAsRead = async (id: number, link?: string | null) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      invalidateApiGetCache('/notifications');
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
    if (link) {
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      invalidateApiGetCache('/notifications');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#1b4332]/20 bg-white text-[#1b4332] shadow-sm transition hover:bg-[#eef5f0]"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#d90429] px-1 text-[10px] font-extrabold text-white shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Drawer */}
      {isOpen && (
        <div className="fixed left-3 right-3 top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain xl:absolute xl:left-auto xl:right-0 xl:top-full xl:mt-2 xl:w-96 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1b4332] text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#2d6a4f]/10 px-2 py-0.5 text-[11px] font-bold text-[#2d6a4f]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs font-semibold text-[#2d6a4f] hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-2 max-h-80 overflow-y-auto space-y-1.5 divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500 font-medium">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center gap-2 text-gray-400">
                <Bell className="h-7 w-7 stroke-[1.5]" />
                <span className="text-xs font-medium">No notifications yet</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex flex-col gap-1 p-2.5 rounded-xl transition ${
                    notif.isRead
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-[#f4faf6] border border-[#a3ef95]/40 hover:bg-[#ebf7ef]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {notif.type === 'SUGGESTION_UPDATE' ? (
                        <ShieldCheck className="h-4 w-4 text-[#2d6a4f] shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-[#52b788] shrink-0" />
                      )}
                      <span className="text-xs font-bold text-[#1b4332] leading-tight">
                        {notif.title}
                      </span>
                    </div>
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Mark as read"
                        className="text-gray-400 hover:text-[#2d6a4f] p-0.5"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed pl-5">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between pl-5 pt-1 text-[11px] text-gray-400 font-medium">
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
                        className="inline-flex items-center gap-1 font-bold text-[#2d6a4f] hover:underline"
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
