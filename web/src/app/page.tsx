import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import "@/components/landing/landing.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LandingReveal from "@/components/landing/LandingReveal";
import HeroBoardPreview from "@/components/landing/HeroBoardPreview";
import LandingResiliencePreview from "@/components/landing/LandingResiliencePreview";
import LandingMapPreview from "@/components/landing/LandingMapPreview";
import LandingForecastPreview from "@/components/landing/LandingForecastPreview";
import LandingEwsPreview from "@/components/landing/LandingEwsPreview";
import LandingDualDevicePreview from "@/components/landing/LandingDualDevicePreview";

export const metadata: Metadata = {
  title: "HargaWatch Surabaya — Bandingkan Harga Pangan",
  description:
    "Bandingkan harga 37 bahan pangan di enam pasar Surabaya, pantau perubahannya, dan lihat perkiraan harga tujuh hari ke depan.",
};

export default function HomePage() {
  return (
    <div data-landing>
      <LandingReveal />
      <a className="lw-skip" href="#lw-main">
        Lewati ke konten
      </a>
      <Header />

      <main id="lw-main" className="pt-16">
        <section
          className="lw-container lw-flow-section pt-4 sm:pt-8"
          aria-labelledby="lw-h1"
        >
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)] lg:gap-8 lg:items-start">
            <div className="min-w-0 w-full">
              <div className="max-w-3xl">
                <h1 id="lw-h1" className="text-xl min-[390px]:text-[22px] sm:text-2xl lg:text-[28px] font-bold text-text-primary tracking-tight leading-tight" data-hero-enter>
                  Bandingkan harga pangan di Surabaya
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl" data-hero-enter>
                  Cek harga cabai, beras, hingga telur di enam pasar Surabaya. Bandingkan pilihan sebelum berangkat dan pantau perubahan harga bahan pangan.
                </p>
              </div>
              <div
                className="mt-3.5 sm:mt-5"
                data-hero-enter
                style={{ "--hero-i": "2" } as React.CSSProperties}
              >
                <HeroBoardPreview />
              </div>
            </div>
            <div className="min-w-0 w-full flex flex-col" data-hero-enter style={{ "--hero-i": "3" } as React.CSSProperties}>
              <LandingResiliencePreview />
            </div>
          </div>
        </section>

        {/* Peta */}
        <section className="lw-container lw-flow-section" aria-labelledby="lw-peta" data-reveal>
          <div className="max-w-3xl mb-2.5 sm:mb-4">
            <h2 id="lw-peta" className="text-xl sm:text-2xl lg:text-[28px] font-bold text-text-primary tracking-tight leading-tight">
              Bandingkan harga pangan di tiap pasar
            </h2>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl">
              Bandingkan harga pangan di enam pasar Surabaya. Pilih komoditas dan pasar pada peta untuk melihat harganya serta selisih dari rata-rata kota.
            </p>
          </div>
          <div className="w-full">
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
            <div className="w-full min-w-0 order-2 lg:order-1 lg:col-span-7">
              <LandingForecastPreview />
            </div>
            <div className="w-full min-w-0 order-1 lg:order-2 lg:col-span-5 lg:col-start-8 flex flex-col justify-center">
              <h2 id="lw-proyeksi" className="text-[17px] min-[390px]:text-lg sm:text-2xl lg:text-[28px] font-bold text-text-primary tracking-tight leading-tight">
                Rencanakan belanja sebelum harga berubah
              </h2>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl">
                Lihat perkiraan harga tujuh hari ke depan dan bandingkan dengan batas harga acuan yang ditetapkan Bapanas.
              </p>
              <div className="mt-3.5 sm:mt-5 space-y-2 sm:space-y-3 w-full">
                <div className="flex items-center gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl border border-border-subtle/70 bg-surface-card/60 shadow-2xs w-full">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-primary shadow-2xs">
                    <span className="material-symbols-outlined text-[20px] leading-none select-none" aria-hidden="true">
                      calendar_today
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold leading-tight text-text-primary">
                      Rencanakan seminggu ke depan
                    </h3>
                    <p className="mt-1 text-xs sm:text-[13px] leading-snug text-text-secondary">
                      Perkiraan harian memberi gambaran arah harga sebelum berbelanja.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl border border-border-subtle/70 bg-surface-card/60 shadow-2xs w-full">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-primary shadow-2xs">
                    <span className="material-symbols-outlined text-[20px] leading-none select-none" aria-hidden="true">
                      insights
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold leading-tight text-text-primary">
                      Pahami kemungkinan perubahan
                    </h3>
                    <p className="mt-1 text-xs sm:text-[13px] leading-snug text-text-secondary">
                      Lihat perkiraan utama serta kisaran harga yang mungkin terjadi.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-3.5 p-2.5 sm:p-3 rounded-xl border border-border-subtle/70 bg-surface-card/60 shadow-2xs w-full">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-primary shadow-2xs">
                    <span className="material-symbols-outlined text-[20px] leading-none select-none" aria-hidden="true">
                      verified_user
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold leading-tight text-text-primary">
                      Bandingkan dengan batas Bapanas
                    </h3>
                    <p className="mt-1 text-xs sm:text-[13px] leading-snug text-text-secondary">
                      Lihat apakah harga masih di bawah atau sudah melewati batas acuan resmi.
                    </p>
                  </div>
                </div>
              </div>
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
            <div className="w-full min-w-0 lg:col-span-5 flex flex-col justify-center">
              <h2 id="lw-siaga" className="text-[17px] min-[390px]:text-lg sm:text-2xl lg:text-[28px] font-bold text-text-primary tracking-tight leading-tight">
                Ketahui pasar yang perlu diperhatikan
              </h2>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl">
                Untuk pemantauan pangan kota, skor ini merangkum perubahan harga dan menunjukkan pasar yang perlu diperiksa lebih dulu.
              </p>
              
              <div className="mt-3.5 sm:mt-5 space-y-2 sm:space-y-3 w-full">
                <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border border-border-subtle/70 bg-surface-card/60 shadow-2xs w-full">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-primary shadow-2xs">
                      <span className="material-symbols-outlined text-[20px] leading-none select-none" aria-hidden="true">
                        trending_up
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold leading-tight text-text-primary">
                        Kenaikan harga
                      </h3>
                      <p className="mt-1 text-xs sm:text-[13px] leading-snug text-text-secondary">
                        Menandai harga yang naik lebih cepat dari biasanya.
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-xs font-bold rounded-lg border border-border-subtle bg-surface-canvas text-text-secondary font-mono">
                    20%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border border-border-subtle/70 bg-surface-card/60 shadow-2xs w-full">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-primary shadow-2xs">
                      <span className="material-symbols-outlined text-[20px] leading-none select-none" aria-hidden="true">
                        bolt
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold leading-tight text-text-primary">
                        Lonjakan mendadak
                      </h3>
                      <p className="mt-1 text-xs sm:text-[13px] leading-snug text-text-secondary">
                        Menandai perubahan besar yang baru atau berulang.
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-xs font-bold rounded-lg border border-border-subtle bg-surface-canvas text-text-secondary font-mono">
                    20%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border border-border-subtle/70 bg-surface-card/60 shadow-2xs w-full">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-primary shadow-2xs">
                      <span className="material-symbols-outlined text-[20px] leading-none select-none" aria-hidden="true">
                        storefront
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold leading-tight text-text-primary">
                        Perbedaan harga pasar
                      </h3>
                      <p className="mt-1 text-xs sm:text-[13px] leading-snug text-text-secondary">
                        Menandai pasar dengan harga yang jauh berbeda dari lainnya.
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-xs font-bold rounded-lg border border-border-subtle bg-surface-canvas text-text-secondary font-mono">
                    20%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl border border-border-subtle/70 bg-surface-card/60 shadow-2xs w-full">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50 text-primary shadow-2xs">
                      <span className="material-symbols-outlined text-[20px] leading-none select-none" aria-hidden="true">
                        query_stats
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold leading-tight text-text-primary">
                        Perkiraan harga
                      </h3>
                      <p className="mt-1 text-xs sm:text-[13px] leading-snug text-text-secondary">
                        Menandai kemungkinan harga melewati batas acuan dalam tujuh hari.
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-xs font-bold rounded-lg border border-emerald-200/80 bg-emerald-50 text-primary font-mono">
                    40%
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full min-w-0 lg:col-span-7">
              <LandingEwsPreview />
            </div>
          </div>
        </section>

        {/* Band penutup */}
        <div className="lw-band" data-reveal>
          <section className="lw-container" aria-labelledby="lw-tutup">
            <div className="lw-cols items-center">
              <div className="w-full min-w-0 lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
                <h2 id="lw-tutup" className="text-xl sm:text-2xl lg:text-[28px] font-bold text-white tracking-tight leading-tight max-w-lg">
                  Harga pangan berubah.<br />Cek sebelum berbelanja.
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-white/85 leading-relaxed max-w-md mx-auto lg:mx-0">
                  Bandingkan harga di enam pasar dan lihat perkiraan perubahannya untuk tujuh hari ke depan.
                </p>
                <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm bg-white text-primary hover:bg-emerald-50 shadow-sm transition-all active:scale-[0.98]"
                  >
                    <span>Bandingkan harga</span>
                    <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">arrow_forward</span>
                  </Link>
                  <Link
                    href="/peta"
                    className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm text-white bg-white/10 hover:bg-white/20 border border-white/25 backdrop-blur-xs transition-all active:scale-[0.98]"
                  >
                    <span>Lihat peta pasar</span>
                    <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">map</span>
                  </Link>
                </div>
              </div>
              <div className="w-full min-w-0 lg:col-span-7 flex justify-center items-center mt-5 sm:mt-7 lg:mt-0">
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
