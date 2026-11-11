import React from 'react';
import { useState } from 'react';
import { Search, User } from 'lucide-react';
import { CampaignCard } from '../components/CampaignCard.jsx';

export function PageCampagnes({ campaigns, navigateTo, setActiveModal, setModalData }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Toutes');

  const filtered = campaigns.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.location.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'Toutes' || c.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Campagnes Solidaires</h2>
          <p className="text-xs text-slate-500">Explorez et soutenez les projets qui vous tiennent à cœur</p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher une action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-64"
            />
          </div>

          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="Toutes">Toutes catégories</option>
            <option value="Humanitaire">Humanitaire</option>
            <option value="Écologie">Écologie</option>
            <option value="Éducation">Éducation</option>
            <option value="Santé">Santé</option>
            <option value="Social">Social</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          Aucune campagne ne correspond à vos critères de recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(camp => (
            <CampaignCard 
              key={camp.id} 
              campaign={camp} 
              onSelect={() => navigateTo('campagne-detail', camp.id)}
              onDonate={() => { setModalData(camp); setActiveModal('donate'); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- DÉTAIL CAMPAGNE ---

export function PageCampagneDetail({ campaignId, campaigns, events, navigateTo, setActiveModal, setModalData, currentRole }) {
  const camp = campaigns.find(c => c.id === campaignId) || campaigns[0];
  const relatedEvents = events.filter(e => e.campaignId === camp.id);
  const percent = Math.min(100, Math.round((camp.raised / camp.goal) * 100));

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <button 
        onClick={() => navigateTo('campagnes')} 
        className="text-xs font-bold text-slate-500 hover:text-emerald-700 flex items-center space-x-1"
      >
        <span>← Retour aux campagnes</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8">
        <div className="relative h-72 rounded-2xl overflow-hidden">
          <img src={camp.image} alt="" className="w-full h-full object-cover" />
          <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-slate-800">
            {camp.category}
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{camp.title}</h1>
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Par <strong>{camp.organizerName}</strong></span>
            </span>
            <span>•</span>
            <span>Localisation : {camp.location}</span>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-emerald-50/60 border border-emerald-100 p-6 rounded-2xl space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-black text-slate-900">{camp.raised.toLocaleString('fr-FR')} €</span>
            <span className="text-sm font-bold text-emerald-700">Objectif : {camp.goal.toLocaleString('fr-FR')} € ({percent}%)</span>
          </div>
          <div className="w-full h-3 bg-emerald-200/50 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${percent}%` }}></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 pt-1">
            <span>Début : {camp.startDate}</span>
            <span>Fin : {camp.endDate}</span>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => { setModalData(camp); setActiveModal('donate'); }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-sm"
            >
              Soutenir cette campagne (Faire un Don)
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 text-base">À propos du projet</h3>
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{camp.description}</p>
        </div>

        {/* Associated Events */}
        {relatedEvents.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">Événements liés à cette action</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedEvents.map(ev => (
                <div key={ev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm">{ev.title}</h4>
                  <p className="text-xs text-slate-500">{ev.location} • {new Date(ev.date).toLocaleDateString('fr-FR')}</p>
                  <button onClick={() => navigateTo('evenements')} className="text-xs font-bold text-emerald-700 hover:underline">S'inscrire à cet événement →</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- ESPACE CITOYEN: ÉVÉNEMENTS ---
