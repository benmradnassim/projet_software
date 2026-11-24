
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

import {
  Breadcrumb,
  Button,
  Input,
  Textarea,
  useToast
} from '../../../design/components';

import {
  getCampagne,
  updateCampagne,
  getCategories
} from '../api';

import '../campagnes.css';

const CATEGORIES = getCategories();

export default function EditCampaignPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    titre: '',
    description: '',
    categorie: '',
    ville: '',
    besoins: [],
    point_collecte: '',
    date_debut: '',
    date_fin: '',
    objectif_montant: '',
    image: ''
  });

  // Récupérer la campagne depuis Django
  useEffect(() => {
    let actif = true;

    async function chargerCampagne() {
      try {
        setLoading(true);
        setError('');

        const campagne = await getCampagne(id);

        if (!actif) return;

        setForm({
          titre: campagne.titre || '',
          description: campagne.description || '',
          categorie: campagne.categorie || '',
          ville: campagne.ville || '',
          besoins: Array.isArray(campagne.besoins)
            ? campagne.besoins.map((b) => [
                String(b[0] ?? ''),
                String(b[1] ?? '')
              ])
            : [],
          point_collecte: campagne.point_collecte || '',
          date_debut: campagne.date_debut || '',
          date_fin: campagne.date_fin || '',
          objectif_montant: String(
            campagne.objectif_montant ?? ''
          ),
          image: campagne.image || ''
        });
      } catch (err) {
        if (actif) {
          setError(
            err.message || 'Impossible de charger cette campagne.'
          );
        }
      } finally {
        if (actif) {
          setLoading(false);
        }
      }
    }

    chargerCampagne();

    return () => {
      actif = false;
    };
  }, [id]);

  // Modifier un champ simple du formulaire
  const changer = (champ) => (event) => {
    setForm((ancien) => ({
      ...ancien,
      [champ]: event.target.value
    }));
  };

  // Modifier un besoin matériel
  const modifierBesoin = (index, position, valeur) => {
    setForm((ancien) => ({
      ...ancien,
      besoins: ancien.besoins.map((besoin, i) => {
        if (i !== index) return besoin;

        const nouveau = [...besoin];
        nouveau[position] = valeur;

        return nouveau;
      })
    }));
  };

  // Ajouter un besoin matériel
  const ajouterBesoin = () => {
    setForm((ancien) => ({
      ...ancien,
      besoins: [...ancien.besoins, ['', '']]
    }));
  };

  // Supprimer un besoin matériel
  const supprimerBesoin = (index) => {
    setForm((ancien) => ({
      ...ancien,
      besoins: ancien.besoins.filter((_, i) => i !== index)
    }));
  };

  // Enregistrer les modifications dans Django
  const enregistrer = async () => {
    if (saving) return;

    if (!form.titre.trim()) {
      toast('Le titre est obligatoire.');
      return;
    }

    if (!form.description.trim()) {
      toast('La description est obligatoire.');
      return;
    }

    if (!form.categorie.trim()) {
      toast('Choisissez une catégorie.');
      return;
    }

    // Vérifier la limite du DecimalField Django
    const objectif = form.objectif_montant.trim();

    if (
      !/^\d{1,9}(\.\d{1,3})?$/.test(objectif) ||
      Number(objectif) <= 0
    ) {
      toast(
        "L'objectif doit être positif, avec au maximum " +
        '9 chiffres avant la virgule et 3 décimales.'
      );
      return;
    }

    if (
      !form.date_debut ||
      !form.date_fin ||
      form.date_fin < form.date_debut
    ) {
      toast('Veuillez vérifier les dates de la campagne.');
      return;
    }

    if (form.ville.trim().length > 120) {
      toast('La ville ne doit pas dépasser 120 caractères.');
      return;
    }

    if (form.point_collecte.trim().length > 255) {
      toast(
        'Le point de collecte ne doit pas dépasser 255 caractères.'
      );
      return;
    }

    // Vérifier les besoins matériels
    const besoinsValides = form.besoins
      .filter((b) => b[0].trim() || b[1].trim());

    for (const besoin of besoinsValides) {
      const article = besoin[0].trim();
      const quantite = besoin[1].trim();

      if (!article) {
        toast('Veuillez saisir le nom de chaque article.');
        return;
      }

      if (!/^[1-9]\d*$/.test(quantite)) {
        toast(
          'Chaque besoin doit avoir une quantité entière supérieure à zéro.'
        );
        return;
      }
    }

    if (form.image.trim()) {
      try {
        const url = new URL(form.image.trim());

        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('URL invalide');
        }
      } catch {
        toast(
          "L'URL de l'image doit commencer par http:// ou https://."
        );
        return;
      }
    }

    // Données envoyées à l'API Django
    const payload = {
      titre: form.titre.trim(),
      description: form.description.trim(),
      categorie: form.categorie.trim(),

      ville: form.ville.trim(),

      besoins: besoinsValides.map((b) => [
        b[0].trim(),
        b[1].trim()
      ]),

      point_collecte: form.point_collecte.trim(),

      date_debut: form.date_debut,
      date_fin: form.date_fin,
      objectif_montant: objectif,
      image: form.image.trim()
    };

    try {
      setSaving(true);

      await updateCampagne(id, payload);

      toast('Campagne modifiée avec succès !');

      navigate('/organisateur/campagnes');
    } catch (err) {
      toast(
        err.message || 'Erreur lors de la modification.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Chargement
  if (loading) {
    return (
      <div className="pg">
        <p>Chargement de la campagne...</p>
      </div>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="pg">
        <p role="alert">{error}</p>

        <Button
          variant="ghost"
          onClick={() => navigate('/organisateur/campagnes')}
        >
          Retour à mes campagnes
        </Button>
      </div>
    );
  }

  return (
    <div className="pg">
      <Breadcrumb
        items={[
          {
            label: 'Mes campagnes',
            to: '/organisateur/campagnes'
          },
          'Modifier une campagne'
        ]}
      />

      <div className="panel" style={{ maxWidth: 850 }}>
        <h2 style={{ marginBottom: 12 }}>
          Modifier ma campagne
        </h2>

        <p
          style={{
            color: 'var(--muted)',
            marginBottom: 24
          }}
        >
          Modifiez les informations de votre campagne,
          puis enregistrez vos changements.
        </p>

        <div style={{ display: 'grid', gap: 18 }}>

          {/* Titre */}
          <Input
            label="Titre de la campagne"
            value={form.titre}
            onChange={changer('titre')}
            maxLength={70}
          />

          {/* Description */}
          <Textarea
            label="Description"
            value={form.description}
            onChange={changer('description')}
          />

          {/* Catégorie */}
          <div>
            <label
              htmlFor="edit-categorie"
              className="lbl"
            >
              Catégorie
            </label>

            <select
              id="edit-categorie"
              className="inp3"
              style={{ width: '100%' }}
              value={form.categorie}
              onChange={changer('categorie')}
            >
              {!CATEGORIES.some(
                (cat) => cat.label === form.categorie
              ) && form.categorie && (
                <option value={form.categorie}>
                  {form.categorie}
                </option>
              )}

              {CATEGORIES.map((cat) => (
                <option key={cat.code} value={cat.label}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ville */}
          <Input
            label="Ville"
            value={form.ville}
            onChange={changer('ville')}
            maxLength={120}
            placeholder="Ex. : Sfax"
          />

          {/* Objectif financier */}
          <Input
            label="Objectif financier (TND)"
            type="number"
            min="0.001"
            max="999999999.999"
            step="0.001"
            value={form.objectif_montant}
            onChange={changer('objectif_montant')}
          />

          {/* Dates */}
          <div className="fg2">
            <Input
              label="Date de début"
              type="date"
              value={form.date_debut}
              onChange={changer('date_debut')}
            />

            <Input
              label="Date de fin"
              type="date"
              value={form.date_fin}
              onChange={changer('date_fin')}
            />
          </div>

          {/* Besoins matériels */}
          <div>
            <h3 style={{ marginBottom: 8 }}>
              Besoins matériels
            </h3>

            <p
              className="muted"
              style={{ fontSize: 13, marginBottom: 12 }}
            >
              Ajoutez les articles dont votre campagne a besoin.
              Cette section est facultative.
            </p>

            {form.besoins.map((besoin, index) => (
              <div
                className="needrow"
                key={index}
                style={{ marginBottom: 10 }}
              >
                <input
                  className="inp3"
                  placeholder="Article (ex. : cartables)"
                  aria-label={`Article ${index + 1}`}
                  value={besoin[0]}
                  onChange={(event) =>
                    modifierBesoin(
                      index,
                      0,
                      event.target.value
                    )
                  }
                />

                <input
                  className="inp3"
                  placeholder="Quantité"
                  aria-label={`Quantité de l'article ${index + 1}`}
                  inputMode="numeric"
                  value={besoin[1]}
                  onChange={(event) =>
                    modifierBesoin(
                      index,
                      1,
                      event.target.value.replace(/\D/g, '')
                    )
                  }
                />

                <button
                  type="button"
                  className="kob"
                  aria-label={`Supprimer l'article ${index + 1}`}
                  title="Supprimer cet article"
                  onClick={() => supprimerBesoin(index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <Button
              size="sm"
              variant="ghost"
              icon={Plus}
              onClick={ajouterBesoin}
            >
              Ajouter un article
            </Button>
          </div>

          {/* Point de collecte */}
          <Input
            label="Point de collecte"
            value={form.point_collecte}
            onChange={changer('point_collecte')}
            maxLength={255}
            placeholder="Ex. : Local associatif, Sfax"
          />

          {/* Image */}
          <Input
            label="URL de l'image (facultatif)"
            type="url"
            placeholder="https://exemple.com/image.jpg"
            value={form.image}
            onChange={changer('image')}
          />

          {form.image && (
            <img
              src={form.image}
              alt="Aperçu de la campagne"
              style={{
                width: '100%',
                maxHeight: 260,
                objectFit: 'cover',
                borderRadius: 12
              }}
            />
          )}

          {/* Boutons */}
          <div
            className="row"
            style={{
              gap: 12,
              marginTop: 12,
              flexWrap: 'wrap'
            }}
          >
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() =>
                navigate('/organisateur/campagnes')
              }
            >
              Annuler
            </Button>

            <Button
              onClick={enregistrer}
              loading={saving}
              loadingText="Enregistrement..."
            >
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
