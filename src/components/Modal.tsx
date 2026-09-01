import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

export function Modal({ open, onClose, title, children, footer, wide = false }: { open: boolean; onClose(): void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return (
    <dialog ref={dialog} className={`modal ${wide ? "modal--wide" : ""}`} onCancel={(event) => { event.preventDefault(); onClose(); }} onClose={onClose}>
      <div className="modal__head"><h2>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
      <div className="modal__body">{children}</div>
      {footer ? <div className="modal__footer">{footer}</div> : null}
    </dialog>
  );
}
