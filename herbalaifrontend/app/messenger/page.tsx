'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
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
  AlertCircle
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
  if (role === 'admin') return '🛡️ Admin';
  if (role === 'botanist') return '🌿 Botanist';
  return '🧑‍🌾 Contributor';
}

function avatarDisplay(avatar: string, name: string, size = 'md') {
  const dim = size === 'sm' ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-base';
  if (avatar?.startsWith('http')) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${dim} rounded-full object-cover border-2 border-white shadow`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] flex items-center justify-center text-white font-bold border-2 border-white shadow`}
    >
      {avatar || name.charAt(0).toUpperCase()}
    </div>
  );
}

// --- Main Content Component ---
function MessengerContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [activeContact, setActiveContact] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [userPickerSearch, setUserPickerSearch] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const callback = targetUserId ? `/messenger?userId=${targetUserId}` : '/messenger';
      router.push(`/signin?callbackUrl=${encodeURIComponent(callback)}`);
    }
  }, [loading, isAuthenticated, router, targetUserId]);

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
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

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
        const contact = msg.senderId === user.id ? msg.sender : (prev.find((c) => c.contact.id === contactId)?.contact || msg.sender);
        
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

    const fetchConversations = async () => {
      try {
        const res = await api.get('/messages/conversations');
        if (res.data?.status === 'success') {
          setConversations(res.data.data.conversations || []);
        }
      } catch (err) {
        console.error('Failed to fetch conversations', err);
      }
    };

    const fetchAllUsers = async () => {
      try {
        const res = await api.get('/messages/users');
        if (res.data?.status === 'success') {
          setAllUsers(res.data.data.users || []);
        }
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };

    fetchConversations();
    fetchAllUsers();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isAuthenticated, user]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = useCallback(async (contact: UserProfile) => {
    setActiveContact(contact);
    setLoadingMessages(true);
    setMessages([]);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setEditingMessageId(null);
    setInput('');
    inputRef.current?.focus();

    try {
      const res = await api.get(`/messages/history/${contact.id}`);
      if (res.data?.status === 'success') {
        setMessages(res.data.data.messages || []);
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

  // Handle auto-opening conversation from query param
  useEffect(() => {
    if (!targetUserId || allUsers.length === 0) return;
    
    // Check if user is already the active contact
    if (activeContact?.id === targetUserId) return;

    const contact = allUsers.find((u) => u.id === targetUserId);
    if (contact) {
      const timer = setTimeout(() => {
        openConversation(contact);
        
        // Clean up search params from the URL
        const url = new URL(window.location.href);
        url.searchParams.delete('userId');
        window.history.replaceState({}, '', url.pathname + url.search);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [targetUserId, allUsers, activeContact, openConversation]);

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

  const filteredAllUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(userPickerSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f7f2]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f4faf6] font-sans">
      <Navbar />

      <main className="flex flex-1 flex-col overflow-hidden px-0">
        {/* Page header */}
        <div className="px-6 py-4 border-b border-[#1b4332]/10 bg-white">
          <h1 className="text-xl font-extrabold text-[#1b4332]">Private Messenger</h1>
          <p className="text-xs text-gray-500 mt-0.5">Direct messages with contributors and admins</p>
        </div>

        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
          {/* ===== SIDEBAR ===== */}
          <aside className="w-full max-w-[300px] shrink-0 flex flex-col border-r border-[#1b4332]/10 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-[#2d6a4f]" />
                <span className="text-sm font-extrabold text-[#1b4332]">Messages</span>
                <button
                  onClick={() => setShowUserPicker(true)}
                  className="ml-auto h-7 w-7 rounded-full bg-[#40916c]/10 hover:bg-[#40916c]/20 flex items-center justify-center transition-colors"
                  title="New message"
                >
                  <UserPlus className="h-3.5 w-3.5 text-[#2d6a4f]" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#2d6a4f] transition-colors"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-12 px-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-[#40916c]/10 flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-[#40916c]/60" />
                  </div>
                  <p className="text-xs text-gray-400 font-semibold">No conversations yet.</p>
                  <button
                    onClick={() => setShowUserPicker(true)}
                    className="text-xs font-extrabold text-[#2d6a4f] hover:underline"
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
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 hover:bg-[#eef5f0] ${
                        isActive ? 'bg-[#eef5f0] border-l-2 border-l-[#40916c]' : ''
                      }`}
                    >
                      {avatarDisplay(conv.contact.avatar, conv.contact.name, 'sm')}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-extrabold text-[#1b4332] truncate">{conv.contact.name}</span>
                          {conv.lastTime && (
                            <span className="text-[10px] text-gray-400 shrink-0">{formatDate(conv.lastTime)}</span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMessage}</p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ===== MAIN CHAT AREA ===== */}
          <section className="flex-1 flex flex-col overflow-hidden">
            {!activeContact ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#40916c]/10 to-[#74c69d]/20 flex items-center justify-center shadow-inner">
                  <MessageSquare className="h-9 w-9 text-[#40916c]/50" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#1b4332]">Select a Conversation</h2>
                  <p className="text-sm text-gray-400 mt-1 max-w-xs">
                    Choose a conversation from the sidebar or start a new private chat with a contributor.
                  </p>
                </div>
                <button
                  onClick={() => setShowUserPicker(true)}
                  className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-[#40916c] to-[#52b788] text-white text-sm font-extrabold px-5 py-2.5 rounded-full shadow hover:brightness-105 transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  New Message
                </button>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <header className="flex items-center gap-3 px-5 py-3 border-b border-[#1b4332]/10 bg-white shrink-0">
                  {avatarDisplay(activeContact.avatar, activeContact.name)}
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-[#1b4332] text-sm leading-none">{activeContact.name}</p>
                    <p className="text-[11px] text-[#52b788] font-semibold mt-0.5">{getRoleLabel(activeContact.role)}</p>
                  </div>
                </header>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/60">
                  {loadingMessages ? (
                    <div className="flex justify-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 py-16 text-center">
                      <span className="text-3xl">👋</span>
                      <p className="text-sm font-extrabold text-[#1b4332]">
                        Say hello to {activeContact.name}!
                      </p>
                      <p className="text-xs text-gray-400">This is the beginning of your conversation.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
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
                                <div className="h-full w-full rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] flex items-center justify-center text-white text-xs font-bold">
                                  {activeContact.avatar || activeContact.name.charAt(0)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Message Bubble Column */}
                          <div className={`flex flex-col gap-0.5 max-w-[72%] relative ${isOwn ? 'items-end' : 'items-start'}`}>
                            
                            {/* Deleted Message */}
                            {msg.isDeleted ? (
                              <div className="px-4 py-2.5 rounded-2xl text-xs italic bg-gray-200/60 text-gray-400 border border-gray-100 flex items-center gap-1.5 shadow-sm select-none">
                                <AlertCircle className="h-3 w-3 text-gray-400" />
                                This message was deleted
                              </div>
                            ) : (
                              <>
                                {/* Message Actions Trigger (three-dots icon) */}
                                {isOwn && !isEditing && (
                                  <div className="absolute left-[-28px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => setActiveMenuMessageId(activeMenuMessageId === msg.id ? null : msg.id)}
                                      className="h-6 w-6 rounded-full bg-white hover:bg-gray-100 border border-gray-100 shadow flex items-center justify-center text-gray-500 hover:text-gray-700"
                                      aria-label="Message options"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </button>
                                    
                                    {/* Action Dropdown Menu */}
                                    {activeMenuMessageId === msg.id && (
                                      <div ref={menuRef} className="absolute bottom-7 left-0 z-10 w-24 bg-white rounded-lg border border-gray-100 shadow-lg py-1">
                                        {!msg.imageUrl && (
                                          <button
                                            onClick={() => {
                                              setEditingMessageId(msg.id);
                                              setEditInput(msg.content);
                                              setActiveMenuMessageId(null);
                                            }}
                                            className="w-full px-3 py-1.5 text-left text-xs font-bold text-gray-600 hover:bg-[#eef5f0] hover:text-[#2d6a4f] flex items-center gap-1.5"
                                          >
                                            <Edit2 className="h-3 w-3" /> Edit
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteMessage(msg.id)}
                                          className="w-full px-3 py-1.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                                        >
                                          <Trash2 className="h-3 w-3" /> Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Inline Editing Layout */}
                                {isEditing ? (
                                  <div className="flex items-center gap-1.5 w-full bg-white border border-[#2d6a4f] rounded-xl px-2.5 py-1.5 shadow">
                                    <input
                                      type="text"
                                      value={editInput}
                                      onChange={(e) => setEditInput(e.target.value)}
                                      className="text-xs text-[#1b4332] bg-transparent focus:outline-none flex-1 min-w-[120px]"
                                      autoFocus
                                    />
                                    <button 
                                      onClick={() => handleEditSubmit(msg.id)}
                                      disabled={!editInput.trim()}
                                      className="h-6 w-6 rounded-full bg-[#40916c] hover:bg-[#2d6a4f] text-white flex items-center justify-center transition-colors disabled:opacity-50"
                                      title="Save edit"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button 
                                      onClick={() => { setEditingMessageId(null); setEditInput(''); }}
                                      className="h-6 w-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
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
                                      <div className="overflow-hidden rounded-xl border border-gray-100 max-w-[240px] max-h-[180px] shadow-sm">
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
                                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
                                          isOwn
                                            ? 'bg-gradient-to-br from-[#40916c] to-[#52b788] text-white rounded-br-sm'
                                            : 'bg-white border border-gray-200 text-[#1b4332] rounded-bl-sm'
                                        }`}
                                      >
                                        {msg.content}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}

                            {/* Timestamp / Edited Badge */}
                            {!isEditing && (
                              <div className="flex items-center gap-1.5 px-1 mt-0.5">
                                <span className="text-[9px] text-gray-400">{formatTime(msg.time)}</span>
                                {msg.isEdited && !msg.isDeleted && (
                                  <span className="text-[9px] text-gray-400 font-semibold italic">(edited)</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar Section */}
                <div className="border-t border-[#1b4332]/10 bg-white px-4 py-3 shrink-0">
                  {/* File Upload Preview bar */}
                  {filePreviewUrl && (
                    <div className="flex items-center gap-3 p-2 bg-[#f0f7f2] rounded-xl border border-[#40916c]/20 mb-2 max-w-max animate-fade-in shadow-inner">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-gray-200">
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
                        <p className="text-[10px] text-[#2d6a4f] font-extrabold max-w-[120px] truncate">{selectedFile?.name}</p>
                        <p className="text-[9px] text-gray-400 font-semibold">Ready to upload</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    {/* Attachment Selection Button */}
                    <button
                      type="button"
                      onClick={handleAttachmentClick}
                      disabled={isSending}
                      className="h-10 w-10 rounded-full bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
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
                      className="flex-1 px-4 py-2.5 text-sm rounded-full border border-gray-200 bg-gray-50/60 text-[#1b4332] placeholder-gray-400 focus:outline-none focus:border-[#2d6a4f] focus:bg-white transition-all disabled:opacity-60"
                      aria-label="Message input"
                    />

                    {/* Send submit button */}
                    <button
                      type="submit"
                      disabled={(!input.trim() && !selectedFile) || isSending}
                      className="h-10 w-10 rounded-full bg-gradient-to-br from-[#40916c] to-[#52b788] text-white flex items-center justify-center shadow hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4 pl-0.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-extrabold text-[#1b4332]">New Message</h3>
              <button
                onClick={() => { setShowUserPicker(false); setUserPickerSearch(''); }}
                className="h-7 w-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="h-3.5 w-3.5 text-gray-500" />
              </button>
            </div>

            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userPickerSearch}
                  onChange={(e) => setUserPickerSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-[#2d6a4f] transition-colors"
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto px-2 pb-4">
              {filteredAllUsers.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No users found.</p>
              ) : (
                filteredAllUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleStartChat(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#eef5f0] transition-colors text-left"
                  >
                    {avatarDisplay(u.avatar, u.name, 'sm')}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-[#1b4332] truncate">{u.name}</p>
                      <p className="text-[11px] text-[#52b788] font-semibold">{getRoleLabel(u.role)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </button>
                ))
              )}
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
      <div className="flex min-h-screen items-center justify-center bg-[#f0f7f2]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent" />
      </div>
    }>
      <MessengerContent />
    </Suspense>
  );
}
