import { CheckCheck, Coins, MoreVertical, Phone, Send, Smile, Sparkles, Video } from 'lucide-react';

/**
 * A sleek, high-fidelity smartphone preview rendered directly from the theme's own tokens.
 * Accurately demonstrates how text readability, gradients, chat bubbles, and brand accents look in real usage.
 */
export function ThemePreview({ colors, branding }) {
  const c = colors;
  const radius = branding?.borderRadius ?? 18;

  return (
    <div
      className="mx-auto w-full max-w-[310px] overflow-hidden rounded-[2.5rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl ring-1 ring-white/10"
      aria-label="Interactive preview of the mobile app with these colours"
    >
      {/* Phone Top Bezel & Dynamic Island */}
      <div className="relative flex items-center justify-between px-6 pt-3 pb-2 bg-slate-950 text-white select-none">
        <span className="text-[11px] font-semibold tracking-tight text-white/90">9:41</span>
        <div className="h-4 w-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-slate-700/80 mr-1" />
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500/40" />
        </div>
        <div className="flex items-center gap-1.5 text-white/90">
          <span className="text-[10px]">5G</span>
          <div className="w-4 h-2 rounded-sm border border-white/80 p-0.5 flex items-center">
            <div className="w-full h-full bg-white rounded-xs" />
          </div>
        </div>
      </div>

      {/* Screen Container */}
      <div
        className="flex flex-col transition-colors duration-300"
        style={{
          background: c.background,
          fontFamily: branding?.fontFamily || 'inherit',
          minHeight: 460,
        }}
      >
        {/* App Header with Signature Theme Gradient */}
        <div
          className="relative px-3.5 pt-3 pb-3.5 shadow-md flex items-center justify-between transition-all"
          style={{
            background: `linear-gradient(135deg, ${c.gradientStart || c.primary}, ${c.gradientEnd || c.secondary})`,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-black shadow-sm"
              style={{ background: c.surface, color: c.primary, borderRadius: Math.max(6, radius - 8) }}
            >
              {(branding?.appName || 'Vibe').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xs font-bold leading-tight" style={{ color: c.onPrimary }}>
                {branding?.appName || 'Vibe Live'}
              </span>
              <span className="block truncate text-[9px] font-medium opacity-85" style={{ color: c.onPrimary }}>
                {branding?.tagline || 'Online & vibing'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Coin Balance Pill */}
            <div
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-xs backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(0,0,0,0.25)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
              }}
            >
              <Coins className="h-3 w-3" style={{ color: c.coinGold }} aria-hidden="true" />
              <span>555</span>
            </div>
          </div>
        </div>

        {/* Free Talk / Special Banner Strip */}
        <div
          className="flex items-center justify-between px-3.5 py-1.5 border-b text-[10px] font-semibold"
          style={{
            background: c.surfaceAlt,
            borderColor: c.border,
            color: c.primary,
          }}
        >
          <span className="flex items-center gap-1">
            <span>⏳ Free Chat:</span>
            <span className="font-bold">25:00</span>
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-xs"
            style={{ backgroundColor: c.primary }}
          >
            Active
          </span>
        </div>

        {/* Conversation Header Partner Mini-bar */}
        <div
          className="flex items-center justify-between px-3.5 py-2.5 border-b"
          style={{ background: c.surface, borderColor: c.border }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <div
                className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold shadow-xs"
                style={{ background: c.femaleAccent, color: c.onPrimary }}
              >
                🌸
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
                style={{ background: c.onlineDot, borderColor: c.surface }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="truncate text-xs font-bold leading-tight" style={{ color: c.textPrimary }}>
                  Ananya
                </p>
                <span
                  className="px-1 py-0.2 rounded text-[8px] font-bold"
                  style={{ backgroundColor: `${c.femaleAccent}25`, color: c.femaleAccent }}
                >
                  Host
                </span>
              </div>
              <p className="truncate text-[10px] font-medium" style={{ color: c.onlineDot }}>
                🟢 Online & Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" style={{ color: c.textSecondary }}>
            <Phone className="h-3.5 w-3.5 opacity-80" />
            <Video className="h-3.5 w-3.5 opacity-80" />
            <MoreVertical className="h-3.5 w-3.5 opacity-80" />
          </div>
        </div>

        {/* Chat Thread Messages Area */}
        <div className="flex-1 space-y-2.5 px-3.5 py-3 overflow-hidden">
          {/* Timestamp chip */}
          <div className="flex justify-center">
            <span
              className="rounded-full px-2.5 py-0.5 text-[9px] font-semibold"
              style={{ background: `${c.textMuted}20`, color: c.textMuted }}
            >
              Today, 2:15 PM
            </span>
          </div>

          {/* Incoming Message Bubble */}
          <div className="flex items-end gap-1.5 justify-start">
            <div
              className="max-w-[76%] px-3 py-2 text-[11px] shadow-xs"
              style={{
                background: c.surface,
                color: c.textPrimary,
                borderRadius: radius,
                borderBottomLeftRadius: 3,
                border: `1px solid ${c.border}`,
              }}
            >
              <p className="leading-snug">Hey there! Loved your voice room earlier today ✨</p>
              <span className="block text-[8px] text-right mt-1" style={{ color: c.textMuted }}>
                2:16 PM
              </span>
            </div>
          </div>

          {/* Outgoing Message Bubble */}
          <div className="flex items-end gap-1.5 justify-end">
            <div
              className="max-w-[76%] px-3 py-2 text-[11px] shadow-sm"
              style={{
                background: c.primary,
                color: c.onPrimary,
                borderRadius: radius,
                borderBottomRightRadius: 3,
              }}
            >
              <p className="leading-snug font-medium">Thank you! Join us for the next game round 🎲</p>
              <div className="flex items-center justify-end gap-1 text-[8px] mt-1 opacity-90">
                <span>2:17 PM</span>
                <CheckCheck className="h-2.5 w-2.5" />
              </div>
            </div>
          </div>

          {/* Special Gift / Event Mini-Card */}
          <div
            className="flex items-center gap-2 p-2 rounded-xl border shadow-xs"
            style={{
              background: c.surfaceAlt,
              borderColor: `${c.primary}30`,
              borderRadius: Math.max(8, radius - 6),
            }}
          >
            <div
              className="h-7 w-7 rounded-lg grid place-items-center text-sm shadow-xs"
              style={{ backgroundColor: `${c.primary}20` }}
            >
              🎁
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold truncate" style={{ color: c.textPrimary }}>
                Sent 10 Free Bonus Coins
              </p>
              <p className="text-[8px] truncate" style={{ color: c.textMuted }}>
                Coin transfer successful
              </p>
            </div>
            <span className="text-[10px] font-extrabold" style={{ color: c.coinGold }}>
              +10
            </span>
          </div>
        </div>

        {/* Input Composer Bar */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 border-t"
          style={{ background: c.surface, borderColor: c.border }}
        >
          <Smile className="h-4 w-4 shrink-0" style={{ color: c.textMuted }} aria-hidden="true" />
          <div
            className="flex-1 flex items-center px-3 py-1.5 rounded-full border text-[11px]"
            style={{
              background: c.surfaceAlt,
              borderColor: c.border,
              color: c.textMuted,
            }}
          >
            Type a vibe message...
          </div>
          <button
            type="button"
            className="h-7 w-7 shrink-0 grid place-items-center rounded-full shadow-sm active:scale-95 transition"
            style={{ background: c.primary }}
          >
            <Send className="h-3.5 w-3.5" style={{ color: c.onPrimary }} aria-hidden="true" />
          </button>
        </div>

        {/* Bottom Home Indicator */}
        <div className="py-2 flex justify-center bg-slate-950">
          <div className="w-24 h-1 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
}

/** Rich, multi-step gradient swatch bar displayed on theme cards */
export function ThemeSwatches({ colors, className = '' }) {
  const c = colors;
  if (!c) return null;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Primary Gradient Ribbon */}
      <div
        className="h-3 w-full rounded-md shadow-xs ring-1 ring-black/10"
        style={{
          background: `linear-gradient(90deg, ${c.gradientStart || c.primary} 0%, ${c.primary} 50%, ${c.gradientEnd || c.secondary} 100%)`,
        }}
      />
      {/* Discrete Palette Swatches */}
      <div className="flex gap-1">
        {[
          { color: c.primary, name: 'Primary' },
          { color: c.secondary, name: 'Secondary' },
          { color: c.accent, name: 'Accent' },
          { color: c.background, name: 'Background' },
          { color: c.surface, name: 'Surface' },
          { color: c.textPrimary, name: 'Text' },
          { color: c.coinGold, name: 'Coin' },
        ].map((item, idx) => (
          <span
            key={idx}
            title={`${item.name}: ${item.color}`}
            className="h-4.5 flex-1 rounded-sm ring-1 ring-inset ring-black/15 shadow-2xs"
            style={{ backgroundColor: item.color }}
          />
        ))}
      </div>
    </div>
  );
}
