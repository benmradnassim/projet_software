"""
Modération automatique des publications et des commentaires (US 7.6).

Le texte est analysé AVANT l'enregistrement (ajout ou modification) :

- score >= SEUIL_BLOCAGE : le contenu est refusé (erreur 400, rien n'est enregistré) ;
- score >= SEUIL_REVUE   : le contenu est enregistré « en attente » et part dans la file
                            de modération ; il reste invisible tant qu'un admin ne l'a pas gardé ;
- sinon                  : le contenu est publié directement.

L'analyse actuelle est un dictionnaire pondéré (aucun service externe, fonctionne hors ligne).
Pour brancher un vrai modèle (Perspective API, modèle Hugging Face…), il suffit de remplacer
le corps de `analyser_contenu` en gardant sa valeur de retour.
"""
import re
import unicodedata
from dataclasses import dataclass, field

SEUIL_BLOCAGE = 0.7
SEUIL_REVUE = 0.3

# Expression normalisée (minuscules, sans accents) -> (poids, motif lisible par l'admin)
TERMES = {
    # insultes et grossièretés
    "connard": (0.8, "Insulte"),
    "connasse": (0.8, "Insulte"),
    "salope": (0.8, "Insulte"),
    "pute": (0.8, "Insulte"),
    "encule": (0.8, "Insulte"),
    "fdp": (0.8, "Insulte"),
    "batard": (0.7, "Insulte"),
    "ta gueule": (0.6, "Insulte"),
    "nique": (0.7, "Insulte"),
    "abruti": (0.4, "Insulte"),
    "imbecile": (0.4, "Insulte"),
    "idiot": (0.35, "Insulte"),
    "debile": (0.35, "Insulte"),
    "cretin": (0.35, "Insulte"),
    "merde": (0.3, "Grossièreté"),
    # menaces
    "je vais te tuer": (1.0, "Menace"),
    "mort aux": (1.0, "Menace / haine"),
    "creve": (0.6, "Menace"),
    # accusations diffamatoires
    "voleur": (0.4, "Accusation"),
    "volent": (0.4, "Accusation"),
    "escroc": (0.4, "Accusation"),
    # arnaques : paiement hors plateforme
    "rib": (0.4, "Arnaque possible"),
    "western union": (0.5, "Arnaque possible"),
    "envoyez directement": (0.4, "Arnaque possible"),
    "pas besoin de passer par l'appli": (0.4, "Arnaque possible"),
}


@dataclass
class Analyse:
    score: float
    mots: list = field(default_factory=list)
    motif: str = ""

    @property
    def bloque(self):
        return self.score >= SEUIL_BLOCAGE

    @property
    def a_revoir(self):
        return SEUIL_REVUE <= self.score < SEUIL_BLOCAGE


def _normaliser(texte):
    texte = unicodedata.normalize("NFKD", texte or "").encode("ascii", "ignore").decode("ascii")
    return texte.lower().replace("’", "'")


def analyser_contenu(*textes):
    """Analyse un ou plusieurs textes (titre, contenu…) et renvoie une `Analyse`."""
    texte = _normaliser(" ".join(t for t in textes if t))
    score, mots, motifs = 0.0, [], []
    for terme, (poids, motif) in TERMES.items():
        # accepte aussi le féminin et le pluriel : connard -> connards, connarde, connardes ; idiot -> idiote…
        if re.search(rf"(?<![a-z0-9]){re.escape(terme)}(?:e|s|es|x)?(?![a-z0-9])", texte):
            score += poids
            mots.append(terme)
            if motif not in motifs:
                motifs.append(motif)
    return Analyse(score=round(min(score, 1.0), 2), mots=mots, motif=" / ".join(motifs))


MESSAGE_BLOCAGE = "Votre message a été bloqué par la modération automatique : reformulez-le de façon respectueuse."
