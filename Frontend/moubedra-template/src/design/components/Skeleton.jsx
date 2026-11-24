/** Bloc de chargement animé (shimmer). */
export default function Skeleton({ width = '100%', height = 14, radius = 8, style, className = '' }) {
  return <div className={`sk ${className}`} style={{ width, height, borderRadius: radius, ...style }} aria-hidden="true" />;
}

/** Squelette d'une carte de publication (fil). */
export function SkeletonPost() {
  return (
    <div className="panel" style={{ marginTop: 16 }} aria-hidden="true">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Skeleton width={46} height={46} radius="50%" />
        <div style={{ flex: 1 }}>
          <Skeleton width="30%" />
          <Skeleton width="20%" height={12} style={{ marginTop: 8 }} />
        </div>
      </div>
      <Skeleton height={16} style={{ marginTop: 18 }} />
      <Skeleton width="70%" height={16} style={{ marginTop: 10 }} />
      <Skeleton height={160} radius={14} style={{ marginTop: 14 }} />
    </div>
  );
}

/** Liste de lignes en chargement. */
export function SkeletonList({ rows = 3 }) {
  return (
    <div role="status" aria-label="Chargement…">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0' }}>
          <Skeleton width={56} height={56} radius={14} />
          <div style={{ flex: 1 }}>
            <Skeleton width="45%" />
            <Skeleton width="30%" height={12} style={{ marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
