
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, ScanLine } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "barcode-reader-container";

  useEffect(() => {
    const startScanner = async () => {
      setIsInitializing(true);
      setError(null);
      
      try {
        // Formati estesi per coprire ogni tipo di prodotto commerciale
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF
        ];

        const html5QrCode = new Html5Qrcode(scannerId, { 
          verbose: false,
          formatsToSupport: formatsToSupport 
        });
        html5QrCodeRef.current = html5QrCode;

        const config = { 
          fps: 25, // Frame rate alto per non perdere codici in movimento
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            // Box rettangolare ottimizzato per codici a barre (più largo che alto)
            const width = Math.floor(viewfinderWidth * 0.85);
            const height = Math.floor(viewfinderHeight * 0.4);
            return { width: width, height: height };
          },
          aspectRatio: 1.0,
          // Migliora la messa a fuoco su dispositivi mobili
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          (decodedText) => {
            // Feedback tattile (vibrazione) se disponibile
            if (navigator.vibrate) navigator.vibrate(80);
            onScan(decodedText);
            stopScanner();
          },
          () => {} // Ignora i frame non letti
        );
        setIsInitializing(false);
      } catch (err: any) {
        console.error("Scanner Error:", err);
        setError("Errore: consenti l'accesso alla fotocamera e assicurati che non sia usata da altre app.");
        setIsInitializing(false);
      }
    };

    startScanner();
    return () => { stopScanner(); };
  }, []);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn("Stop error", e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center">
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20 bg-gradient-to-b from-slate-900/80 to-transparent">
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold">Lettore Barcode</h2>
            <p className="text-[10px] text-emerald-200 uppercase font-black">Scansione in tempo reale</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full h-full relative flex items-center justify-center">
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 bg-slate-950 z-10">
            <RefreshCw className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-sm font-medium animate-pulse">Preparazione fotocamera...</p>
          </div>
        )}

        {error ? (
          <div className="p-8 text-center bg-slate-900 rounded-3xl border border-red-500/30 m-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-bold mb-2">Accesso Negato</h3>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold">Riprova</button>
          </div>
        ) : (
          <div id={scannerId} className="w-full h-full max-h-screen bg-black"></div>
        )}
        
        {/* Guida visiva sopra il video */}
        {!isInitializing && !error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className="w-[85%] h-[40%] border-2 border-emerald-500/50 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
                
                {/* Linea di scansione animata */}
                <div className="absolute w-full h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
             </div>
             <div className="absolute bottom-24 text-center">
                <p className="text-white text-xs font-bold bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                   Centra il codice a barre nel rettangolo
                </p>
             </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
        #barcode-reader-container video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
