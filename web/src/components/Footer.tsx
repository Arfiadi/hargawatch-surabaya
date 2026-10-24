export default function Footer() {
  return (
    <footer className="w-full bg-surface-card shadow-[0_-1px_6px_rgba(0,0,0,0.03)] border-t border-border-subtle/50 mt-auto">
      <div className="max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop py-space-xl text-center flex flex-col items-center">
        <div className="flex items-center justify-center gap-space-xs mb-space-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="HargaWatch Logo"
            className="h-8 w-8 rounded-lg object-contain shadow-xs border border-primary/10 bg-white p-0.5"
            src="/logo.svg"
          />
          <span className="font-headline-sm text-headline-sm text-primary">
            HargaWatch Surabaya
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-text-secondary max-w-xl mx-auto mb-space-md text-justify sm:text-center">
          Portal keterbukaan data komoditas pangan dan instrumen mitigasi volatilitas inflasi pangan daerah berbasis data harian dari 6 pasar induk dan strategis di Kota Surabaya.
        </p>

        <div className="pt-space-md border-t border-border-subtle/50 w-full max-w-xl text-center flex flex-col items-center gap-1.5">
          <span className="text-[11px] text-text-muted font-normal normal-case">
            Peta didukung oleh{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors"
            >
              OpenStreetMap
            </a>{" "}
            &amp;{" "}
            <a
              href="https://leafletjs.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors"
            >
              Leaflet
            </a>
          </span>
          <span className="text-text-muted font-label-caps text-label-caps">
            &copy; 2026 HargaWatch Surabaya.
          </span>
        </div>
      </div>
    </footer>
  );
}
