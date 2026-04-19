"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ChartSummary({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="text-slate-400 p-4">Chargement de l'analyse...</div>;
  }

  const stats = data.reduce((acc: any, point: any) => {
    if (!acc[point.neighborhood]) {
      acc[point.neighborhood] = { max: 0, count: 0, total: 0 };
    }
    acc[point.neighborhood].total += point.concentration;
    acc[point.neighborhood].count += 1;
    if (point.concentration > acc[point.neighborhood].max) {
      acc[point.neighborhood].max = point.concentration;
    }
    return acc;
  }, {});

  const sortedNeighborhoods = Object.keys(stats)
    .map(key => ({
      name: key,
      avg: Math.round(stats[key].total / stats[key].count),
      max: Math.round(stats[key].max)
    }))
    .sort((a, b) => b.max - a.max)
    .slice(0, 5); 

  const chartData = {
    labels: sortedNeighborhoods.map(n => n.name),
    datasets: [
      {
        label: 'Max Enregistré (µg/m³)',
        data: sortedNeighborhoods.map(n => n.max),
        backgroundColor: 'rgba(239, 68, 68, 0.9)', 
        borderRadius: 4,
      },
      {
        label: 'Moyenne Zone (µg/m³)',
        data: sortedNeighborhoods.map(n => n.avg),
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
        borderRadius: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#94a3b8' } },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      y: { 
        ticks: { color: '#64748b' }, 
        grid: { color: 'rgba(255,255,255,0.05)' } 
      },
      x: { 
        ticks: { color: '#94a3b8' }, 
        grid: { display: false } 
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold mb-6 border-b border-slate-700 pb-2">Analyses & Données</h2>
      
      <div className="flex-1 min-h-0 relative">
        <Bar data={chartData} options={options} />
      </div>
      
      <div className="mt-8 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <h3 className="font-semibold text-slate-300 mb-3 text-sm tracking-wide uppercase">Normes NIOSH / OSHA (NH³)</h3>
        <ul className="text-sm space-y-3">
          <li className="flex items-center text-emerald-400">
            <span className="w-3 h-3 bg-emerald-500 rounded-full mr-3 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            {'< 50 µg/m³ (Zone Sûre)'}
          </li>
          <li className="flex items-center text-orange-400">
            <span className="w-3 h-3 bg-orange-500 rounded-full mr-3 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
            {'50 - 200 µg/m³ (Avertissement)'}
          </li>
          <li className="flex items-center text-red-500 font-medium">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-3 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            {'> 200 µg/m³ (Danger Exposant)'}
          </li>
        </ul>
      </div>
    </div>
  );
}
