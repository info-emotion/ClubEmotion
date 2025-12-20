
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, RefreshCw, AlertCircle, ScanLine, Camera, Zap } from 'lucide-react';

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
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_39
        ];

        const html5QrCode = new Html5Qrcode(scannerId, { 
          verbose: false,
          formatsToSupport: formatsToSupport 
        });
        html5QrCodeRef.current = html5QrCode;

        const config = { 
          fps: 20, 
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            // Area rettangolare: 80% larghezza, 40% altezza del lato più corto.
            // Ideale per codici a barre lineari (EAN) e QR.
            const width = Math.floor(viewfinderWidth * 0.85);
            const height = Math.floor(viewfinderHeight * 0.4);
            return { width: width, height: height };
          },
          // Rimosso l'aspect ratio forzato per permettere al browser di scegliere il miglior stream
          videoConstraints: {
            facingMode: "environment",
            focusMode: "continuous"
          }
        };

        if (isMounted) {
          await html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            (decodedText) => {
              if (navigator.vibrate) navigator.vibrate(80);
              console.log("Lettura riuscita:", decodedText);
              onScan(decodedText);
              stopScanner();
            },
            () => {} 
          );
          setIsInitializing(false);
        }
      } catch (err: any) {
        console.error("Scanner Error:", err);
        if (isMounted) {
          setError("Fotocamera non accessibile. Assicurati che il sito sia in HTTPS e di aver concesso i permessi.");
          setIsInitializing(false);
        }
      }
    };

    // Timeout per attendere il montaggio stabile del DOM
    const timer = setTimeout(() => {
      if (isMounted) startScanner();
    }, 300);
    
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
        console.warn("Chiusura scanner forzata.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-30 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <ScanLine className="w-6 h-6" />
          </div>
          <div className="text-white">
            <h2 className="text-sm font-bold tracking-tight">Scanner Intelligente</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Sensore Ottico</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all border border-white/10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full h-full relative flex items-center justify-center">
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 bg-slate-950 z-20">
            <RefreshCw className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Inizializzazione...</p>
          </div>
        )}

        {error ? (
          <div className="p-8 text-center bg-slate-900 rounded-[2.5rem] border border-red-500/20 m-6 max-w-sm z-40">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Errore Sensore</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">{error}</p>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold text-xs uppercase transition-all shadow-xl active:scale-95">Ricarica</button>
          </div>
        ) : (
          <div id={scannerId} className="w-full h-full bg-black"></div>
        )}
        
        {/* Visual Guide Overlay */}
        {!isInitializing && !error && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
             <div className="w-[85vw] h-[35vw] max-w-[450px] max-h-[220px] relative">
                {/* Borders */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl"></div>
                
                {/* Laser line */}
                <div className="absolute w-[94%] left-[3%] h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-[laser-move_2.5s_infinite]"></div>
             </div>
             
             <div className="mt-12 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <p className="text-white text-[10px] font-bold uppercase tracking-widest">Inquadra il codice a barre o QR</p>
             </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes laser-move {
          0% { top: 15%; opacity: 0.2; }
          50% { opacity: 1; }
          100% { top: 85%; opacity: 0.2; }
        }
        #barcode-full-screen-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        #barcode-full-screen-reader__dashboard { display: none !important; }
        #barcode-full-screen-reader__scan_region { border: none !important; }
        #barcode-full-screen-reader__scan_region img { display: none !important; }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
