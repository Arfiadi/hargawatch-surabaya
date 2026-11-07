import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import "./landing.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LandingReveal from "./LandingReveal";
import HeroBoardPreview from "./HeroBoardPreview";
import LandingMapPreview from "./LandingMapPreview";
import LandingForecastPreview from "./LandingForecastPreview";
import LandingEwsPreview from "./LandingEwsPreview";
import LandingDualDevicePreview from "./LandingDualDevicePreview";

export const metadata: Metadata = {
  title: "HargaWatch Surabaya — Bandingkan Harga Pangan",
  description:
    "Bandingkan harga 37 bahan pangan di enam pasar Surabaya, pantau perubahannya, dan lihat perkiraan harga tujuh hari ke depan.",
};

export default function LandingPage() {
  return (
    <div data-landing>
      <LandingReveal />
      <a className="lw-skip" href="#lw-main">
        Lewati ke konten
      </a>
      <Header />

      <main id="lw-main" className="pt-16">
        <section
          className="lw-container lw-flow-section flex flex-col pt-8 sm:pt-12"
          aria-labelledby="lw-h1"
        >
          <div className="max-w-3xl">
            <h1 id="lw-h1" className="text-xl sm:text-2xl lg:text-[28px] font-bold text-text-primary tracking-tight leading-tight" data-hero-enter>
              Bandingkan harga pangan<br />di Surabaya
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl" data-hero-enter>
              Cek harga cabai, beras, hingga telur di enam pasar Surabaya. Bandingkan pilihan sebelum berangkat dan pantau perubahan harga bahan pangan.
            </p>
            <div className="mt-4 flex items-center" data-hero-enter>
              <Link href="/" className="lw-btn shadow-xs hover:shadow-md transition-all">
                Bandingkan harga
              </Link>
            </div>
          </div>
          <div
            className="mt-8 w-full"
            data-hero-enter
            style={{ "--hero-i": "2" } as React.CSSProperties}
          >
            <HeroBoardPreview />
          </div>
        </section>

        {/* Peta */}
        <section className="lw-container lw-flow-section" aria-labelledby="lw-peta" data-reveal>
          <div className="max-w-3xl mb-3 sm:mb-4">
            <h2 id="lw-peta" className="text-xl sm:text-2xl lg:text-[28px] font-bold text-text-primary tracking-tight leading-tight">
              Bandingkan harga cabai di tiap pasar
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl">
              Bandingkan harga cabai di enam pasar Surabaya. Pilih pasar pada peta untuk melihat harganya dan selisih dari rata-rata kota.
            </p>
          </div>
          <div>
            <LandingMapPreview />
          </div>
        </section>

        {/* Proyeksi */}
        <section
          className="lw-container lw-flow-section"
          aria-labelledby="lw-proyeksi"
          data-reveal
        >
          <div className="lw-cols items-center">
            <div className="col-span-12 lg:col-span-7">
              <LandingForecastPreview />
            </div>
            <div className="col-span-12 lg:col-span-5 lg:col-start-8 flex flex-col justify-center">
              <h2 id="lw-proyeksi" className="text-xl sm:text-2xl lg:text-[28px] font-bold text-text-primary tracking-tight leading-tight">
                Rencanakan belanja<br />sebelum harga berubah
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md">
                Lihat perkiraan harga tujuh hari ke depan dan bandingkan dengan batas harga acuan yang ditetapkan Bapanas.
              </p>
              <dl className="mt-3.5 border-t border-border-subtle divide-y divide-border-subtle text-xs">
                <div className="py-2">
                  <dt className="font-bold text-text-primary">Rencanakan seminggu ke depan</dt>
                  <dd className="text-text-secondary mt-0.5 text-[11px] sm:text-xs leading-relaxed">
                    Perkiraan harian memberi gambaran arah harga sebelum berbelanja.
                  </dd>
                </div>
                <div className="py-2">
                  <dt className="font-bold text-text-primary">Pahami kemungkinan perubahan</dt>
                  <dd className="text-text-secondary mt-0.5 text-[11px] sm:text-xs leading-relaxed">
                    Lihat perkiraan utama serta kisaran harga yang mungkin terjadi.
                  </dd>
                </div>
                <div className="py-2">
                  <dt className="font-bold text-text-primary">Bandingkan dengan batas Bapanas</dt>
                  <dd className="text-text-secondary mt-0.5 text-[11px] sm:text-xs leading-relaxed">
                    Lihat apakah harga masih di bawah atau sudah melewati batasnya.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Siaga */}
        <section
          className="lw-container lw-flow-section"
          aria-labelledby="lw-siaga"
          data-reveal
        >
          <div className="lw-cols items-center">
            <div className="col-span-12 lg:col-span-5 flex flex-col justify-center">
              <h2 id="lw-siaga" className="text-xl sm:text-2xl lg:text-[28px] font-bold text-text-primary tracking-tight leading-tight">
                Ketahui pasar yang<br />perlu diperhatikan
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md">
                Untuk pemantauan pangan kota, skor ini merangkum perubahan harga dan menunjukkan pasar yang perlu diperiksa lebih dulu.
              </p>
              
              <dl className="mt-3.5 border-t border-border-subtle divide-y divide-border-subtle text-xs">
                <div className="py-2 flex items-start justify-between gap-3">
                  <div>
                    <dt className="font-bold text-text-primary">Kenaikan harga</dt>
                    <dd className="text-text-secondary mt-0.5 text-[11px] sm:text-xs leading-relaxed">Menandai harga yang naik lebih cepat dari biasanya.</dd>
                  </div>
                  <span className="font-semibold text-text-muted shrink-0 text-right text-[11px] sm:text-xs">20%</span>
                </div>
                <div className="py-2 flex items-start justify-between gap-3">
                  <div>
                    <dt className="font-bold text-text-primary">Lonjakan mendadak</dt>
                    <dd className="text-text-secondary mt-0.5 text-[11px] sm:text-xs leading-relaxed">Menandai perubahan besar yang baru atau berulang.</dd>
                  </div>
                  <span className="font-semibold text-text-muted shrink-0 text-right text-[11px] sm:text-xs">20%</span>
                </div>
                <div className="py-2 flex items-start justify-between gap-3">
                  <div>
                    <dt className="font-bold text-text-primary">Perbedaan harga pasar</dt>
                    <dd className="text-text-secondary mt-0.5 text-[11px] sm:text-xs leading-relaxed">Menandai pasar dengan harga yang jauh berbeda dari lainnya.</dd>
                  </div>
                  <span className="font-semibold text-text-muted shrink-0 text-right text-[11px] sm:text-xs">20%</span>
                </div>
                <div className="py-2 flex items-start justify-between gap-3">
                  <div>
                    <dt className="font-bold text-text-primary">Perkiraan harga</dt>
                    <dd className="text-text-secondary mt-0.5 text-[11px] sm:text-xs leading-relaxed">Menandai kemungkinan harga melewati batas acuan dalam tujuh hari.</dd>
                  </div>
                  <span className="font-semibold text-text-muted shrink-0 text-right text-[11px] sm:text-xs">40%</span>
                </div>
              </dl>
            </div>
            <div className="col-span-12 lg:col-span-7 mt-space-xl lg:mt-0">
              <LandingEwsPreview />
            </div>
          </div>
        </section>

        {/* Band penutup */}
        <div className="lw-band" data-reveal>
          <section className="lw-container" aria-labelledby="lw-tutup">
            <div className="lw-cols items-center">
              <div className="col-span-12 lg:col-span-5">
                <h2 id="lw-tutup" className="text-xl sm:text-2xl lg:text-[28px] font-bold text-white tracking-tight leading-tight max-w-lg">
                  Harga pangan berubah.<br />Cek sebelum berbelanja.
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-white/80 leading-relaxed max-w-md">
                  Bandingkan harga di enam pasar dan lihat perkiraan perubahannya untuk tujuh hari ke depan.
                </p>
                <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-space-md">
                  <Link href="/" className="lw-btn">
                    Bandingkan harga
                  </Link>
                  <Link href="/peta" className="lw-link">
                    Lihat peta pasar
                  </Link>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-7 flex justify-center items-center mt-space-xl lg:mt-0">
                <LandingDualDevicePreview />
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
