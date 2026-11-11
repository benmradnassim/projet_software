import React from 'react';

export function PageConnexion({ navigateTo, setCurrentRole, showToast }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    setCurrentRole('Citoyen');
    showToast('Connexion réussie en tant que Citoyen !');
    navigateTo('accueil');
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900">Connexion à votre espace</h2>
        <p className="text-xs text-slate-500">Rejoignez la communauté solidaire</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse Email</label>
          <input type="email" required defaultValue="sophie.martin@example.com" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700">Mot de passe</label>
            <button type="button" onClick={() => navigateTo('mot-de-passe-oublie')} className="text-xs text-emerald-600 hover:underline">Oublié ?</button>
          </div>
          <input type="password" required defaultValue="••••••••" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
        </div>

        <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm">
          Se connecter
        </button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Pas encore de compte ?{' '}
        <button onClick={() => navigateTo('inscription')} className="text-emerald-700 font-bold hover:underline">
          S'inscrire gratuitement
        </button>
      </div>
    </div>
  );
}

export function PageInscription({ navigateTo, setCurrentRole, showToast }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    setCurrentRole('Citoyen');
    showToast('Compte créé avec succès ! Bienvenue.');
    navigateTo('accueil');
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900">Créer un compte</h2>
        <p className="text-xs text-slate-500">Devenez un acteur de la solidarité</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet</label>
          <input type="text" required placeholder="ex: Jean Dupont" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse Email</label>
          <input type="email" required placeholder="votre.email@example.com" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Mot de passe</label>
          <input type="password" required placeholder="••••••••" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
        </div>

        <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm">
          Créer mon compte Citoyen
        </button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Déjà inscrit ?{' '}
        <button onClick={() => navigateTo('connexion')} className="text-emerald-700 font-bold hover:underline">
          Se connecter
        </button>
      </div>
    </div>
  );
}

export function PageMotDePasseOublie({ navigateTo, showToast }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    showToast('Un lien de réinitialisation a été envoyé à votre adresse e-mail.');
    navigateTo('connexion');
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-extrabold text-slate-900">Mot de passe oublié</h2>
        <p className="text-xs text-slate-500">Entrez votre e-mail pour recevoir les instructions</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse Email enregistrée</label>
          <input type="email" required placeholder="votre.email@example.com" className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
        </div>

        <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm">
          Envoyer le lien
        </button>
      </form>

      <div className="text-center text-xs text-slate-500">
        <button onClick={() => navigateTo('connexion')} className="text-slate-600 hover:underline">
          Retour à la connexion
        </button>
      </div>
    </div>
  );
}

// --- ESPACE UTILISATEUR: PROFIL ---
