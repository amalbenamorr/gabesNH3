"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ChartSummary from '@/components/ChartSummary';
import { Activity } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-slate-500">Chargement de la carte...</div>
});

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     // Utilise la variable d'environnement définie sur Railway ou localhost par défaut
     const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
     
     fetch(`${API_URL}/api/concentration`)
       .then(res => res.json())
       .then(d => {
         setData(d.data);
         setLoading(false);
       })
       .catch(err => console.error("Erreur API:", err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-4 md:p-8 font-sans">
      <header className="mb-6 flex items-center gap-3 border-b border-slate-700 pb-4">
        <Activity className="text-emerald-400 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gabès NH³ Dashboard</h1>
          <p className="text-slate-400 text-sm">Simulation de dispersion d'ammoniac en temps réel</p>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700 h-[650px] relative z-0">
          {!loading ? <MapComponent data={data} /> : null}
        </section>

        <section className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-6 h-[650px] flex flex-col">
          <ChartSummary data={data} />
        </section>
      </main>
    </div>
  );
}
