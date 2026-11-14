interface FooterProps {
  showMapAttribution?: boolean;
}

export default function Footer({ showMapAttribution = false }: FooterProps) {
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
        <p className="font-body-sm text-body-sm text-text-secondary max-w-xl mx-auto mb-space-md text-center">
          Portal keterbukaan data komoditas pangan dan instrumen mitigasi volatilitas inflasi pangan daerah berbasis data harian dari 6 pasar induk dan strategis di Kota Surabaya.
        </p>

        <div className="pt-space-md border-t border-border-subtle/50 w-full max-w-xl text-center flex flex-col items-center gap-1.5">
          <span className="text-text-muted font-label-caps text-label-caps">
            &copy; 2026 HargaWatch Surabaya.
          </span>
          {showMapAttribution && (
            <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-text-secondary text-[10px] leading-[1.6] tracking-[0.01em]">
              <span>
                Data peta &copy; kontributor{" "}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline decoration-text-secondary/40 underline-offset-2 hover:text-primary hover:decoration-primary/60 transition-colors"
                >
                  OpenStreetMap
                </a>{" "}
                (
                <a
                  href="https://opendatacommons.org/licenses/odbl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline decoration-text-secondary/40 underline-offset-2 hover:text-primary hover:decoration-primary/60 transition-colors"
                >
                  ODbL
                </a>
                )
              </span>
              <span aria-hidden="true" className="text-text-muted">
                &middot;
              </span>
              <span>
                Peta dasar oleh{" "}
                <a
                  href="https://www.hotosm.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline decoration-text-secondary/40 underline-offset-2 hover:text-primary hover:decoration-primary/60 transition-colors"
                >
                  HOT
                </a>
              </span>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
