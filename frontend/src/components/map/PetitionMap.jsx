import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PriorityBadge from '@/components/ai/PriorityBadge';
import { Link } from 'react-router-dom';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const priorityColors = {
  critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#16a34a',
};

function priorityIcon(priority) {
  const color = priorityColors[priority] ?? '#1d4ed8';
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function PetitionMap({ petitions = [], center = [20.5937, 78.9629], zoom = 5, role = 'citizen', height = 380 }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '0.75rem' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {petitions.map((p) => {
        const lat = p.latitude || p.lat;
        const lng = p.longitude || p.lng;
        if (!lat || !lng) return null;
        const priority = p.priority || p.ai_analysis?.priority;
        return (
          <Marker key={p.id} position={[lat, lng]} icon={priorityIcon(priority)}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-semibold text-sm text-foreground mb-1">{p.title}</p>
                <div className="flex gap-1 mb-1">
                  {priority && <PriorityBadge priority={priority} />}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1 border-b border-border pb-1">
                  {p.petition_number}
                </p>
                <p className="text-xs text-muted-foreground mb-1">{p.location}</p>
                <Link to={`/${role}/petitions/${p.id}`} className="text-xs text-primary-600 underline">
                  View petition
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
