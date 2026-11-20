import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, AlertCircle, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Bell, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, CreditCard, Edit3, Filter, Flag, Heart, Home, KeyRound, Leaf, LogOut, MapPin, Menu, MessageCircle, MoreHorizontal, Plus, QrCode, Search, Send, ShieldCheck, Sparkles, Sprout, Trash2, TrendingUp, User, UserCheck, UserPlus, Users, Wallet, X, HandHeart, Megaphone } from 'lucide-react';
import { initialData, photo, roles } from './mockData';
import { api } from './api';
import QRCode from 'qrcode';
import './styles.css';

const protectedPages = new Set(['dashboard','account','posts','reports','notifications','campaigns','campaign-detail','participations','donations','donate','events','event-detail','organizer-request','manage-campaigns','participation-requests','received-donations','event-participations','organizer-reports','admin-users','admin-requests','moderation']);
const clone = (value) => JSON.parse(JSON.stringify(value));
const demoOrganizerId = 'demo-organisateur';
const eventFallbackImages = [photo.food, photo.school, photo.coast, photo.garden, photo.library, photo.seniors];
const eventCover = (event) => {
  if (event.image) return event.image;
  const index = Number(event.id);
  return eventFallbackImages[Number.isInteger(index) ? Math.abs(index - 1) % eventFallbackImages.length : 0];
};
const createDemoEvents = (organizerId, organizerName, role) => [
  ...initialData.events.map(event => ({
      id: event.id,
      titre: event.title,
      description: event.description || '',
      date_evenement: `${event.date}T${event.time}:00`,
      lieu: event.location,
      ville: event.region,
      capacite: event.capacity,
      statut: 'planifie',
      organisateur: `demo-organisateur-${event.id}`,
      organisateur_nom: event.organizer,
      nb_participants: event.attendees,
      ma_participation: null,
    })),
  ...(role === 'Organisateur' ? [{
    id: 100,
    titre: 'Atelier de quartier — votre démo',
    description: 'Un événement exemple que vous pouvez modifier ou supprimer en mode démo.',
    date_evenement: '2026-12-15T10:00:00',
    lieu: 'Maison de quartier, Sfax',
    ville: 'Sfax',
    capacite: 25,
    statut: 'planifie',
    organisateur: organizerId || demoOrganizerId,
    organisateur_nom: organizerName,
    nb_participants: 8,
    ma_participation: null,
  }] : []),
];
const money = (amount) => `${Number(amount || 0).toLocaleString('fr-FR')} TND`;
const dateFr = (date) => {
  if (!date) return '—';
  const parsed = new Date(typeof date === 'string' && date.length === 10 ? `${date}T12:00:00` : date);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
};

const iconByPage = {home:Home,dashboard:Activity,account:User,posts:MessageCircle,reports:Flag,notifications:Bell,campaigns:Megaphone,participations:HandHeart,donations:Wallet,events:CalendarDays,'organizer-request':UserPlus,'manage-campaigns':Megaphone,'participation-requests':Users,'received-donations':Wallet,'organizer-reports':Flag,'admin-users':Users,'admin-requests':UserCheck,moderation:ShieldCheck};

function Logo({onClick}) { return <button className="logo" onClick={onClick} aria-label="moubedra, accueil"><span className="logo-symbol"><Heart size={19} strokeWidth={2.2}/></span><span>moubedra<span className="logo-period">.</span></span></button>; }
function Button({children,variant='outline',icon:Icon,onClick,type='button',disabled=false,className=''}) { return <button type={type} disabled={disabled} className={`ui-button ${variant} ${className}`} onClick={onClick}>{Icon&&<Icon size={15}/>}<span>{children}</span></button>; }
function StatusBadge({status}) { const tone = /confirm|accept|actif|en cours|publié|résolu|terminée/i.test(status)?'positive':/attente|brouillon|pris en charge/i.test(status)?'pending':/refus|rejet|bloqué|annul/i.test(status)?'negative':'neutral'; return <span className={`status-badge ${tone}`}><i/>{status}</span>; }
function ProgressBar({value,max}) { const percent = max ? Math.min(100,Math.round(value/max*100)) : 0; return <div className="progress-wrap"><div className="progress-track"><span style={{width:`${percent}%`}}/></div><small>{percent}%</small></div>; }
function Avatar({name='Nour Saada',size=34}) { const initials = name.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase(); return <span className="user-avatar" style={{width:size,height:size}}>{initials}</span>; }
function PageHeading({eyebrow,title,description,action}) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{action}</div>; }
function Panel({children,className=''}) { return <section className={`ui-panel ${className}`}>{children}</section>; }
function EmptyState({title='Rien à afficher pour le moment',text='Les éléments apparaîtront ici dès qu’ils seront disponibles.',action}) { return <div className="empty-state"><span><Sprout size={23}/></span><b>{title}</b><p>{text}</p>{action}</div>; }
function DemoStates() { return <div className="demo-states"><div><span className="loading-swatch"/><b>Chargement</b><small>Les données arrivent…</small></div><div><span className="empty-swatch"><Leaf size={16}/></span><b>État vide</b><small>Aucun élément à afficher.</small></div><div><span className="error-swatch"><AlertCircle size={16}/></span><b>État d’erreur</b><small>Une erreur est survenue.</small></div></div>; }
function ConfirmModal({modal,onClose,onConfirm,campaignDraft,setCampaignDraft,saveCampaign,eventDraft,setEventDraft,saveEvent}) {
  if(!modal) return null;
  const field=(setter,draft,key,value)=>setter({...draft,[key]:value});
  return <div className="modal-backdrop" onMouseDown={(e)=>e.target===e.currentTarget&&onClose()}><div className={`modal-card ${['campaign','event'].includes(modal.type)?'wide':''}`} role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose} aria-label="Fermer"><X size={18}/></button>
    {modal.type==='confirm'?<><div className="modal-icon warning"><AlertCircle size={22}/></div><h2>{modal.title}</h2><p>{modal.text}</p><div className="modal-actions"><Button onClick={onClose}>Annuler</Button><Button variant="danger" onClick={onConfirm}>Confirmer</Button></div></>:null}
    {modal.type==='text'?<><div className="modal-icon"><Edit3 size={20}/></div><h2>{modal.title}</h2><textarea className="ui-textarea" value={modal.value} onChange={e=>modal.onChange(e.target.value)}/><div className="modal-actions"><Button onClick={onClose}>Annuler</Button><Button variant="primary" onClick={modal.onSave}>Enregistrer</Button></div></>:null}
    {modal.type==='campaign'&&campaignDraft?<><div className="modal-icon"><Megaphone size={20}/></div><h2>{campaignDraft.title?'Modifier la campagne':'Créer une campagne'}</h2><div className="form-grid"><Field label="Titre" value={campaignDraft.title} onChange={v=>field(setCampaignDraft,campaignDraft,'title',v)} placeholder="Nom de l'initiative"/><Field label="Catégorie" value={campaignDraft.category} onChange={v=>field(setCampaignDraft,campaignDraft,'category',v)} options={['Éducation','Solidarité','Solidarité alimentaire','Environnement','Urgence']}/><Field label="Région" value={campaignDraft.region} onChange={v=>field(setCampaignDraft,campaignDraft,'region',v)}/><Field label="Objectif (TND)" type="number" value={campaignDraft.goal} onChange={v=>field(setCampaignDraft,campaignDraft,'goal',v)}/><Field label="Date de fin" type="date" value={campaignDraft.end} onChange={v=>field(setCampaignDraft,campaignDraft,'end',v)}/><Field label="Image de couverture" value={campaignDraft.image} onChange={v=>field(setCampaignDraft,campaignDraft,'image',v)} options={Object.entries(photo).map(([name,url])=>({name,url}))}/><div className="span-two"><Field label="Description" value={campaignDraft.description} onChange={v=>field(setCampaignDraft,campaignDraft,'description',v)} type="textarea" placeholder="Racontez votre projet et son impact."/></div></div><div className="modal-actions"><Button onClick={onClose}>Annuler</Button><Button variant="primary" onClick={saveCampaign}>Enregistrer en brouillon</Button></div></>:null}
    {modal.type==='event'&&eventDraft?<><div className="modal-icon"><CalendarDays size={20}/></div><h2>{eventDraft.id?'Modifier l’événement':'Créer un événement'}</h2><div className="form-grid"><Field label="Titre" value={eventDraft.title} onChange={v=>field(setEventDraft,eventDraft,'title',v)} placeholder="Nom de l'événement"/><Field label="Date" type="date" value={eventDraft.date} onChange={v=>field(setEventDraft,eventDraft,'date',v)}/><Field label="Heure" type="time" value={eventDraft.time} onChange={v=>field(setEventDraft,eventDraft,'time',v)}/><Field label="Lieu" value={eventDraft.location} onChange={v=>field(setEventDraft,eventDraft,'location',v)} placeholder="Adresse ou lieu de rendez-vous"/><Field label="Capacité" type="number" value={eventDraft.capacite} onChange={v=>field(setEventDraft,eventDraft,'capacite',v)}/>{eventDraft.id&&<Field label="Statut" value={eventDraft.statut} onChange={v=>field(setEventDraft,eventDraft,'statut',v)} options={[{name:'Planifié',value:'planifie'},{name:'Complet',value:'complet'},{name:'Annulé',value:'annule'},{name:'Terminé',value:'termine'}]}/>}<div className="span-two event-photo-field"><label className="ui-field"><span>Photo de l’événement</span><input type="file" accept="image/*" onChange={e=>{const imageFile=e.target.files?.[0]||null;setEventDraft({...eventDraft,imageFile,imagePreview:''});if(imageFile){const reader=new FileReader();reader.onload=()=>setEventDraft(current=>current?.imageFile===imageFile?{...current,imagePreview:reader.result}:current);reader.readAsDataURL(imageFile);}}}/></label><small>Choisissez une image (5 Mo maximum). Elle apparaîtra sur la fiche de l’événement.</small>{(eventDraft.imagePreview||eventDraft.image)&&<img className="event-image-preview" src={eventDraft.imagePreview||eventDraft.image} alt="Aperçu de la photo de l’événement"/>}</div><div className="span-two"><Field label="Description" value={eventDraft.description} onChange={v=>field(setEventDraft,eventDraft,'description',v)} type="textarea" placeholder="Décrivez l'activité, son objectif et ce que les participants feront."/></div></div><div className="modal-actions"><Button onClick={onClose}>Annuler</Button><Button variant="primary" onClick={saveEvent}>Enregistrer</Button></div></>:null}
    {!['confirm','text','campaign','event'].includes(modal.type)&&<><div className="modal-icon"><CircleHelp size={20}/></div><h2>{modal.title}</h2><p>{modal.text}</p><div className="modal-actions"><Button onClick={onClose}>Fermer</Button></div></>}
  </div></div>;
}

function QrCodeModal({qrData, onClose, onNotify}) {
  const [qrImage, setQrImage] = useState('');
  const [qrError, setQrError] = useState('');

  useEffect(() => {
    if (!qrData?.code_qr) return;
    let active = true;
    QRCode.toDataURL(qrData.code_qr, { width: 240, margin: 2 })
      .then(image => { if (active) setQrImage(image); })
      .catch(() => { if (active) setQrError('Impossible de générer le QR code.'); });
    return () => { active = false; };
  }, [qrData?.code_qr]);

  if (!qrData) return null;
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card qr-modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        <div className="modal-icon"><QrCode size={20} /></div>
        <h2>Votre QR Code</h2>
        <p>Événement : <b>{qrData.evenement}</b></p>
        <p>Date : {dateFr(qrData.date_evenement)}</p>
        <p>Lieu : {qrData.lieu}</p>
        <p>Participant : {qrData.participant}</p>
        <div className="qr-code-display">
          {qrImage ? <img src={qrImage} alt="QR code de participation" /> : <p>{qrError || 'Génération du QR code…'}</p>}
          <p className="qr-code-text">{qrData.code_qr}</p>
        </div>
        <div className="modal-actions">
          <Button onClick={onClose}>Fermer</Button>
          <Button onClick={async () => {
            try {
              await navigator.clipboard.writeText(qrData.code_qr);
              onNotify('Code QR copié.');
            } catch {
              onNotify('Impossible de copier le code QR.', 'error');
            }
          }}>Copier le code</Button>
          {qrImage && <a className="ui-button primary" href={qrImage} download={`qr-evenement-${qrData.evenement}.png`}>Télécharger</a>}
        </div>
      </div>
    </div>
  );
}
function CampaignCard({campaign,onOpen,index=0,manage=false,onEdit,onDelete,onPublish,onClose}) { const percent = campaign.goal?Math.round(campaign.raised/campaign.goal*100):0; return <article className={`cause-card cause-${index%3}`}><button className="cause-image" onClick={()=>onOpen?.(campaign)}><img src={campaign.image} alt=""/><span className="cause-label">{campaign.category}</span><span className="cause-arrow"><ArrowUpRight size={18}/></span></button><div className="cause-copy"><div className="cause-place"><MapPin size={13}/>{campaign.region}, Tunisie</div><button className="cause-title-button" onClick={()=>onOpen?.(campaign)}><h3>{campaign.title}</h3></button><div className="cause-amount"><b>{money(campaign.raised)}</b><span>sur {money(campaign.goal)}</span></div><div className="cause-progress"><span style={{width:`${percent}%`}}/></div><div className="cause-foot"><span>{percent}% financé</span><span><CalendarDays size={13}/>{dateFr(campaign.end)}</span></div>{manage&&<div className="card-actions"><StatusBadge status={campaign.status}/><span/><button onClick={()=>onEdit?.(campaign)} title="Modifier"><Edit3 size={15}/></button><button onClick={()=>onPublish?.(campaign)} title={campaign.status==='Brouillon'?'Publier':'Clôturer'}>{campaign.status==='Brouillon'?<Send size={15}/>:<Check size={15}/>}</button><button onClick={()=>onDelete?.(campaign)} title="Supprimer"><Trash2 size={15}/></button></div>}</div></article>; }
function Field({label,value,onChange,placeholder,type='text',options}) { return <label className="ui-field"><span>{label}</span>{options?<select value={value} onChange={e=>onChange(e.target.value)}>{options.map(item=>typeof item==='string'?<option key={item} value={item}>{item}</option>:<option key={item.value??item.url} value={item.value??item.url}>{item.name}</option>)}</select>:type==='textarea'?<textarea className="ui-textarea" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>}</label>; }
function Table({headers,children}) { return <div className="table-scroll"><table className="ui-table"><thead><tr>{headers.map((h,i)=><th key={i}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }

function App() {
  const [data,setData]=useState(()=>clone(initialData));
  const [session,setSession]=useState(null);
  const [role,setRole]=useState('Utilisateur');
  const [page,setPage]=useState('home');
  const [selectedCampaign,setSelectedCampaign]=useState(null);
  const [selectedEvent,setSelectedEvent]=useState(null);
  const [eventParticipationEventId,setEventParticipationEventId]=useState(null);
  const [eventSearch,setEventSearch]=useState('');
  const [eventStatusFilter,setEventStatusFilter]=useState('');
  const [citizenEventView,setCitizenEventView]=useState('discover');
  const [organizerEventView,setOrganizerEventView]=useState('discover');
  const [organizerMyEventView,setOrganizerMyEventView]=useState('created');
  const [qrScanValue,setQrScanValue]=useState('');
  const [qrScanResult,setQrScanResult]=useState(null);
  const [query,setQuery]=useState('');
  const [filterCategory,setFilterCategory]=useState('Toutes les catégories');
  const [filterStatus,setFilterStatus]=useState('Tous les statuts');
  const [toast,setToast]=useState(null);
  const [modal,setModal]=useState(null);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [postDraft,setPostDraft]=useState('');
  const [reportDraft,setReportDraft]=useState({target:'',reason:'Contenu inapproprié',details:''});
  const [amount,setAmount]=useState('50');
  const [profile,setProfile]=useState({name:'Nour Saada',email:'nour.saada@example.tn',region:'Tunis',bio:'Citoyenne engagée, j’aime aider près de chez moi.'});
  const [campaignDraft,setCampaignDraft]=useState(null);
  const [eventDraft,setEventDraft]=useState(null);
  const [commentDraft,setCommentDraft]=useState({});
  const [commentsOpen,setCommentsOpen]=useState({});
  const [authMode,setAuthMode]=useState('login');
  const [authEmail,setAuthEmail]=useState('');
  const [authName,setAuthName]=useState('');
  const [authPassword,setAuthPassword]=useState('');
  const [authLoading,setAuthLoading]=useState(false);
  const [orgReason,setOrgReason]=useState('');
  const [filtersOpen,setFiltersOpen]=useState(false);

  const [apiEvents, setApiEvents] = useState([]);
  const [apiParticipations, setApiParticipations] = useState([]);
  const [eventParticipationRows, setEventParticipationRows] = useState([]);
  const [eventParticipationLoading, setEventParticipationLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [participationsLoading, setParticipationsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  const currentName = session?.name || profile.name;

  const fetchEvents = useCallback(async () => {
    if (!session || session.demo) return;
    setEventsLoading(true);
    setEventsError(null);
    try {
      const params = {};
      if (eventSearch.trim()) params.search = eventSearch.trim();
      if (eventStatusFilter) params.statut = eventStatusFilter;
      const res = await api.events.list(params);
      setApiEvents(res.results || res);
    } catch (e) {
      setEventsError(e.message);
      console.error('Failed to fetch events:', e);
    } finally {
      setEventsLoading(false);
    }
  }, [session, eventSearch, eventStatusFilter]);

  const fetchParticipations = useCallback(async () => {
    if (!session || session.demo) {
      setApiParticipations([]);
      return;
    }
    setParticipationsLoading(true);
    try {
      const res = await api.participations.list();
      setApiParticipations(res.results || res);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setParticipationsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchEvents();
    fetchParticipations();
  }, [fetchEvents, fetchParticipations]);

  useEffect(() => {
    if (page !== 'event-participations' || !session || !eventParticipationEventId) return;
    let active = true;
    setEventParticipationLoading(true);
    api.participations.list({ evenement: eventParticipationEventId })
      .then(res => { if (active) setEventParticipationRows(res.results || res); })
      .catch(error => { if (active) notify(error.message, 'error'); })
      .finally(() => { if (active) setEventParticipationLoading(false); });
    return () => { active = false; };
  }, [page, session, eventParticipationEventId]);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) return;
    api.auth.me().then(user => {
      const labels = {admin:'Admin',organisateur:'Organisateur',citoyen:'Citoyen',utilisateur:'Utilisateur'};
      const userRole = labels[user.role] || 'Utilisateur';
      setRole(userRole);
      setSession({id:user.id,name:user.nom_complet,email:user.email,role:userRole,demo:false});
      setProfile(current => ({...current,name:user.nom_complet,email:user.email,region:user.ville || current.region}));
    }).catch(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      notify('Votre session a expiré. Reconnectez-vous.', 'error');
    });
  }, []);

  useEffect(()=>{ if(!toast)return; const id=setTimeout(()=>setToast(null),3200); return()=>clearTimeout(id); },[toast]);
  const notify=(message,type='success')=>setToast({message,type});
  const patchData=(key,updater)=>setData(current=>({...current,[key]:typeof updater==='function'?updater(current[key]):updater}));
  const updateRow=(key,id,patch)=>patchData(key,rows=>rows.map(row=>row.id===id?{...row,...patch}:row));
  const protectedGo=(target)=>{if(protectedPages.has(target)&&!session){setPage('login');setAuthMode('login');notify('Connectez-vous pour accéder à cet espace.','info');return;}setPage(target);setMobileOpen(false);window.scrollTo({top:0,behavior:'smooth'});};
  const enterDemo=(chosenRole=role,chosenName=null)=>{if(session&&!session.demo)return;const name=chosenName|| (chosenRole==='Admin'?'Admin moubedra':chosenRole==='Organisateur'?'Marwa Ltifi':profile.name);const id=chosenRole==='Organisateur'?demoOrganizerId:`demo-${chosenRole.toLowerCase()}`;setRole(chosenRole);setSession({id,name,role:chosenRole,email:chosenRole==='Admin'?'admin@moubedra.tn':profile.email,demo:true});setApiEvents(createDemoEvents(id,name,chosenRole));setEventsError(null);setPage(chosenRole==='Utilisateur'?'account':'dashboard');notify(`Mode démo : ${chosenRole}`);};
  const changeRole=(next)=>{if(session&&!session.demo)return;setRole(next);if(session){const name=next==='Admin'?'Admin moubedra':next==='Organisateur'?'Marwa Ltifi':profile.name;const id=next==='Organisateur'?demoOrganizerId:`demo-${next.toLowerCase()}`;setSession({...session,id,role:next,name});setApiEvents(createDemoEvents(id,name,next));setEventsError(null);setPage(next==='Utilisateur'?'account':'dashboard');notify(`Espace ${next} activé.`);}else enterDemo(next);};
  const signOut=()=>{localStorage.removeItem('access_token');localStorage.removeItem('refresh_token');setSession(null);setRole('Utilisateur');setApiEvents([]);setApiParticipations([]);setPage('home');notify('Vous êtes déconnecté.','info');};
  const startApiSession=(user)=>{const labels={admin:'Admin',organisateur:'Organisateur',citoyen:'Citoyen',utilisateur:'Utilisateur'};const userRole=labels[user.role]||'Utilisateur';setRole(userRole);setSession({id:user.id,name:user.nom_complet,email:user.email,role:userRole,demo:false});setProfile(current=>({...current,name:user.nom_complet,email:user.email,region:user.ville||current.region}));setPage(userRole==='Utilisateur'?'account':'dashboard');};
  const submitAuth=async()=>{if(!authEmail.trim()||!authPassword){notify('Saisissez votre adresse e-mail et votre mot de passe.','error');return;}setAuthLoading(true);try{if(page==='register'){const [prenom,...nom]=authName.trim().split(/\s+/);if(!prenom){notify('Saisissez votre nom complet.','error');return;}await api.auth.register({email:authEmail.trim(),password:authPassword,prenom,nom:nom.join(' ')||prenom});}const tokens=await api.auth.login(authEmail.trim(),authPassword);localStorage.setItem('access_token',tokens.access);localStorage.setItem('refresh_token',tokens.refresh);const user=await api.auth.me();startApiSession(user);notify(page==='register'?'Compte citoyen créé.':'Connexion réussie.');}catch(error){notify(error.message,'error');}finally{setAuthLoading(false);}};
  const askConfirm=(title,text,onConfirm)=>setModal({type:'confirm',title,text,onConfirm});
  const openTextModal=(title,value,onSave)=>setModal({type:'text',title,value,onChange:(next)=>setModal(current=>({...current,value:next})),onSave});
  const categories=['Toutes les catégories',...new Set(data.campaigns.map(c=>c.category))];
  const filteredCampaigns=useMemo(()=>data.campaigns.filter(c=>(!query||`${c.title} ${c.region} ${c.category}`.toLowerCase().includes(query.toLowerCase()))&&(filterCategory==='Toutes les catégories'||c.category===filterCategory)&&(filterStatus==='Tous les statuts'||c.status===filterStatus)),[data.campaigns,query,filterCategory,filterStatus]);
  const campaignById=(id)=>data.campaigns.find(c=>c.id===Number(id));
  const openCampaign=(campaign)=>{setSelectedCampaign(campaign);protectedGo('campaign-detail');};
  const openEvent = async (event) => {
    try {
      const eventDetail = session?.demo
        ? apiEvents.find(item => item.id === event.id)
        : event.titre
          ? await api.events.get(event.id)
          : apiEvents.find(item => item.id === event.id);
      if (!eventDetail) {
        protectedGo('events');
        return;
      }
      setSelectedEvent(eventDetail);
      protectedGo('event-detail');
    } catch (e) {
      notify('Impossible de charger les détails de l\'événement.', 'error');
    }
  };
  const beginDonation=(campaign)=>{setSelectedCampaign(campaign);setAmount('50');protectedGo('donate');};
  const requestParticipation=(campaign)=>{if(data.participations.some(p=>p.campaignId===campaign.id&&p.citizen===currentName&&p.status!=='Annulée')){notify('Votre demande est déjà enregistrée.','info');return;}patchData('participations',rows=>[{id:Date.now(),citizen:currentName,campaignId:campaign.id,date:campaign.end,status:'En attente'},...rows]);notify('Votre demande de participation a été envoyée.');};
  const submitDonation=()=>{const value=Number(amount);if(!value||value<1){notify('Saisissez un montant valide.','error');return;}const item={id:Date.now(),donor:currentName,campaignId:selectedCampaign.id,amount:value,method:'Carte bancaire',status:'En attente',date:new Date().toISOString().slice(0,10)};patchData('donations',rows=>[item,...rows]);setData(current=>({...current,campaigns:current.campaigns.map(c=>c.id===selectedCampaign.id?{...c,raised:c.raised+value}:c)}));notify(`Don de ${money(value)} enregistré en mode démo.`);setPage('donations');};
  const submitPost=()=>{const clean=postDraft.trim();if(!clean)return;const inappropriate=/idiot|stupide|insulte|menace/i.test(clean);if(inappropriate){setModal({type:'notice',title:'Modération IA',text:'Ce contenu semble inapproprié. Modifiez votre message avant de le publier.'});notify('La modération IA demande une vérification.','error');return;}patchData('posts',rows=>[{id:Date.now(),author:currentName,role,avatar:currentName.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(),time:'À l’instant',text:clean,likes:0,campaignId:null,comments:[]} ,...rows]);setPostDraft('');notify('Publication ajoutée au fil. Contenu analysé par l’IA.');};
  const submitReport=()=>{if(!reportDraft.target.trim()||!reportDraft.details.trim()){notify('Complétez le contenu visé et les détails.','error');return;}patchData('reports',rows=>[{id:Date.now(),reporter:currentName,target:reportDraft.target,reason:reportDraft.reason,status:'En attente',date:new Date().toISOString().slice(0,10),details:reportDraft.details},...rows]);setReportDraft({target:'',reason:'Contenu inapproprié',details:''});notify('Votre signalement a été transmis.');};
  const openCampaignEditor=(campaign=null)=>{setCampaignDraft(campaign?{...campaign}:{id:Date.now(),title:'',category:'Éducation',region:'Tunis',organizer:currentName,goal:5000,raised:0,status:'Brouillon',start:new Date().toISOString().slice(0,10),end:'2026-12-31',participants:0,image:photo.school,description:''});setModal({type:'campaign'});};
  const saveCampaign=()=>{if(!campaignDraft.title.trim()||!campaignDraft.description.trim()){notify('Ajoutez un titre et une description.','error');return;}const exists=data.campaigns.some(c=>c.id===campaignDraft.id);const normalized={...campaignDraft,goal:Number(campaignDraft.goal)||0,raised:Number(campaignDraft.raised)||0,participants:Number(campaignDraft.participants)||0};patchData('campaigns',rows=>exists?rows.map(c=>c.id===campaignDraft.id?normalized:c):[normalized,...rows]);setModal(null);notify(exists?'Campagne modifiée.':'Campagne créée en brouillon.');};
  const openEventEditor = (event = null) => {
    if (event) {
      const [eventDate, eventTime = ''] = event.date_evenement.split('T');
      setEventDraft({
        id: event.id,
        title: event.titre,
        date: eventDate,
        time: eventTime.slice(0, 5),
        location: event.lieu,
        capacite: event.capacite,
        description: event.description || '',
        image: event.image || '',
        imageFile: null,
        imagePreview: '',
        statut: event.statut,
      });
    } else {
      setEventDraft({
        title: '',
        date: '',
        time: '',
        location: '',
        capacite: 30,
        description: '',
        image: '',
        imageFile: null,
        imagePreview: '',
        statut: 'planifie',
      });
    }
    setModal({ type: 'event' });
  };

  const saveEvent = async () => {
    const capacity = Number(eventDraft.capacite);
    if (!eventDraft.title.trim() || !eventDraft.location.trim() || !eventDraft.date || !eventDraft.time) {
      notify('Complétez le titre, la date, l’heure et le lieu.', 'error');
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1) {
      notify('La capacité doit être un nombre entier supérieur à zéro.', 'error');
      return;
    }
    if (eventDraft.imageFile && eventDraft.imageFile.size > 5 * 1024 * 1024) {
      notify('La photo ne peut pas dépasser 5 Mo.', 'error');
      return;
    }
    if (eventDraft.imageFile && !eventDraft.imageFile.type.startsWith('image/')) {
      notify('Choisissez un fichier image valide.', 'error');
      return;
    }
    try {
      const eventData = {
        titre: eventDraft.title,
        description: eventDraft.description || '',
        date_evenement: `${eventDraft.date}T${eventDraft.time}:00`,
        lieu: eventDraft.location,
        capacite: capacity,
        ...(eventDraft.id ? {statut:eventDraft.statut} : {}),
      };
      const uploadData = new FormData();
      Object.entries(eventData).forEach(([key, value]) => uploadData.append(key, value));
      if (eventDraft.imageFile) uploadData.append('image', eventDraft.imageFile);
      if (session?.demo) {
        const existing = apiEvents.find(event => event.id === eventDraft.id);
        const savedEvent = {
          ...existing,
          id: existing?.id || Date.now(),
          ...eventData,
          statut: eventData.statut || 'planifie',
          organisateur: session.id,
          organisateur_nom: session.name,
          image: eventDraft.imagePreview || existing?.image || '',
          nb_participants: existing?.nb_participants || 0,
          ma_participation: existing?.ma_participation || null,
        };
        setApiEvents(current => existing
          ? current.map(event => event.id === existing.id ? savedEvent : event)
          : [savedEvent, ...current]);
        setModal(null);
        notify(existing ? 'Événement modifié dans la démo.' : 'Événement ajouté à la démo.');
        return;
      }
      if (eventDraft.id) {
        await api.events.update(eventDraft.id, uploadData);
        notify('Événement modifié.');
      } else {
        await api.events.create(uploadData);
        notify('Événement créé.');
      }
      setModal(null);
      await fetchEvents();
    } catch (e) {
      notify(e.message || 'Erreur lors de la sauvegarde.', 'error');
    }
  };
  const submitOrganizerRequest=()=>{if(!orgReason.trim()){notify('Expliquez votre motivation avant l’envoi.','error');return;}patchData('organizerRequests',rows=>[{id:Date.now(),name:currentName,contact:session?.email||profile.email,reason:orgReason,status:'En attente',date:new Date().toISOString().slice(0,10)},...rows]);notify('Votre demande organisateur a été envoyée.');};
  const addComment=(post)=>{const text=(commentDraft[post.id]||'').trim();if(!text)return;patchData('posts',rows=>rows.map(p=>p.id===post.id?{...p,comments:[...p.comments,{id:Date.now(),author:currentName,text}]}:p));setCommentDraft({...commentDraft,[post.id]:''});setCommentsOpen(current=>({...current,[post.id]:true}));notify('Commentaire ajouté.');};
  const editComment=(post,comment)=>openTextModal('Modifier votre commentaire',comment.text,(text)=>{patchData('posts',rows=>rows.map(p=>p.id===post.id?{...p,comments:p.comments.map(c=>c.id===comment.id?{...c,text}:c)}:p));setModal(null);notify('Commentaire modifié.');});
  const toggleLike=(post)=>patchData('posts',rows=>rows.map(p=>p.id===post.id?{...p,liked:!p.liked,likes:p.likes+(p.liked?-1:1)}:p));
  const removePost=(post)=>askConfirm('Supprimer cette publication ?',`La publication de ${post.author} sera retirée du fil.`,()=>{patchData('posts',rows=>rows.filter(p=>p.id!==post.id));setModal(null);notify('Publication supprimée.');});
  const removeComment=(post,comment)=>askConfirm('Supprimer ce commentaire ?',`Le commentaire de ${comment.author} sera supprimé.`,()=>{patchData('posts',rows=>rows.map(p=>p.id===post.id?{...p,comments:p.comments.filter(c=>c.id!==comment.id)}:p));setModal(null);notify('Commentaire supprimé.');});
  const updateStatus=(key,id,status)=>{updateRow(key,id,{status});patchData('notifications',rows=>[{id:Date.now(),title:'Mise à jour de statut',text:`${key==='participations'?'Participation':key==='reports'?'Signalement':key==='organizerRequests'?'Demande organisateur':'Élément'} · ${status}`,date:'À l’instant',read:false},...rows]);notify(`Statut mis à jour : ${status}.`);};

  const commonLinks=[['account','Mon compte',User],['posts','Mes publications',MessageCircle],['reports','Mes signalements',Flag],['notifications','Notifications',Bell]];
  const citizenLinks=[['campaigns','Campagnes',Megaphone],['participations','Mes participations',HandHeart],['donations','Mes dons',Wallet],['events','Événements',CalendarDays],['organizer-request','Devenir organisateur',UserPlus]];
  const organizerLinks=[['manage-campaigns','Mes campagnes',Megaphone],['participation-requests','Demandes de participation',Users],['received-donations','Dons reçus',Wallet],['events','Événements',CalendarDays],['organizer-reports','Signalements',Flag]];
  const adminLinks=[['admin-users','Utilisateurs',Users],['admin-requests','Demandes organisateur',UserCheck],['moderation','Modération',ShieldCheck],['reports','Signalements',Flag]];
  const sideGroups=session?[['MON ESPACE',commonLinks],...(role==='Citoyen'?[['ESPACE CITOYEN',citizenLinks]]:[]),...(role==='Organisateur'?[['ESPACE ORGANISATEUR',organizerLinks]]:[]),...(role==='Admin'?[['ADMINISTRATION',adminLinks]]:[]),...(role==='Utilisateur'?[['DÉCOUVRIR',citizenLinks.slice(0,1)]]:[])]:[];
  const pageTitles={dashboard:'Tableau de bord',account:'Mon compte',posts:'Le fil communautaire',reports:'Mes signalements',notifications:'Centre de notifications',campaigns:'Campagnes solidaires','campaign-detail':'Détail de la campagne',participations:'Mes participations',donations:'Mes dons',donate:'Faire un don',events:'Événements solidaires','event-detail':'Détail de l’événement','event-participations':'Participations à l’événement','organizer-request':'Devenir organisateur','manage-campaigns':'Gérer mes campagnes','participation-requests':'Demandes de participation','received-donations':'Dons reçus','organizer-reports':'Signalements','admin-users':'Gestion des utilisateurs','admin-requests':'Demandes organisateur',moderation:'Modération'};

  const Header=()=> <header className="site-header app-topbar">
    <Logo onClick={()=>protectedGo('home')}/>
    {!session
      ? <nav className="site-nav"><button className="selected" onClick={()=>protectedGo('home')}>Accueil</button><button onClick={()=>protectedGo('campaigns')}>Campagnes</button><button onClick={()=>protectedGo('events')}>Événements</button></nav>
      : <div className="header-welcome"><span className="welcome-dot"/>Bienvenue, <b>{currentName}</b></div>}
    <div className="header-actions">
      <label className="role-picker"><span>Mode démo</span><select value={role} disabled={!!session&&!session.demo} onChange={e=>changeRole(e.target.value)}>{roles.map(item=><option key={item}>{item}</option>)}</select><ChevronDown size={13}/></label>
      {session
        ? <><button className="header-icon" onClick={()=>protectedGo('notifications')} aria-label="Notifications"><Bell size={18}/>{data.notifications.some(n=>!n.read)&&<i/>}</button><button className="profile-button" onClick={()=>protectedGo('account')}><Avatar name={currentName}/><span>{currentName}</span><ChevronDown size={13}/></button></>
        : <><button className="header-login" onClick={()=>{setAuthMode('login');setPage('login')}}>Connexion <ArrowUpRight size={14}/></button><button className="header-donate" onClick={()=>{setAuthMode('register');setPage('register')}}>Créer un compte <ArrowRight size={14}/></button></>}
    </div>
    <button className="nav-menu" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Ouvrir le menu"><Menu size={22}/></button>
  </header>;

  const Sidebar=()=> <aside className={`app-sidebar ${mobileOpen?'open':''}`}><div className="sidebar-section"><span className="sidebar-caption">VOTRE ESPACE · {role.toUpperCase()}</span><button className={`side-link ${page==='home'?'active':''}`} onClick={()=>protectedGo('home')}><Home size={17}/>Accueil</button><button className={`side-link ${page==='dashboard'?'active':''}`} onClick={()=>protectedGo('dashboard')}><Activity size={17}/>Tableau de bord</button></div>{sideGroups.map(([heading,links])=><div className="sidebar-section" key={heading}><span className="sidebar-caption">{heading}</span>{links.map(([id,label,Icon])=><button key={id} className={`side-link ${page===id?'active':''}`} onClick={()=>protectedGo(id)}><Icon size={17}/><span>{label}</span>{id==='notifications'&&data.notifications.some(n=>!n.read)&&<i className="side-unread"/>}</button>)}</div>)}<div className="sidebar-help"><span><Sparkles size={18}/></span><b>Une idée solidaire ?</b><small>Elle peut commencer ici.</small><button onClick={()=>protectedGo(role==='Organisateur'?'manage-campaigns':'campaigns')}>Découvrir <ArrowRight size={13}/></button></div><button className="side-link logout-link" onClick={signOut}><LogOut size={17}/>Déconnexion</button></aside>;

  const HomePage=()=> <><section className="hero app-hero" aria-labelledby="hero-title"><div className="hero-message"><div className="paper"><span className="overline"><i/> L’ENTRAIDE NOUS RASSEMBLE <i/></span><h1 id="hero-title">La solidarité<br/>fait <em>grandir</em><br/>nos horizons.</h1><p>Des idées généreuses, des gens qui se mobilisent, des vies qui changent. Ici, chaque geste compte.</p><button className="hero-button" onClick={()=>protectedGo('campaigns')}>Découvrir les campagnes <ArrowRight size={17}/></button><span className="hero-aside">Ensemble, partout en Tunisie</span></div><span className="hero-flower flower-a">✳</span><span className="hero-flower flower-b">✿</span></div><div className="hero-photo"><div className="hero-slide slide-one"><img src={photo.hero} alt="Des bénévoles réunis"/></div><div className="hero-slide slide-two"><img src={photo.people} alt="Une communauté solidaire"/></div><div className="hero-slide slide-three"><img src={photo.school} alt="Des enfants à l’école"/></div><div className="photo-caption"><span className="caption-heart"><Heart size={15} fill="currentColor"/></span><span><b>Des gestes qui rapprochent.</b><small>Des changements qui restent.</small></span><span className="caption-star">✳</span></div><div className="photo-number"><b>01</b><span>— 03</span><i/></div><span className="photo-location"><MapPin size={14}/> Tunis, Tunisie</span><div className="slideshow-controls" aria-hidden="true"><span/><span/><span/><b>Ⅱ</b></div></div><div className="hero-bottom-note"><span>01</span><span>FAITES DÉFILER POUR DÉCOUVRIR</span><ArrowDown size={14}/></div></section><section className="intro" id="mission"><div className="intro-mark"><Sprout size={23}/></div><div className="intro-title"><span className="eyebrow">BIENVENUE CHEZ MOUBEDRA</span><h2>Faire le bien,<br/>c’est <em>contagieux.</em></h2></div><div className="intro-copy"><p>moubedra rassemble celles et ceux qui veulent faire bouger les choses. Des associations aux citoyens, nous créons le lien entre les belles idées et les actions qui comptent.</p><button className="under-link" onClick={()=>protectedGo('campaigns')}>Explorer la communauté <ArrowUpRight size={15}/></button></div><div className="intro-side-note"><span>✳</span> UNE INITIATIVE<br/>NÉE EN TUNISIE</div></section><section className="campaign-section"><div className="section-heading"><div><span className="eyebrow">PETITS GESTES, BELLES HISTOIRES</span><h2>Une cause vous<br/>attend quelque part.</h2></div><div className="section-heading-side"><p>Éducation, entraide, environnement… Découvrez les projets portés par des gens d’ici.</p><button className="under-link" onClick={()=>protectedGo('campaigns')}>Toutes les campagnes <ArrowUpRight size={15}/></button></div></div><div className="campaign-grid">{data.campaigns.slice(0,3).map((campaign,index)=><CampaignCard key={campaign.id} campaign={campaign} index={index} onOpen={openCampaign}/>)}</div><button className="all-causes" onClick={()=>protectedGo('campaigns')}>Voir les 8 campagnes <ArrowRight size={16}/></button></section><section className="impact-band"><div className="impact-icon"><HandHeart size={25}/></div><div className="impact-words"><span className="eyebrow">ÇA BOUGE, GRÂCE À VOUS</span><h2>La solidarité en action.</h2></div><div className="impact-stat"><b>128</b><span>campagnes solidaires</span></div><div className="impact-stat"><b>342 680 <small>TND</small></b><span>dons collectés</span></div><div className="impact-stat"><b>8 540</b><span>participants engagés</span></div></section><section className="join"><span className="eyebrow">LA PROCHAINE BELLE HISTOIRE EST LA VÔTRE</span><h2>Et si on faisait<br/>ça <em>ensemble ?</em></h2><p>Un peu de temps, une idée ou juste l’envie d’être là. Il y a mille façons de faire la différence.</p><div className="join-actions"><button className="join-primary" onClick={()=>protectedGo('campaigns')}>Je découvre les campagnes <ArrowRight size={16}/></button><button className="join-secondary" onClick={()=>enterDemo('Organisateur')}>Je veux organiser une action <ArrowUpRight size={15}/></button></div></section></>;

  const CampaignListPage=()=> <><PageHeading eyebrow="TROUVEZ VOTRE PROCHAINE ACTION" title="Campagnes solidaires" description="Des initiatives portées partout en Tunisie, près de chez vous." action={<Button icon={Filter} onClick={()=>setFiltersOpen(!filtersOpen)}>Filtres</Button>}/><Panel className="filter-panel"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher une campagne, une ville…"/></div><div className="filter-row"><select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select><select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>{['Tous les statuts','En cours','Brouillon','Clôturée'].map(c=><option key={c}>{c}</option>)}</select><select><option>Trier : plus récentes</option><option>Objectif le plus proche</option><option>Plus de participants</option></select><span className="result-count">{filteredCampaigns.length} campagnes</span></div></Panel><div className="campaign-grid app-campaign-grid">{filteredCampaigns.map((c,i)=><CampaignCard key={c.id} campaign={c} index={i} onOpen={openCampaign} manage={role==='Organisateur'&&c.organizer===currentName} onEdit={openCampaignEditor} onDelete={(item)=>askConfirm('Supprimer cette campagne ?',item.title,()=>{patchData('campaigns',rows=>rows.filter(x=>x.id!==item.id));setModal(null);notify('Campagne supprimée.');})} onPublish={(item)=>updateStatus('campaigns',item.id,item.status==='Brouillon'?'En cours':'Clôturée')}/>)}</div></>;

  const CampaignDetailPage=()=>{const c=selectedCampaign||data.campaigns[0];const percent=Math.round(c.raised/c.goal*100);return <><button className="back-link" onClick={()=>protectedGo('campaigns')}><ArrowLeft size={15}/>Retour aux campagnes</button><div className="detail-layout"><div className="detail-main"><img className="detail-cover" src={c.image} alt=""/><div className="detail-meta"><StatusBadge status={c.status}/><span><MapPin size={14}/>{c.region}, Tunisie</span><span><CalendarDays size={14}/>{dateFr(c.start)} — {dateFr(c.end)}</span></div><h2>{c.title}</h2><p>{c.description}</p><div className="detail-fund"><div><b>{money(c.raised)}</b><span>collectés sur {money(c.goal)}</span></div><strong>{percent}%</strong></div><ProgressBar value={c.raised} max={c.goal}/><div className="detail-actions"><Button variant="primary" icon={HandHeart} onClick={()=>requestParticipation(c)}>Demander à participer</Button><Button variant="accent" icon={Heart} onClick={()=>beginDonation(c)}>Faire un don</Button></div><Panel className="detail-info"><h3>À propos de l’initiative</h3><p>Organisée par <b>{c.organizer}</b> · {c.participants} citoyens impliqués.</p><p>Lieu : {c.region}, Tunisie</p></Panel></div><aside className="detail-side"><Panel><span className="eyebrow">L’ORGANISATEUR</span><div className="organizer-person"><Avatar name={c.organizer} size={43}/><div><b>{c.organizer}</b><StatusBadge status="Organisateur vérifié"/></div></div><p>Association engagée dans des actions locales et durables.</p></Panel><Panel><span className="eyebrow">ÉVÉNEMENTS LIÉS</span>{data.events.filter(e=>e.campaignId===c.id).map(e=><button className="mini-event" key={e.id} onClick={()=>openEvent(e)}><CalendarDays size={16}/><span><b>{e.title}</b><small>{dateFr(e.date)} · {e.region}</small></span><ArrowRight size={15}/></button>)}</Panel></aside></div></>;};

  const HomeConnectedDashboard=()=> <><PageHeading eyebrow={`BONJOUR ${currentName.toUpperCase()}`} title={role==='Organisateur'?'Votre espace organisateur':role==='Admin'?'Vue d’ensemble':'Votre espace solidaire'} description="Retrouvez vos actions et les nouvelles de la communauté." action={role==='Organisateur'?<Button variant="primary" icon={Plus} onClick={()=>openCampaignEditor()}>Créer une campagne</Button>:null}/><div className="metric-grid"><div className="metric-card"><span><Megaphone size={18}/></span><small>Campagnes actives</small><b>{data.campaigns.filter(c=>c.status==='En cours').length}</b><i><TrendingUp size={12}/> +12% ce mois</i></div><div className="metric-card"><span><Wallet size={18}/></span><small>Dons collectés</small><b>{money(data.donations.filter(d=>d.status==='Confirmé').reduce((a,d)=>a+d.amount,0))}</b><i><TrendingUp size={12}/> grâce à la communauté</i></div><div className="metric-card"><span><Users size={18}/></span><small>Demandes en attente</small><b>{data.participations.filter(p=>p.status==='En attente').length}</b><i>À suivre cette semaine</i></div><div className="metric-card"><span><CalendarDays size={18}/></span><small>Prochains événements</small><b>{data.events.length}</b><i>Dans toute la Tunisie</i></div></div>{role==='Organisateur'?<Panel><div className="panel-head"><div><b>Mes campagnes récentes</b><small>Suivi de vos initiatives.</small></div><Button onClick={()=>protectedGo('manage-campaigns')}>Gérer mes campagnes</Button></div><div className="campaign-grid app-campaign-grid">{data.campaigns.slice(0,3).map((c,i)=><CampaignCard key={c.id} campaign={c} index={i} onOpen={openCampaign} manage onEdit={openCampaignEditor} onDelete={()=>{}} onPublish={item=>updateStatus('campaigns',item.id,item.status==='Brouillon'?'En cours':'Clôturée')}/>)}</div></Panel>:role==='Admin'?<div className="admin-shortcuts"><button onClick={()=>protectedGo('admin-users')}><Users/>Gérer les utilisateurs<ArrowRight/></button><button onClick={()=>protectedGo('admin-requests')}><UserCheck/>Demandes organisateur<ArrowRight/></button><button onClick={()=>protectedGo('moderation')}><ShieldCheck/>Modération<ArrowRight/></button></div>:<><div className="home-dashboard-grid"><Panel><div className="panel-head"><div><b>Campagnes à découvrir</b><small>Des initiatives sélectionnées pour vous.</small></div><Button onClick={()=>protectedGo('campaigns')}>Tout voir</Button></div><div className="compact-campaign-list">{data.campaigns.slice(0,4).map(c=><button key={c.id} onClick={()=>openCampaign(c)}><img src={c.image}/><span><b>{c.title}</b><small>{c.region} · {money(c.raised)} collectés</small></span><ArrowRight size={15}/></button>)}</div></Panel><Panel><div className="panel-head"><div><b>À venir près de vous</b><small>Rencontres et actions solidaires.</small></div><Button onClick={()=>protectedGo('events')}>Calendrier</Button></div>{data.events.slice(0,3).map(e=><button className="mini-event" key={e.id} onClick={()=>openEvent(e)}><CalendarDays size={16}/><span><b>{e.title}</b><small>{dateFr(e.date)} · {e.region}</small></span><ArrowRight size={15}/></button>)}</Panel></div><Panel><div className="panel-head"><div><b>Le fil de la communauté</b><small>Les beaux moments à partager.</small></div><Button onClick={()=>protectedGo('posts')}>Ouvrir le fil</Button></div>{data.posts.slice(0,2).map(p=><div className="feed-snippet" key={p.id}><Avatar name={p.author}/><span><b>{p.author}</b><small>{p.text}</small></span></div>)}</Panel></>}</>;

  const CampaignManagement=()=>{const mine=data.campaigns.filter(c=>role==='Admin'||c.organizer===currentName);return <><PageHeading eyebrow="ESPACE ORGANISATEUR" title="Gérer mes campagnes" description="Créez, publiez et suivez vos initiatives." action={<Button variant="primary" icon={Plus} onClick={()=>openCampaignEditor()}>Nouvelle campagne</Button>}/><div className="campaign-grid app-campaign-grid">{mine.map((c,i)=><CampaignCard key={c.id} campaign={c} index={i} onOpen={openCampaign} manage onEdit={openCampaignEditor} onDelete={(item)=>askConfirm('Supprimer cette campagne ?',item.title,()=>{patchData('campaigns',rows=>rows.filter(x=>x.id!==item.id));setModal(null);notify('Campagne supprimée.');})} onPublish={(item)=>updateStatus('campaigns',item.id,item.status==='Brouillon'?'En cours':'Clôturée')}/>)}</div>{!mine.length&&<EmptyState title="Aucune campagne" text="Créez votre première campagne pour la voir apparaître ici."/>}</>;};

  const EventsPage = () => {
    const sourceEvents = session?.demo
      ? apiEvents.filter(event =>
        (!eventSearch.trim() || `${event.titre} ${event.description} ${event.lieu} ${event.ville}`.toLowerCase().includes(eventSearch.trim().toLowerCase())) &&
        (!eventStatusFilter || event.statut === eventStatusFilter)
      )
      : apiEvents;
    const events = role === 'Admin'
      ? sourceEvents
      : role === 'Organisateur'
        ? sourceEvents.filter(e => e.organisateur === session?.id || e.statut === 'planifie')
        : sourceEvents.filter(e => e.statut === 'planifie');
    const myEvents = events.filter(e => e.organisateur === session?.id);
    const discoverableEvents = events.filter(e => e.organisateur !== session?.id && e.statut === 'planifie');
    const organizerParticipations = apiParticipations.filter(participation => String(participation.utilisateur) === String(session?.id));
    const isCitizenMyEventsView = role === 'Citoyen' && citizenEventView === 'mine';
    const isOrganizerMyEventsView = role === 'Organisateur' && organizerEventView === 'mine';
    const isOrganizerParticipationsView = isOrganizerMyEventsView && organizerMyEventView === 'participations';
    const personalParticipations = isCitizenMyEventsView ? apiParticipations : organizerParticipations;
    const visibleEvents = role === 'Organisateur'
      ? isOrganizerMyEventsView && organizerMyEventView === 'created' ? myEvents
        : isOrganizerMyEventsView ? []
          : discoverableEvents
      : isCitizenMyEventsView ? [] : events;
    const canCreateEvent = role === 'Organisateur' && isOrganizerMyEventsView && organizerMyEventView === 'created';

    const handleCancelParticipation = async (participationId) => {
      setModal(null);
      try {
        await api.participations.delete(participationId);
        notify('Participation annulée.');
        await fetchParticipations();
        await fetchEvents();
      } catch (e) {
        notify(e.message, 'error');
      }
    };

    const handleViewParticipationQr = async (participation) => {
      if (participation.statut !== 'acceptee') return;
      try {
        const qrData = await api.participations.qrCode(participation.id);
        setModal({ type: 'qr_code', qrData });
      } catch (e) {
        notify(e.message, 'error');
      }
    };

    return (
      <>
        <PageHeading
          eyebrow={role === 'Organisateur' ? 'ESPACE ORGANISATEUR' : 'RENCONTREZ-VOUS, AGISSEZ'}
          title="Événements de la communauté"
          description={role === 'Organisateur'
            ? isOrganizerParticipationsView
              ? 'Suivez vos demandes et retrouvez le QR code des participations acceptées.'
              : isOrganizerMyEventsView
                ? 'Retrouvez vos événements créés et ceux auxquels vous participez.'
                : 'Découvrez les activités proposées par la communauté.'
            : isCitizenMyEventsView ? 'Suivez vos demandes et retrouvez le QR code des participations acceptées.' : 'Ateliers, rencontres et actions concrètes pour apprendre, échanger et agir ensemble.'}
          action={canCreateEvent ? <Button variant="primary" icon={Plus} onClick={() => openEventEditor()}>Créer un événement</Button> : null}
        />
        {session?.demo && role === 'Organisateur' && <div className="demo-notice"><ShieldCheck size={17}/><span><b>Mode démo</b><small>Vous pouvez essayer la gestion des événements. Vos changements restent dans cette session de démonstration.</small></span></div>}
        {role === 'Citoyen' && (
          <div className="event-scope-tabs citizen-event-tabs" role="group" aria-label="Vues des événements">
            <button type="button" className={citizenEventView === 'discover' ? 'active' : ''} aria-pressed={citizenEventView === 'discover'} onClick={() => setCitizenEventView('discover')}>
              Découvrir <span>{events.length}</span>
            </button>
            <button type="button" className={citizenEventView === 'mine' ? 'active' : ''} aria-pressed={citizenEventView === 'mine'} onClick={() => {
              setCitizenEventView('mine');
              if (!session?.demo) fetchParticipations();
            }}>
              Mes événements <span>{apiParticipations.length}</span>
            </button>
          </div>
        )}
        {role === 'Organisateur' && (
          <div className="event-scope-tabs citizen-event-tabs organizer-event-tabs" role="group" aria-label="Vues des événements">
            <button type="button" className={organizerEventView === 'discover' ? 'active' : ''} aria-pressed={organizerEventView === 'discover'} onClick={() => setOrganizerEventView('discover')}>
              Découvrir <span>{discoverableEvents.length}</span>
            </button>
            <button type="button" className={organizerEventView === 'mine' ? 'active' : ''} aria-pressed={organizerEventView === 'mine'} onClick={() => setOrganizerEventView('mine')}>
              Mes événements <span>{myEvents.length + organizerParticipations.length}</span>
            </button>
          </div>
        )}
        {isOrganizerMyEventsView && (
          <div className="event-scope-tabs organizer-event-subtabs" role="group" aria-label="Mes événements">
            <button type="button" className={organizerMyEventView === 'created' ? 'active' : ''} aria-pressed={organizerMyEventView === 'created'} onClick={() => setOrganizerMyEventView('created')}>
              Événements créés <span>{myEvents.length}</span>
            </button>
            <button type="button" className={organizerMyEventView === 'participations' ? 'active' : ''} aria-pressed={organizerMyEventView === 'participations'} onClick={() => {
              setOrganizerMyEventView('participations');
              if (!session?.demo) fetchParticipations();
            }}>
              Mes participations <span>{organizerParticipations.length}</span>
            </button>
          </div>
        )}
        {(isCitizenMyEventsView || isOrganizerParticipationsView) ? (
          <Panel className="my-event-participations-panel">
            {participationsLoading && <div className="loading">Chargement de vos événements...</div>}
            {personalParticipations.length > 0 && (
              <Table headers={['Événement', 'Date', 'Statut', 'Actions']}>
                {personalParticipations.map(participation => (
                  <tr key={participation.id}>
                    <td>{participation.evenement_titre}</td>
                    <td>{dateFr(participation.evenement_date)}</td>
                    <td><StatusBadge status={participation.statut} /></td>
                    <td>
                      {participation.statut === 'en_attente' && (
                        <Button variant="danger" onClick={() => askConfirm('Annuler votre demande ?', participation.evenement_titre, () => handleCancelParticipation(participation.id))}>Annuler</Button>
                      )}
                      {participation.statut === 'acceptee' && (
                        <Button variant="primary" icon={QrCode} onClick={() => handleViewParticipationQr(participation)}>QR Code</Button>
                      )}
                      {participation.statut === 'refusee' && <span>Refusée</span>}
                      {participation.statut === 'annulee' && <span>Annulée</span>}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
            {!personalParticipations.length && !participationsLoading && (
              <EmptyState
                title="Aucune demande pour le moment"
                text={session?.demo ? 'En mode démo, les demandes ne sont pas enregistrées. Connectez-vous pour les suivre ici.' : 'Vos demandes et les événements acceptés apparaîtront ici.'}
                action={<Button variant="primary" onClick={() => {
                  if (isCitizenMyEventsView) setCitizenEventView('discover');
                  else setOrganizerEventView('discover');
                }}>Découvrir les événements</Button>}
              />
            )}
          </Panel>
        ) : (
          <>
            <Panel className="filter-panel">
              <div className="search-box">
                <Search size={17} />
                <input value={eventSearch} onChange={e => setEventSearch(e.target.value)} placeholder="Rechercher un événement, un lieu…" />
              </div>
              <div className="filter-row">
                <select value={eventStatusFilter} onChange={e => setEventStatusFilter(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  <option value="planifie">Planifié</option>
                  <option value="complet">Complet</option>
                  <option value="annule">Annulé</option>
                  <option value="termine">Terminé</option>
                </select>
                <span className="result-count">{visibleEvents.length} événement{visibleEvents.length === 1 ? '' : 's'}</span>
              </div>
            </Panel>
            {eventsLoading && <div className="loading">Chargement des événements...</div>}
            {eventsError && <div className="error">Erreur: {eventsError}</div>}
            <div className="event-grid app-event-grid">
          {visibleEvents.map(e => {
            const isOwnEvent = role === 'Organisateur' && e.organisateur === session?.id;
            const canManageThisEvent = role === 'Organisateur' && isOwnEvent;
            const canParticipate = ['Citoyen', 'Organisateur'].includes(role) && !isOwnEvent && (
              Boolean(e.ma_participation) ||
              (e.statut === 'planifie' && (e.nb_participants || 0) < e.capacite)
            );
            return (
            <Panel className="event-card-ui" key={e.id}>
              <div className="event-date">
                <b>{new Date(e.date_evenement).getDate()}</b>
                <span>{new Date(e.date_evenement).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</span>
              </div>
              <div className="event-image">
                <img src={eventCover(e)} alt="" />
              </div>
              <div className="event-copy">
                <span className="eyebrow">{e.ville?.toUpperCase() || e.lieu.split(',')[0].toUpperCase()}</span>
                {role === 'Organisateur' && <span className={`event-owner-chip ${isOwnEvent ? 'mine' : ''}`}>{isOwnEvent ? 'Organisé par vous' : `Par ${e.organisateur_nom || 'un organisateur'}`}</span>}
                <h3>{e.titre}</h3>
                <p><CalendarDays size={14} />{dateFr(e.date_evenement)} · {new Date(e.date_evenement).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p><MapPin size={14} />{e.lieu}</p>
                {e.description && <p className="event-description-preview">{e.description}</p>}
                <div className="event-capacity"><Users size={15}/><span><b>{e.nb_participants || 0} / {e.capacite}</b> places confirmées</span></div>
                <div className="event-card-actions">
                  <Button className={`event-details-button ${canParticipate ? 'has-participate' : ''}`} onClick={() => openEvent(e)}>Détails</Button>
                  {canParticipate && <button type="button" className="event-participate-button" aria-label={`${e.ma_participation ? 'Voir ma demande pour' : 'Participer à'} ${e.titre}`} onClick={() => openEvent(e)}>
                    <Heart size={14} />
                    <span>{e.ma_participation ? 'Ma demande' : 'Participer'}</span>
                  </button>}
                  {canManageThisEvent && (
                    <>
                      <button type="button" title="Modifier l'événement" aria-label={`Modifier ${e.titre}`} onClick={() => openEventEditor(e)}><Edit3 size={14} /></button>
                      {!session?.demo && <button title="Gérer les participations" onClick={() => {
                        setSelectedEvent(e);
                        setEventParticipationEventId(e.id);
                        setQrScanValue('');
                        setQrScanResult(null);
                        protectedGo('event-participations');
                      }}><Users size={14} /></button>}
                      <button type="button" title="Supprimer l'événement" aria-label={`Supprimer ${e.titre}`} onClick={() => askConfirm('Supprimer cet événement ?', e.titre, async () => {
                        if (session?.demo) {
                          setApiEvents(current => current.filter(event => event.id !== e.id));
                          notify('Événement supprimé de la démo.');
                          setModal(null);
                          return;
                        }
                        try {
                          await api.events.delete(e.id);
                          notify('Événement supprimé.');
                          await fetchEvents();
                        } catch (err) {
                          notify(err.message, 'error');
                        }
                        setModal(null);
                      })}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            </Panel>
          );})}
            </div>
            {!visibleEvents.length && !eventsLoading && !eventsError && <EmptyState title={role === 'Organisateur' && isOrganizerMyEventsView ? 'Aucun événement créé' : 'Aucun événement à afficher'} text={role === 'Organisateur' && isOrganizerMyEventsView ? 'Créez votre premier événement pour le retrouver ici.' : 'Aucun événement publié pour le moment.'} />}
          </>
        )}
      </>
    );
  };

  const EventDetail = () => {
    const e = selectedEvent;
    if (!e) return <div>Chargement...</div>;

    const participation = e.ma_participation;
    const isOwnEvent = role === 'Organisateur' && e.organisateur === session.id;
    const isOrganizer = !session?.demo && isOwnEvent;
    const canRequestParticipation = session && !session.demo && ['Citoyen', 'Organisateur'].includes(role) && !isOrganizer && !participation && e.statut === 'planifie' && (e.nb_participants || 0) < e.capacite;
    const canPreviewParticipation = session?.demo && ['Citoyen', 'Organisateur'].includes(role) && !isOwnEvent && !participation && e.statut === 'planifie' && (e.nb_participants || 0) < e.capacite;

    const handleRequestParticipation = async () => {
      if (!session) return;
      try {
        await api.participations.create({ evenement: e.id, type: 'benevole', motif: '' });
        notify('Demande de participation envoyée.');
        await fetchParticipations();
        const updated = await api.events.get(e.id);
        setSelectedEvent(updated);
      } catch (err) {
        notify(err.message || 'Erreur lors de la demande.', 'error');
      }
    };

    const handleViewQrCode = async () => {
      if (!participation?.id) return;
      try {
        const qrData = await api.participations.qrCode(participation.id);
        setModal({ type: 'qr_code', qrData });
      } catch (err) {
        notify(err.message, 'error');
      }
    };

    const handleCancelParticipation = async () => {
      if (!participation?.id) return;
      try {
        await api.participations.delete(participation.id);
        notify('Participation annulée.');
        await fetchParticipations();
        const updated = await api.events.get(e.id);
        setSelectedEvent(updated);
      } catch (err) {
        notify(err.message, 'error');
      }
    };

    return (
      <>
        <button className="back-link" onClick={() => protectedGo('events')}><ArrowLeft size={15} />Retour aux événements</button>
        <Panel className="event-detail-panel">
          <img src={eventCover(e)} alt="" />
          <div>
            <span className="eyebrow">{e.ville?.toUpperCase() || e.lieu.split(',')[0].toUpperCase()} · ÉVÉNEMENT</span>
            <h2>{e.titre}</h2>
            {e.organisateur_nom && <p className="event-detail-organizer">{role === 'Organisateur' && e.organisateur === session?.id ? 'Organisé par vous' : `Organisé par ${e.organisateur_nom}`}</p>}
            <p><CalendarDays size={16} />{dateFr(e.date_evenement)} à {new Date(e.date_evenement).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><MapPin size={16} />{e.lieu}</p>
            {e.description && <p>{e.description}</p>}
            <div className="event-capacity"><Users size={16}/><span><b>{e.nb_participants || 0} / {e.capacite}</b> places confirmées</span></div>
            <div className="detail-actions">
              {canRequestParticipation && (
                <Button variant="primary" icon={UserPlus} onClick={handleRequestParticipation}>{role === 'Organisateur' ? 'Participer à cet événement' : 'Demander à participer'}</Button>
              )}
              {canPreviewParticipation && (
                <Button variant="primary" icon={Heart} onClick={() => notify('Connectez-vous à AccessiCity pour envoyer une demande de participation.', 'info')}>Participer</Button>
              )}
              {participation && participation.statut === 'en_attente' && (
                <Button variant="danger" onClick={handleCancelParticipation}>Annuler ma demande</Button>
              )}
              {participation && participation.statut === 'acceptee' && (
                <Button variant="primary" icon={QrCode} onClick={handleViewQrCode}>Voir mon QR Code</Button>
              )}
              {participation && participation.statut === 'refusee' && (
                <Button variant="outline" disabled>Demande refusée</Button>
              )}
              {participation && participation.statut === 'annulee' && (
                <Button variant="outline" disabled>Participation annulée</Button>
              )}
              {isOrganizer && (
                <Button variant="outline" onClick={() => {
                  setEventParticipationEventId(e.id);
                  setQrScanValue('');
                  setQrScanResult(null);
                  protectedGo('event-participations');
                }}>
                  Gérer les participations
                </Button>
              )}
            </div>
          </div>
        </Panel>
      </>
    );
  };

  const MyParticipations=()=>{const mine=data.participations.filter(p=>p.citizen===currentName);return <><PageHeading eyebrow="MON ENGAGEMENT" title="Mes participations" description="Suivez vos demandes et vos prochaines actions."/><Panel><Table headers={['Campagne','Date','Statut','Action']}>{mine.map(p=><tr key={p.id}><td>{campaignById(p.campaignId)?.title}</td><td>{dateFr(p.date)}</td><td><StatusBadge status={p.status}/></td><td>{p.status==='En attente'&&<Button variant="danger" onClick={()=>askConfirm('Annuler votre demande ?',campaignById(p.campaignId)?.title,()=>{updateStatus('participations',p.id,'Annulée');setModal(null);})}>Annuler</Button>}</td></tr>)}</Table>{!mine.length&&<EmptyState title="Aucune participation" text="Rejoignez une campagne et votre historique apparaîtra ici." action={<Button variant="primary" onClick={()=>protectedGo('campaigns')}>Découvrir les campagnes</Button>}/>}</Panel></>};

  const DonationsPage=({received=false})=>{const rows=data.donations.filter(d=>received?data.campaigns.some(c=>c.id===d.campaignId&&c.organizer===currentName):d.donor===currentName);return <><PageHeading eyebrow={received?'ESPACE ORGANISATEUR':'MON SOUTIEN'} title={received?'Dons reçus':'Mes dons'} description={received?'Consultez les contributions à vos campagnes.':'Historique de vos contributions solidaires.'}/><div className="metric-grid three"><div className="metric-card"><span><Wallet size={18}/></span><small>Total confirmé</small><b>{money(rows.filter(d=>d.status==='Confirmé').reduce((s,d)=>s+d.amount,0))}</b></div><div className="metric-card"><span><Clock3 size={18}/></span><small>En attente</small><b>{rows.filter(d=>d.status==='En attente').length}</b></div><div className="metric-card"><span><Heart size={18}/></span><small>Contributions</small><b>{rows.length}</b></div></div><Panel><Table headers={[...(received?['Donateur']:[]),'Campagne','Date','Montant','Mode','Statut','Action']}>{rows.map(d=><tr key={d.id}>{received&&<td>{d.donor}</td>}<td>{campaignById(d.campaignId)?.title||'Campagne supprimée'}</td><td>{dateFr(d.date)}</td><td><b>{money(d.amount)}</b></td><td>{d.method}</td><td><StatusBadge status={d.status}/></td><td>{received&&d.status==='En attente'?<div className="inline-actions"><Button variant="primary" onClick={()=>updateStatus('donations',d.id,'Confirmé')}>Vérifier</Button><Button variant="danger" onClick={()=>updateStatus('donations',d.id,'Refusé')}>Refuser</Button></div>:!received&&d.status==='En attente'?<Button variant="danger" onClick={()=>askConfirm('Annuler ce don ?',money(d.amount),()=>{updateStatus('donations',d.id,'Annulé');setModal(null);})}>Annuler</Button>:null}</td></tr>)}</Table>{!rows.length&&<EmptyState title="Aucun don pour le moment" text="Votre historique se remplira après votre première contribution."/>}</Panel></>};

  const DonationForm=()=>{const c=selectedCampaign||data.campaigns[0];return <><button className="back-link" onClick={()=>openCampaign(c)}><ArrowLeft size={15}/>Retour à la campagne</button><PageHeading eyebrow="UN GESTE QUI COMPTE" title="Faire un don" description={`Votre contribution soutient : ${c.title}`}/><div className="donation-layout"><Panel className="donation-form-ui"><h3>Choisissez un montant</h3><p>Chaque contribution fait avancer cette initiative.</p><div className="amount-options">{['20','50','100','200'].map(v=><button key={v} className={amount===v?'selected':''} onClick={()=>setAmount(v)}>{v} <small>TND</small></button>)}</div><Field label="Montant personnalisé (TND)" type="number" value={amount} onChange={setAmount}/><Field label="Mode de paiement" value="Carte bancaire" onChange={()=>{}} options={['Carte bancaire','D17','Virement']}/><div className="secure-copy"><ShieldCheck size={16}/> Paiement simulé — aucune transaction réelle n’a lieu.</div><Button variant="primary" icon={Heart} onClick={submitDonation}>Confirmer mon don de {money(amount)}</Button></Panel><Panel className="donation-summary"><img src={c.image} alt=""/><span className="eyebrow">VOTRE DON SOUTIENT</span><h3>{c.title}</h3><ProgressBar value={c.raised} max={c.goal}/><small>{money(c.raised)} collectés sur {money(c.goal)}</small></Panel></div></>};

  const ProfilePage=()=> <><PageHeading eyebrow="VOTRE ESPACE PERSONNEL" title="Mon compte" description="Gérez votre profil et vos préférences." action={<Button icon={KeyRound} onClick={()=>setModal({type:'notice',title:'Changer le mot de passe',text:'Formulaire de démonstration : le changement de mot de passe n’est pas connecté à un service réel.'})}>Changer le mot de passe</Button>}/><div className="profile-layout"><Panel className="profile-card"><div className="profile-card-head"><Avatar name={profile.name} size={64}/><div><b>{profile.name}</b><StatusBadge status={role}/></div><button className="icon-action" onClick={()=>openTextModal('Modifier votre nom',profile.name,(v)=>{setProfile({...profile,name:v});setSession({...session,name:v});setModal(null);notify('Profil mis à jour.');})}><Edit3 size={16}/></button></div><Field label="Nom complet" value={profile.name} onChange={v=>setProfile({...profile,name:v})}/><Field label="Adresse e-mail" value={profile.email} onChange={v=>setProfile({...profile,email:v})}/><Field label="Région" value={profile.region} onChange={v=>setProfile({...profile,region:v})}/><Field label="À propos de moi" type="textarea" value={profile.bio} onChange={v=>setProfile({...profile,bio:v})}/><Button variant="primary" onClick={()=>{setSession({...session,name:profile.name,email:profile.email});notify('Profil enregistré sur cet appareil.');}}>Enregistrer le profil</Button><div className="danger-zone"><div><b>Supprimer mon compte</b><small>Cette action efface la session de démonstration.</small></div><Button variant="danger" onClick={()=>askConfirm('Supprimer votre compte ?', 'Votre session locale sera fermée.',()=>{setModal(null);signOut();})}>Supprimer</Button></div></Panel><Panel><span className="eyebrow">VOTRE ACTIVITÉ</span><div className="profile-stat"><b>{data.posts.filter(p=>p.author===currentName).length}</b><span>publications</span></div><div className="profile-stat"><b>{data.participations.filter(p=>p.citizen===currentName).length}</b><span>participations</span></div><div className="profile-stat"><b>{data.donations.filter(d=>d.donor===currentName).length}</b><span>dons réalisés</span></div><div className="demo-notice"><ShieldCheck size={17}/><span><b>Mode démonstration</b><small>Les modifications restent en mémoire pendant cette visite. Aucune donnée n’est envoyée à un serveur.</small></span></div><DemoStates/></Panel></div></>;

  const PostsPage=()=> <><PageHeading eyebrow="LA COMMUNAUTÉ MOUBEDRA" title="Publications" description="Les nouvelles, les idées et les petits gestes qui rapprochent."/><Panel className="post-composer"><Avatar name={currentName}/><textarea value={postDraft} onChange={e=>setPostDraft(e.target.value)} placeholder="Une belle nouvelle à partager ?"/><div className="composer-footer"><span><ShieldCheck size={14}/> Modération IA activée · Contenu analysé avant publication</span><Button variant="primary" icon={Send} onClick={submitPost}>Publier</Button></div></Panel><div className="feed-list">{data.posts.map(post=><Panel className="feed-post" key={post.id}><div className="feed-author"><Avatar name={post.author}/><span><b>{post.author} {post.role==='Organisateur'&&<BadgeCheck size={13}/>}</b><small>{post.role} · {post.time}</small></span><StatusBadge status="Modération IA · analysé"/><button className="icon-action" onClick={()=>openTextModal('Signaler une publication',post.author,(v)=>{patchData('reports',rows=>[{id:Date.now(),reporter:currentName,target:`Publication de ${post.author}`,reason:'Contenu inapproprié',details:v,status:'En attente',date:new Date().toISOString().slice(0,10)},...rows]);setModal(null);notify('Publication signalée.');})}><MoreHorizontal size={18}/></button></div><p className="feed-text">{post.text}</p>{post.campaignId&&<button className="post-campaign-link" onClick={()=>openCampaign(campaignById(post.campaignId))}><Megaphone size={14}/>{campaignById(post.campaignId)?.title}</button>}<div className="post-actions"><button onClick={()=>toggleLike(post)} className={post.liked?'liked':''}><Heart size={16} fill={post.liked?'currentColor':'none'}/>{post.likes} J’aime</button><button type="button" className="post-comments-toggle" aria-expanded={!!commentsOpen[post.id]} onClick={()=>setCommentsOpen(current=>({...current,[post.id]:!current[post.id]}))}><MessageCircle size={16}/>{post.comments.length} commentaires</button></div>{commentsOpen[post.id]&&<div className="comments-panel"><div className="comment-list">{post.comments.map(comment=><div className="comment-row" key={comment.id}><span><b>{comment.author}</b>{comment.text}</span>{comment.author===currentName&&<><button onClick={()=>editComment(post,comment)} aria-label="Modifier le commentaire"><Edit3 size={13}/></button><button onClick={()=>removeComment(post,comment)} aria-label="Supprimer le commentaire"><Trash2 size={13}/></button></>}{role==="Admin"&&comment.author!==currentName&&<button onClick={()=>removeComment(post,comment)} aria-label="Modérer le commentaire"><Trash2 size={13}/></button>}</div>)}</div><div className="comment-box"><input value={commentDraft[post.id]||''} onChange={e=>setCommentDraft({...commentDraft,[post.id]:e.target.value})} placeholder="Écrire un commentaire…"/><button onClick={()=>addComment(post)} aria-label="Envoyer"><Send size={16}/></button></div></div>}{post.author===currentName&&<div className="own-post-actions"><Button onClick={()=>openTextModal('Modifier la publication',post.text,(v)=>{patchData('posts',rows=>rows.map(p=>p.id===post.id?{...p,text:v}:p));setModal(null);notify('Publication modifiée.');})}>Modifier</Button><Button variant="danger" onClick={()=>removePost(post)}>Supprimer</Button></div>}</Panel>)}</div></>;

  const ReportsPage=({organizer=false})=>{const rows=data.reports.filter(r=>organizer?role==='Admin'||data.campaigns.some(c=>c.organizer===currentName):r.reporter===currentName);return <><PageHeading eyebrow={organizer?'ESPACE ORGANISATEUR':'SÉCURITÉ DE LA COMMUNAUTÉ'} title={organizer?'Signalements à traiter':'Mes signalements'} description={organizer?'Suivez les signalements liés à vos campagnes.':'Signalez un problème et consultez son suivi.'}/>{!organizer&&<Panel className="report-form"><h3>Créer un signalement</h3><div className="form-grid"><Field label="Lien ou contenu concerné" value={reportDraft.target} onChange={v=>setReportDraft({...reportDraft,target:v})} placeholder="Publication, commentaire, campagne…"/><Field label="Motif" value={reportDraft.reason} onChange={v=>setReportDraft({...reportDraft,reason:v})} options={['Contenu inapproprié','Harcèlement','Information trompeuse','Autre']}/><div className="span-two"><Field label="Détails" type="textarea" value={reportDraft.details} onChange={v=>setReportDraft({...reportDraft,details:v})} placeholder="Expliquez-nous la situation."/></div></div><Button variant="primary" icon={Send} onClick={submitReport}>Envoyer le signalement</Button></Panel>}<Panel className="top-gap"><div className="panel-head"><div><b>{organizer?'Signalements reçus':'Mes signalements'}</b><small>{rows.length} éléments</small></div></div><Table headers={['Cible','Motif','Date','Statut',...(organizer?['Traitement']:['Action'])]}>{rows.map(r=><tr key={r.id}><td>{r.target}</td><td>{r.reason}</td><td>{dateFr(r.date)}</td><td><StatusBadge status={r.status}/></td><td>{organizer&&['En attente','Pris en charge'].includes(r.status)?<select value={r.status} onChange={e=>updateStatus('reports',r.id,e.target.value)}>{['Pris en charge','Résolu','Rejeté'].map(x=><option key={x}>{x}</option>)}</select>:!organizer&&r.status==='En attente'?<Button variant="danger" onClick={()=>askConfirm('Annuler ce signalement ?',r.target,()=>{patchData('reports',list=>list.filter(x=>x.id!==r.id));setModal(null);notify('Signalement annulé.');})}>Annuler</Button>:null}</td></tr>)}</Table>{!rows.length&&<EmptyState title="Aucun signalement"/>}</Panel></>};

  const NotificationsPage=()=> <><PageHeading eyebrow="RESTEZ DANS LA BOUCLE" title="Notifications" description="Les nouvelles liées à vos actions sur moubedra." action={<Button onClick={()=>patchData('notifications',rows=>rows.map(n=>({...n,read:true})))}>Tout marquer comme lu</Button>}/><Panel>{data.notifications.map(n=><div className={`notification-row ${n.read?'':'unread'}`} key={n.id}><span className="notification-icon"><Bell size={17}/></span><span><b>{n.title}</b><small>{n.text} · {n.date}</small></span>{!n.read&&<i/>}</div>)}</Panel></>;

  const ParticipationRequests=()=>{const rows=data.participations.filter(p=>data.campaigns.some(c=>c.id===p.campaignId&&c.organizer===currentName)&&p.status==='En attente');return <><PageHeading eyebrow="RENFORCEZ VOTRE ÉQUIPE" title="Demandes de participation" description="Acceptez ou refusez les demandes des citoyens."/><Panel><Table headers={['Citoyen','Campagne','Date demandée','Statut','Actions']}>{rows.map(p=><tr key={p.id}><td>{p.citizen}</td><td>{campaignById(p.campaignId)?.title}</td><td>{dateFr(p.date)}</td><td><StatusBadge status={p.status}/></td><td><div className="inline-actions"><Button variant="primary" onClick={()=>updateStatus('participations',p.id,'Acceptée')}>Accepter</Button><Button variant="danger" onClick={()=>updateStatus('participations',p.id,'Refusée')}>Refuser</Button></div></td></tr>)}</Table>{!rows.length&&<EmptyState title="Aucune demande en attente"/>}</Panel></>};

  const OrganizerRequestPage=()=>{const mine=data.organizerRequests.filter(r=>r.contact===session?.email||r.name===currentName);return <><PageHeading eyebrow="FAIRE GRANDIR VOTRE INITIATIVE" title="Devenir organisateur" description="Présentez votre association ou votre projet solidaire."/><div className="organizer-request-layout"><Panel className="report-form"><h3>Pourquoi souhaitez-vous devenir organisateur ?</h3><p>Notre équipe fictive examinera votre demande de démonstration.</p><Field label="Association / collectif" value={currentName} onChange={()=>{}}/><Field label="Votre motivation" value={orgReason} onChange={setOrgReason} type="textarea" placeholder="Présentez votre mission, vos actions et les causes qui vous tiennent à cœur…"/><Button variant="primary" onClick={submitOrganizerRequest}>Envoyer ma demande</Button></Panel><Panel><div className="panel-head"><div><b>Suivi de la demande</b><small>Vos demandes précédentes.</small></div></div>{mine.length?mine.map(r=><div className="request-row" key={r.id}><span><b>{r.name}</b><small>{r.reason}</small></span><StatusBadge status={r.status}/></div>):<EmptyState title="Aucune demande envoyée" text="Votre suivi apparaîtra ici après l’envoi."/>}</Panel></div></>};

  const AdminUsers=()=> <><PageHeading eyebrow="ADMINISTRATION" title="Gestion des utilisateurs" description="Recherchez, gérez les rôles et modérez les accès."/><Panel><div className="search-box table-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un nom ou un e-mail…"/></div><Table headers={['Utilisateur','E-mail','Rôle','État','Actions']}>{data.users.filter(u=>!query||`${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())).map(u=><tr key={u.id}><td><span className="table-person"><Avatar name={u.name} size={29}/>{u.name}</span></td><td>{u.email}</td><td><select value={u.role} onChange={e=>{updateRow('users',u.id,{role:e.target.value});notify(`Rôle de ${u.name} modifié.`);}}>{roles.map(r=><option key={r}>{r}</option>)}</select></td><td><StatusBadge status={u.status}/></td><td><div className="inline-actions"><Button onClick={()=>{updateRow('users',u.id,{status:u.status==='Bloqué'?'Actif':'Bloqué'});notify('Accès utilisateur mis à jour.');}}>{u.status==='Bloqué'?'Débloquer':'Bloquer'}</Button><button className="icon-action danger-icon" onClick={()=>askConfirm('Supprimer cet utilisateur ?',u.name,()=>{patchData('users',rows=>rows.filter(x=>x.id!==u.id));setModal(null);notify('Utilisateur supprimé.');})}><Trash2 size={15}/></button></div></td></tr>)}</Table></Panel></>;

  const AdminRequests=()=> <><PageHeading eyebrow="EXAMEN DES DEMANDES" title="Demandes organisateur" description="Validez les associations qui rejoignent la plateforme."/><Panel><Table headers={['Organisation','Contact','Motivation','Date','Statut','Décision']}>{data.organizerRequests.map(r=><tr key={r.id}><td><b>{r.name}</b></td><td>{r.contact}</td><td className="reason-cell">{r.reason}</td><td>{dateFr(r.date)}</td><td><StatusBadge status={r.status}/></td><td>{r.status==='En attente'&&<div className="inline-actions"><Button variant="primary" onClick={()=>{updateStatus('organizerRequests',r.id,'Acceptée');const user=data.users.find(u=>u.email===r.contact);if(user)updateRow('users',user.id,{role:'Organisateur'});}}>Accepter</Button><Button variant="danger" onClick={()=>updateStatus('organizerRequests',r.id,'Refusée')}>Refuser</Button></div>}</td></tr>)}</Table></Panel></>;

  const Moderation=()=> <><PageHeading eyebrow="SÉCURITÉ DE LA COMMUNAUTÉ" title="Modération" description="Contenus signalés et publications récentes."/><div className="moderation-columns"><Panel><div className="panel-head"><div><b>Contenus signalés</b><small>Publications et commentaires à examiner.</small></div></div>{data.reports.filter(r=>['En attente','Pris en charge'].includes(r.status)).map(r=><div className="moderation-row" key={r.id}><Flag size={16}/><span><b>{r.target}</b><small>{r.reason} · signalé par {r.reporter}</small></span><select value={r.status} onChange={e=>updateStatus('reports',r.id,e.target.value)}>{['En attente','Pris en charge','Résolu','Rejeté'].map(x=><option key={x}>{x}</option>)}</select></div>)}</Panel><Panel><div className="panel-head"><div><b>Publications récentes</b><small>Retirez un contenu inapproprié.</small></div></div>{data.posts.slice(0,6).map(p=><div className="moderation-row" key={p.id}><MessageCircle size={16}/><span><b>{p.author}</b><small>{p.text.slice(0,88)}…</small></span><button className="icon-action danger-icon" onClick={()=>removePost(p)}><Trash2 size={15}/></button></div>)}</Panel></div></>;

  const EventParticipationsPage = () => {
    const eventId = eventParticipationEventId;
    const event = selectedEvent?.id === eventId ? selectedEvent : apiEvents.find(item => item.id === eventId);

    const handleTraiter = async (participationId, action) => {
      try {
        await api.participations.traiter(participationId, action);
        notify(`Demande ${action === 'accepter' ? 'acceptée' : 'refusée'}.`);
        const partsRes = await api.participations.list({ evenement: eventId });
        setEventParticipationRows(partsRes.results || partsRes);
      } catch (e) {
        notify(e.message, 'error');
      }
    };

    const verifyQr = async () => {
      if (!qrScanValue.trim()) {
        notify('Saisissez le code lu sur le QR code.', 'error');
        return;
      }
      try {
        const result = await api.participations.verifyQr(qrScanValue.trim());
        if (Number(result.participation.evenement) !== Number(eventId)) {
          setQrScanResult({ valide: false, message: 'Ce QR code appartient à un autre événement.' });
          return;
        }
        setQrScanResult(result);
        notify(result.message);
      } catch (error) {
        setQrScanResult({ valide: false, message: error.message });
        notify(error.message, 'error');
      }
    };

    const eventsPage = 'events';
    if (!event) return <EmptyState title="Événement introuvable" text="Revenez à la liste et sélectionnez un événement à gérer." action={<Button onClick={() => protectedGo(eventsPage)}>Retour aux événements</Button>} />;

    return (
      <>
        <button className="back-link" onClick={() => protectedGo(eventsPage)}><ArrowLeft size={15} />Retour aux événements</button>
        <PageHeading
          eyebrow="ESPACE ORGANISATEUR"
          title="Gérer les participations"
          description={`Événement : ${event.titre}`}
        />
        {eventParticipationLoading && <div className="loading">Chargement...</div>}
        {!session?.demo && role === 'Organisateur' && <Panel className="event-qr-check">
          <div className="panel-head"><div><b>Vérifier une présence</b><small>Scannez le QR code avec votre lecteur puis vérifiez le code reçu.</small></div></div>
          <div className="inline-actions">
            <Field label="Code QR" value={qrScanValue} onChange={setQrScanValue} placeholder="Collez ou scannez le code"/>
            <Button variant="primary" icon={QrCode} onClick={verifyQr}>Vérifier</Button>
          </div>
          {qrScanResult && <p className={qrScanResult.valide ? 'qr-result success' : 'qr-result error'}>{qrScanResult.message}</p>}
        </Panel>}
        <Panel>
          <Table headers={['Participant', 'Date demande', 'Statut', 'Actions']}>
            {eventParticipationRows.map(p => (
              <tr key={p.id}>
                <td>{p.utilisateur_nom}</td>
                <td>{dateFr(p.date_demande)}</td>
                <td><StatusBadge status={p.statut} /></td>
                <td>
                  {p.statut === 'en_attente' && (
                    <div className="inline-actions">
                      <Button variant="primary" size="sm" onClick={() => handleTraiter(p.id, 'accepter')}>Accepter</Button>
                      <Button variant="danger" size="sm" onClick={() => handleTraiter(p.id, 'refuser')}>Refuser</Button>
                    </div>
                  )}
                  {p.statut === 'acceptee' && <StatusBadge status="Acceptée" />}
                  {p.statut === 'refusee' && <StatusBadge status="Refusée" />}
                  {p.statut === 'annulee' && <StatusBadge status="Annulée" />}
                </td>
              </tr>
            ))}
          </Table>
          {!eventParticipationRows.length && !eventParticipationLoading && <EmptyState title="Aucune demande" text="Personne n'a encore demandé à participer à cet événement." />}
        </Panel>
      </>
    );
  };

  const renderContent=()=>{
    if(page==='home') return HomePage();
    if(page==='login'||page==='register'||page==='forgot') return <div className="auth-layout">
      <div className="auth-image"><img src={photo.people} alt="Communauté moubedra"/><div className="auth-image-caption"><span className="brand-mark"><Heart size={17} fill="currentColor"/></span><h3>Les petits gestes<br/>font les grands <em>demain.</em></h3><p>Rejoignez celles et ceux qui font la différence.</p></div></div>
      <Panel className="auth-card">
        <Logo onClick={()=>protectedGo('home')}/>
        <div className="auth-tabs"><button className={page==='login'?'active':''} onClick={()=>{setPage('login');setAuthMode('login')}}>Connexion</button><button className={page==='register'?'active':''} onClick={()=>{setPage('register');setAuthMode('register')}}>Créer un compte</button></div>
        <h2>{page==='login'?'Ravie de vous revoir !':page==='register'?'Bienvenue chez moubedra':'Mot de passe oublié ?'}</h2>
        <p>{page==='forgot'?'Entrez votre e-mail pour recevoir les instructions de réinitialisation.':'Connectez-vous pour continuer votre aventure solidaire.'}</p>
        {page==='register'&&<Field label="Nom complet" value={authName} onChange={setAuthName} placeholder="Votre nom"/>}
        <Field label="Adresse e-mail" value={authEmail} onChange={setAuthEmail} placeholder="vous@exemple.tn" type="email"/>
        {page!=='forgot'&&<Field label="Mot de passe" value={authPassword} onChange={setAuthPassword} placeholder="Au moins 8 caractères" type="password"/>}
        <div className="auth-links">{page==='login'&&<button onClick={()=>setPage('forgot')}>Mot de passe oublié ?</button>}{page==='forgot'&&<button onClick={()=>setPage('login')}>Retour à la connexion</button>}</div>
        <Button variant="primary" disabled={authLoading} onClick={()=>page==='forgot'?(notify('Si ce compte existe, un e-mail de réinitialisation sera envoyé (simulation).'),setPage('login')):submitAuth()}>{authLoading?'Connexion…':page==='login'?'Se connecter':page==='register'?'Créer mon compte':'Envoyer les instructions'}</Button>
        <div className="demo-login-note"><ShieldCheck size={14}/> {page==='register'?'Un compte citoyen sera créé sur AccessiCity.':'Connexion sécurisée à votre compte AccessiCity.'}</div>
      </Panel>
    </div>;
    if(page==='dashboard')return HomeConnectedDashboard();if(page==='account')return ProfilePage();if(page==='posts')return PostsPage();if(page==='reports')return ReportsPage();if(page==='organizer-reports')return ReportsPage({organizer:true});if(page==='notifications')return NotificationsPage();if(page==='campaigns')return CampaignListPage();if(page==='campaign-detail')return CampaignDetailPage();if(page==='participations')return MyParticipations();if(page==='donations')return DonationsPage();if(page==='donate')return DonationForm();if(page==='events')return EventsPage();if(page==='event-detail')return EventDetail();if(page==='organizer-request')return OrganizerRequestPage();if(page==='manage-campaigns')return CampaignManagement();if(page==='participation-requests')return ParticipationRequests();if(page==='received-donations')return DonationsPage({received:true});if(page==='admin-users')return AdminUsers();if(page==='admin-requests')return AdminRequests();if(page==='moderation')return Moderation();if(page==='event-participations')return EventParticipationsPage();return HomePage();
  };

  return <div className="site app-site" id="top">
    <Header/>
    {session
      ? <div className="connected-shell"><Sidebar/><main className="connected-content"><div className="content-wrap">{page!=='home'&&page!=='dashboard'&&pageTitles[page]&&<div className="breadcrumb"><button onClick={()=>protectedGo('home')}>Accueil</button><span>/</span><b>{pageTitles[page]}</b></div>}{renderContent()}</div><footer className="app-footer"><Logo onClick={()=>protectedGo('home')}/><span>{session.demo?'Mode démo — les événements sont simulés dans cette session.':'Connecté à AccessiCity — les événements sont synchronisés avec le serveur.'}</span></footer></main></div>
      : <main className="public-main"><div className="public-content">{renderContent()}</div><footer className="site-footer"><div className="footer-bottom"><span>© 2026 moubedra</span><span>Fait avec soin en Tunisie <Heart size={13}/></span><div><button>Confidentialité</button><button>Accessibilité</button></div></div></footer></main>}
    <ConfirmModal modal={modal} onClose={()=>setModal(null)} onConfirm={()=>modal.onConfirm?.()} campaignDraft={campaignDraft} setCampaignDraft={setCampaignDraft} saveCampaign={saveCampaign} eventDraft={eventDraft} setEventDraft={setEventDraft} saveEvent={saveEvent} campaigns={data.campaigns} modalCampaigns={modal?.campaigns}/>
    {modal && modal.type === 'qr_code' && <QrCodeModal qrData={modal.qrData} onClose={() => setModal(null)} onNotify={notify}/>}
    {toast&&<div className={`toast ${toast.type}`}><span>{toast.type==='error'?<AlertCircle size={17}/>:<Check size={17}/>}</span>{toast.message}<button onClick={()=>setToast(null)}><X size={15}/></button></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
