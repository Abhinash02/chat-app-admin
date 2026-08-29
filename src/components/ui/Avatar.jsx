import { initialsOf } from '../../lib/format.js';

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
};

/**
 * Falls back to initials on a gender-tinted background. A broken image URL is
 * common here (a user deleted their photo, a CDN hiccup) and must never render
 * as an empty box.
 */
export function Avatar({ src, name = '', gender, size = 'md', className = '' }) {
  const tint = gender === 'female' ? 'bg-brand-100 text-brand-700' : 'bg-sky-100 text-sky-700';

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full
                  font-semibold ${SIZES[size]} ${tint} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
      <span className={src ? 'absolute -z-10' : ''}>{initialsOf(name)}</span>
    </span>
  );
}
