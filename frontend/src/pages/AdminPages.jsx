import React from 'react';
import { AlertTriangle, User } from 'lucide-react';

export function PageAdminUtilisateurs({ store, setStore, showToast }) {
  const toggleBlock = (id) => {
    setStore({
      ...store,
      users: store.users.map(u => u.id === id ? { ...u, status: u.status === 'Actif' ? 'Bloqué' : 'Actif' } : u)
    });
    showToast('Statut de l’utilisateur modifié.');
  };

  const changeRole = (id, newRole) => {
    setStore({
      ...store,
      users: store.users.map(u => u.id === id ? { ...u, role: newRole } : u)
    });
    showToast(`Rôle mis à jour en ${newRole}.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Gestion des Utilisateurs</h2>
        <p className="text-xs text-slate-500">Administration des droits et blocages de compte</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-600 uppercase">
            <tr>
              <th className="p-4">Utilisateur</th>
              <th className="p-4">Email</th>
              <th className="p-4">Rôle</th>
              <th className="p-4">Statut</th>
              <th className="p-4 text-right">Actions Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {store.users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-800 flex items-center space-x-2">
                  <img src={u.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  <span>{u.name}</span>
                </td>
                <td className="p-4 text-slate-500">{u.email}</td>
                <td className="p-4">
                  <select 
                    value={u.role} 
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="p-1 border border-slate-200 rounded font-semibold text-xs"
                  >
                    <option value="Citoyen">Citoyen</option>
                    <option value="Organisateur">Organisateur</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded font-bold ${u.status === 'Actif' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => toggleBlock(u.id)} className="text-rose-600 hover:underline font-bold">
                    {u.status === 'Actif' ? 'Bloquer' : 'Débloquer'}
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

// --- ESPACE ADMIN: DEMANDES ORGANISATEURS ---

export function PageAdminDemandes({ store, setStore, showToast }) {
  const handleDecision = (req, decision) => {
    // Update request status
    const updatedReqs = store.organizerRequests.map(r => r.id === req.id ? { ...r, status: decision } : r);
    
    // Upgrade user role if approved
    let updatedUsers = store.users;
    if (decision === 'Approuvée') {
      updatedUsers = store.users.map(u => u.id === req.userId ? { ...u, role: 'Organisateur' } : u);
    }

    setStore({ ...store, organizerRequests: updatedReqs, users: updatedUsers });
    showToast(`Demande d’organisateur ${decision.toLowerCase()} !`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Demandes pour devenir Organisateur</h2>
        <p className="text-xs text-slate-500">Examen des habilitations associatives et citoyennes</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {store.organizerRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Aucune demande en attente.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {store.organizerRequests.map(req => (
              <div key={req.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">{req.userName} ({req.userEmail})</h4>
                  <p className="text-xs text-slate-600">"{req.reason}"</p>
                  <span className="text-[10px] text-slate-400">Date : {req.date}</span>
                </div>
                
                <div className="flex items-center space-x-2 shrink-0">
                  {req.status === 'En attente' ? (
                    <>
                      <button onClick={() => handleDecision(req, 'Approuvée')} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm">
                        Approuver
                      </button>
                      <button onClick={() => handleDecision(req, 'Refusée')} className="px-3 py-1.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-xl">
                        Refuser
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- ESPACE ADMIN: MODÉRATION ---

export function PageAdminModeration({ store, setStore, showToast }) {
  const deletePost = (postId) => {
    setStore({
      ...store,
      posts: store.posts.filter(p => p.id !== postId)
    });
    showToast('Publication supprimée par la modération.');
  };

  const resolveReport = (repId, status) => {
    setStore({
      ...store,
      reports: store.reports.map(r => r.id === repId ? { ...r, status } : r)
    });
    showToast(`Signalement marqué comme ${status}.`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Modération & Signalements IA</h2>
        <p className="text-xs text-slate-500">Traitez le contenu inapproprié ou signalé</p>
      </div>

      {/* Flagged AI Content */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Publications signalées automatiquement par l’IA</span>
        </h3>

        <div className="space-y-3">
          {store.posts.filter(p => p.aiFlag).map(p => (
            <div key={p.id} className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-bold text-slate-800 text-xs">{p.authorName} :</span>
                <p className="text-xs text-slate-700">"{p.content}"</p>
              </div>
              <button onClick={() => deletePost(p.id)} className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm">
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* User Reports */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">Signalements des citoyens</h3>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {store.reports.map(rep => (
              <div key={rep.id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{rep.targetTitle}</h4>
                  <p className="text-xs text-slate-500">{rep.reason} (par {rep.reporterName})</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => resolveReport(rep.id, 'Résolu')} className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg">
                    Résoudre
                  </button>
                  <button onClick={() => resolveReport(rep.id, 'Rejeté')} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
