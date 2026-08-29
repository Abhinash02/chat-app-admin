import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm shadow-brand-500/25',
  secondary: 'bg-ink-100 text-ink-800 hover:bg-ink-200 active:bg-ink-300',
  outline: 'border border-ink-300 text-ink-700 hover:bg-ink-50 active:bg-ink-100',
  ghost: 'text-ink-600 hover:bg-ink-100 active:bg-ink-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-600/25',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-9 w-9',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon: Icon,
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <button
      // `disabled` while loading prevents the double-submit that would create
      // two orders or two coin adjustments.
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center rounded-xl font-medium transition
                  disabled:opacity-50 disabled:pointer-events-none
                  ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="h-4 w-4" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
