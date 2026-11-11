import React from 'react';

export function CampaignCard({ campaign, onSelect, onDonate }) {
  const percent = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img 
          src={campaign.image} 
          alt={campaign.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
          {campaign.category}
        </div>
        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[11px] font-bold ${
          campaign.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'
        }`}>
          {campaign.status}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 
            onClick={onSelect}
            className="font-bold text-slate-900 text-lg group-hover:text-emerald-700 cursor-pointer line-clamp-1 transition-colors"
          >
            {campaign.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {campaign.description}
          </p>
        </div>

        {/* Goal Progress */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-900">{campaign.raised.toLocaleString('fr-FR')} € <span className="font-normal text-slate-400">récoltés</span></span>
            <span className="font-bold text-emerald-600">{percent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" 
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Objectif : {campaign.goal.toLocaleString('fr-FR')} €</span>
            <span>{campaign.location}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <button 
            onClick={onSelect}
            className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Détails
          </button>
          {campaign.status === 'Active' && (
            <button 
              onClick={onDonate}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Faire un don
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- PAGE AUTHENTIFICATION ---
