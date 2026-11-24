import { Link } from 'react-router-dom';
import Icon from './Icon';

/**
 * Cartes colorées « à faire » des tableaux de bord organisateur et admin.
 *   <TodoCards items={[{ icone: 'users', fond, bord, texte, valeur: '4', libelle: 'demandes à valider', to: '/…' }]} />
 */
export default function TodoCards({ items = [] }) {
  return (
    <nav className="todo2" aria-label="À faire">
      {items.map((t) => (
        <Link key={t.libelle} to={t.to} style={{ background: t.fond, borderColor: t.bord, color: t.texte }}>
          <Icon name={t.icone} size={26} />
          <span>
            <b>{t.valeur}</b>
            <small>{t.libelle}</small>
          </span>
        </Link>
      ))}
    </nav>
  );
}
