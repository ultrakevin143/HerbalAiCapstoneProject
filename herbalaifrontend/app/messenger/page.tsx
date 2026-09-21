'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SessionUnavailable from '../../components/SessionUnavailable';
import api from '../../lib/axios';
import io, { Socket } from 'socket.io-client';
import { 
  Send, 
  MessageSquare, 
  Search, 
  UserPlus, 
  X, 
  ChevronRight, 
  Paperclip, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Check, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

// --- Types ---
interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface ChatMessage {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  time: string;
  sender: UserProfile;
}

interface Conversation {
  contact: UserProfile;
  lastMessage: string;
  lastTime: string;
}

// --- Helpers ---
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getRoleLabel(role: string) {
  if (role === 'admin') return 'Admin Specialist';
  if (role === 'botanist') return 'Botanical Researcher';
  return 'Contributor';
}

function avatarDisplay(avatar: string, name: string, size = 'md') {
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  if (avatar?.startsWith('http')) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${dim} rounded-md object-cover border border-line shadow-xs`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-md bg-soft text-ink font-bold border border-line flex items-center justify-center shadow-xs`}
    >
      {avatar || name.charAt(0).toUpperCase()}
    </div>
  );
}

// --- Main Content Component ---
function MessengerContent() {
  const { user, isAuthenticated, loading, sessionUnavailable, checkSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationOffset, setConversationOffset] = useState(0);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [activeContact, setActiveContact] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedConversationSearch, setDebouncedConversationSearch] = useState('');
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userPickerSearch, setUserPickerSearch] = useState('');
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userOffset, setUserOffset] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);

  // --- Attachments & Edit/Delete States ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editInput, setEditInput] = useState('');
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const prependingMessagesRef = useRef(false);
  const conversationQueryRef = useRef(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated && !sessionUnavailable) {
      const callback = targetUserId ? `/messenger?userId=${targetUserId}` : '/messenger';
      router.push(`/signin?callbackUrl=${encodeURIComponent(callback)}`);
    }
  }, [loading, isAuthenticated, sessionUnavailable, router, targetUserId]);

  // Click outside listener to close message menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuMessageId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Setup socket & fetch initial data
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

    socketRef.current = io(backendUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
    let active = true;
    api.get('/auth/socket-token').then((response) => {
      if (!active || !socketRef.current) return;
      socketRef.current.auth = { token: response.data.data.token };
      socketRef.current.connect();
    }).catch((error) => console.error('Failed to authenticate messenger connection:', error));

    socketRef.current.on('connect', () => {
      console.log('Connected to real-time messaging server');
    });

    socketRef.current.on('private_message', (msg: ChatMessage) => {
      // Only apply if the message belongs to current user or active contact
      setMessages((prev) => {
        const alreadyExists = prev.some((m) => m.id === msg.id);
        if (alreadyExists) return prev;
        return [...prev, msg];
      });

      // Update sidebar conversation preview
      setConversations((prev) => {
        const contactId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
        const existingContact = prev.find((c) => c.contact.id === contactId)?.contact;
        // For outgoing messages, msg.sender is the current user. Preserve the
        // recipient already inserted by openConversation instead of displaying self.
        const contact = existingContact || msg.sender;
        
        let lastMsgText = msg.content;
        if (msg.isDeleted) {
          lastMsgText = 'This message was deleted';
        } else if (msg.imageUrl) {
          lastMsgText = '📷 Sent an image';
        }

        const updated: Conversation = {
          contact: { ...contact, id: contactId },
          lastMessage: lastMsgText,
          lastTime: msg.time,
        };
        const filtered = prev.filter((c) => c.contact.id !== contactId);
        return [updated, ...filtered];
      });
    });

    socketRef.current.on('message_edited', (msg: ChatMessage) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      
      // Update sidebar conversation preview if it's the last message
      setConversations((prev) => prev.map((c) => {
        const contactId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
        if (c.contact.id === contactId) {
          return { ...c, lastMessage: msg.content };
        }
        return c;
      }));
    });

    socketRef.current.on('message_deleted', (msg: ChatMessage) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));

      // Update sidebar conversation preview if it's the last message
      setConversations((prev) => prev.map((c) => {
        const contactId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
        if (c.contact.id === contactId) {
          return { ...c, lastMessage: 'This message was deleted' };
        }
        return c;
      }));
    });

    return () => {
      active = false;
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedConversationSearch(searchTerm.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    conversationQueryRef.current += 1;
    api.get('/messages/conversations', { params: { limit: 25, offset: 0, search: debouncedConversationSearch } }).then((response) => {
      if (cancelled || response.data?.status !== 'success') return;
      const page: Conversation[] = response.data.data.conversations || [];
      setConversations(page);
      setConversationOffset(page.length);
      setHasMoreConversations(Boolean(response.data.data.hasMore));
    }).catch((error) => { if (!cancelled) console.error('Failed to fetch conversations', error); });
    return () => { cancelled = true; };
  }, [isAuthenticated, debouncedConversationSearch]);

  const loadMoreConversations = async () => {
    if (!hasMoreConversations || loadingMoreConversations) return;
    const requestVersion = conversationQueryRef.current;
    setLoadingMoreConversations(true);
    try {
      const response = await api.get('/messages/conversations', { params: { limit: 25, offset: conversationOffset, search: debouncedConversationSearch } });
      if (requestVersion !== conversationQueryRef.current || response.data?.status !== 'success') return;
      const page: Conversation[] = response.data.data.conversations || [];
      setConversations((current) => [...current, ...page.filter((item) => !current.some((existing) => existing.contact.id === item.contact.id))]);
      setConversationOffset((offset) => offset + page.length);
      setHasMoreConversations(Boolean(response.data.data.hasMore));
    } catch (error) {
      console.error('Failed to load conversations', error);
    } finally {
      setLoadingMoreConversations(false);
    }
  };

  useEffect(() => {
    if (!showUserPicker || !isAuthenticated) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const response = await api.get('/messages/users', { params: { search: userPickerSearch, limit: 20, offset: userOffset } });
        if (cancelled) return;
        const nextUsers: UserProfile[] = response.data.data.users || [];
        setAllUsers((current) => userOffset === 0 ? nextUsers : [...current, ...nextUsers]);
        setHasMoreUsers(Boolean(response.data.data.hasMore));
      } catch (error) {
        if (!cancelled) console.error('Failed to fetch users', error);
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    }, userOffset === 0 ? 250 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [showUserPicker, isAuthenticated, userPickerSearch, userOffset]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (prependingMessagesRef.current) {
      prependingMessagesRef.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = useCallback(async (contact: UserProfile) => {
    setActiveContact(contact);
    setLoadingMessages(true);
    setMessages([]);
    setHasOlderMessages(false);
    setNextBefore(null);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setEditingMessageId(null);
    setInput('');
    inputRef.current?.focus();

    try {
      const res = await api.get(`/messages/history/${contact.id}?limit=50`);
      if (res.data?.status === 'success') {
        setMessages(res.data.data.messages || []);
        setHasOlderMessages(Boolean(res.data.data.hasMore));
        setNextBefore(res.data.data.nextBefore || null);
      }
    } catch (err) {
      console.error('Failed to load message history', err);
    } finally {
      setLoadingMessages(false);
    }

    // Ensure conversation appears in sidebar
    setConversations((prev) => {
      const exists = prev.some((c) => c.contact.id === contact.id);
      if (exists) return prev;
      return [{ contact, lastMessage: '', lastTime: '' }, ...prev];
    });
  }, []);

  const loadOlderMessages = async () => {
    if (!activeContact || !nextBefore || loadingOlderMessages) return;
    setLoadingOlderMessages(true);
    try {
      const res = await api.get(
        `/messages/history/${activeContact.id}?limit=50&before=${encodeURIComponent(nextBefore)}`
      );
      if (res.data?.status === 'success') {
        prependingMessagesRef.current = true;
        setMessages((current) => [...(res.data.data.messages || []), ...current]);
        setHasOlderMessages(Boolean(res.data.data.hasMore));
        setNextBefore(res.data.data.nextBefore || null);
      }
    } catch (err) {
      console.error('Failed to load older messages', err);
    } finally {
      setLoadingOlderMessages(false);
    }
  };

  // Handle auto-opening conversation from query param
  useEffect(() => {
    if (!targetUserId || !isAuthenticated) return;
    
    // Check if user is already the active contact
    if (activeContact?.id === targetUserId) return;

    let cancelled = false;
    api.get('/messages/users', { params: { id: targetUserId } }).then((response) => {
      if (cancelled) return;
      const contact = response.data.data.users?.[0] as UserProfile | undefined;
      if (!contact) return;
      void openConversation(contact);
      const url = new URL(window.location.href);
      url.searchParams.delete('userId');
      window.history.replaceState({}, '', url.pathname + url.search);
    }).catch((error) => console.error('Failed to open linked conversation', error));
    return () => { cancelled = true; };
  }, [targetUserId, isAuthenticated, activeContact, openConversation]);

  // Attachment attachment trigger
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds the 5MB limit.');
        return;
      }
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Send Message (Supports text + image upload)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || !activeContact || isSending) return;

    setIsSending(true);
    const contentText = input.trim();
    
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('receiverId', activeContact.id);
    if (contentText) {
      formData.append('content', contentText);
    }
    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    setInput('');
    removeSelectedFile();

    try {
      await api.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Edit Message Request
  const handleEditSubmit = async (msgId: number) => {
    if (!editInput.trim()) return;

    try {
      const res = await api.put(`/messages/${msgId}`, { content: editInput.trim() });
      if (res.data?.status === 'success') {
        setEditingMessageId(null);
        setEditInput('');
      }
    } catch (err) {
      console.error('Failed to edit message', err);
      alert('Failed to edit message.');
    }
  };

  // Soft Delete Message Request
  const handleDeleteMessage = async (msgId: number) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await api.delete(`/messages/${msgId}`);
      setActiveMenuMessageId(null);
    } catch (err) {
      console.error('Failed to delete message', err);
      alert('Failed to delete message.');
    }
  };

  const handleStartChat = (contact: UserProfile) => {
    setShowUserPicker(false);
    setUserPickerSearch('');
    openConversation(contact);
  };

  const filteredConversations = conversations.filter((c) =>
    c.contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllUsers = allUsers;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-line border-t-transparent" />
      </div>
    );
  }

  if (sessionUnavailable && !user) {
    return <SessionUnavailable retry={() => { void checkSession(true); }} />;
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-sans">
      <Navbar />

      <main className="flex flex-1 flex-col overflow-hidden px-0">
        {/* Page header */}
        <div className="px-6 py-4 border-b border-line bg-panel flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono-code text-[11px] uppercase tracking-wider text-[var(--primary)]">Ethnobotanical Consultation Dispatch</span>
            </div>
            <h1 className="font-editorial text-2xl font-normal text-ink">Researcher &amp; Curator Messenger</h1>
          </div>
          <p className="text-xs text-muted hidden sm:block font-mono-code">Direct Peer Dispatch</p>
        </div>

        <div className="flex min-h-[320px] overflow-hidden h-[calc(100dvh-160px)]">
          {/* ===== SIDEBAR ===== */}
          <aside aria-label="Conversations" className={`${activeContact ? 'hidden md:flex' : 'flex'} w-full md:w-[280px] lg:w-[300px] shrink-0 flex-col border-r border-line bg-panel overflow-hidden`}>
            <div className="px-4 py-3 border-b border-line">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-ink" />
                <span className="text-sm font-extrabold text-ink">Messages</span>
                <button
                  onClick={() => setShowUserPicker(true)}
                  className="ml-auto h-11 w-11 rounded-full bg-soft hover:bg-soft flex items-center justify-center transition-colors"
                  title="New message"
                >
                  <UserPlus className="h-3.5 w-3.5 text-ink" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  aria-label="Search conversations"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-line bg-panel focus:outline-none focus:border-line transition-colors"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-12 px-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-soft flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-muted" />
                  </div>
                  <p className="text-sm text-muted font-semibold">No conversations yet.</p>
                  <button
                    onClick={() => setShowUserPicker(true)}
                    className="text-sm font-extrabold text-ink hover:underline"
                  >
                    Start a new chat →
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = activeContact?.id === conv.contact.id;
                  return (
                    <button
                      key={conv.contact.id}
                      onClick={() => openConversation(conv.contact)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-line hover:bg-soft ${
                        isActive ? 'bg-soft border-l-2 border-l-[var(--primary)]' : ''
                      }`}
                    >
                      {avatarDisplay(conv.contact.avatar, conv.contact.name, 'sm')}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-extrabold text-ink truncate">{conv.contact.name}</span>
                          {conv.lastTime && (
                            <span className="text-sm text-muted shrink-0">{formatDate(conv.lastTime)}</span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-sm text-muted truncate mt-0.5">{conv.lastMessage}</p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
              {hasMoreConversations && <button type="button" disabled={loadingMoreConversations} onClick={loadMoreConversations} className="w-full py-3 text-sm font-semibold text-ink disabled:opacity-50">{loadingMoreConversations ? 'Loading...' : 'Load more conversations'}</button>}
            </div>
          </aside>

          {/* ===== MAIN CHAT AREA ===== */}
          <section aria-label="Conversation" className={`${activeContact ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col overflow-hidden`}>
            {!activeContact ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
                <div className="h-16 w-16 rounded-xl bg-soft border border-line flex items-center justify-center shadow-xs">
                  <MessageSquare className="h-8 w-8 text-[var(--accent-moss)]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink">Select a Conversation</h2>
                  <p className="text-xs text-muted mt-1 max-w-xs leading-relaxed">
                    Choose a conversation from the sidebar or start a new direct consultation with a contributor.
                  </p>
                </div>
                <button
                  onClick={() => setShowUserPicker(true)}
                  className="flat-button flat-button-primary inline-flex items-center gap-1.5 text-xs mt-2"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>New Message</span>
                </button>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <header className="flex items-center gap-2 px-3 py-3 border-b border-line bg-panel shrink-0">
                  <button type="button" aria-label="Back to conversations" onClick={() => { setActiveContact(null); router.replace('/messenger'); }} className="md:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-soft">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  {avatarDisplay(activeContact.avatar, activeContact.name)}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-extrabold text-ink text-sm leading-tight">{activeContact.name}</p>
                    <p className="text-sm text-muted font-semibold mt-0.5">{getRoleLabel(activeContact.role)}</p>
                  </div>
                </header>

                {/* Messages Panel */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-4 bg-panel">
                  {loadingMessages ? (
                    <div className="flex justify-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-transparent" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 py-16 text-center">
                      <span className="text-3xl">👋</span>
                      <p className="text-sm font-extrabold text-ink">
                        Say hello to {activeContact.name}!
                      </p>
                      <p className="text-sm text-muted">This is the beginning of your conversation.</p>
                    </div>
                  ) : (
                    <>
                    {hasOlderMessages && (
                      <div className="flex justify-center pb-2">
                        <button
                          type="button"
                          onClick={loadOlderMessages}
                          disabled={loadingOlderMessages}
                          className="rounded-full border border-line bg-panel px-4 py-1.5 text-sm font-bold text-ink shadow-sm hover:bg-soft disabled:opacity-60"
                        >
                          {loadingOlderMessages ? 'Loading…' : 'Load older messages'}
                        </button>
                      </div>
                    )}
                    {messages.map((msg) => {
                      const isOwn = msg.senderId === user.id;
                      const isEditing = editingMessageId === msg.id;
                      
                      return (
                        <div key={msg.id} className={`flex items-start gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Sender Avatar */}
                          {!isOwn && (
                            <div className="h-7 w-7 rounded-full shrink-0 overflow-hidden mt-1">
                              {activeContact.avatar?.startsWith('http') ? (
                                <img src={activeContact.avatar} alt={activeContact.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full rounded-full bg-brand flex items-center justify-center text-on-brand text-sm font-bold">
                                  {activeContact.avatar || activeContact.name.charAt(0)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message Bubble Column */}
                          <div className={`flex flex-col gap-0.5 max-w-[72%] relative ${isOwn ? 'items-end' : 'items-start'}`}>
                            
                            {/* Deleted Message */}
                            {msg.isDeleted ? (
                              <div className="px-4 py-2.5 rounded-2xl text-sm italic bg-panel text-muted border border-line flex items-center gap-1.5 shadow-sm select-none">
                                <AlertCircle className="h-3 w-3 text-muted" />
                                This message was deleted
                              </div>
                            ) : (
                              <>
                                {/* Message Actions Trigger (three-dots icon) */}
                                {isOwn && !isEditing && (
                                  <div className="absolute left-[-44px] top-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                    <button 
                                      type="button"
                                      onClick={() => setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id)}
                                      className="h-11 w-11 rounded-full bg-panel hover:bg-panel border border-line shadow flex items-center justify-center text-muted hover:text-muted"
                                      aria-label="Message options"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </button>
                                    
                                  </div>
                                )}

                                {/* Inline Editing Layout */}
                                {isEditing ? (
                                  <div className="flex items-center gap-1.5 w-full bg-panel border border-line rounded-xl px-2.5 py-1.5 shadow">
                                    <input
                                      type="text"
                                      value={editInput}
                                      onChange={(e) => setEditInput(e.target.value)}
                                      className="text-base text-ink bg-transparent focus:outline-none flex-1 min-w-0 w-full"
                                      autoFocus
                                    />
                                    <button 
                                      onClick={() => handleEditSubmit(msg.id)}
                                      disabled={!editInput.trim()}
                                      className="h-6 w-6 rounded-full bg-brand hover:bg-brand text-on-brand flex items-center justify-center transition-colors disabled:opacity-50"
                                      title="Save edit"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button 
                                      onClick={() => { setEditingMessageId(null); setEditInput(''); }}
                                      className="h-6 w-6 rounded-full bg-panel hover:bg-panel text-muted flex items-center justify-center transition-colors"
                                      title="Cancel edit"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  /* Normal Message Bubble */
                                  <div className="flex flex-col gap-1">
                                    {/* Image Attachment (if present) */}
                                    {msg.imageUrl && (
                                      <div className="overflow-hidden rounded-xl border border-line max-w-[240px] max-h-[180px] shadow-sm">
                                        <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                          <img 
                                            src={msg.imageUrl} 
                                            alt="Sent attachment" 
                                            className="w-full h-full object-cover hover:scale-102 transition-transform cursor-pointer" 
                                          />
                                        </a>
                                      </div>
                                    )}

                                    {/* Message Text (if text is present) */}
                                    {msg.content && (
                                      <div
                                        className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm leading-relaxed shadow-xs break-words ${
                                          isOwn
                                            ? 'bg-forest text-white border border-forest rounded-br-xs'
                                            : 'bg-panel border border-line text-ink rounded-bl-xs'
                                        }`}
                                      >
                                        {msg.content}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}

                            {/* In-flow actions cannot be clipped above the first message. */}
                            {isOwn && !msg.isDeleted && !isEditing && activeMenuMessageId === msg.id && (
                              <div ref={menuRef} className="flex flex-wrap self-end rounded-xl border border-line bg-panel shadow-sm">
                                {!msg.imageUrl && (
                                  <button type="button" onClick={() => {
                                    setEditingMessageId(msg.id);
                                    setEditInput(msg.content);
                                    setActiveMenuMessageId(null);
                                  }} className="flex min-h-11 items-center gap-1.5 px-3 text-sm font-bold text-ink hover:bg-soft">
                                    <Edit2 className="h-4 w-4" /> Edit
                                  </button>
                                )}
                                <button type="button" onClick={() => handleDeleteMessage(msg.id)} className="flex min-h-11 items-center gap-1.5 px-3 text-sm font-bold text-error-ink hover:bg-error-surface">
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
                              </div>
                            )}

                            {/* Timestamp / Edited Badge */}
                            {!isEditing && (
                              <div className="flex items-center gap-1.5 px-1 mt-0.5">
                                <span className="text-sm text-muted">{formatTime(msg.time)}</span>
                                {msg.isEdited && !msg.isDeleted && (
                                  <span className="text-sm text-muted font-semibold italic">(edited)</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar Section */}
                <div className="border-t border-line bg-panel px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
                  {/* File Upload Preview bar */}
                  {filePreviewUrl && (
                    <div className="flex items-center gap-3 p-2 bg-canvas rounded-xl border border-line mb-2 max-w-max animate-fade-in shadow-inner">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-line">
                        <img src={filePreviewUrl} alt="Upload preview" className="h-full w-full object-cover" />
                        <button 
                          type="button"
                          onClick={removeSelectedFile}
                          className="absolute inset-0 bg-black/40 hover:bg-black/55 flex items-center justify-center text-white transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-sm text-ink font-extrabold max-w-[120px] truncate">{selectedFile?.name}</p>
                        <p className="text-sm text-muted font-semibold">Ready to upload</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    {/* Attachment Selection Button */}
                    <button
                      type="button"
                      onClick={handleAttachmentClick}
                      disabled={isSending}
                      className="h-10 w-10 rounded-full bg-panel border border-line text-muted flex items-center justify-center hover:bg-panel hover:text-muted transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                      title="Attach image"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Message input field */}
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={selectedFile ? "Add a caption..." : `Message ${activeContact.name}...`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isSending}
                      className="min-w-0 flex-1 px-3 py-2.5 text-base rounded-full border border-line bg-panel text-ink placeholder-muted focus:outline-none focus:border-line focus:bg-panel transition-all disabled:opacity-60"
                      aria-label="Message input"
                    />

                    {/* Send submit button */}
                    <button
                      type="submit"
                      disabled={(!input.trim() && !selectedFile) || isSending}
                      className="h-10 w-10 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center shadow-xs hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* ===== USER PICKER MODAL ===== */}
      {showUserPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30  px-4">
          <div className="w-full max-w-sm bg-panel rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <h3 className="text-sm font-extrabold text-ink">New Message</h3>
              <button
                onClick={() => { setShowUserPicker(false); setUserPickerSearch(''); }}
                className="h-7 w-7 rounded-full bg-panel hover:bg-panel flex items-center justify-center transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted" />
              </button>
            </div>

            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userPickerSearch}
                  onChange={(e) => { setUserPickerSearch(e.target.value); setUserOffset(0); setAllUsers([]); }}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-line bg-panel focus:outline-none focus:border-line transition-colors"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto px-2 pb-4">
              {filteredAllUsers.length === 0 ? (
                <p className="text-center text-sm text-muted py-8">{loadingUsers ? 'Loading users...' : 'No users found.'}</p>
              ) : (
                filteredAllUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleStartChat(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-soft transition-colors text-left"
                  >
                    {avatarDisplay(u.avatar, u.name, 'sm')}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-ink truncate">{u.name}</p>
                      <p className="text-sm text-muted font-semibold">{getRoleLabel(u.role)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted shrink-0" />
                  </button>
                ))
              )}
              {hasMoreUsers && <button type="button" disabled={loadingUsers} onClick={() => setUserOffset((offset) => offset + 20)} className="w-full py-3 text-sm font-semibold text-ink disabled:opacity-50">Load more users</button>}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function MessengerPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-line border-t-transparent" />
      </div>
    }>
      <MessengerContent />
    </Suspense>
  );
}
