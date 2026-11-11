import React from 'react';
import { useState } from 'react';

export function PageProfil({ currentUser, showToast }) {
  const [name, setName] = useState(currentUser.name);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 border-b border-slate-100 pb-6">
          <img src={currentUser.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover ring-4 ring-emerald-500/20" />
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{currentUser.name}</h2>
            <p className="text-xs text-slate-500">{currentUser.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              Rôle actuel : {currentUser.role}
            </span>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); showToast('Informations du profil mises à jour !'); }} className="space-y-4 max-w-lg">
          <h3 className="font-bold text-slate-800 text-sm">Informations personnelles</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse Email</label>
            <input type="email" readOnly value={currentUser.email} className="w-full p-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500" />
          </div>

          <div className="pt-2">
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-sm">
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-lg">
        <h3 className="font-bold text-slate-800 text-sm">Sécurité du compte</h3>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nouveau mot de passe</label>
          <input type="password" placeholder="••••••••" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
        </div>
        <button onClick={() => showToast('Mot de passe modifié.')} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50">
          Changer le mot de passe
        </button>
      </div>
    </div>
  );
}

// --- ESPACE UTILISATEUR: PUBLICATIONS (FEED + AI BADGE) ---
