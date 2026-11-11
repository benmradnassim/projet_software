import React from 'react';
import { useState, useMemo } from 'react';
import { Heart, HeartHandshake, Users, Calendar, ShieldCheck, AlertTriangle, Plus, CheckCircle2, MessageSquare, User, Bell, Sparkles, Check, BarChart2, Layers, DollarSign, X, Menu, AlertCircle, CheckSquare } from 'lucide-react';
import { PageAccueil } from './pages/HomePage.jsx';
import { PageAdminDemandes, PageAdminModeration, PageAdminUtilisateurs } from './pages/AdminPages.jsx';
import { PageCampagneDetail, PageCampagnes } from './pages/CampaignPages.jsx';
import { PageConnexion, PageInscription, PageMotDePasseOublie } from './pages/AuthPages.jsx';
import { PageDemandeOrganisateur, PageOrgaCampagnes, PageOrgaDashboard, PageOrgaDons, PageOrgaParticipations } from './pages/OrganizerPages.jsx';
import { PageEvenements } from './pages/EventsPage.jsx';
import { PageMesDons, PageMesParticipations } from './pages/DonationsPages.jsx';
import { PageProfil } from './pages/ProfilePage.jsx';
import { PagePublications, PageSignalements } from './pages/CommunityPages.jsx';
import { SidebarLink } from './components/SidebarLink.jsx';
import { INITIAL_DATA, SENSITIVE_WORDS } from './data/initialData.js';

export default function App() {
  // --- APPLICATION STATES ---
  const [currentRole, setCurrentRole] = useState('Citoyen'); // 'Visiteur', 'Citoyen', 'Organisateur', 'Admin'
  const [currentPage, setCurrentPage] = useState('accueil'); // router state
  const [pageParam, setPageParam] = useState(null); // ID parameters for detail pages
  
  // Database state
  const [store, setStore] = useState(INITIAL_DATA);

  // UI States
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // modal identifier
  const [modalData, setModalData] = useState(null);
  
  // AI Moderation Live Checker in Forms
  const [aiWarning, setAiWarning] = useState(false);

  // Current logged in user view simulation
  const currentUser = useMemo(() => {
    if (currentRole === 'Visiteur') return null;
    if (currentRole === 'Organisateur') return store.users.find(u => u.role === 'Organisateur') || store.users[1];
    if (currentRole === 'Admin') return store.users.find(u => u.role === 'Admin') || store.users[4];
    return store.users.find(u => u.role === 'Citoyen') || store.users[0];
  }, [currentRole, store.users]);

  // Toast Notification helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Switch role helper
  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    showToast(`Rôle changé avec succès : ${newRole}`, 'info');
    if (newRole === 'Visiteur' && !['accueil', 'campagnes', 'evenements', 'connexion', 'inscription'].includes(currentPage)) {
      setCurrentPage('accueil');
    }
  };

  // --- MODAL CONTROLLERS & ACTIONS ---
  const handleDonateSubmit = (e) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    if (!amount || amount <= 0) return;

    const newDonation = {
      id: 'd' + Date.now(),
      campaignId: modalData.id,
      campaignTitle: modalData.title,
      donorName: currentUser ? currentUser.name : 'Donateur Anonyme',
      donorId: currentUser ? currentUser.id : 'anon',
      amount: parseFloat(amount),
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'En attente'
    };

    // Update campaign raised sum
    const updatedCampaigns = store.campaigns.map(c => 
      c.id === modalData.id ? { ...c, raised: c.raised + parseFloat(amount) } : c
    );

    setStore({
      ...store,
      campaigns: updatedCampaigns,
      donations: [newDonation, ...store.donations]
    });

    setActiveModal(null);
    showToast(`Merci pour votre don de ${amount} € ! Il a été enregistré (En attente).`);
  };

  const handleCreatePostSubmit = (e) => {
    e.preventDefault();
    const content = e.target.content.value;
    if (!content.trim()) return;

    // AI Check trigger
    const hasSensitiveWord = SENSITIVE_WORDS.some(w => content.toLowerCase().includes(w));

    const newPost = {
      id: 'p' + Date.now(),
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorId: currentUser.id,
      avatar: currentUser.avatar,
      date: 'À l’instant',
      content,
      image: modalData?.imageUrl || null,
      likes: 0,
      isLiked: false,
      aiFlag: hasSensitiveWord,
      comments: []
    };

    setStore({ ...store, posts: [newPost, ...store.posts] });
    setActiveModal(null);
    if (hasSensitiveWord) {
      showToast('Publication créée mais marquée pour révision par l’IA (contenu sensible décelé).', 'warning');
    } else {
      showToast('Publication publiée avec succès !');
    }
  };

  const handleCreateCampaignSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const newCamp = {
      id: 'c' + Date.now(),
      title: form.title.value,
      category: form.category.value,
      goal: parseFloat(form.goal.value),
      raised: 0,
      image: form.image.value || 'https://images.unsplash.com/photo-1532629345422-7515fe9d1633?w=800',
      startDate: form.startDate.value,
      endDate: form.endDate.value,
      location: form.location.value,
      organizerId: currentUser.id,
      organizerName: currentUser.name,
      organizerAvatar: currentUser.avatar,
      status: 'Active',
      description: form.description.value
    };

    setStore({ ...store, campaigns: [newCamp, ...store.campaigns] });
    setActiveModal(null);
    showToast('Campagne créée et mise en ligne avec succès !');
  };

  const handleCreateEventSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const selectedCamp = store.campaigns.find(c => c.id === form.campaignId.value);
    
    const newEv = {
      id: 'e' + Date.now(),
      title: form.title.value,
      date: form.date.value,
      location: form.location.value,
      campaignId: selectedCamp ? selectedCamp.id : '',
      campaignTitle: selectedCamp ? selectedCamp.title : 'Action Indépendante',
      capacity: parseInt(form.capacity.value, 10),
      registeredCount: 0,
      organizerId: currentUser.id,
      description: form.description.value
    };

    setStore({ ...store, events: [newEv, ...store.events] });
    setActiveModal(null);
    showToast('Événement créé avec succès !');
  };

  const handleCreateReportSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const newReport = {
      id: 'rep' + Date.now(),
      type: form.type.value,
      targetTitle: form.targetTitle.value,
      reason: form.reason.value,
      reporterName: currentUser.name,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'En attente'
    };

    setStore({ ...store, reports: [newReport, ...store.reports] });
    setActiveModal(null);
    showToast('Signalement transmis à l’équipe de modération.');
  };

  const handleRequestOrganizerSubmit = (e) => {
    e.preventDefault();
    const reason = e.target.reason.value;
    const newReq = {
      id: 'or' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      reason,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'En attente'
    };
    setStore({ ...store, organizerRequests: [newReq, ...store.organizerRequests] });
    setActiveModal(null);
    showToast('Demande envoyée aux administrateurs.');
  };

  // Handler helpers for actions
  const toggleLikePost = (postId) => {
    setStore({
      ...store,
      posts: store.posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            isLiked: !p.isLiked
          };
        }
        return p;
      })
    });
  };

  const handleAddComment = (postId, text) => {
    if (!text.trim()) return;
    const hasSensitiveWord = SENSITIVE_WORDS.some(w => text.toLowerCase().includes(w));
    
    if (hasSensitiveWord) {
      showToast('⚠️ Ce commentaire contient des mots jugés inappropriés par l’IA.', 'warning');
      return;
    }

    setStore({
      ...store,
      posts: store.posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...p.comments, { id: 'c-' + Date.now(), author: currentUser.name, content: text, date: 'À l’instant' }]
          };
        }
        return p;
      })
    });
    showToast('Commentaire ajouté !');
  };

  const handleJoinEvent = (eventObj) => {
    if (currentRole === 'Visiteur') {
      setCurrentPage('connexion');
      showToast('Veuillez vous connecter pour vous inscrire.', 'info');
      return;
    }
    const existing = store.participations.find(p => p.eventId === eventObj.id && p.userId === currentUser.id);
    if (existing) {
      showToast('Vous avez déjà soumis une demande de participation pour cet événement.', 'info');
      return;
    }

    const newPart = {
      id: 'part' + Date.now(),
      eventId: eventObj.id,
      eventTitle: eventObj.title,
      userId: currentUser.id,
      userName: currentUser.name,
      date: new Date().toLocaleDateString('fr-FR'),
      status: 'En attente'
    };

    setStore({
      ...store,
      participations: [newPart, ...store.participations]
    });
    showToast('Votre demande de participation a été envoyée ! (Statut : En attente)');
  };

  // Quick navigation helper
  const navigateTo = (page, param = null) => {
    setCurrentPage(page);
    setPageParam(param);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 animate-slide-up">
          {toast.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          ) : toast.type === 'info' ? (
            <Sparkles className="w-5 h-5 text-sky-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* --- TOP HEADER NAVIGATION --- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center space-x-3">
            {currentRole !== 'Visiteur' && (
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none"
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            <div 
              onClick={() => navigateTo('accueil')} 
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                  Solidarité Ensemble
                </span>
                <span className="text-[10px] text-slate-400 tracking-widest font-semibold uppercase -mt-1">
                  Actions & Partage
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 font-medium text-sm text-slate-600">
            <button 
              onClick={() => navigateTo('accueil')} 
              className={`px-3 py-2 rounded-lg transition-colors ${currentPage === 'accueil' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'hover:bg-slate-100 hover:text-slate-900'}`}
            >
              Accueil
            </button>
            <button 
              onClick={() => navigateTo('campagnes')} 
              className={`px-3 py-2 rounded-lg transition-colors ${currentPage === 'campagnes' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'hover:bg-slate-100 hover:text-slate-900'}`}
            >
              Campagnes
            </button>
            <button 
              onClick={() => navigateTo('evenements')} 
              className={`px-3 py-2 rounded-lg transition-colors ${currentPage === 'evenements' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'hover:bg-slate-100 hover:text-slate-900'}`}
            >
              Événements
            </button>
            {currentRole !== 'Visiteur' && (
              <button 
                onClick={() => navigateTo('publications')} 
                className={`px-3 py-2 rounded-lg transition-colors ${currentPage === 'publications' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'hover:bg-slate-100 hover:text-slate-900'}`}
              >
                Fil d’actualité
              </button>
            )}
          </nav>

          {/* User Controls & ROLE SELECTOR (DEMO TOOL) */}
          <div className="flex items-center space-x-3">
            
            {/* ROLE SELECTOR BADGE / DROPDOWN */}
            <div className="flex items-center bg-amber-50 border border-amber-200/80 rounded-xl px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-sm">
              <span className="hidden sm:inline text-amber-700 mr-1.5 font-normal">Test Rôle:</span>
              <select 
                value={currentRole} 
                onChange={(e) => handleRoleChange(e.target.value)}
                className="bg-transparent font-bold text-amber-900 focus:outline-none cursor-pointer py-0.5"
              >
                <option value="Visiteur">Visiteur (Déconnecté)</option>
                <option value="Citoyen">Citoyen</option>
                <option value="Organisateur">Organisateur</option>
                <option value="Admin">Administrateur</option>
              </select>
            </div>

            {/* Auth Buttons or Quick Profile */}
            {currentRole === 'Visiteur' ? (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => navigateTo('connexion')}
                  className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Connexion
                </button>
                <button 
                  onClick={() => navigateTo('inscription')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 transition-all hover:scale-105"
                >
                  Inscription
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => navigateTo('signalements')}
                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors relative"
                  title="Notifications & Signalements"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </button>
                <div 
                  onClick={() => navigateTo('profil')}
                  className="flex items-center space-x-2 pl-2 cursor-pointer group"
                >
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/30 group-hover:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- MAIN LAYOUT WITH RESPONSIVE SIDEBAR --- */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* SIDEBAR FOR LOGGED IN USERS */}
        {currentRole !== 'Visiteur' && (
          <aside className={`
            fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 p-5 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:border-r-0 lg:bg-transparent lg:p-0
            ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-6">
              
              {/* User Profile Snippet */}
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                <img src={currentUser.avatar} alt="" className="w-11 h-11 rounded-xl object-cover" />
                <div className="overflow-hidden">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{currentUser.name}</h4>
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                    currentRole === 'Admin' ? 'bg-purple-100 text-purple-700' :
                    currentRole === 'Organisateur' ? 'bg-teal-100 text-teal-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Navigation Sections based on Role */}
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                    Espace Général
                  </div>
                  <nav className="space-y-1">
                    <SidebarLink 
                      icon={User} 
                      label="Mon Profil" 
                      active={currentPage === 'profil'} 
                      onClick={() => navigateTo('profil')} 
                    />
                    <SidebarLink 
                      icon={MessageSquare} 
                      label="Mes Publications" 
                      active={currentPage === 'publications'} 
                      onClick={() => navigateTo('publications')} 
                    />
                    <SidebarLink 
                      icon={AlertCircle} 
                      label="Mes Signalements" 
                      active={currentPage === 'signalements'} 
                      onClick={() => navigateTo('signalements')} 
                    />
                  </nav>
                </div>

                {/* CITOYEN NAVIGATION */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                    Espace Citoyen
                  </div>
                  <nav className="space-y-1">
                    <SidebarLink 
                      icon={Heart} 
                      label="Explorer Campagnes" 
                      active={currentPage === 'campagnes'} 
                      onClick={() => navigateTo('campagnes')} 
                    />
                    <SidebarLink 
                      icon={DollarSign} 
                      label="Mes Dons" 
                      active={currentPage === 'mes-dons'} 
                      onClick={() => navigateTo('mes-dons')} 
                    />
                    <SidebarLink 
                      icon={CheckSquare} 
                      label="Mes Participations" 
                      active={currentPage === 'mes-participations'} 
                      onClick={() => navigateTo('mes-participations')} 
                    />
                    {currentRole === 'Citoyen' && (
                      <SidebarLink 
                        icon={Sparkles} 
                        label="Devenir Organisateur" 
                        active={currentPage === 'demande-organisateur'} 
                        onClick={() => navigateTo('demande-organisateur')} 
                      />
                    )}
                  </nav>
                </div>

                {/* ORGANISATEUR NAVIGATION */}
                {(currentRole === 'Organisateur' || currentRole === 'Admin') && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 text-teal-600">
                      Gestion Organisateur
                    </div>
                    <nav className="space-y-1">
                      <SidebarLink 
                        icon={BarChart2} 
                        label="Tableau de bord" 
                        active={currentPage === 'orga-dashboard'} 
                        onClick={() => navigateTo('orga-dashboard')} 
                      />
                      <SidebarLink 
                        icon={Layers} 
                        label="Gérer mes Campagnes" 
                        active={currentPage === 'orga-campagnes'} 
                        onClick={() => navigateTo('orga-campagnes')} 
                      />
                      <SidebarLink 
                        icon={Users} 
                        label="Demandes Participations" 
                        active={currentPage === 'orga-participations'} 
                        onClick={() => navigateTo('orga-participations')} 
                      />
                      <SidebarLink 
                        icon={DollarSign} 
                        label="Dons Reçus" 
                        active={currentPage === 'orga-dons'} 
                        onClick={() => navigateTo('orga-dons')} 
                      />
                    </nav>
                  </div>
                )}

                {/* ADMIN NAVIGATION */}
                {currentRole === 'Admin' && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 text-purple-600">
                      Administration System
                    </div>
                    <nav className="space-y-1">
                      <SidebarLink 
                        icon={Users} 
                        label="Gestion Utilisateurs" 
                        active={currentPage === 'admin-utilisateurs'} 
                        onClick={() => navigateTo('admin-utilisateurs')} 
                      />
                      <SidebarLink 
                        icon={ShieldCheck} 
                        label="Demandes Organisateur" 
                        active={currentPage === 'admin-demandes'} 
                        onClick={() => navigateTo('admin-demandes')} 
                      />
                      <SidebarLink 
                        icon={AlertTriangle} 
                        label="Modération & Signalements" 
                        active={currentPage === 'admin-moderation'} 
                        onClick={() => navigateTo('admin-moderation')} 
                      />
                    </nav>
                  </div>
                )}
              </div>

              {/* Quick Action Button in Sidebar */}
              <div className="pt-2 border-t border-slate-100">
                <button 
                  onClick={() => {
                    if (currentRole === 'Organisateur' || currentRole === 'Admin') {
                      setActiveModal('create-campaign');
                    } else {
                      setActiveModal('create-post');
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-100 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{currentRole === 'Organisateur' ? 'Nouvelle Campagne' : 'Créer une Publication'}</span>
                </button>
              </div>

            </div>
          </aside>
        )}

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 w-full">
          {renderMainContent()}
        </main>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-800">Solidarité Ensemble</span>
            <span className="text-xs text-slate-400">© 2026 Plateforme Solidaire Citoyenne</span>
          </div>
          <div className="flex items-center space-x-6 text-xs text-slate-500 font-medium">
            <button onClick={() => navigateTo('accueil')} className="hover:text-emerald-600">Accueil</button>
            <button onClick={() => navigateTo('campagnes')} className="hover:text-emerald-600">Campagnes</button>
            <button onClick={() => navigateTo('evenements')} className="hover:text-emerald-600">Événements</button>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">Mode Prototype Front-end</span>
          </div>
        </div>
      </footer>

      {/* --- MODAL DIALOGS RENDERER --- */}
      {renderModals()}
    </div>
  );

  // Helper renderer to handle page views
  function renderMainContent() {
    switch (currentPage) {
      case 'accueil':
        return <PageAccueil navigateTo={navigateTo} campaigns={store.campaigns} events={store.events} setActiveModal={setActiveModal} setModalData={setModalData} />;
      case 'connexion':
        return <PageConnexion navigateTo={navigateTo} setCurrentRole={setCurrentRole} showToast={showToast} />;
      case 'inscription':
        return <PageInscription navigateTo={navigateTo} setCurrentRole={setCurrentRole} showToast={showToast} />;
      case 'mot-de-passe-oublie':
        return <PageMotDePasseOublie navigateTo={navigateTo} showToast={showToast} />;
      
      // Espace Utilisateur
      case 'profil':
        return <PageProfil currentUser={currentUser} showToast={showToast} />;
      case 'publications':
        return <PagePublications store={store} setStore={setStore} currentUser={currentUser} toggleLikePost={toggleLikePost} handleAddComment={handleAddComment} setActiveModal={setActiveModal} showToast={showToast} />;
      case 'signalements':
        return <PageSignalements store={store} setStore={setStore} currentUser={currentUser} setActiveModal={setActiveModal} showToast={showToast} />;
      
      // Espace Citoyen
      case 'campagnes':
        return <PageCampagnes campaigns={store.campaigns} navigateTo={navigateTo} setActiveModal={setActiveModal} setModalData={setModalData} />;
      case 'campagne-detail':
        return <PageCampagneDetail campaignId={pageParam} campaigns={store.campaigns} events={store.events} navigateTo={navigateTo} setActiveModal={setActiveModal} setModalData={setModalData} currentRole={currentRole} />;
      case 'evenements':
        return <PageEvenements events={store.events} handleJoinEvent={handleJoinEvent} currentRole={currentRole} />;
      case 'mes-dons':
        return <PageMesDons store={store} setStore={setStore} currentUser={currentUser} showToast={showToast} />;
      case 'mes-participations':
        return <PageMesParticipations store={store} setStore={setStore} currentUser={currentUser} showToast={showToast} />;
      case 'demande-organisateur':
        return <PageDemandeOrganisateur store={store} currentUser={currentUser} setActiveModal={setActiveModal} />;
      
      // Espace Organisateur
      case 'orga-dashboard':
        return <PageOrgaDashboard store={store} currentUser={currentUser} navigateTo={navigateTo} />;
      case 'orga-campagnes':
        return <PageOrgaCampagnes store={store} setStore={setStore} currentUser={currentUser} setActiveModal={setActiveModal} showToast={showToast} />;
      case 'orga-participations':
        return <PageOrgaParticipations store={store} setStore={setStore} showToast={showToast} />;
      case 'orga-dons':
        return <PageOrgaDons store={store} setStore={setStore} showToast={showToast} />;

      // Espace Admin
      case 'admin-utilisateurs':
        return <PageAdminUtilisateurs store={store} setStore={setStore} showToast={showToast} />;
      case 'admin-demandes':
        return <PageAdminDemandes store={store} setStore={setStore} showToast={showToast} />;
      case 'admin-moderation':
        return <PageAdminModeration store={store} setStore={setStore} showToast={showToast} />;

      default:
        return <PageAccueil navigateTo={navigateTo} campaigns={store.campaigns} events={store.events} setActiveModal={setActiveModal} setModalData={setModalData} />;
    }
  }

  // Helper modal dialog switcher
  function renderModals() {
    if (!activeModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 transform transition-all">
          
          {/* DONATION MODAL */}
          {activeModal === 'donate' && modalData && (
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                  <h3 className="font-bold text-slate-800">Faire un don solidaire</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleDonateSubmit} className="p-6 space-y-4">
                <p className="text-xs text-slate-500">
                  Campagne concernée : <strong className="text-slate-800">{modalData.title}</strong>
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Montant du don (€)
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[10, 25, 50, 100].map(val => (
                      <button 
                        key={val} 
                        type="button" 
                        onClick={() => {
                          const input = document.getElementById('donation-amount-input');
                          if (input) input.value = val;
                        }}
                        className="py-2 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50/40 hover:bg-emerald-100 transition-colors"
                      >
                        {val} €
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <input 
                      id="donation-amount-input"
                      name="amount" 
                      type="number" 
                      min="1" 
                      defaultValue="25"
                      required 
                      className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl font-bold text-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                    />
                    <span className="absolute right-4 top-3.5 text-slate-400 font-bold">€</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-500 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Paiement sécurisé en ligne fictif. Votre soutien est directement transmis aux organisateurs.</span>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal(null)} 
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200"
                  >
                    Confirmer le Don
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CREATE POST MODAL WITH AI LIVE DETECTOR */}
          {activeModal === 'create-post' && (
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800">Exprimer ou partager une action</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreatePostSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Votre Message
                  </label>
                  <textarea 
                    name="content"
                    rows="4"
                    required
                    onChange={(e) => {
                      const text = e.target.value.toLowerCase();
                      setAiWarning(SENSITIVE_WORDS.some(w => text.includes(w)));
                    }}
                    placeholder="Partagez l’avancement d’une initiative solidaire, un appel à bénévoles ou un témoignage..."
                    className="w-full p-3.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  ></textarea>
                </div>

                {/* AI Moderation Interactive Banner */}
                {aiWarning ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2 text-xs text-amber-800 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Avertissement Modération IA :</strong> Des termes jugés sensibles ou inappropriés ont été détectés (ex: arnaque, haine). Ce contenu sera soumis à validation par l'équipe administrative.
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center space-x-2 text-xs text-emerald-700">
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Contenu analysé automatiquement par l’IA de la plateforme (Charte bienveillante).</span>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal(null)} 
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200"
                  >
                    Publier
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CREATE CAMPAIGN MODAL */}
          {activeModal === 'create-campaign' && (
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-teal-50">
                <div className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-800">Lancer une nouvelle campagne</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateCampaignSubmit} className="p-6 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Titre de la campagne</label>
                  <input name="title" required placeholder="ex: Banque alimentaire solidaire" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
                    <select name="category" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none">
                      <option value="Humanitaire">Humanitaire</option>
                      <option value="Écologie">Écologie</option>
                      <option value="Éducation">Éducation</option>
                      <option value="Santé">Santé</option>
                      <option value="Social">Social</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Objectif financier (€)</label>
                    <input name="goal" type="number" required defaultValue="5000" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date début</label>
                    <input name="startDate" type="date" required defaultValue="2024-11-15" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date fin</label>
                    <input name="endDate" type="date" required defaultValue="2024-12-31" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ville / Localisation</label>
                  <input name="location" required placeholder="ex: Marseille (13001)" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">URL Image de couverture</label>
                  <input name="image" placeholder="https://..." defaultValue="https://images.unsplash.com/photo-1532629345422-7515fe9d1633?w=800" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description détaillée</label>
                  <textarea name="description" rows="3" required placeholder="Explication du projet et des actions..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"></textarea>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600">Annuler</button>
                  <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md">Publier la Campagne</button>
                </div>
              </form>
            </div>
          )}

          {/* CREATE EVENT MODAL */}
          {activeModal === 'create-event' && (
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-teal-50">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-800">Organiser un événement solidaire</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateEventSubmit} className="p-6 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Titre de l'événement</label>
                  <input name="title" required placeholder="ex: Ateliers confection repas" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campagne liée (optionnel)</label>
                  <select name="campaignId" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none">
                    <option value="">-- Aucune (Action Indépendante) --</option>
                    {store.campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Heure</label>
                    <input name="date" type="datetime-local" required className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Capacité (personnes)</label>
                    <input name="capacity" type="number" required defaultValue="20" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lieu exact</label>
                  <input name="location" required placeholder="ex: Salle Municipale, Paris" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Consignes</label>
                  <textarea name="description" rows="3" required placeholder="Description du déroulement..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"></textarea>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600">Annuler</button>
                  <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md">Créer l'Événement</button>
                </div>
              </form>
            </div>
          )}

          {/* CREATE REPORT MODAL */}
          {activeModal === 'create-report' && (
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-800">Signaler un problème ou contenu</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateReportSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type de contenu</label>
                  <select name="type" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none">
                    <option value="Publication">Publication du fil</option>
                    <option value="Campagne">Campagne de collecte</option>
                    <option value="Commentaire">Commentaire</option>
                    <option value="Utilisateur">Comportement Utilisateur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Titre / Référence du contenu</label>
                  <input name="targetTitle" required placeholder="ex: Titre de la campagne ou extrait" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Raison du signalement</label>
                  <textarea name="reason" rows="3" required placeholder="Expliquez en quoi ce contenu enfreint nos règles ou semble suspect..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"></textarea>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600">Annuler</button>
                  <button type="submit" className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md">Envoyer Signalement</button>
                </div>
              </form>
            </div>
          )}

          {/* REQUEST ORGANIZER MODAL */}
          {activeModal === 'request-organizer' && (
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-teal-50">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-800">Demander le statut Organisateur</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleRequestOrganizerSubmit} className="p-6 space-y-4">
                <p className="text-xs text-slate-600">
                  Le statut d’organisateur vous permet de publier des campagnes de dons, de récolter des fonds et d’organiser des événements citoyens.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Motivation & Structure représentée</label>
                  <textarea name="reason" rows="4" required placeholder="Présentez votre association ou collectif, vos objectifs et vos besoins..." className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"></textarea>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600">Annuler</button>
                  <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md">Soumettre ma demande</button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    );
  }
}

// ==========================================
// --- REUSABLE SIDEBAR LINK COMPONENT ---
// ==========================================
