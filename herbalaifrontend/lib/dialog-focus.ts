export function activateDialog(
  panel: HTMLElement, onClose: () => void, returnFocus?: HTMLElement,
): () => void {
  const owner = panel.ownerDocument;
  const previousFocus = returnFocus ?? owner.activeElement as HTMLElement | null;
  const previousOverflow = owner.body.style.overflow;
  owner.body.style.overflow = 'hidden';
  panel.focus({ preventScroll: true });

  const handleKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(panel.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    )).filter(control => control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) {
      event.preventDefault();
      panel.focus();
    } else if (!panel.contains(owner.activeElement) || owner.activeElement === panel ||
      (event.shiftKey ? owner.activeElement === first : owner.activeElement === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };

  owner.addEventListener('keydown', handleKey);
  return () => {
    owner.removeEventListener('keydown', handleKey);
    owner.body.style.overflow = previousOverflow;
    if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus({ preventScroll: true });
  };
}
