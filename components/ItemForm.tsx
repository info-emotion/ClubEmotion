
import React, { useState, useEffect } from 'react';
import { InventoryItem, AIAnalysisResult } from '../types';
import { X, Sparkles, Loader2, Save, Info } from 'lucide-react';
import { analyzeItemData } from '../services/geminiService';

interface ItemFormProps {
  initialData?: InventoryItem | null;
  onSave: (item: Partial<InventoryItem>) => void;
  onClose: () => void;
  scannedSku?: string | null;
}

const ItemForm: React.FC<ItemFormProps> = ({ initialData, onSave, onClose, scannedSku }) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    sku: scannedSku || '',
    category: '',
    quantity: 0,
    minStockLevel: 5,
    price: 0,
    location: '',
    description: '',
    ...initialData
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAiFill = async () => {
    if (!formData.name) return;
    setIsAnalyzing(true);
    const result = await analyzeItemData(formData.name!, formData.sku || 'N/A');
    if (result) {
      setFormData(prev => ({
        ...prev,
        category: result.suggestedCategory,
        description: result.suggestedDescription + (result.riskAssessment ? " | Nota Rischio: " + result.riskAssessment : "")
      }));
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-hidden">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-4 sm:p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10 sm:rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {initialData ? 'Modifica Articolo' : 'Nuovo Articolo'}
            </h2>
            <p className="text-xs text-slate-500">Compila i campi per aggiornare l'inventario.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-hide">
          {/* AI Suggestion Banner */}
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-900">Suggerimento Intelligente</p>
              <p className="text-xs text-indigo-700 mb-2">Inserisci il nome e clicca su "AI" per compilare automaticamente categoria e descrizione.</p>
              <button
                type="button"
                onClick={handleAiFill}
                disabled={!formData.name || isAnalyzing}
                className="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Analizza con Gemini
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome Prodotto</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder="es. MacBook Pro 14"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SKU / Barcode</label>
              <input
                required
                type="text"
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-mono"
                placeholder="es. 80123456789"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
              <input
                required
                type="text"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder="es. Elettronica"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicazione</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder="es. A-12"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantità</label>
              <input
                required
                type="number"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Soglia Minima</label>
              <input
                required
                type="number"
                value={formData.minStockLevel}
                onChange={e => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prezzo (€)</label>
              <input
                required
                type="number"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrizione</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none resize-none transition-all"
              placeholder="Aggiungi dettagli..."
            />
          </div>
        </form>

        <div className="p-4 sm:p-6 border-t bg-slate-50 sm:rounded-b-3xl flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white transition-all order-2 sm:order-1"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            type="submit"
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 order-1 sm:order-2"
          >
            <Save className="w-5 h-5" />
            Salva Articolo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemForm;
