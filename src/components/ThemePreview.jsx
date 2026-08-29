import { Coins, Send, Smile } from 'lucide-react';

/**
 * A miniature of the real app rendered entirely from the theme's own tokens.
 *
 * Swatch grids show colours in isolation; they cannot answer the question an
 * operator actually has — "is the text still readable on that background?".
 * This puts every token in the role it plays in the product, so a bad pairing
 * is visible before it ships to anyone.
 */
export function ThemePreview({ colors, branding }) {
  const c = colors;

  return (
    <div
      className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[2rem] border-[10px] border-ink-900 shadow-2xl"
      style={{ background: c.background }}
      aria-label="Preview of the app with these colours"
    >
      {/* Header: coin counter and presence, the two things always on screen */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-3"
        style={{ background: `linear-gradient(135deg, ${c.gradientStart}, ${c.gradientEnd})` }}
      >
        <div
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold"
          style={{ background: c.surface, color: c.primary }}
        >
          {(branding?.appName ?? 'V').charAt(0)}
        </div>
        <span className="truncate text-sm font-semibold" style={{ color: c.onPrimary }}>
          {branding?.appName ?? 'Vibe'}
        </span>
        <span
          className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: 'rgba(255,255,255,0.22)', color: c.onPrimary }}
        >
          <Coins className="h-3 w-3" style={{ color: c.coinGold }} aria-hidden="true" />
          60
        </span>
      </div>

      {/* Conversation list row */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ background: c.surfaceAlt }}>
        <div className="relative">
          <div
            className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold"
            style={{ background: c.femaleAccent, color: c.onPrimary }}
          >
            P
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
            style={{ background: c.onlineDot, borderColor: c.surfaceAlt }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold" style={{ color: c.textPrimary }}>
            Priya
          </p>
          <p className="truncate text-[11px]" style={{ color: c.textMuted }}>
            Online now
          </p>
        </div>
      </div>

      {/* Message thread */}
      <div className="space-y-2 px-3.5 py-4" style={{ minHeight: 168 }}>
        <div className="flex justify-start">
          <div
            className="max-w-[78%] rounded-2xl rounded-bl-md px-3 py-2 text-[11px] leading-snug"
            style={{ background: c.surface, color: c.textPrimary, border: `1px solid ${c.border}` }}
          >
            Hi! How was your day?
          </div>
        </div>

        <div className="flex justify-end">
          <div
            className="max-w-[78%] rounded-2xl rounded-br-md px-3 py-2 text-[11px] leading-snug"
            style={{ background: c.primary, color: c.onPrimary }}
          >
            Pretty good, thanks for asking
          </div>
        </div>

        <div className="flex justify-start">
          <div className="text-2xl leading-none">😊</div>
        </div>

        <div className="flex justify-center pt-1">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-medium"
            style={{ background: c.surfaceAlt, color: c.textSecondary }}
          >
            22 minutes of free chat left
          </span>
        </div>
      </div>

      {/* Composer */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ background: c.surface, borderTop: `1px solid ${c.border}` }}
      >
        <Smile className="h-4 w-4 shrink-0" style={{ color: c.textMuted }} aria-hidden="true" />
        <span
          className="min-w-0 flex-1 truncate rounded-full px-3 py-1.5 text-[11px]"
          style={{ background: c.surfaceAlt, color: c.textMuted }}
        >
          Message…
        </span>
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
          style={{ background: c.primary }}
        >
          <Send className="h-3.5 w-3.5" style={{ color: c.onPrimary }} aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

/** Compact colour strip used on theme cards in the gallery. */
export function ThemeSwatches({ colors, className = '' }) {
  const keys = ['primary', 'secondary', 'accent', 'background', 'surface', 'textPrimary'];

  return (
    <div className={`flex gap-1 ${className}`}>
      {keys.map((key) => (
        <span
          key={key}
          title={`${key}: ${colors[key]}`}
          className="h-6 flex-1 rounded-md ring-1 ring-inset ring-black/10"
          style={{ background: colors[key] }}
        />
      ))}
    </div>
  );
}
