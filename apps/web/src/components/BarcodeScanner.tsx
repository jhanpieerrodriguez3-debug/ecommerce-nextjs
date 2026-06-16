"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => {
      detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
    };
  }
}

const NATIVE_FORMATS = [
  "ean_13", "ean_8", "code_128", "code_39",
  "upc_a", "upc_e", "qr_code", "data_matrix", "itf",
];

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number | null>(null);
  const firedRef  = useRef(false);
  const onDetectedRef = useRef(onDetected);
  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);

  const [manualCode, setManualCode] = useState("");
  const [mode, setMode]     = useState<"camera" | "manual">("camera");
  const [status, setStatus] = useState<"loading" | "scanning" | "error">("loading");
  const [error, setError]   = useState<string | null>(null);
  const [api, setApi]       = useState<"native" | "zxing" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const stopAll = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const fireResult = useCallback((code: string) => {
    if (firedRef.current) return;
    firedRef.current = true;
    stopAll();
    onDetectedRef.current(code);
  }, [stopAll]);

  useEffect(() => {
    if (mode !== "camera") return;

    let cancelled = false;
    firedRef.current = false;
    setStatus("loading");
    setError(null);
    setApi(null);

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width:  { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
            frameRate: { ideal: 30 },
          },
        });

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) { stream.getTracks().forEach(t => t.stop()); return; }

        video.srcObject = stream;

        // Wait for video to be genuinely playing
        await new Promise<void>((resolve, reject) => {
          const onPlaying = () => { video.removeEventListener("playing", onPlaying); resolve(); };
          const onErr     = () => reject(new Error("Video error"));
          video.addEventListener("playing", onPlaying);
          video.addEventListener("error", onErr, { once: true });
          video.play().catch(reject);
        });

        if (cancelled) { stopAll(); return; }
        setStatus("scanning");

        // ── Off-screen canvas (NEVER in the DOM — avoids display:none issues) ──
        const offscreen = document.createElement("canvas");
        const ctx = offscreen.getContext("2d", { willReadFrequently: true })!;

        const drawFrame = () => {
          if (video.videoWidth > 0) {
            if (offscreen.width !== video.videoWidth || offscreen.height !== video.videoHeight) {
              offscreen.width  = video.videoWidth;
              offscreen.height = video.videoHeight;
            }
            ctx.drawImage(video, 0, 0);
          }
        };

        // ── Native BarcodeDetector (Chrome/Edge/Samsung Browser) ──
        if (typeof window !== "undefined" && window.BarcodeDetector) {
          setApi("native");
          const detector = new window.BarcodeDetector({ formats: NATIVE_FORMATS });
          let detecting = false;

          const loop = () => {
            if (cancelled || firedRef.current) return;

            if (!detecting && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
              drawFrame();
              detecting = true;
              detector.detect(offscreen)
                .then(results => {
                  detecting = false;
                  if (results.length > 0 && !cancelled) {
                    fireResult(results[0].rawValue);
                  } else if (!cancelled && !firedRef.current) {
                    rafRef.current = requestAnimationFrame(loop);
                  }
                })
                .catch(() => {
                  detecting = false;
                  if (!cancelled && !firedRef.current) {
                    rafRef.current = requestAnimationFrame(loop);
                  }
                });
            } else if (!cancelled && !firedRef.current) {
              rafRef.current = requestAnimationFrame(loop);
            }
          };

          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        // ── ZXing fallback — let it decode from the already-playing video ──
        setApi("zxing");
        const [
          { BrowserMultiFormatReader },
          { BarcodeFormat: Fmt, DecodeHintType: Hint },
        ] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);

        if (cancelled) { stopAll(); return; }

        const hints = new Map();
        hints.set(Hint.POSSIBLE_FORMATS, [
          Fmt.EAN_13, Fmt.EAN_8, Fmt.CODE_128, Fmt.CODE_39,
          Fmt.UPC_A, Fmt.UPC_E, Fmt.QR_CODE, Fmt.DATA_MATRIX,
        ]);
        hints.set(Hint.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints);

        // decodeFromVideoElement uses the already-playing video — no new stream
        const controls = await (reader as any).decodeFromVideoElement(
          video,
          (result: any) => {
            if (result && !firedRef.current && !cancelled) {
              controls?.stop?.();
              fireResult(result.getText());
            }
          }
        );

        if (cancelled) { controls?.stop?.(); stopAll(); }

      } catch (err: any) {
        if (cancelled) return;
        console.error("[BarcodeScanner]", err);
        const msg =
          err?.name === "NotAllowedError"
            ? "Permiso de cámara denegado. Habilítalo en Configuración."
            : err?.message || "No se pudo acceder a la cámara.";
        setError(msg);
        setStatus("error");
        setTimeout(() => { if (!cancelled) setMode("manual"); }, 1800);
      }
    };

    void start();
    return () => { cancelled = true; stopAll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const switchToManual = useCallback(() => { stopAll(); setMode("manual"); }, [stopAll]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) onDetectedRef.current(manualCode.trim());
  };

  const content = (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0d1117] border border-white/10 rounded-[28px] w-full max-w-sm overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <div className="flex flex-col gap-1">
            <h3 className="font-black text-white text-base leading-none">📷 Lector de Código</h3>
            {api && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                api === "native"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/20 text-amber-400"
              }`}>
                {api === "native" ? "⚡ Motor nativo" : "🔄 Motor ZXing"}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none cursor-pointer">×</button>
        </div>

        {/* Mode tabs */}
        <div className="flex p-4 gap-2">
          {(["camera", "manual"] as const).map(m => (
            <button key={m}
              onClick={m === "manual" ? switchToManual : () => setMode("camera")}
              className={`flex-1 text-xs font-bold py-2 rounded-xl transition cursor-pointer ${
                mode === m
                  ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:border-white/20"
              }`}>
              {m === "camera" ? "📷 Cámara" : "⌨️ Manual"}
            </button>
          ))}
        </div>

        <div className="px-4 pb-5">
          {mode === "camera" ? (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 aspect-[4/3]">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  disablePictureInPicture
                />

                {/* Vignette */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 65% 40% at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 100%)" }}
                />

                {/* Finder */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-[70%] h-[35%]">
                    <span className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl" />
                    <span className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-cyan-400 rounded-tr" />
                    <span className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl" />
                    <span className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-cyan-400 rounded-br" />
                    {status === "scanning" && (
                      <span className="scan-bar absolute left-1 right-1 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full" />
                    )}
                  </div>
                </div>

                {status === "loading" && (
                  <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
                    <span className="text-cyan-300 text-xs animate-pulse bg-black/70 px-3 py-1 rounded-full">
                      Iniciando cámara...
                    </span>
                  </div>
                )}
                {status === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <p className="text-rose-400 text-xs text-center">{error}</p>
                  </div>
                )}
              </div>

              <p className="text-gray-500 text-[11px] text-center">
                Centra el código dentro del recuadro · mantén la cámara estable
              </p>

              <style>{`
                .scan-bar {
                  animation: scanbar 1.8s ease-in-out infinite;
                }
                @keyframes scanbar {
                  0%   { top: 2px;              opacity: 0; }
                  10%  {                         opacity: 1; }
                  90%  {                         opacity: 1; }
                  100% { top: calc(100% - 4px); opacity: 0; }
                }
              `}</style>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Ingresa el código manualmente..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="w-full bg-black/40 border border-cyan-400/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-400 font-mono tracking-widest"
                autoFocus
              />
              <button type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-black py-3 rounded-xl text-sm transition cursor-pointer">
                ✓ Usar Código
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
