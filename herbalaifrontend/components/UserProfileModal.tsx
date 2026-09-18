'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { X, MessageSquare, ShieldCheck, Leaf, User } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  avatar?: string | null;
  role: string;
}

interface UserProfileModalProps {
  userProfile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ userProfile, isOpen, onClose }: UserProfileModalProps) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isOpen || !userProfile) return null;

  const handleMessage = () => {
    onClose();
    if (!isAuthenticated) {
      router.push(`/signin?callbackUrl=${encodeURIComponent(`/messenger?userId=${userProfile.id}`)}`);
      return;
    }
    router.push(`/messenger?userId=${userProfile.id}`);
  };

  const renderRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-ink bg-soft border border-line px-2.5 py-0.5 rounded-full">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--botanical-forest)]" />
          Admin Specialist
        </span>
      );
    }
    if (role === 'botanist') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-ink bg-soft border border-line px-2.5 py-0.5 rounded-full">
          <Leaf className="h-3.5 w-3.5 text-[var(--accent-moss)]" />
          Botanical Researcher
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-muted bg-panel border border-line px-2.5 py-0.5 rounded-full">
        <User className="h-3.5 w-3.5 text-muted" />
        Community Contributor
      </span>
    );
  };

  const isSelf = currentUser && currentUser.id === userProfile.id;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-panel rounded-2xl shadow-xl overflow-hidden border border-line animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header/Banner: Solid archival forest */}
        <div className="h-20 bg-[var(--botanical-forest)] relative">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profile Card Content */}
        <div className="px-6 pb-6 text-center relative -mt-10">
          {/* Avatar frame */}
          <div className="inline-flex h-20 w-20 rounded-full bg-panel border-2 border-line shadow-xs items-center justify-center text-2xl text-ink font-bold select-none mb-3 overflow-hidden">
            {userProfile.avatar?.startsWith('http') ? (
              <img 
                src={userProfile.avatar} 
                alt={userProfile.name} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <span className="h-full w-full flex items-center justify-center bg-soft text-ink">
                {userProfile.avatar || userProfile.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-ink">{userProfile.name}</h3>
          <div className="mt-1.5 flex justify-center">
            {renderRoleBadge(userProfile.role)}
          </div>

          <div className="mt-6 border-t border-line pt-5">
            {isSelf ? (
              <p className="text-sm font-medium text-muted italic">This is your profile</p>
            ) : (
              <button
                onClick={handleMessage}
                className="flat-button flat-button-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Message {userProfile.name.split(' ')[0]}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
