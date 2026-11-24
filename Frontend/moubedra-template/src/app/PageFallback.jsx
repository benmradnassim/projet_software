/** Affiché pendant le chargement d'une page (lazy). */
export default function PageFallback() {
  return <div className="page-fallback" role="status" aria-label="Chargement…" />;
}
