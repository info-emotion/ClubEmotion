
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, RefreshCw, AlertCircle, ScanLine, Zap, Camera, Info } from 'lucide-react';

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
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF
        ];

        const html5QrCode = new Html5Qrcode(scannerId, { 
          verbose: false,
          formatsToSupport: formatsToSupport 
        });
        html5QrCodeRef.current = html5QrCode;

        // Configurazioni per una lettura aggressiva e precisa
        const config = { 
          fps: 25, 
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            // Box quadrato più grande per catturare meglio i dettagli
            const minDimension = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minDimension * 0.7);
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Usa API nativa del browser se disponibile (velocissima)
          },
          videoConstraints: {
            facingMode: "environment",
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          }
        };

        if (isMounted) {
          await html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            (decodedText) => {
              if (navigator.vibrate) navigator.vibrate(100);
              console.log("Codice rilevato:", decodedText);
              onScan(decodedText);
              stopScanner();
            },
            () => {} // Ignora i frame dove non viene trovato nulla
          );
          setIsInitializing(false);
        }
      } catch (err: any) {
        console.error("Errore inizializzazione scanner:", err);
        if (isMounted) {
          setError("Fotocamera non accessibile. Verifica i permessi nel browser o assicurati che il sito sia in HTTPS.");
          setIsInitializing(false);
        }
      }
    };

    // Ritardo per assicurarsi che il DOM sia pronto
    const timer = setTimeout(() => {
      if (isMounted) startScanner();
    }, 400);
    
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
        console.warn("Errore durante lo stop dello scanner:", e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Overlay Header */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-30 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
            <ScanLine className="w-6 h-6" />
          </div>
          <div className="text-white">
            <h2 className="text-sm font-bold">Scanner Magazzino</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Multi-Format Attivo</p>
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
            <div className="relative">
              <RefreshCw className="w-12 h-12 animate-spin text-emerald-500" />
              <Camera className="absolute inset-0 m-auto w-5 h-5 text-emerald-500 opacity-50" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-70">Calibrazione Fotocamera...</p>
          </div>
        )}

        {error ? (
          <div className="p-8 text-center bg-slate-900 rounded-[2.5rem] border border-red-500/20 m-6 max-w-sm z-40">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Accesso Negato</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">{error}</p>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold text-xs uppercase transition-all shadow-xl">Ricarica Pagina</button>
          </div>
        ) : (
          <div id={scannerId} className="w-full h-full bg-black"></div>
        )}
        
        {/* Mirino Visivo */}
        {!isInitializing && !error && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
             <div className="w-[75vw] h-[75vw] max-w-[320px] max-h-[320px] relative">
                {/* Angoli */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl"></div>
                
                {/* Linea Laser */}
                <div className="absolute w-full h-[3px] bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)] animate-[laser_2s_infinite]"></div>
             </div>
             
             <div className="mt-10 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                <p className="text-white text-[10px] font-bold uppercase tracking-[0.2em]">Inquadra il Codice QR o a Barre</p>
             </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes laser {
          0% { top: 5%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 95%; opacity: 0; }
        }
        #barcode-full-screen-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          position: absolute;
          top: 0;
          left: 0;
        }
        #barcode-full-screen-reader__dashboard { display: none !important; }
        #barcode-full-screen-reader__scan_region { border: none !important; }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
