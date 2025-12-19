
import React, { useEffect, useState } from 'react';
import { InventoryItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Package, AlertCircle, Euro, TrendingUp, Sparkles } from 'lucide-react';
import { getInventoryAdvice } from '../services/geminiService';

interface DashboardProps {
  items: InventoryItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ items }) => {
  const [aiAdvice, setAiAdvice] = useState<string>("Analisi in corso...");

  useEffect(() => {
    if (items.length > 0) {
      getInventoryAdvice(items).then(setAiAdvice);
    } else {
      setAiAdvice("Aggiungi prodotti per ricevere consigli intelligenti.");
    }
  }, [items]);

  const totalValue = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const lowStockCount = items.filter(i => i.quantity <= i.minStockLevel).length;
  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);

  // Prepare chart data: Top 5 items by value
  const chartData = [...items]
    .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
    .slice(0, 5)
    .map(i => ({
      name: i.name.substring(0, 10) + (i.name.length > 10 ? '...' : ''),
      value: i.price * i.quantity
    }));

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Package className="w-6 h-6" />}
          label="Articoli Totali"
          value={totalItems.toString()}
          color="bg-blue-500"
        />
        <StatCard 
          icon={<AlertCircle className="w-6 h-6" />}
          label="In Sottoscorta"
          value={lowStockCount.toString()}
          color="bg-red-500"
        />
        <StatCard 
          icon={<Euro className="w-6 h-6" />}
          label="Valore Totale"
          value={`€${totalValue.toLocaleString('it-IT')}`}
          color="bg-emerald-500"
        />
        <StatCard 
          icon={<TrendingUp className="w-6 h-6" />}
          label="Prodotti Unici"
          value={items.length.toString()}
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Valore Top 5 Prodotti</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => `€${value.toFixed(2)}`}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-200" />
              <h3 className="text-lg font-semibold">Consigli AI</h3>
            </div>
            <div className="prose prose-invert prose-sm">
              <p className="text-indigo-100 leading-relaxed italic">
                "{aiAdvice}"
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-indigo-500/50 flex justify-between items-center text-xs text-indigo-200">
              <span>Potenziato da Gemini 3</span>
              <span className="px-2 py-1 bg-indigo-500/50 rounded-full">Real-time</span>
            </div>
          </div>
          {/* Decorative shapes */}
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-40px] left-[-20px] w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className={`${color} p-3 rounded-lg text-white`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;
