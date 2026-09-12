import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-surface-card shadow-[0_-1px_6px_rgba(0,0,0,0.03)] mt-space-2xl">
      <div className="max-w-[80rem] mx-auto px-space-md lg:px-gutter-desktop py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-lg mb-space-lg">
          <div className="md:col-span-2 flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="HargaWatch Logo"
                className="h-6 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida/AEtjO1WiZ8V1jVXZ1sU1_kf8Rny3lqf6Mezyyzf1ac0WfhnMnfLFShPPO7SDTRhwUVFtq3i37SKWPp4Tzy4I5PaEovQGtiVITOm1K9s7gv9ycCUwbVWmXXcSMrxBTLK7AKh2rU4Qhgmd-ElW41fMDDLA1Zy-hAd6BPDSYqI9a5y1t9EU3e7RkEdfjQWMFrp0NuNAVvXuwUcgfdRLRr4wky2XPBm3Zbvao6IkweWr0HSIR05qEzUkq2Vg-WfLAyA"
              />
              <span className="font-headline-sm text-headline-sm text-primary">
                HargaWatch Surabaya
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-secondary max-w-xl">
              Portal keterbukaan data komoditas pangan dan instrumen mitigasi volatilitas inflasi pangan daerah berbasis data harian dari 6 pasar induk dan strategis di Kota Surabaya.
            </p>
            <div className="flex items-center gap-space-xs text-status-normal font-label-caps text-label-caps">
              <span className="material-symbols-outlined text-body-md">verified</span>
              Terverifikasi SP2KP &amp; TPID Kota Surabaya
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <span className="font-title-md text-title-md text-on-surface">
              Aksi Cepat &amp; Partisipasi
            </span>
            <Link
              className="font-body-sm text-body-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5"
              href="/early-warning"
            >
              <span className="material-symbols-outlined text-body-md">report_problem</span>
              Lapor Lonjakan Harga
            </Link>
            <Link
              className="font-body-sm text-body-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5"
              href="/early-warning"
            >
              <span className="material-symbols-outlined text-body-md">campaign</span>
              Program Operasi Pasar
            </Link>
            <Link
              className="font-body-sm text-body-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5"
              href="/forecasting"
            >
              <span className="material-symbols-outlined text-body-md">download</span>
              Data Terbuka CSV / API
            </Link>
          </div>

          <div className="flex flex-col gap-space-xs">
            <span className="font-title-md text-title-md text-on-surface">
              Kontak Satgas Pangan
            </span>
            <div className="flex items-center gap-space-xs text-text-secondary font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-body-md text-primary">call</span>
              Hotline: 0800-1-987-987
            </div>
            <div className="flex items-center gap-space-xs text-text-secondary font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-body-md text-primary">location_on</span>
              Balaikota Surabaya, Jl. Taman Surya No. 1
            </div>
            <div className="flex items-center gap-space-xs text-text-secondary font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-body-md text-primary">mail</span>
              satgaspangan@surabaya.go.id
            </div>
          </div>
        </div>

        <div className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm text-text-muted font-label-caps text-label-caps">
          <span>
            &copy; 2025 Pemerintah Kota Surabaya &bull; Dinas Koperasi, Usaha Kecil dan Menengah dan Perdagangan.
          </span>
          <span>Pembaruan Server: Setiap Pukul 06.00 &amp; 12.00 WIB</span>
        </div>
      </div>
    </footer>
  );
}
