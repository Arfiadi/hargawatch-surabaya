export default function Footer() {
  return (
    <footer className="mt-auto w-full bg-white px-4">
      <div className="mx-auto w-full max-w-[45rem] py-5 text-center">
        <p className="mb-4 text-xs leading-relaxed text-text-secondary">
          Portal keterbukaan data komoditas pangan dan instrumen mitigasi volatilitas inflasi pangan daerah berbasis data harian dari 6 pasar induk dan strategis di Kota Surabaya.
        </p>
        <div className="flex flex-col items-center gap-1.5 border-t border-border-subtle/60 pt-4">
          <span className="text-sm tracking-[0.02em] text-text-secondary">
            &copy; 2026 HargaWatch Surabaya.
          </span>
          <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-xs leading-[1.6] tracking-[0.01em] text-text-secondary">
            <span>
              Data peta &copy; kontributor{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-text-secondary/40 underline-offset-2 hover:text-primary hover:decoration-primary/60 transition-colors"
              >
                OpenStreetMap
              </a>{" "}
              (
              <a
                href="https://opendatacommons.org/licenses/odbl/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-text-secondary/40 underline-offset-2 hover:text-primary hover:decoration-primary/60 transition-colors"
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
                className="underline decoration-text-secondary/40 underline-offset-2 hover:text-primary hover:decoration-primary/60 transition-colors"
              >
                HOT
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
