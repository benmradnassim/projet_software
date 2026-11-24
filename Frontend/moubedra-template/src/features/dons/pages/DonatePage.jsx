import { useParams, useSearchParams } from 'react-router-dom';
import { Button, EmptyState, Skeleton } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { getBesoins, getCampagne } from '../../campagnes';
import MaterialDonation from '../components/MaterialDonation';
import MoneyDonation from '../components/MoneyDonation';

/**
 * /campagnes/:id/don                         don en argent (?montant=50 pré-sélectionne le montant)
 * /campagnes/:id/don?type=materiel&q=1.1.0   don matériel (q = quantités par article)
 */
export default function DonatePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const materiel = params.get('type') === 'materiel';
  // TODO(API): GET /api/campagnes/<id>/ — voir features/campagnes/api.js (getCampagne, getBesoins)
  const { data: c, loading } = useApi(() => getCampagne(id), [id]);
  const { data: besoins, loading: lb } = useApi(() => getBesoins(id), [id]);

  if (loading || (materiel && lb)) {
    return (
      <div className="pg dg" aria-busy="true">
        <Skeleton height={420} radius={20} />
        <Skeleton height={360} radius={20} />
      </div>
    );
  }
  if (!c) return <EmptyState title="Campagne introuvable" actions={<Button to="/campagnes" size="sm">Voir les campagnes</Button>} />;
  if (materiel && besoins) {
    const q = (params.get('q') || '').split('.').map((n) => Number(n) || 0);
    return <MaterialDonation campagne={c} besoins={besoins} initial={q} />;
  }
  const montant = Number(params.get('montant')) || 50;
  return <MoneyDonation campagne={c} initialAmount={montant} />;
}
