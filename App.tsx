
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LayoutDashboard, Package, QrCode, Search, Plus, Bell, Menu, X, LogOut, CloudSync, RefreshCw, Database, Settings, Link as LinkIcon, AlertCircle, CheckCircle2, RotateCw, WifiOff, Save, ShieldCheck } from 'lucide-react';
import { InventoryItem, ViewType } from './types';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import BarcodeScanner from './components/BarcodeScanner';
import ItemForm from './components/ItemForm';
import { fetchFromSheet, saveToSheet, isValidSheetUrl } from './services/googleSheetsService';

const INITIAL_DATA: InventoryItem[] = [
  {
    id: '1', sku: '8001234567890', name: 'Esempio Prodotto', category: 'Generale', quantity: 15, minStockLevel: 5, price: 12.50, location: 'A-1', description: 'Benvenuto in StockMaster. Connetti il Cloud per iniziare.', lastUpdated: new Date().toISOString()
  }
];

const App: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('google_sheet_url') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scannedSku, setScannedSku] = useState<string | null>(null);

  // Caricamento iniziale e ricarica Cloud
  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsSyncing(true);
    setSyncError(null);
    
    // 1. Carica subito i dati locali per velocità
    const localData = localStorage.getItem('inventory_data');
    if (localData) {
      try {
        setItems(JSON.parse(localData));
      } catch (e) {
        console.error("Local parse error", e);
      }
    } else if (items.length === 0) {
      setItems(INITIAL_DATA);
    }

    // 2. Tenta la sincronizzazione se l'URL è configurato
    const savedUrl = localStorage.getItem('google_sheet_url');
    if (savedUrl && isValidSheetUrl(savedUrl)) {
      try {
        const cloudData = await fetchFromSheet(savedUrl);
        if (cloudData) {
          setItems(cloudData);
          localStorage.setItem('inventory_data', JSON.stringify(cloudData));
          setSyncError(null);
        } else {
          setSyncError("Impossibile connettersi al Cloud. Verificare URL.");
        }
      } catch (err) {
        setSyncError("Errore di rete. Modalità offline attiva.");
      }
    }
    
    if (showLoader) setIsSyncing(false);
  }, [items.length]);

  useEffect(() => {
    loadData();
    // Refresh automatico ogni 5 minuti se in background
    const interval = setInterval(() => loadData(false), 300000);
    return () => clearInterval(interval);
  }, [loadData]);

  const syncToCloud = async (newItems: InventoryItem[]) => {
    setItems(newItems);
    localStorage.setItem('inventory_data', JSON.stringify(newItems));
    
    const savedUrl = localStorage.getItem('google_sheet_url');
    if (savedUrl && isValidSheetUrl(savedUrl)) {
      setIsSyncing(true);
      const success = await saveToSheet(savedUrl, newItems);
      if (!success) setSyncError("Modifica salvata solo localmente. Errore Cloud.");
      else setSyncError(null);
      setIsSyncing(false);
    }
  };

  const handleSaveSettings = () => {
    if (sheetUrl && !isValidSheetUrl(sheetUrl)) {
      alert("L'URL deve essere quello fornito da Apps Script e terminare con /exec");
      return;
    }
    localStorage.setItem('google_sheet_url', sheetUrl);
    setIsSettingsOpen(false);
    loadData(true);
  };

  const handleQuantityChange = (id: string, delta: number) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty, lastUpdated: new Date().toISOString() };
      }
      return item;
    });
    syncToCloud(updated);
  };

  const handleSaveItem = (itemData: Partial<InventoryItem>) => {
    let updated: InventoryItem[];
    if (editingItem) {
      updated = items.map(i => i.id === editingItem.id ? { ...i, ...itemData, lastUpdated: new Date().toISOString() } as InventoryItem : i);
    } else {
      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        sku: itemData.sku || '',
        name: itemData.name || 'Prodotto',
        category: itemData.category || 'Varie',
        quantity: itemData.quantity || 0,
        minStockLevel: itemData.minStockLevel || 0,
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
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Eliminare definitivamente questo articolo?')) {
      syncToCloud(items.filter(i => i.id !== id));
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 transition-all duration-300 ${isSidebarOpen ? 'w-64 shadow-2xl' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
              <Package className="w-6 h-6" />
            </div>
            {isSidebarOpen && <h1 className="font-bold text-lg text-slate-800 tracking-tight">StockMaster</h1>}
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active={currentView === ViewType.DASHBOARD} onClick={() => { setCurrentView(ViewType.DASHBOARD); setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && window.innerWidth >= 1024} />
            <SidebarItem icon={<Package />} label="Magazzino" active={currentView === ViewType.INVENTORY} onClick={() => { setCurrentView(ViewType.INVENTORY); setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && window.innerWidth >= 1024} />
            <SidebarItem icon={<Settings />} label="Impostazioni" active={false} onClick={() => { setIsSettingsOpen(true); setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && window.innerWidth >= 1024} />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="flex-none bg-white border-b px-4 lg:px-8 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"><Menu className="w-6 h-6 text-slate-600" /></button>
            <div className="hidden sm:flex relative w-full max-w-md group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input type="text" placeholder="Cerca SKU o nome..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${syncError ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
              {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : syncError ? <WifiOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
              <span>{syncError ? 'Errore Cloud' : isSyncing ? 'Sincronizzo' : 'Cloud Attivo'}</span>
            </div>
            
            <button onClick={() => { setEditingItem(null); setScannedSku(null); setIsFormOpen(true); }} className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 active:scale-95 transition-all flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline font-bold text-sm">Aggiungi</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {syncError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4 text-red-700 text-sm shadow-sm animate-in slide-in-from-top-2">
              <div className="p-2 bg-red-100 rounded-lg"><AlertCircle className="w-5 h-5" /></div>
              <p className="font-medium">{syncError}</p>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {currentView === ViewType.DASHBOARD ? 'Stato del Magazzino' : 'Gestione Inventario'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {sheetUrl ? 'I dati sono sincronizzati con il foglio Google' : '⚠️ Modalità locale attiva (dati salvati solo su questo dispositivo)'}
            </p>
          </div>

          {currentView === ViewType.DASHBOARD ? <Dashboard items={items} /> : (
            <InventoryList items={filteredItems} onEdit={setEditingItem} onDelete={handleDeleteItem} onQuantityChange={handleQuantityChange} />
          )}
        </div>
      </main>

      {/* Modal Impostazioni - Ora persistente */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-2xl"><Settings className="w-6 h-6 text-slate-600" /></div>
                <h3 className="text-2xl font-bold text-slate-800">Impostazioni</h3>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-[1.5rem] flex items-start gap-4">
                <CloudSync className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">Sincronizzazione Cloud</h4>
                  <p className="text-xs text-emerald-700 leading-relaxed mt-1">
                    Connetti un foglio Google tramite Apps Script per rendere i dati accessibili a tutto il team.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">URL Applicazione Web Apps Script</label>
                <input 
                  type="text" 
                  placeholder="https://script.google.com/macros/s/.../exec" 
                  value={sheetUrl}
                  onChange={e => setSheetUrl(e.target.value)}
                  className={`w-full p-4 bg-slate-50 border rounded-2xl font-mono text-[10px] outline-none transition-all ${sheetUrl && !isValidSheetUrl(sheetUrl) ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 focus:bg-white'}`}
                />
                {sheetUrl && !isValidSheetUrl(sheetUrl) && <p className="text-red-500 text-[10px] font-bold px-1">L'URL deve terminare con /exec per funzionare</p>}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Informazioni App</h4>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Versione</span>
                  <span className="font-mono">2.1.0-stable</span>
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={() => { 
                  if(confirm('Disconnettere il Cloud? I dati rimarranno salvati solo localmente.')) {
                    localStorage.removeItem('google_sheet_url'); 
                    setSheetUrl(''); 
                    setIsSettingsOpen(false); 
                    loadData(true); 
                  }
                }}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Disconnetti
              </button>
              <button 
                onClick={handleSaveSettings} 
                className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salva e Sincronizza
              </button>
            </div>
          </div>
        </div>
      )}

      {(isFormOpen || editingItem) && <ItemForm initialData={editingItem} scannedSku={scannedSku} onSave={handleSaveItem} onClose={() => { setIsFormOpen(false); setEditingItem(null); }} />}
      
      {/* Tasto Mobile Barcode flottante */}
      <div className="fixed bottom-8 right-8 lg:hidden flex flex-col gap-4 z-40">
        <button onClick={() => setIsScannerOpen(true)} className="w-16 h-16 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all border-4 border-white">
          <QrCode className="w-8 h-8" />
        </button>
      </div>

      {isScannerOpen && <BarcodeScanner onScan={(code) => {
        setIsScannerOpen(false);
        const exists = items.find(i => i.sku === code);
        if (exists) {
          setEditingItem(exists);
        } else {
          setScannedSku(code);
          setIsFormOpen(true);
        }
      }} onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
};

// Fixed TypeScript error by adding <any> generic to ReactElement cast
const SidebarItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 w-full p-3 rounded-2xl transition-all ${active ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
    <div className={`${active ? 'text-emerald-600' : 'text-slate-400'}`}>{React.cloneElement(icon as React.ReactElement<any>, { size: 22 })}</div>
    {!collapsed && <span className="font-bold text-sm whitespace-nowrap">{label}</span>}
  </button>
);

export default App;
