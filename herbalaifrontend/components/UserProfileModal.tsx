'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { X, MessageSquare } from 'lucide-react';

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

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return '🛡️ Admin';
    return '🧑‍🌾 Contributor';
  };

  const isSelf = currentUser && currentUser.id === userProfile.id;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header/Banner with green gradient */}
        <div className="h-24 bg-gradient-to-r from-[#2d6a4f] to-[#52b788] relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profile Card Content */}
        <div className="px-6 pb-6 text-center relative -mt-10">
          {/* Avatar frame */}
          <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] border-4 border-white shadow-md items-center justify-center text-3xl text-white font-bold select-none mb-3 overflow-hidden">
            {userProfile.avatar?.startsWith('http') ? (
              <img 
                src={userProfile.avatar} 
                alt={userProfile.name} 
                className="h-full w-full object-cover" 
              />
            ) : (
              <span>{userProfile.avatar || userProfile.name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <h3 className="text-lg font-extrabold text-[#1b4332]">{userProfile.name}</h3>
          <p className="text-xs font-semibold text-[#52b788] mt-1">{getRoleLabel(userProfile.role)}</p>

          <div className="mt-6 border-t border-gray-100 pt-5">
            {isSelf ? (
              <p className="text-xs font-semibold text-gray-400 italic">This is you</p>
            ) : (
              <button
                onClick={handleMessage}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#2d6a4f] to-[#52b788] text-white text-sm font-extrabold py-3 px-5 rounded-full shadow hover:brightness-105 transition-all cursor-pointer border-0"
              >
                <MessageSquare className="h-4 w-4" />
                Message {userProfile.name.split(' ')[0]}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
