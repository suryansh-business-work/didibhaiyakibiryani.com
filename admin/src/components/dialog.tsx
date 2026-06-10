import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Modal } from "./ui";

interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}
interface AlertOptions {
  title: string;
  message: ReactNode;
}
interface DialogState {
  kind: "confirm" | "alert";
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
}
interface DialogApi {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<DialogState | null>(null);
  const resolverRef = useRef<((result: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState(null);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        setState({
          kind: "confirm",
          danger: options.danger ?? false,
          title: options.title,
          message: options.message,
          confirmLabel: options.confirmLabel ?? "Confirm",
          cancelLabel: options.cancelLabel ?? "Cancel",
        });
      }),
    []
  );

  const alert = useCallback(
    (options: AlertOptions) =>
      new Promise<void>((resolve) => {
        resolverRef.current = () => resolve();
        setState({
          kind: "alert",
          danger: false,
          title: options.title,
          message: options.message,
          confirmLabel: "OK",
          cancelLabel: "",
        });
      }),
    []
  );

  const api = useMemo<DialogApi>(() => ({ confirm, alert }), [confirm, alert]);

  return (
    <DialogContext.Provider value={api}>
      {children}
      {state && (
        <Modal
          title={state.title}
          onClose={() => settle(false)}
          footer={
            <>
              {state.kind === "confirm" && (
                <button className="btn btn-ghost" onClick={() => settle(false)}>
                  {state.cancelLabel}
                </button>
              )}
              <button
                className={`btn ${state.danger ? "btn-danger" : "btn-gold"}`}
                onClick={() => settle(true)}
              >
                {state.confirmLabel}
              </button>
            </>
          }
        >
          <div className="muted">{state.message}</div>
        </Modal>
      )}
    </DialogContext.Provider>
  );
}

function useDialogApi(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("Dialog hooks must be used within a <DialogProvider>.");
  }
  return ctx;
}

export function useConfirm() {
  return useDialogApi().confirm;
}
export function useAlert() {
  return useDialogApi().alert;
}
