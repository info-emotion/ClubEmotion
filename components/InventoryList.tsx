
import React from 'react';
import { InventoryItem } from '../types';
import { Edit2, Trash2, AlertTriangle, Package, MapPin, Tag, Plus, Minus } from 'lucide-react';

interface InventoryListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onQuantityChange: (id: string, delta: number) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, onEdit, onDelete, onQuantityChange }) => {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Nessun articolo trovato</h3>
          <p className="text-slate-500 max-w-xs mx-auto">I dati sono sincronizzati con il cloud ma la ricerca non ha prodotto risultati.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prodotto</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Stock Rapido</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Prezzo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{item.name}</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        <MapPin className="w-3 h-3" /> {item.location} | <Tag className="w-3 h-3" /> {item.category}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{item.sku}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => onQuantityChange(item.id, -1)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className={`w-12 text-center py-1 rounded-lg text-sm font-bold ${
                        item.quantity <= item.minStockLevel 
                          ? 'bg-red-50 text-red-600 border border-red-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {item.quantity}
                      </div>
                      <button 
                        onClick={() => onQuantityChange(item.id, 1)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-90"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    €{item.price.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {items.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-900 leading-tight">{item.name}</h3>
                <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-indigo-600">€{item.price.toFixed(2)}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category}</div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Giacenza</span>
                <div className={`text-lg font-black ${item.quantity <= item.minStockLevel ? 'text-red-600' : 'text-emerald-600'}`}>
                  {item.quantity} <span className="text-xs font-normal">pz</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onQuantityChange(item.id, -1)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-red-500 shadow-sm active:scale-90"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => onQuantityChange(item.id, 1)}
                  className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-xl text-white shadow-md active:scale-90"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                <MapPin className="w-3 h-3" /> {item.location}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onEdit(item)} className="p-2 text-slate-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {item.quantity <= item.minStockLevel && (
              <div className="mt-3 bg-red-50 p-2 rounded-lg flex items-center gap-2 text-[10px] font-bold text-red-600 uppercase">
                <AlertTriangle className="w-3 h-3" /> Sottoscorta
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryList;
