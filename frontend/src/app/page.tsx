"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
});

export default function DashboardNH3() {
  const [data, setData] = useState<any[]>([]);
  const [meteo, setMeteo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
     const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
     
     fetch(`${API_URL}/concentrations-grid`)
       .then(res => res.json())
       .then(d => {
         setData(d.points || []);
         setMeteo(d.meteo || {});
         setLoading(false);
       })
       .catch(err => console.error("Erreur API:", err));
  }, []);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [realNames, setRealNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    currentData.forEach(p => {
      const coordKey = `${p.lat}-${p.lng}`;
      if (!realNames[coordKey]) {
        setRealNames(prev => ({...prev, [coordKey]: "Recherche..."}));
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${p.lat}&longitude=${p.lng}&localityLanguage=fr`)
          .then(res => res.json())
          .then(dt => {
             const adminList = dt?.localityInfo?.administrative || [];
             const specific = adminList.reverse().find((a:any) => a.adminLevel >= 5);
             const name = specific ? specific.name : (dt.locality || p.neighborhood);
             setRealNames(prev => ({...prev, [coordKey]: name}));
          })
          .catch(() => {
             setRealNames(prev => ({...prev, [coordKey]: p.neighborhood}));
          });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentData]);

  const neighborhoods = Array.from(new Set(data.map(p => p.neighborhood)));
  const chartData = {
    labels: neighborhoods.slice(0, 5),
    datasets: [
      {
        label: 'Moyenne Concentration (µg/m³)',
        data: neighborhoods.slice(0, 5).map(n => {
          const pointsInNeighborhood = data.filter(p => p.neighborhood === n);
          const avg = pointsInNeighborhood.reduce((sum, p) => sum + p.concentration, 0) / (pointsInNeighborhood.length || 1);
          return avg;
        }),
        backgroundColor: '#667eea',
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <header 
         className="pt-6 pb-6 px-4 md:px-8 shadow-md relative z-10"
         style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}
      >
        <h1 className="text-3xl font-bold mb-2">Carte de concentration NH₃ à Gabès</h1>
        <p className="text-sm opacity-90">
          Météo actuelle : Température {meteo.temperature || '--'}°C, Vent {meteo.windSpeed || '--'} m/s ({meteo.windDirection || '--'}°)
        </p>
      </header>

      <main className="flex flex-col p-4 md:p-8 space-y-10 max-w-7xl mx-auto">
        <section className="relative w-full h-[480px] rounded-[16px] shadow-lg overflow-hidden border border-gray-200 z-0">
          {!loading ? <MapComponent points={data} /> : <div className="h-full flex items-center justify-center bg-gray-50">Chargement de la carte...</div>}
        </section>

        <section>
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden auto-cols-auto">
             <div className="p-4 border-b bg-white">
               <h2 className="text-lg font-bold">Tableau des points ({itemsPerPage} par page)</h2>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-white border-b border-gray-200 text-sm text-gray-600">
                     <th className="p-3 font-semibold border-r border-gray-100 last:border-r-0">Latitude</th>
                     <th className="p-3 font-semibold border-r border-gray-100 last:border-r-0">Longitude</th>
                     <th className="p-3 font-semibold border-r border-gray-100 last:border-r-0">Quartier</th>
                     <th className="p-3 font-semibold border-r border-gray-100 last:border-r-0">Concentration (µg/m³)</th>
                     <th className="p-3 font-semibold border-r border-gray-100 last:border-r-0">Niveau de risque</th>
                   </tr>
                 </thead>
                 <tbody>
                   {currentData.map((p, idx) => (
                     <tr key={idx} className={`border-b border-gray-100 text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}`}>
                       <td className="p-3 text-gray-700 border-r border-gray-100 last:border-r-0">{p.lat.toFixed(4)}</td>
                       <td className="p-3 text-gray-700 border-r border-gray-100 last:border-r-0">{p.lng.toFixed(4)}</td>
                       <td className="p-3 text-gray-700 border-r border-gray-100 last:border-r-0">
                         {realNames[`${p.lat}-${p.lng}`] === "Recherche..." ? (
                           <span className="text-gray-400 italic text-xs animate-pulse">Extraction map...</span>
                         ) : (
                           realNames[`${p.lat}-${p.lng}`] || p.neighborhood
                         )}
                       </td>
                       <td className="p-3 font-mono border-r border-gray-100 last:border-r-0">{p.concentration.toFixed(2)}</td>
                       <td className="p-3 font-bold border-r border-gray-100 last:border-r-0" style={{ color: p.color }}>{p.riskLevel}</td>
                     </tr>
                   ))}
                   {currentData.length === 0 && !loading && (
                     <tr><td colSpan={5} className="p-4 text-center text-gray-500">Aucun point disponible.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
             <div className="p-4 bg-white flex items-center justify-center gap-4 text-sm font-medium border-t">
                 <button 
                   disabled={currentPage === 1} 
                   onClick={() => setCurrentPage(p => p - 1)}
                   className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                 >
                   Précédent
                 </button>
                 <span className="text-gray-600">Page {currentPage} / {totalPages}</span>
                 <button 
                   disabled={currentPage === totalPages} 
                   onClick={() => setCurrentPage(p => p + 1)}
                   className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                 >
                   Suivant
                 </button>
             </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border p-6 mx-auto w-full" style={{ maxWidth: 600 }}>
          <h2 className="text-lg font-bold text-center mb-6">Quartiers les plus exposés (top 5)</h2>
          <div className="h-[300px]">
             {!loading && <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />}
          </div>
        </section>
      </main>
    </div>
  );
}
