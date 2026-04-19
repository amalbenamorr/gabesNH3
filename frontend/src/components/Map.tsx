"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  data: any[];
}

export default function Map({ data }: MapProps) {
  const GABES_CENTER: [number, number] = [33.8950, 10.1000];

  const getColor = (level: string) => {
    switch (level) {
      case 'Rouge': return '#ef4444';
      case 'Orange': return '#f97316';
      default: return '#22c55e';
    }
  };

  return (
    <MapContainer center={GABES_CENTER} zoom={13} className="h-full w-full">
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      
      {data.map((point, idx) => (
        <CircleMarker
          key={idx}
          center={[point.lat, point.lng]}
          pathOptions={{ 
            color: getColor(point.riskLevel), 
            fillColor: getColor(point.riskLevel),
            fillOpacity: point.riskLevel === 'Rouge' ? 0.7 : 0.4,
            weight: 0
          }}
          radius={point.riskLevel === 'Rouge' ? 14 : point.riskLevel === 'Orange' ? 10 : 5}
        >
          <Popup>
            <div className="text-slate-800 font-sans p-1">
              <strong className="text-base">{point.neighborhood}</strong>
              <div className="mt-2 text-sm">
                Concentration: <strong>{point.concentration} µg/m³</strong>
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm font-medium">
                Statut: 
                <span style={{color: getColor(point.riskLevel)}}>
                  {point.riskLevel.toUpperCase()}
                </span>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
