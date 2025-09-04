import React, {createContext, useCallback, useContext, useMemo, useRef, useState} from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type PromptOptions = {
  title?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
};

export type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type ModalApi = {
  prompt: (opts?: PromptOptions) => Promise<string | null>;
  confirm: (opts?: ConfirmOptions) => Promise<boolean>;
};

const ModalCtx = createContext<ModalApi | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const resolvePromptRef = useRef<(value: string | null) => void>(null);
  const resolveConfirmRef = useRef<(value: boolean) => void>(null);

  const [promptState, setPromptState] = useState<PromptOptions>({});
  const [confirmState, setConfirmState] = useState<ConfirmOptions>({});
  const [promptValue, setPromptValue] = useState("");

  const prompt = useCallback((opts?: PromptOptions) => {
    setPromptState(opts ?? {});
    setPromptValue(opts?.defaultValue ?? "");
    setPromptOpen(true);
    return new Promise<string | null>((resolve) => {
      resolvePromptRef.current = resolve;
    });
  }, []);

  const confirm = useCallback((opts?: ConfirmOptions) => {
    setConfirmState(opts ?? {});
    setConfirmOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveConfirmRef.current = resolve;
    });
  }, []);

  const api = useMemo<ModalApi>(() => ({ prompt, confirm }), [prompt, confirm]);

  // Handlers
  function handlePromptConfirm() {
    const v = promptValue.trim();
    resolvePromptRef.current?.(v.length ? v : "");
    setPromptOpen(false);
  }
  function handlePromptCancel() {
    resolvePromptRef.current?.(null);
    setPromptOpen(false);
  }
  function handleConfirmYes() {
    resolveConfirmRef.current?.(true);
    setConfirmOpen(false);
  }
  function handleConfirmNo() {
    resolveConfirmRef.current?.(false);
    setConfirmOpen(false);
  }

  return (
    <ModalCtx.Provider value={api}>
      {children}

      {/* Prompt Dialog */}
      <Dialog open={promptOpen} onOpenChange={(o) => { if (!o) handlePromptCancel(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{promptState.title ?? "Entrer une valeur"}</DialogTitle>
            {promptState.label && (
              <DialogDescription>{promptState.label}</DialogDescription>
            )}
          </DialogHeader>
          <input
            autoFocus
            className="w-full rounded-md border bg-background p-2 outline-none"
            placeholder={promptState.placeholder}
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handlePromptConfirm();
              if (e.key === "Escape") handlePromptCancel();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={handlePromptCancel}>
              {promptState.cancelText ?? "Annuler"}
            </Button>
            <Button onClick={handlePromptConfirm}>
              {promptState.confirmText ?? "Valider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onOpenChange={(o) => { if (!o) handleConfirmNo(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmState.title ?? "Confirmation"}</DialogTitle>
            {confirmState.description && (
              <DialogDescription>{confirmState.description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleConfirmNo}>
              {confirmState.cancelText ?? "Annuler"}
            </Button>
            <Button variant={confirmState.destructive ? "destructive" : "default"} onClick={handleConfirmYes}>
              {confirmState.confirmText ?? "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModalCtx.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalCtx);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
