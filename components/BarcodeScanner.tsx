
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, RefreshCw, AlertCircle, ScanLine, Zap } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "barcode-full-screen-reader";

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      setIsInitializing(true);
      setError(null);
      
      try {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ];

        const html5QrCode = new Html5Qrcode(scannerId, { 
          verbose: false,
          formatsToSupport: formatsToSupport 
        });
        html5QrCodeRef.current = html5QrCode;

        const config = { 
          fps: 30, // Massimo frame rate per non perdere letture
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            // Rettangolo molto largo per facilitare la cattura dei codici a barre standard
            const width = Math.floor(viewfinderWidth * 0.9);
            const height = Math.floor(viewfinderHeight * 0.45);
            return { width: width, height: height };
          },
          aspectRatio: 1.0,
          // Utilizza l'accelerazione hardware se disponibile (molto più veloce)
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        if (isMounted) {
          await html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            (decodedText) => {
              if (navigator.vibrate) navigator.vibrate(100);
              onScan(decodedText);
              stopScanner();
            },
            () => {} // Ignora frame vuoti
          );
          setIsInitializing(false);
        }
      } catch (err: any) {
        console.error("Scanner Error:", err);
        if (isMounted) {
          setError("Permesso fotocamera negato o camera già in uso da un'altra app.");
          setIsInitializing(false);
        }
      }
    };

    // Piccolo ritardo per assicurarsi che il DOM sia pronto
    const timer = setTimeout(startScanner, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn("Errore stop scanner:", e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Header Overlay */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="font-bold tracking-tight">Scanner Rapido</h2>
            <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest">Laser Mode Attivo</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full h-full relative flex items-center justify-center">
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 bg-slate-950 z-10">
            <div className="relative">
              <RefreshCw className="w-12 h-12 animate-spin text-emerald-500" />
              <div className="absolute inset-0 blur-xl bg-emerald-500/20 animate-pulse"></div>
            </div>
            <p className="text-sm font-bold tracking-widest uppercase opacity-70">Calibrazione Ottica...</p>
          </div>
        )}

        {error ? (
          <div className="p-10 text-center bg-slate-900 rounded-[2.5rem] border border-red-500/20 m-6 max-w-sm shadow-2xl">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-black text-xl mb-2">Ops!</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{error}</p>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all">Ricarica</button>
          </div>
        ) : (
          <div id={scannerId} className="w-full h-full max-h-screen bg-black overflow-hidden"></div>
        )}
        
        {/* Mirino Hi-Tech */}
        {!isInitializing && !error && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
             <div className="w-[85%] h-[35%] border border-white/20 rounded-3xl relative overflow-hidden backdrop-brightness-125">
                {/* Angoli Rinforzati */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-500 rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-500 rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-500 rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-500 rounded-br-3xl"></div>
                
                {/* Linea Laser Animata */}
                <div className="absolute w-full h-[2px] bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)] animate-[laser_1.5s_infinite]"></div>
             </div>
             
             <div className="mt-12 text-center animate-bounce">
                <p className="text-white text-[11px] font-black uppercase tracking-[0.2em] bg-emerald-600/80 px-6 py-2.5 rounded-full backdrop-blur-md shadow-lg border border-emerald-400/50">
                   Inquadra il Codice
                </p>
             </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes laser {
          0% { top: 10%; opacity: 0.2; }
          50% { top: 90%; opacity: 1; }
          100% { top: 10%; opacity: 0.2; }
        }
        #barcode-full-screen-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          transform: scale(1.05); /* Leggero zoom per aiutare la messa a fuoco */
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
