import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import { Button, EmptyState, Icon, PageHeader, SkeletonList, useToast } from '../../../design/components';
import { formatRelative } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { listNotifications, marquerToutLu } from '../api';
import '../notifications.css';

const isToday = (d) => Date.now() - new Date(d).getTime() < 86400000;

export default function NotificationsPage() {
  const toast = useToast();
  // TODO(API): pas encore d'endpoint — voir features/notifications/api.js (listNotifications)
  const { data, loading, setData } = useApi(listNotifications, [], []);
  const [reading, setReading] = useState(false);
  const unread = data.filter((n) => !n.lu).length;

  const readAll = () => {
    setReading(true);
    // TODO(API): voir features/notifications/api.js (marquerToutLu)
    marquerToutLu();
    data.filter((n) => !n.lu).forEach((n, i) => setTimeout(() => setData((l) => l.map((x) => (x.id === n.id ? { ...x, lu: true } : x))), 300 + i * 90));
    toast('Tout est marqué comme lu');
  };

  const groups = [
    ['Aujourd’hui', data.filter((n) => isToday(n.date))],
    ['Cette semaine', data.filter((n) => !isToday(n.date))],
  ].filter(([, l]) => l.length);

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Communauté', 'Notifications']}
        title="Notifications"
        subtitle={unread ? `Ce qui s’est passé pour vous · ${unread} non lue${unread > 1 ? 's' : ''}` : 'Ce qui s’est passé pour vous.'}
        actions={
          <Button variant="ghost" size="sm" icon={CheckCheck} onClick={readAll} disabled={!unread}>
            Tout marquer comme lu ? </Button>
        }
      />
      <div className="panel" style={{ padding: '10px 12px' }}>
        {loading ? (
          <SkeletonList />
        ) : !data.length ? (
          <EmptyState image="fil" title="Aucune notification" text="Vous serez prévenu·e ici des réponses et des nouvelles de vos campagnes." />
        ) : (
          groups.map(([label, items]) => (
            <section key={label} aria-labelledby={`grp-${label}`}>
              <h2 className="grp" id={`grp-${label}`}>
                {label}
              </h2>
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <Link to={n.lien} className={`nt${n.lu ? '' : ' unread'}${reading && n.lu ? ' read-anim' : ''}`}>
                      <span className="ic2" style={{ background: n.fond, color: n.couleur }} aria-hidden="true">
                        <Icon name={n.icone} size={19} />
                      </span>
                      <div style={{ flex: 1 }}>
                        <b>
                          {n.titre}
                          {!n.lu && <span className="sr-only"> (non lue)</span>}
                        </b>
                        <p>{n.message}</p>
                      </div>
                      <small>{formatRelative(n.date)}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
