import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function QrCodePage() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [includeMargin, setIncludeMargin] = useState(true);
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("L");
  const [copied, setCopied] = useState(false);

  const qrRef = useRef<SVGSVGElement>(null);

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qrcode-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR Code downloaded successfully!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Value copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setText("");
    setSize(256);
    setFgColor("#000000");
    setBgColor("#ffffff");
    setIncludeMargin(true);
    setLevel("L");
    toast.info("Generator reset");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            QR Code Generator
          </h1>
          <p className="text-muted-foreground">
            Generate and download QR codes for items, URLs, or any other data.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4 whitespace-nowrap"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset Generator
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Content & Settings
            </h2>

            <div className="space-y-2">
              <label htmlFor="qr-text" className="text-sm font-medium">
                QR Content (Text or URL)
              </label>
              <div className="relative">
                <textarea
                  id="qr-text"
                  placeholder="Enter URL or text to encode..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                />
                {text && (
                  <button
                    onClick={handleCopy}
                    className="absolute bottom-3 right-3 p-2 bg-secondary/80 hover:bg-secondary rounded-md transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">QR Size (px)</label>
                <input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  min={128}
                  max={1024}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Error Correction Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="L">L - Low (7%)</option>
                  <option value="M">M - Medium (15%)</option>
                  <option value="Q">Q - Quartile (25%)</option>
                  <option value="H">H - High (30%)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Foreground Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-12 h-10 p-1 border border-input rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Background Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-10 p-1 border border-input rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="margin"
                checked={includeMargin}
                onChange={(e) => setIncludeMargin(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="margin"
                className="text-sm font-medium select-none"
              >
                Include Margin
              </label>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col items-center justify-between min-h-[400px]">
            <h2 className="text-lg font-semibold w-full text-left mb-4">
              Preview
            </h2>

            <div className="flex-1 flex items-center justify-center p-4 bg-secondary/30 rounded-lg border-2 border-dashed border-border w-full">
              {text ? (
                <div className="bg-white p-4 rounded-lg shadow-md overflow-hidden">
                  <QRCodeSVG
                    ref={qrRef}
                    value={text}
                    size={200}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    includeMargin={includeMargin}
                    level={level}
                  />
                </div>
              ) : (
                <div className="text-center space-y-2 opacity-40">
                  <QrCode size={64} className="mx-auto" />
                  <p className="text-sm font-medium">
                    Enter content to preview
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 w-full space-y-3">
              <button
                onClick={handleDownload}
                disabled={!text}
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-11 py-2 px-4 shadow-sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </button>
              <p className="text-xs text-center text-muted-foreground">
                High resolution image for printing or digital use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
