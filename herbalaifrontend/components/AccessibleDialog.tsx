'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

let openDialogs = 0;
let previousOverflow = '';

export default function AccessibleDialog({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    if (!dialog) return;
    dialog.showModal();
    if (openDialogs === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openDialogs += 1;
    return () => {
      dialog.close();
      openDialogs -= 1;
      if (openDialogs === 0) document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog ref={dialogRef} aria-label={label} className="herb-detail-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button, input, textarea, select, [tabindex]'))
        .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }}>
      <button type="button" onClick={onClose} aria-label={`Close ${label}`} className="dialog-close-button flex h-11 w-11 items-center justify-center rounded-full border border-line bg-panel text-ink shadow-sm transition-colors hover:bg-soft">
        <X className="h-5 w-5" />
      </button>
      <div className="dialog-content">{children}</div>
    </dialog>
  );
}
