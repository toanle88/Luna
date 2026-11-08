export function Flower({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g fill="currentColor">
        <ellipse cx="50" cy="30" rx="15" ry="28" />
        <ellipse cx="50" cy="70" rx="15" ry="28" />
        <ellipse cx="30" cy="50" rx="28" ry="15" />
        <ellipse cx="70" cy="50" rx="28" ry="15" />
        <ellipse cx="36" cy="36" rx="15" ry="26" transform="rotate(-45 36 36)" />
        <ellipse cx="64" cy="64" rx="15" ry="26" transform="rotate(-45 64 64)" />
        <ellipse cx="36" cy="64" rx="15" ry="26" transform="rotate(45 36 64)" />
        <ellipse cx="64" cy="36" rx="15" ry="26" transform="rotate(45 64 36)" />
      </g>
      <circle cx="50" cy="50" r="11" fill="#f3dfb2" />
    </svg>
  );
}
