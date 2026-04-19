"use client";

import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Point {
  lat: number;
  lng: number;
  concentration: number;
  riskLevel: string;
  color: string;
}

export default function Map({ points }: { points: Point[] }) {
  const center: [number, number] = [33.8800, 10.1000];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer 
        center={center} 
        zoom={12} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {points?.map((point, idx) => (
          <CircleMarker
            key={idx}
            center={[point.lat, point.lng]}
            radius={5}
            pathOptions={{ 
              color: point.color, 
              fillColor: point.color, 
              fillOpacity: 0.8,
              weight: 0 
            }}
          />
        ))}
      </MapContainer>
      
      {/* Légende absolue */}
      <div 
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          background: 'rgba(255,255,255,0.95)',
          padding: '12px 16px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          pointerEvents: 'none'
        }}
      >
        <h4 className="font-bold text-sm mb-3">Légende (Risque)</h4>
        <div className="flex flex-col gap-2 text-sm">
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#e74c3c' }}></div>Élevé</div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f39c12' }}></div>Moyen</div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2ecc71' }}></div>Faible</div>
        </div>
      </div>
    </div>
  );
}
