import { Fragment, useState } from 'react';
import { Eye, Pencil, Trash2, X, Save, ImagePlus } from 'lucide-react';

import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  SkeletonList,
  useToast
} from '../../../design/components';

import { deleteCampagne, listToutesCampagnes, updateCampagne } from '../api';
import { useApi } from '../../../lib/useApi';
import { formatNumber } from '../../../lib/format';
import '../campagnes.css';

// Statuts provenant du backend Django
const STATUTS = {
  brouillon: ['wait', 'Brouillon'],
  en_cours: ['ok', 'En cours'],
  cloturee: ['grey', 'Clôturée'],
  annulee: ['grey', 'Annulée']
};

// Les campagnes sont chargées par listToutesCampagnes (features/campagnes/api.js) :
// vrai back si VITE_DEMO=false, données de démo sinon.

// Préparer les valeurs du formulaire de modification

function preparerFormulaire(c) {
  return {
    titre: c.titre || '',
    description: c.description || '',
    categorie: c.categorie || '',
    ville: c.ville || '',
    besoins: Array.isArray(c.besoins)
      ? c.besoins.map((b) => [
          String(b[0] ?? ''),
          String(b[1] ?? '')
        ])
      : [],
    point_collecte: c.point_collecte || '',
    objectif_montant: String(c.objectif_montant ?? ''),
    date_debut: c.date_debut || '',
    date_fin: c.date_fin || '',
    image: c.image || ''
  };
}


// Affichage d'une ligne du tableau
function CampagneRow({
  c,
  onModifier,
  onSupprimer,
  busyId
}) {
  const [tone, label] = STATUTS[c.statut] || [
    'grey',
    'Inconnu'
  ];

  return (
    <tr style={{ borderBottom: '1px solid #e8ebef' }}>
      {/* Campagne et organisateur */}
      <td style={{ padding: '16px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 210
          }}
        >
          {c.image ? (
            <img
              src={c.image}
              alt=""
              style={{
                width: 60,
                height: 60,
                objectFit: 'cover',
                borderRadius: 10,
                flexShrink: 0
              }}
            />
          ) : (
            <div
              className="noimg"
              style={{
                width: 60,
                height: 60,
                borderRadius: 10,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ImagePlus size={22} />
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <strong
              style={{
                color: 'var(--navy)',
                display: 'block',
                overflowWrap: 'anywhere'
              }}
            >
              {c.titre}
            </strong>

            <small className="muted">
              {c.organisateur_nom || 'Organisateur inconnu'}
            </small>

            <div className="muted" style={{ fontSize: 12 }}>
              {c.categorie} · N° {c.id}
            </div>
          </div>
        </div>
      </td>

      {/* Statut */}
      <td style={{ padding: 12 }}>
        <Badge tone={tone}>{label}</Badge>
      </td>

      {/* Objectif */}
      <td
        style={{
          padding: 12,
          whiteSpace: 'nowrap'
        }}
      >
        <strong>{formatNumber(c.objectif_montant)} TND</strong>
      </td>

      {/* Actions */}
      <td style={{ padding: 12 }}>
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            flexWrap: 'nowrap'
          }}
        >
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            to={`/campagnes/${c.id}`}
          >
            Voir
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={Pencil}
            disabled={busyId !== null}
            onClick={() => onModifier(c)}
          >
            Modifier
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={Trash2}
            disabled={busyId !== null}
            onClick={() => onSupprimer(c)}
          >
            Supprimer
          </Button>
        </div>
      </td>
    </tr>
  );
}

// Formulaire de modification
function FormulaireModification({
  form,
  setForm,
  onEnregistrer,
  onAnnuler,
  saving
}) {
  const changer = (champ) => (event) => {
    setForm((ancien) => ({
      ...ancien,
      [champ]: event.target.value
    }));
  };

  const champStyle = {
    width: '100%',
    padding: 12,
    border: '1px solid #dce2e7',
    borderRadius: 10
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontWeight: 600
  };

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        background: 'var(--bg, #f8f9fa)'
      }}
    >
      <h3 style={{ marginBottom: 18 }}>
        Modifier la campagne
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16
        }}
      >
        <div>
          <label style={labelStyle} htmlFor="admin-titre">
            Titre
          </label>
          <input
            id="admin-titre"
            style={champStyle}
            value={form.titre}
            onChange={changer('titre')}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="admin-categorie">
            Catégorie
          </label>
          <input
            id="admin-categorie"
            style={champStyle}
            value={form.categorie}
            onChange={changer('categorie')}
          />
        </div>

<div>
  <label style={labelStyle} htmlFor="admin-ville">
    Ville
  </label>
  <input
    id="admin-ville"
    style={champStyle}
    maxLength={120}
    value={form.ville}
    onChange={changer('ville')}
    placeholder="Ex. : Nabeul"
  />
</div>

<div>
  <label style={labelStyle} htmlFor="admin-point">
    Point de collecte
  </label>
  <input
    id="admin-point"
    style={champStyle}
    maxLength={255}
    value={form.point_collecte}
    onChange={changer('point_collecte')}
    placeholder="Adresse de collecte"
  />
</div>


        <div>
          <label style={labelStyle} htmlFor="admin-objectif">
            Objectif financier (TND)
          </label>
          <input
            id="admin-objectif"
            type="number"
            min="0.001"
            max="999999999.999"
            step="0.001"
            style={champStyle}
            value={form.objectif_montant}
            onChange={changer('objectif_montant')}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="admin-debut">
            Date de début
          </label>
          <input
            id="admin-debut"
            type="date"
            style={champStyle}
            value={form.date_debut}
            onChange={changer('date_debut')}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="admin-fin">
            Date de fin
          </label>
          <input
            id="admin-fin"
            type="date"
            style={champStyle}
            value={form.date_fin}
            onChange={changer('date_fin')}
          />
        </div>

        <div>
          <label style={labelStyle} htmlFor="admin-image">
            URL de l'image (facultatif)
          </label>
          <input
            id="admin-image"
            type="url"
            style={champStyle}
            value={form.image}
            onChange={changer('image')}
            placeholder="https://exemple.com/photo.jpg"
          />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={labelStyle} htmlFor="admin-description">
          Description
        </label>
        
        <textarea
          id="admin-description"
          style={{
            ...champStyle,
            minHeight: 110,
            resize: 'vertical'
          }}
          value={form.description}
          onChange={changer('description')}
        />
      </div>

<div style={{ marginTop: 20 }}>
  <h4 style={{ marginBottom: 12 }}>
    Besoins matériels (facultatif)
  </h4>

  {form.besoins.map((besoin, index) => (
    <div
      className="needrow"
      key={index}
      style={{ marginBottom: 10 }}
    >
      <input
        className="inp3"
        aria-label={`Article ${index + 1}`}
        placeholder="Article"
        value={besoin[0]}
        onChange={(e) => {
          setForm((ancien) => ({
            ...ancien,
            besoins: ancien.besoins.map((b, i) =>
              i === index
                ? [e.target.value, b[1]]
                : b
            )
          }));
        }}
      />

      <input
        className="inp3"
        aria-label={`Quantité ${index + 1}`}
        placeholder="Quantité"
        inputMode="numeric"
        value={besoin[1]}
        onChange={(e) => {
          const valeur = e.target.value.replace(/\D/g, '');

          setForm((ancien) => ({
            ...ancien,
            besoins: ancien.besoins.map((b, i) =>
              i === index
                ? [b[0], valeur]
                : b
            )
          }));
        }}
      />

      <button
        type="button"
        className="kob"
        aria-label={`Supprimer l'article ${index + 1}`}
        onClick={() =>
          setForm((ancien) => ({
            ...ancien,
            besoins: ancien.besoins.filter(
              (_, i) => i !== index
            )
          }))
        }
      >
        <Trash2 size={16} />
      </button>
    </div>
  ))}

  <Button
    size="sm"
    variant="ghost"
    onClick={() =>
      setForm((ancien) => ({
        ...ancien,
        besoins: [...ancien.besoins, ['', '']]
      }))
    }
  >
    + Ajouter un article
  </Button>
</div>


      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          marginTop: 20
        }}
      >
        <Button
          variant="ghost"
          icon={X}
          disabled={saving}
          onClick={onAnnuler}
        >
          Annuler
        </Button>

        <Button
          icon={Save}
          disabled={saving}
          onClick={onEnregistrer}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
}

// Page principale administrateur
export default function AdminCampaignsPage() {
  const toast = useToast();

  const {
    data,
    loading,
    error,
    reload
  } = useApi(listToutesCampagnes, [], []);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Ouvrir le formulaire
  const modifierCampagne = (campagne) => {
    setEditingId(campagne.id);
    setForm(preparerFormulaire(campagne));
  };

  // Annuler la modification
  const annulerModification = () => {
    setEditingId(null);
    setForm(null);
  };

  // Enregistrer dans Django
  const enregistrerModification = async () => {
    if (!form || busyId !== null) return;

    if (!form.titre.trim() || !form.description.trim()) {
      toast('Le titre et la description sont obligatoires.');
      return;
    }

    if (!form.categorie.trim()) {
      toast('La catégorie est obligatoire.');
      return;
    }

    // Django : DecimalField(max_digits=12, decimal_places=3)
    const objectif = form.objectif_montant.trim();

    if (
      !/^\d{1,9}(\.\d{1,3})?$/.test(objectif) ||
      Number(objectif) <= 0
    ) {
      toast(
        "L'objectif doit être positif, avec au maximum 9 chiffres avant la virgule et 3 décimales."
      );
      return;
    }

    if (
      !form.date_debut ||
      !form.date_fin ||
      form.date_fin < form.date_debut
    ) {
      toast('Vérifiez les dates de la campagne.');
      return;
    }

    const image = form.image.trim();

    if (image) {
      try {
        const url = new URL(image);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('URL invalide');
        }
      } catch {
        toast("L'URL de l'image est invalide.");
        return;
      }
    }

    setBusyId(editingId);

const besoinsValides = form.besoins.filter(
  (b) => b[0].trim() || b[1].trim()
);

if (
  besoinsValides.some(
    (b) =>
      !b[0].trim() ||
      !/^[1-9]\d*$/.test(b[1].trim())
  )
) {
  toast('Chaque article doit avoir un nom et une quantité positive.');
  return;
}


    try {

await updateCampagne(editingId, {
  titre: form.titre.trim(),
  description: form.description.trim(),
  categorie: form.categorie.trim(),
  ville: form.ville.trim(),
  besoins: besoinsValides.map((b) => [
    b[0].trim(),
    b[1].trim()
  ]),
  point_collecte: form.point_collecte.trim(),
  objectif_montant: objectif,
  date_debut: form.date_debut,
  date_fin: form.date_fin,
  image
});


      toast('Campagne modifiée avec succès !');
      annulerModification();
      await reload();

    } catch (err) {
      toast(err.message || 'Erreur lors de la modification.');
    } finally {
      setBusyId(null);
    }
  };

  // Supprimer dans Django
  const supprimerCampagne = async (campagne) => {
    if (busyId !== null) return;

    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer la campagne "${campagne.titre}" ?`
    );

    if (!confirmation) return;

    setBusyId(campagne.id);

    try {
      await deleteCampagne(campagne.id);

      if (editingId === campagne.id) {
        annulerModification();
      }

      toast('Campagne supprimée avec succès !');
      await reload();

    } catch (err) {
      toast(
        err.message || 'Impossible de supprimer cette campagne.'
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Administration', 'Campagnes']}
        title="Gestion des campagnes"
        subtitle="Consultez, modifiez et supprimez les campagnes."
      />

      {error ? (
        <div className="panel" role="alert">
          <p>
            {error.message || 'Erreur de chargement des campagnes.'}
          </p>
          <Button onClick={reload}>Réessayer</Button>
        </div>
      ) : loading ? (
        <div className="panel">
          <SkeletonList />
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          image="campagnes"
          title="Aucune campagne"
          text="Aucune campagne enregistrée."
        />
      ) : (
        <div
          className="panel"
          style={{ overflowX: 'auto' }}
        >
          <table
            style={{
              width: '100%',
              minWidth: 850,
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid #e8ebef'
                }}
              >
                <th style={{ padding: 12, width: '42%' }}>
                  Campagne / Organisateur
                </th>

                <th style={{ padding: 12, width: '13%' }}>
                  Statut
                </th>

                <th style={{ padding: 12, width: '17%' }}>
                  Objectif
                </th>

                <th style={{ padding: 12, width: '28%' }}>
                  Actions
                </th>
              </tr>
            </thead>

            
<tbody>
  {data.map((c) => (
    <Fragment key={c.id}>
      <CampagneRow
        c={c}
        onModifier={modifierCampagne}
        onSupprimer={supprimerCampagne}
        busyId={busyId}
      />

      {editingId === c.id && form && (
        <tr>
          <td colSpan={4} style={{ padding: 12 }}>
            <FormulaireModification
              form={form}
              setForm={setForm}
              saving={busyId === c.id}
              onEnregistrer={enregistrerModification}
              onAnnuler={annulerModification}
            />
          </td>
        </tr>
      )}
    </Fragment>
  ))}
</tbody>

          </table>
        </div>
      )}
    </div>
  );
}
