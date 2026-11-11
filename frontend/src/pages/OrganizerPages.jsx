import React from 'react';
import { ShieldCheck, Plus, Trash2 } from 'lucide-react';

export function PageDemandeOrganisateur({ store, currentUser, setActiveModal }) {
  const existingReq = store.organizerRequests.find(r => r.userId === currentUser.id);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Devenir Organisateur Solidaire</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          En obtenant le rôle d’organisateur, vous pourrez créer des campagnes de dons, publier des événements et mobiliser des bénévoles pour vos causes.
        </p>

        {existingReq ? (
          <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl text-left space-y-2">
            <span className="text-xs font-bold text-teal-800">Statut de votre demande :</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Soumise le {existingReq.date}</span>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                {existingReq.status}
              </span>
            </div>
            <p className="text-xs text-slate-600 pt-1">Motivation : "{existingReq.reason}"</p>
          </div>
        ) : (
          <button 
            onClick={() => setActiveModal('request-organizer')}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md"
          >
            Formuler ma demande d’habilitation
          </button>
        )}
      </div>
    </div>
  );
}

// --- ESPACE ORGANISATEUR: DASHBOARD ---

export function PageOrgaDashboard({ store, currentUser, navigateTo }) {
  const myCampaigns = store.campaigns.filter(c => c.organizerId === currentUser.id || currentUser.role === 'Admin');
  const totalRaised = myCampaigns.reduce((acc, c) => acc + c.raised, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Tableau de bord Organisateur</h2>
        <p className="text-xs text-slate-500">Vue d'ensemble de vos actions solidaires et collectes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-400">Total Récolté</span>
          <div className="text-2xl font-black text-emerald-700">{totalRaised.toLocaleString('fr-FR')} €</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-400">Campagnes Actives</span>
          <div className="text-2xl font-black text-slate-800">{myCampaigns.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-400">Demandes de participation</span>
          <div className="text-2xl font-black text-amber-600">{store.participations.filter(p => p.status === 'En attente').length}</div>
        </div>
      </div>

      {/* Quick shortcuts */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">Raccourcis de gestion</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button onClick={() => navigateTo('orga-campagnes')} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 text-slate-700 text-xs font-bold text-left transition-colors">
            Gérer Campagnes →
          </button>
          <button onClick={() => navigateTo('orga-participations')} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 text-slate-700 text-xs font-bold text-left transition-colors">
            Valider Inscriptions →
          </button>
          <button onClick={() => navigateTo('orga-dons')} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 text-slate-700 text-xs font-bold text-left transition-colors">
            Vérifier Dons →
          </button>
          <button onClick={() => navigateTo('evenements')} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 text-slate-700 text-xs font-bold text-left transition-colors">
            Créer Événement →
          </button>
        </div>
      </div>
    </div>
  );
}

// --- ESPACE ORGANISATEUR: GÉRER MES CAMPAGNES ---

export function PageOrgaCampagnes({ store, setStore, currentUser, setActiveModal, showToast }) {
  const myCampaigns = store.campaigns.filter(c => c.organizerId === currentUser.id || currentUser.role === 'Admin');

  const toggleCloseCampaign = (id) => {
    setStore({
      ...store,
      campaigns: store.campaigns.map(c => c.id === id ? { ...c, status: c.status === 'Active' ? 'Clôturée' : 'Active' } : c)
    });
    showToast('Statut de la campagne mis à jour.');
  };

  const deleteCampaign = (id) => {
    setStore({
      ...store,
      campaigns: store.campaigns.filter(c => c.id !== id)
    });
    showToast('Campagne supprimée.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Gérer mes Campagnes</h2>
          <p className="text-xs text-slate-500">Création, édition et clôture de projets</p>
        </div>
        <button onClick={() => setActiveModal('create-campaign')} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1">
          <Plus className="w-4 h-4" />
          <span>Créer une campagne</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-600 uppercase">
            <tr>
              <th className="p-4">Titre</th>
              <th className="p-4">Catégorie</th>
              <th className="p-4">Récolté / Objectif</th>
              <th className="p-4">Statut</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {myCampaigns.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-800">{c.title}</td>
                <td className="p-4 text-slate-500">{c.category}</td>
                <td className="p-4 font-semibold text-slate-700">{c.raised} / {c.goal} €</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded font-bold ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => toggleCloseCampaign(c.id)} className="text-slate-600 hover:underline font-semibold">
                    {c.status === 'Active' ? 'Clôturer' : 'Rouvrir'}
                  </button>
                  <button onClick={() => deleteCampaign(c.id)} className="text-rose-600 hover:text-rose-800">
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- ESPACE ORGANISATEUR: DEMANDES PARTICIPATION ---

export function PageOrgaParticipations({ store, setStore, showToast }) {
  const updateStatus = (id, newStatus) => {
    setStore({
      ...store,
      participations: store.participations.map(p => p.id === id ? { ...p, status: newStatus } : p)
    });
    showToast(`Demande ${newStatus.toLowerCase()} !`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Demandes de Participation</h2>
        <p className="text-xs text-slate-500">Validez les bénévoles pour vos événements</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-600 uppercase">
            <tr>
              <th className="p-4">Citoyen</th>
              <th className="p-4">Événement</th>
              <th className="p-4">Date demande</th>
              <th className="p-4">Statut</th>
              <th className="p-4 text-right">Décision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {store.participations.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-800">{p.userName}</td>
                <td className="p-4 text-slate-600">{p.eventTitle}</td>
                <td className="p-4 text-slate-400">{p.date}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    p.status === 'Acceptée' ? 'bg-emerald-100 text-emerald-800' :
                    p.status === 'Refusée' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => updateStatus(p.id, 'Acceptée')} className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">
                    Accepter
                  </button>
                  <button onClick={() => updateStatus(p.id, 'Refusée')} className="px-2.5 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg hover:bg-rose-200">
                    Refuser
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- ESPACE ORGANISATEUR: DONS REÇUS ---

export function PageOrgaDons({ store, setStore, showToast }) {
  const updateStatus = (id, newStatus) => {
    setStore({
      ...store,
      donations: store.donations.map(d => d.id === id ? { ...d, status: newStatus } : d)
    });
    showToast(`Don ${newStatus.toLowerCase()} !`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Dons Reçus</h2>
        <p className="text-xs text-slate-500">Vérification et confirmation des transferts reçus</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-600 uppercase">
            <tr>
              <th className="p-4">Donateur</th>
              <th className="p-4">Campagne</th>
              <th className="p-4">Montant</th>
              <th className="p-4">Statut</th>
              <th className="p-4 text-right">Vérification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {store.donations.map(d => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-800">{d.donorName}</td>
                <td className="p-4 text-slate-600">{d.campaignTitle}</td>
                <td className="p-4 font-bold text-emerald-700">{d.amount} €</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    d.status === 'Confirmé' ? 'bg-emerald-100 text-emerald-800' :
                    d.status === 'Refusé' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {d.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => updateStatus(d.id, 'Confirmé')} className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">
                    Confirmer
                  </button>
                  <button onClick={() => updateStatus(d.id, 'Refusé')} className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200">
                    Refuser
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- ESPACE ADMIN: UTILISATEURS ---
