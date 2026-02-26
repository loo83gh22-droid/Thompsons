/**
 * LogoMark — M4 brand icon
 * Inline SVG so it renders instantly with no network request.
 * Use <LogoMark size={32} /> anywhere in the UI.
 */
export function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="200" height="200" rx="40" fill="#2D6B52" />

      {/* Roof slopes — the adults' raised arms */}
      <line x1="58"  y1="108" x2="100" y2="50" stroke="#F0EAE0" strokeWidth="6" strokeLinecap="round" />
      <line x1="142" y1="108" x2="100" y2="50" stroke="#F0EAE0" strokeWidth="6" strokeLinecap="round" />

      {/* Peak dot */}
      <circle cx="100" cy="50" r="7" fill="#C9622A" />

      {/* Left adult */}
      <circle cx="58" cy="88" r="13" fill="#F0EAE0" />
      <line x1="58" y1="101" x2="58"  y2="126" stroke="#F0EAE0" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="58" y1="110" x2="36"  y2="118" stroke="#F0EAE0" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="58" y1="126" x2="46"  y2="152" stroke="#F0EAE0" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="58" y1="126" x2="70"  y2="152" stroke="#F0EAE0" strokeWidth="3.5" strokeLinecap="round" />

      {/* Right adult */}
      <circle cx="142" cy="88" r="13" fill="#F0EAE0" />
      <line x1="142" y1="101" x2="142" y2="126" stroke="#F0EAE0" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="142" y1="110" x2="164" y2="118" stroke="#F0EAE0" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="142" y1="126" x2="130" y2="152" stroke="#F0EAE0" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="142" y1="126" x2="154" y2="152" stroke="#F0EAE0" strokeWidth="3.5" strokeLinecap="round" />

      {/* Child — orange, centered */}
      <circle cx="100" cy="114" r="11" fill="#C9622A" />
      <line x1="100" y1="125" x2="100" y2="150" stroke="#C9622A" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="100" y1="134" x2="86"  y2="143" stroke="#C9622A" strokeWidth="3"   strokeLinecap="round" />
      <line x1="100" y1="134" x2="114" y2="143" stroke="#C9622A" strokeWidth="3"   strokeLinecap="round" />
      <line x1="100" y1="150" x2="90"  y2="166" stroke="#C9622A" strokeWidth="3"   strokeLinecap="round" />
      <line x1="100" y1="150" x2="110" y2="166" stroke="#C9622A" strokeWidth="3"   strokeLinecap="round" />
    </svg>
  );
}
