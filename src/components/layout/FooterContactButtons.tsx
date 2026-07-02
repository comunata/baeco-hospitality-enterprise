/**
 * Two equal-size CTA buttons for instant contact. Phone numbers are used
 * only as click targets (tel: / wa.me) — never rendered as visible text,
 * per the "no numbers on the page" requirement.
 */
const CALL_NUMBER = "+40754417713";
const WHATSAPP_NUMBER = "40757239757";

export function FooterContactButtons({ dict }: { dict: { call: string; whatsapp: string } }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <a
        href={`tel:${CALL_NUMBER}`}
        className="group flex h-12 w-40 items-center justify-center gap-2.5 rounded-full border border-platinum/20 text-xs font-medium uppercase tracking-[0.15em] text-ivory transition-all duration-300 hover:border-champagne hover:bg-champagne/10 hover:text-champagne"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110">
          <path
            d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.1c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"
            strokeLinejoin="round"
          />
        </svg>
        {dict.call}
      </a>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noreferrer"
        className="group flex h-12 w-40 items-center justify-center gap-2.5 rounded-full border border-platinum/20 text-xs font-medium uppercase tracking-[0.15em] text-ivory transition-all duration-300 hover:border-emerald hover:bg-emerald/10 hover:text-emerald"
      >
        <svg viewBox="0 0 32 32" fill="currentColor" className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110">
          <path d="M16.02 3C9.4 3 4 8.37 4 15c0 2.36.68 4.55 1.87 6.42L4 29l7.77-1.83A11.9 11.9 0 0 0 16.02 27C22.63 27 28 21.63 28 15S22.63 3 16.02 3Zm6.98 16.9c-.3.83-1.7 1.58-2.35 1.68-.6.09-1.36.13-2.2-.14-.5-.16-1.15-.37-1.98-.73-3.48-1.5-5.75-5-5.92-5.24-.17-.24-1.42-1.89-1.42-3.6 0-1.72.9-2.56 1.22-2.91.31-.34.68-.43.9-.43.23 0 .46 0 .66.01.21.01.5-.08.78.6.3.71 1 2.46 1.09 2.64.09.18.15.4.03.64-.12.24-.18.4-.36.61-.18.21-.38.47-.54.63-.18.18-.37.37-.16.73.21.35.93 1.53 2 2.48 1.37 1.22 2.53 1.6 2.88 1.78.35.18.56.15.76-.09.21-.24.88-1.03 1.12-1.38.24-.35.47-.29.79-.18.32.12 2.05.97 2.4 1.14.35.18.58.26.67.41.09.15.09.85-.21 1.68Z" />
        </svg>
        {dict.whatsapp}
      </a>
    </div>
  );
}
