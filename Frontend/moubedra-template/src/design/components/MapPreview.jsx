import { MapPin } from 'lucide-react';

/** Carte illustrée du lieu (visuel de la maquette, sans service de cartographie). */
export default function MapPreview({ height = 180, label = 'Plan du lieu de rendez-vous', compact }) {
  return (
    <div className="map2" style={{ height }} role="img" aria-label={label}>
      <div className="sea" style={compact ? { height: '30%' } : undefined} />
      <i className="rd" style={{ left: 0, right: 0, top: compact ? '45%' : '40%', height: 6 }} />
      <i className="rd" style={{ left: compact ? '40%' : '30%', top: 0, bottom: compact ? '30%' : '40%', width: 5 }} />
      <span className="pin">
        <MapPin size={compact ? 34 : 40} aria-hidden="true" />
      </span>
    </div>
  );
}
