import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import { Button } from './Button.jsx';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, description, size = 'md', children, footer }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    // Stop the page behind the dialog scrolling under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl
                    bg-white shadow-2xl sm:rounded-2xl ${SIZES[size]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-200/70 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-ink-200/70 bg-ink-50/60 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Confirmation for actions that are hard to undo — suspending an account,
 * approving a payment, deleting a coin pack. `confirmLabel` should name the
 * action ("Suspend account"), never just say "OK": the button text is the last
 * thing an operator reads before it happens.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  isLoading = false,
  children,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant={variant} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-600">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </Modal>
  );
}
