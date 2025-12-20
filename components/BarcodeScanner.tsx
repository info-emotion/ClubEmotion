
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
        // Formati supportati con priorità ai codici a barre lineari (EAN/UPC)
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
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
          fps: 30, // FPS alti per catturare codici in movimento o mani non ferme
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            // Un rettangolo largo e stretto è perfetto per i barcode lineari
            const width = Math.min(viewfinderWidth * 0.8, 400);
            const height = Math.min(viewfinderHeight * 0.3, 160);
            return { width, height };
          },
          aspectRatio: undefined, // Permettiamo al sensore di usare la sua risoluzione naturale
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Fondamentale: usa l'hardware del telefono se disponibile
          },
          videoConstraints: {
            facingMode: "environment",
            width: { min: 640, ideal: 1280, max: 1920 }, // Cerchiamo di ottenere HD per dettagli nitidi
            height: { min: 480, ideal: 720, max: 1080 },
            focusMode: "continuous"
          }
        };

        if (isMounted) {
          await html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            (decodedText) => {
              if (navigator.vibrate) navigator.vibrate(100);
              console.log("Barcode rilevato:", decodedText);
              onScan(decodedText);
              stopScanner();
            },
            () => {} // Frame vuoto ignorato
          );
          setIsInitializing(false);
        }
      } catch (err: any) {
        console.error("Errore Fotocamera:", err);
        if (isMounted) {
          setError("Impossibile avviare la fotocamera. Assicurati di aver concesso i permessi e di navigare in HTTPS.");
          setIsInitializing(false);
        }
      }
    };

    const timer = setTimeout(() => {
      if (isMounted) startScanner();
    }, 500);
    
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
        console.warn("Spegnimento scanner...");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-30 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-2xl">
            <ScanLine className="w-7 h-7" />
          </div>
          <div className="text-white">
            <h2 className="text-base font-bold tracking-tight">Scanner Barcode</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-emerald-400">Sensore Ottico HD</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-xl transition-all border border-white/10 active:scale-90"
        >
          <X className="w-7 h-7" />
        </button>
      </div>

      <div className="w-full h-full relative flex items-center justify-center">
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4 bg-slate-950 z-20">
            <RefreshCw className="w-12 h-12 animate-spin text-emerald-500" />
            <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-40">Messa a fuoco...</p>
          </div>
        )}

        {error ? (
          <div className="p-10 text-center bg-slate-900 rounded-[3rem] border border-red-500/30 m-6 max-w-sm z-40 shadow-2xl">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h3 className="text-white font-black text-xl mb-3">Errore Hardware</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{error}</p>
            <button onClick={() => window.location.reload()} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Riprova</button>
          </div>
        ) : (
          <div id={scannerId} className="w-full h-full bg-black"></div>
        )}
        
        {/* Mirino Ottimizzato per Barcode */}
        {!isInitializing && !error && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 px-6">
             <div className="w-full max-w-[400px] aspect-[2.5/1] relative">
                {/* Angoli Hi-Tech */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-3xl"></div>
                
                {/* Linea Laser Rossa (Tipica degli scanner professionali) */}
                <div className="absolute w-[92%] left-[4%] h-[2px] bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)] animate-[laser-pulse_2.5s_infinite]"></div>
             </div>
             
             <div className="mt-16 bg-black/70 backdrop-blur-xl px-8 py-4 rounded-full border border-white/10 shadow-3xl flex items-center gap-3">
                <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                <p className="text-white text-[11px] font-bold uppercase tracking-[0.2em]">Allinea il codice alla linea rossa</p>
             </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes laser-pulse {
          0% { top: 20%; opacity: 0.3; }
          50% { opacity: 1; }
          100% { top: 80%; opacity: 0.3; }
        }
        #barcode-full-screen-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        #barcode-full-screen-reader__dashboard { display: none !important; }
        #barcode-full-screen-reader__scan_region { border: none !important; }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
