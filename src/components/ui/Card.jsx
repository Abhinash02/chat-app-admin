export function Card({ className = '', children, ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 border-b border-ink-200/70 px-5 py-4 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ className = '', children }) {
  return (
    <div className={`flex items-center justify-end gap-2 border-t border-ink-200/70 px-5 py-3.5 ${className}`}>
      {children}
    </div>
  );
}
