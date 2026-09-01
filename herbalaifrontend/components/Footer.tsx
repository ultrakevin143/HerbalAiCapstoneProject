'use client';

import React from 'react';


export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-gray-50 py-6 px-4">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding & Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#40916c] text-[#ffffff] text-sm font-bold shadow-sm">
            🌿
          </div>
          <span className="font-serif-custom italic font-extrabold text-[#1b4332]">
            Help us Preserve our History
          </span>
        </div>

        {/* copyright and legal */}
        <div className="text-center md:text-right">
          <p className="text-xs font-bold text-[#2d6a4f] mb-1">
            © {new Date().getFullYear()} Herbal AI — Philippine Medicinal Plant Repository.
          </p>
          <p className="text-[10px] font-bold text-[#6a7282]">
            Uses publicly available DOH and PITAHC reference materials; not an institutional endorsement.
          </p>
        </div>
      </div>
    </footer>
  );
}
