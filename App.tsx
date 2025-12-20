
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Package, QrCode, Search, Plus, 
  Menu, X, Settings, AlertCircle, RefreshCw, 
  WifiOff, Save, ShieldCheck, Clock
} from 'lucide-react';

import Dashboard from './components/Dashboard.tsx';
import InventoryList from './components/InventoryList.tsx';
import BarcodeScanner from './components/BarcodeScanner.tsx';
import ItemForm from './components/ItemForm.tsx';
import { fetchFromSheet, saveToSheet, isValidSheetUrl } from './services/googleSheetsService.ts';
import { ViewType, InventoryItem } from './types.ts';

const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzJ39jOpXGi23qPY65QReyjChKz3f_yyUNIT7_BJAKKlm2dYtO-yMA8Pq9udLEx_SSgvQ/exec';

const INITIAL_DATA: InventoryItem[] = [
  {
    id: '1', sku: '8001234567890', name: 'Prodotto Demo', category: 'Elettronica', 
    quantity: 12, minStockLevel: 5, price: 29.99, location: 'Corsia A1', 
    description: 'Articolo di esempio precaricato.', lastUpdated: new Date().toISOString()
  }
];

const App = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('google_sheet_url') || DEFAULT_SHEET_URL);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scannedSku, setScannedSku] = useState<string | null>(null);

  // Caricamento dati (PULL dal Cloud)
  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsSyncing(true);
    setSyncError(null);
    
    // Leggi prima da locale per velocità
    const localData = localStorage.getItem('inventory_data');
    if (localData && items.length === 0) {
      setItems(JSON.parse(localData));
    }

    if (sheetUrl && isValidSheetUrl(sheetUrl)) {
      try {
        const cloudData = await fetchFromSheet(sheetUrl);
        if (cloudData) {
          setItems(cloudData);
          localStorage.setItem('inventory_data', JSON.stringify(cloudData));
          setLastSyncTime(new Date());
        }
      } catch (err) {
        setSyncError("Cloud non raggiungibile");
      }
    } else if (!localData && items.length === 0) {
      setItems(INITIAL_DATA);
    }
    if (showLoader) setIsSyncing(false);
  }, [sheetUrl, items.length]);

  // Sincronizzazione automatica ogni 60 secondi
  useEffect(() => {
    loadData(true); // Caricamento iniziale
    
    const interval = setInterval(() => {
      console.log("Auto-syncing with Cloud...");
      loadData(false); // Carica in background senza mostrare lo spinner invasivo
    }, 60000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Salvataggio dati (PUSH al Cloud)
  const syncToCloud = async (newItems: InventoryItem[]) => {
    setItems(newItems);
    localStorage.setItem('inventory_data', JSON.stringify(newItems));
    
    if (sheetUrl && isValidSheetUrl(sheetUrl)) {
      setIsSyncing(true);
      const success = await saveToSheet(sheetUrl, newItems);
      if (!success) setSyncError("Errore salvataggio Cloud");
      else {
        setSyncError(null);
        setLastSyncTime(new Date());
      }
      setIsSyncing(false);
    }
  };

  const handleSaveItem = (itemData: Partial<InventoryItem>) => {
    let updated: InventoryItem[];
    if (editingItem) {
      updated = items.map(i => i.id === editingItem.id ? { ...i, ...itemData, lastUpdated: new Date().toISOString() } as InventoryItem : i);
    } else {
      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        sku: itemData.sku || '',
        name: itemData.name || 'Senza nome',
        category: itemData.category || 'Generale',
        quantity: itemData.quantity || 0,
        minStockLevel: itemData.minStockLevel || 5,
        price: itemData.price || 0,
        location: itemData.location || '',
        description: itemData.description || '',
        lastUpdated: new Date().toISOString(),
      };
      updated = [newItem, ...items];
    }
    syncToCloud(updated);
    setIsFormOpen(false);
    setEditingItem(null);
    setScannedSku(null);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden font-sans">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 transition-all duration-300 ${isSidebarOpen ? 'w-64 shadow-2xl translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Package className="w-6 h-6" />
            </div>
            {isSidebarOpen && <h1 className="font-bold text-lg text-slate-800 tracking-tight">StockMaster</h1>}
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <NavItem icon={<LayoutDashboard />} label="Dashboard" active={currentView === ViewType.DASHBOARD} onClick={() => { setCurrentView(ViewType.DASHBOARD); setIsSidebarOpen(false); }} collapsed={!isSidebarOpen} />
            <NavItem icon={<Package />} label="Magazzino" active={currentView === ViewType.INVENTORY} onClick={() => { setCurrentView(ViewType.INVENTORY); setIsSidebarOpen(false); }} collapsed={!isSidebarOpen} />
            <NavItem icon={<Settings />} label="Impostazioni" active={false} onClick={() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }} collapsed={!isSidebarOpen} />
          </nav>

          {isSidebarOpen && (
            <div className="p-4 m-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ultimo Sync</span>
               </div>
               <p className="text-xs font-mono text-slate-600">{lastSyncTime.toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="flex-none bg-white border-b px-4 lg:px-8 py-4 flex items-center justify-between shadow-sm z-30">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"><Menu className="w-6 h-6 text-slate-600" /></button>
            <div className="hidden sm:flex relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cerca prodotto..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             <div className={`hidden md:flex flex-col items-end px-3 py-1 rounded-xl border transition-all ${syncError ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${syncError ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isSyncing ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : syncError ? <WifiOff className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                  {isSyncing ? 'In Corso...' : syncError ? 'Errore Cloud' : 'Cloud Attivo'}
                </div>
                {!isSyncing && !syncError && <span className="text-[8px] text-emerald-500/70 font-mono">{lastSyncTime.toLocaleTimeString()}</span>}
             </div>

             <button 
                onClick={() => loadData(true)} 
                disabled={isSyncing}
                title="Sincronizza ora con Excel"
                className={`p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all active:scale-95 ${isSyncing ? 'bg-slate-50 opacity-50' : 'bg-white shadow-sm'}`}
             >
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
             </button>

             <button onClick={() => { setEditingItem(null); setScannedSku(null); setIsFormOpen(true); }} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 hover:bg-emerald-700 transition-all">
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline font-bold text-sm">Nuovo</span>
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {currentView === ViewType.DASHBOARD ? (
            <Dashboard items={items} />
          ) : (
            <InventoryList 
              items={filteredItems} 
              onEdit={item => { setEditingItem(item); setIsFormOpen(true); }}
              onDelete={id => { if(confirm("Eliminare l'articolo?")) syncToCloud(items.filter(i => i.id !== id)) }}
              onQuantityChange={(id, delta) => {
                const updated = items.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i);
                syncToCloud(updated);
              }}
            />
          )}
        </div>
      </main>

      {/* Mobile Floating Action Button per Scanner */}
      <button onClick={() => setIsScannerOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center justify-center lg:hidden z-40 active:scale-90 transition-transform">
        <QrCode className="w-6 h-6" />
      </button>

      {isScannerOpen && <BarcodeScanner onScan={code => { setIsScannerOpen(false); const item = items.find(i => i.sku === code); if (item) { setEditingItem(item); setIsFormOpen(true); } else { setScannedSku(code); setEditingItem(null); setIsFormOpen(true); } }} onClose={() => setIsScannerOpen(false)} />}
      {isFormOpen && <ItemForm initialData={editingItem} scannedSku={scannedSku} onSave={handleSaveItem} onClose={() => setIsFormOpen(false)} />}
      
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Impostazioni Cloud</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-xs text-blue-700 leading-relaxed font-medium">L'URL deve puntare al tuo Google Apps Script distribuito come "Chiunque".</p>
              </div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Apps Script Web App URL</label>
              <input 
                type="text" 
                value={sheetUrl} 
                onChange={e => setSheetUrl(e.target.value)} 
                placeholder="https://script.google.com/..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
              <button onClick={() => { localStorage.setItem('google_sheet_url', sheetUrl); setIsSettingsOpen(false); loadData(true); }} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95">Salva e Sincronizza</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 w-full p-3.5 rounded-xl transition-all ${active ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
    <span className={`${active ? 'scale-110' : ''} transition-transform`}>{icon}</span>
    <span className={`font-bold text-sm ${collapsed && window.innerWidth >= 1024 ? 'hidden' : 'block'}`}>{label}</span>
  </button>
);

export default App;
