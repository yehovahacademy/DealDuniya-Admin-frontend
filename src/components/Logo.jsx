// DealDuniya brand mark, same artwork as the storefront's Logo.
// `light` is for dark backgrounds (sidebar, login panel).
export default function Logo({ size = 30, light = false, showText = true, badge }) {
  const globe = light ? "#FFFFFF" : "#1F1A5C";
  const line = light ? "#1F1A5C" : "#FFFFFF";

  return (
    <span className="inline-flex items-center leading-none" style={{ gap: size * 0.3 }}>
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="DealDuniya" className="shrink-0">
        <circle cx="30" cy="34" r="24" fill={globe} />
        <ellipse cx="30" cy="34" rx="10" ry="24" fill="none" stroke={line} strokeWidth="2" />
        <path d="M6 34h48M10 22h40M10 46h40" fill="none" stroke={line} strokeWidth="2" />
        <rect x="38" y="4" width="22" height="22" rx="6" fill="#FF6A1F" />
        <circle cx="46" cy="12" r="2.6" fill={line} />
      </svg>
      {showText && (
        <span
          className={`brand-name ${light ? "text-white" : "text-navy-800"}`}
          style={{ fontSize: size * 0.72 }}
          aria-hidden="true"
        >
          Deal<span className={light ? "text-brand-400" : "text-[#E8530E]"}>Duniya</span>
        </span>
      )}
      {badge && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${
            light ? "bg-white/10 text-white/80" : "bg-brand-50 text-brand-600"
          }`}
        >
          {badge}
        </span>
      )}
    </span>
  );
}
