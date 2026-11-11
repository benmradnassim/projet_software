import React from 'react';

export function PageEvenements({ events, handleJoinEvent, currentRole }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Événements & Action de Terrain</h2>
        <p className="text-xs text-slate-500">Inscrivez-vous pour devenir bénévole lors des journées d'action</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map(ev => (
          <div key={ev.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">
                  {new Date(ev.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs font-semibold text-slate-400">{ev.registeredCount} / {ev.capacity} places</span>
              </div>

              <h3 className="font-bold text-slate-900 text-lg leading-snug">{ev.title}</h3>
              <p className="text-xs text-slate-600">{ev.description}</p>
              
              <div className="text-xs text-slate-500 font-medium">
                📍 {ev.location}
              </div>
            </div>

            <button 
              onClick={() => handleJoinEvent(ev)}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Demander à participer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- ESPACE CITOYEN: MES DONS ---
