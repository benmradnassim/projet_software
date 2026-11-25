import { useState } from 'react';
import { Copy, Eye, ImagePlus, Pencil, Plus } from 'lucide-react';
import { Badge, Button, PageHeader, ProgressBar, SkeletonList, Tabs, useToast } from '../../../design/components';
import { formatNumber } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import {
  listMesCampagnes,
  deleteCampagne,
  publierCampagne,
  cloturerCampagne
} from '../api';
import { pctCampagne } from '../components/CampaignCard';
import '../campagnes.css';

const ETATS = {
  brouillon: ['wait', 'Brouillon'],
  en_cours: ['ok', 'En cours'],
  cloturee: ['grey', 'Clôturée'],
  annulee: ['grey', 'Annulée'],
};


function Row({
  c,
  index,
  onDelete,
  onPublier,
  onCloturer,
  actionEnCours
}) {
  const p = pctCampagne(c);

  const [tone, label] = ETATS[c.statut] || [
    'grey',
    'Statut inconnu'
  ];

  const enCours = actionEnCours === c.id;

  return (
    <div
      className="mc"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Image de la campagne */}
      {c.image ? (
        <img
          src={c.image}
          alt=""
          style={{
            objectPosition: c.image_position || 'center'
          }}
        />
      ) : (
        <div className="noimg">
          <ImagePlus
            size={26}
            aria-label="Pas de photo"
          />
        </div>
      )}

      {/* Informations de la campagne */}
      <div>
        <h3>{c.titre}</h3>

        <div className="meta2">
          {c.categorie}
        </div>

        <Badge
          tone={tone}
          style={{ marginTop: 6 }}
        >
          {label}
        </Badge>
      </div>

      {/* Montant et progression */}
      <div>
        <b
          style={{
            font: '800 17px var(--display)',
            color: 'var(--navy)'
          }}
        >
          {formatNumber(c.montant_collecte)}
          {' / '}
          {formatNumber(c.objectif_montant)} TND ? </b>

        <ProgressBar
          value={Math.min(100, p)}
          label={`${p} % financé`}
        />
      </div>

      {/* Boutons selon le statut */}
      <div
        className="row"
        style={{
          gap: 8,
          flexWrap: 'wrap'
        }}
      >

        {/* BROUILLON */}
        {c.statut === 'brouillon' && (
          <>
            <Button
              size="sm"
              variant="ghost"
              icon={Pencil}
              to={`/organisateur/campagnes/${c.id}/modifier`}
            >
              Modifier ? </Button>

            <Button
              size="sm"
              disabled={enCours}
              onClick={() => onPublier(c)}
            >
              Publier ? </Button>

            <Button
              size="sm"
              variant="ghost"
              disabled={enCours}
              onClick={() => onDelete(c)}
            >
              Supprimer ? </Button>
          </>
        )}

        {/* EN COURS */}
        {c.statut === 'en_cours' && (
          <>
            <Button
              variant="soft"
              size="sm"
              icon={Eye}
              to={`/campagnes/${c.id}`}
            >
              Voir ? </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={Pencil}
              to={`/organisateur/campagnes/${c.id}/modifier`}
            >
              Modifier ? </Button>

            <Button
              size="sm"
              disabled={enCours}
              onClick={() => onCloturer(c)}
            >
              Clôturer ? </Button>
          </>
        )}

        {/* CLÔTURÉE OU ANNULÉE */}
        {['cloturee', 'annulee'].includes(c.statut) && (
          <>
            <Button
              variant="ghost"
              size="sm"
              icon={Pencil}
              to={`/organisateur/campagnes/${c.id}/modifier`}
            >
              Modifier ? </Button>
          </>
        )}

      </div>
    </div>
  );
}

export default function MyCampaignsPage() {
  // TODO(API): remplacer par GET /api/campagnes/?organisateur=<moi> — voir features/campagnes/api.js (listMesCampagnes)
  const {
  data,
  loading,
  error,
  reload
} = useApi(listMesCampagnes, [], []);



const toast = useToast();
const [actionEnCours, setActionEnCours] = useState(null);

// Supprimer une campagne
const handleDelete = async (campagne) => {
  const confirmation = window.confirm(
    `Voulez-vous vraiment supprimer la campagne "${campagne.titre}" ?`
  );

  if (!confirmation) return;

  setActionEnCours(campagne.id);

  try {
    await deleteCampagne(campagne.id);
    toast('Campagne supprimée avec succès !');
    reload();
  } catch (err) {
    toast(err.message || 'Erreur lors de la suppression.');
  } finally {
    setActionEnCours(null);
  }
};

// Publier une campagne
const handlePublier = async (campagne) => {
  setActionEnCours(campagne.id);

  try {
    await publierCampagne(campagne.id);
    toast('Campagne publiée avec succès !');
    reload();
  } catch (err) {
    toast(err.message || 'Erreur lors de la publication.');
  } finally {
    setActionEnCours(null);
  }
};

// Clôturer une campagne
const handleCloturer = async (campagne) => {
  setActionEnCours(campagne.id);

  try {
    await cloturerCampagne(campagne.id);
    toast('Campagne clôturée avec succès !');
    reload();
  } catch (err) {
    toast(err.message || 'Erreur lors de la clôture.');
  } finally {
    setActionEnCours(null);
  }
};



























  const [tab, setTab] = useState('all');
  const count = (k) => data.filter((c) => c.statut === k).length;
  const tabs = [
  { key: 'all', label: 'Toutes', count: data.length },
  { key: 'en_cours', label: 'En cours', count: count('en_cours') },
  { key: 'brouillon', label: 'Brouillons', count: count('brouillon') },
  { key: 'cloturee', label: 'Clôturées', count: count('cloturee') },
  { key: 'annulee', label: 'Annulées', count: count('annulee') },
];
 const list = data.filter(
  (c) => tab === 'all' || c.statut === tab
);
  return (
    <div className="pg">
      <PageHeader
        crumbs={['Mes actions', 'Mes campagnes']}
        title="Mes campagnes"
        subtitle="Suivez, modifiez et publiez vos campagnes."
        actions={
          <Button to="/organisateur/campagnes/nouvelle" icon={Plus}>
            Nouvelle campagne ? </Button>
        }
      />
      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Filtrer mes campagnes">
        {loading ? (
          <div className="panel">
            <SkeletonList />
          </div>
        ) : list.length ? (
          
list.map((c, i) => (
  <Row
    key={c.id}
    c={c}
    index={i}
    onDelete={handleDelete}
    onPublier={handlePublier}
    onCloturer={handleCloturer}
    actionEnCours={actionEnCours}
  />
))

        ) : (
          <p className="panel muted">Aucune campagne dans cette catégorie.</p>
        )}
      </Tabs>
    </div>
  );
}
