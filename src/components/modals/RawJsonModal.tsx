import * as Dialog from "@radix-ui/react-dialog";
import { X, Copy, Check, FileJson } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RawJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  title?: string;
}

export function RawJsonModal({
  isOpen,
  onClose,
  data,
  title,
}: RawJsonModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    toast.success("JSON copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-[60] w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] border border-border bg-background p-0 shadow-lg duration-200 sm:rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-border flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <FileJson className="h-5 w-5" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                  {title || "Raw Log Data"}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mt-1">
                  Complete JSON response from the server
                </Dialog.Description>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex items-center gap-2"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="text-xs font-medium">Copy</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-auto bg-muted/30 flex-1">
            <pre className="text-sm font-mono p-4 rounded-lg bg-card border border-border whitespace-pre-wrap break-all overflow-x-auto text-foreground italic shadow-inner">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>

          <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors font-medium text-sm"
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
