// Small inline SVG icon set used across the dashboard (replaces emoji glyphs).

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function ListIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

export function CalendarIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

export function ClockIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function MapPinIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function SparkleIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 3l1.8 4.9L18.7 9.7 13.8 11.5 12 16.4 10.2 11.5 5.3 9.7l4.9-1.8L12 3Z" />
      <path d="M19 14l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z" />
    </svg>
  );
}

export function EyeIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M10.7 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.2-1" />
      <path d="m9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </svg>
  );
}

export function FolderIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z" />
    </svg>
  );
}

export function RepeatIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M17 2.5 21 6l-4 3.5" />
      <path d="M3 12a9 9 0 0 1 15.6-5.6" />
      <path d="M7 21.5 3 18l4-3.5" />
      <path d="M21 12a9 9 0 0 1-15.6 5.6" />
    </svg>
  );
}

export function ShieldIcon({ className = 'h-4 w-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 3 4.5 6v5.5c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
