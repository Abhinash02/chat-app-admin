const BASE_CONTROL =
  'w-full rounded-xl border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 ' +
  'placeholder:text-ink-400 transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 ' +
  'disabled:bg-ink-100 disabled:text-ink-500';

export function Field({ label, hint, error, htmlFor, children, className = '' }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      {children}
      {/* Hint and error occupy the same slot: showing both at once buries the
          thing the user needs to act on. */}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        hint && <p className="text-xs text-ink-500">{hint}</p>
      )}
    </div>
  );
}

export function Input({ className = '', invalid = false, ...props }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={`${BASE_CONTROL} ${invalid ? 'border-red-400 focus:border-red-400 focus:ring-red-500/10' : ''} ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = '', rows = 3, ...props }) {
  return <textarea rows={rows} className={`${BASE_CONTROL} resize-y ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${BASE_CONTROL} pr-9 ${className}`} {...props}>
      {children}
    </select>
  );
}

export function NumberInput({ suffix, className = '', ...props }) {
  return (
    <div className="relative">
      <Input type="number" className={`${suffix ? 'pr-16' : ''} ${className}`} {...props} />
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-500">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label
      className={`flex items-start gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition
                    ${checked ? 'bg-brand-500' : 'bg-ink-300'}
                    ${disabled ? 'pointer-events-none' : ''}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all
                      ${checked ? 'left-[1.375rem]' : 'left-0.5'}`}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-800">{label}</span>
        {description && <span className="block text-xs text-ink-500">{description}</span>}
      </span>
    </label>
  );
}

/**
 * Pairs a native colour picker with a text field. The text field matters: an
 * operator pasting a brand hex from a spec should not have to hunt for it in a
 * colour wheel.
 */
export function ColorInput({ value, onChange, label, id }) {
  const isValidHex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value ?? '');

  return (
    <div className="flex items-center gap-2.5">
      <input
        type="color"
        id={id}
        aria-label={label}
        value={isValidHex ? value : '#000000'}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-ink-300 bg-white p-0.5"
      />
      <input
        type="text"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        spellCheck={false}
        className={`w-full rounded-lg border bg-white px-2.5 py-1.5 font-mono text-xs uppercase
                    transition focus:ring-4 focus:ring-brand-500/10
                    ${isValidHex ? 'border-ink-300 focus:border-brand-400' : 'border-red-400 focus:border-red-400'}`}
      />
    </div>
  );
}
