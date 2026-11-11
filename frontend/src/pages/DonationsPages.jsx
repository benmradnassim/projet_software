import React from 'react';
import { Trash2 } from 'lucide-react';

export function PageMesDons({ store, setStore, currentUser, showToast }) {
  const myDonations = store.donations.filter(d => d.donorId === currentUser.id || currentUser.role === 'Admin');

  const cancelDonation = (id) => {
    setStore({
      ...store,
      donations: store.donations.filter(d => d.id !== id)
    });
    showToast('Don en attente annulé avec succès.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Historique de mes Dons</h2>
        <p className="text-xs text-slate-500">Suivi des contributions financières effectuées</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {myDonations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Vous n'avez effectué aucun don pour le moment.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="p-4">Campagne</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Date</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myDonations.map(d => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{d.campaignTitle}</td>
                  <td className="p-4 font-bold text-emerald-700">{d.amount} €</td>
                  <td className="p-4 text-slate-500">{d.date}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                      d.status === 'Confirmé' ? 'bg-emerald-100 text-emerald-800' :
                      d.status === 'Refusé' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {d.status === 'En attente' && (
                      <button onClick={() => cancelDonation(d.id)} className="text-rose-600 hover:underline font-semibold">
                        Annuler
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// --- ESPACE CITOYEN: MES PARTICIPATIONS ---

export function PageMesParticipations({ store, setStore, currentUser, showToast }) {
  const myParts = store.participations.filter(p => p.userId === currentUser.id || currentUser.role === 'Admin');

  const cancelParticipation = (id) => {
    setStore({
      ...store,
      participations: store.participations.filter(p => p.id !== id)
    });
    showToast('Demande de participation annulée.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Mes Inscriptions aux Événements</h2>
        <p className="text-xs text-slate-500">Statut de vos participations en tant que bénévole</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {myParts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Aucune demande de participation enregistrée.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myParts.map(p => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{p.eventTitle}</h4>
                  <span className="text-xs text-slate-400">Demande le {p.date}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    p.status === 'Acceptée' ? 'bg-emerald-100 text-emerald-800' :
                    p.status === 'Refusée' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.status}
                  </span>
                  <button onClick={() => cancelParticipation(p.id)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- ESPACE CITOYEN: DEMANDE ORGANISATEUR ---
