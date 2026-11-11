import React from 'react';
import { HeartHandshake, Users, ChevronRight, ArrowRight, User, Sparkles, DollarSign } from 'lucide-react';
import { CampaignCard } from '../components/CampaignCard.jsx';

export function PageAccueil({ navigateTo, campaigns, events, setActiveModal, setModalData }) {
  const activeCampaigns = campaigns.filter(c => c.status === 'Active').slice(0, 3);
  const featuredEvents = events.slice(0, 3);

  const totalRaised = campaigns.reduce((acc, c) => acc + c.raised, 0);
  const totalCampaigns = campaigns.length;

  return (
    <div className="space-y-12 pb-10">
      
      {/* HERO SECTION */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-slate-900 text-white p-8 sm:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-full px-3 py-1 text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plateforme Solidaire Citoyenne de France</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Unissons nos forces pour un <span className="text-emerald-400">impact réel</span> et durable.
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Soutenez des campagnes humanitaires, écologiques et sociales. Participez à des événements de bénévolat près de chez vous et suivez l'impact de chaque don.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button 
              onClick={() => navigateTo('campagnes')}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 flex items-center space-x-2 text-sm"
            >
              <span>Découvrir les campagnes</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigateTo('evenements')}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-md transition-all text-sm border border-white/15"
            >
              Voir les événements
            </button>
          </div>
        </div>
      </section>

      {/* KEY STATS BAR */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalRaised.toLocaleString('fr-FR')} €</div>
            <div className="text-xs text-slate-500 font-medium">Récoltés pour la communauté</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalCampaigns}</div>
            <div className="text-xs text-slate-500 font-medium">Campagnes solidaires soutenues</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">1 420+</div>
            <div className="text-xs text-slate-500 font-medium">Citoyens & bénévole engagés</div>
          </div>
        </div>
      </section>

      {/* FEATURED CAMPAIGNS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Campagnes en vedette</h2>
            <p className="text-xs text-slate-500">Initiatives urgentes nécessitant votre soutien</p>
          </div>
          <button 
            onClick={() => navigateTo('campagnes')} 
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>Tout voir</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeCampaigns.map(camp => (
            <CampaignCard 
              key={camp.id} 
              campaign={camp} 
              onSelect={() => navigateTo('campagne-detail', camp.id)}
              onDonate={() => { setModalData(camp); setActiveModal('donate'); }}
            />
          ))}
        </div>
      </section>

      {/* UPCOMING EVENTS PREVIEW */}
      <section className="bg-emerald-950/5 border border-emerald-900/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Prochains Événements Citoyens</h2>
            <p className="text-xs text-slate-500">Rejoignez une action sur le terrain avec d'autres bénévoles</p>
          </div>
          <button 
            onClick={() => navigateTo('evenements')} 
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>Tous les événements</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredEvents.map(ev => (
            <div key={ev.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
                <h3 className="font-bold text-slate-900 text-base leading-snug">{ev.title}</h3>
                <p className="text-xs text-slate-500 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5" />
                  <span>{ev.location}</span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">{ev.registeredCount}/{ev.capacity} inscrits</span>
                <button 
                  onClick={() => navigateTo('evenements')}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  S'inscrire
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// --- CAMPAIGN CARD REUSABLE COMPONENT ---
