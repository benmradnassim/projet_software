import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="pg">
      <div className="crumb">Erreur 404</div>
      <h1 style={{ fontSize: 36, fontWeight: 800 }}>Page introuvable</h1>
      <p style={{ color: 'var(--muted)', margin: '8px 0 20px' }}>Cette page n’existe pas ou a été déplacée.</p>
      <Link className="btn primary" to="/">Retour à l’accueil</Link>
    </div>
  );
}
