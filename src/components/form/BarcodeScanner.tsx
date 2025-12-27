import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, AlertCircle } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scannerId = "barcode-scanner-container";

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" }, // Prefer back camera on mobile
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            // Successfully scanned
            onScan(decodedText);
            stopScanner();
            onClose();
          },
          () => {
            // Scan error - ignore, just means no barcode detected in frame
          }
        );
        setIsStarting(false);
      } catch (err) {
        console.error("Failed to start scanner:", err);
        if (err instanceof Error) {
          if (err.message.includes("Permission")) {
            setError(
              "Camera access denied. Please allow camera access in your browser settings."
            );
          } else if (
            err.message.includes("NotFoundError") ||
            err.message.includes("No camera")
          ) {
            setError("No camera found on this device.");
          } else {
            setError(`Failed to start camera: ${err.message}`);
          }
        } else {
          setError("Failed to start camera. Please try again.");
        }
        setIsStarting(false);
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === 2) {
            // 2 = SCANNING
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (err) {
          console.error("Error stopping scanner:", err);
        }
        scannerRef.current = null;
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onScan, onClose]);

  const handleClose = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    onClose();
  };

  return (
    <div
      className="relative bg-black/95 rounded-lg overflow-hidden"
      ref={containerRef}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2 text-white">
          <Camera className="h-4 w-4" />
          <span className="text-sm font-medium">Scan Barcode</span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Scanner Container */}
      <div className="min-h-[280px] flex items-center justify-center">
        {isStarting && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-5">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2" />
              <p className="text-sm">Starting camera...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-5 p-4">
            <div className="text-center">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div id="barcode-scanner-container" className="w-full" />
      </div>

      {/* Footer hint */}
      {!error && !isStarting && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white/80 text-xs text-center">
            Point your camera at a barcode
          </p>
        </div>
      )}
    </div>
  );
}
