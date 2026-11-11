import React from 'react';

export function SidebarLink({ icon: Icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active 
          ? 'bg-emerald-50 text-emerald-700 font-semibold' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
      <span>{label}</span>
    </button>
  );
}

// ==========================================
// --- PAGE COMPONENTS ---
// ==========================================

// --- PAGE ACCUEIL (PUBLIC HERO) ---
