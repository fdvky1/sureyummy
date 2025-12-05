import Link from "next/link";
import { 
  RiRestaurantLine, 
  RiSmartphoneLine, 
  RiPrinterLine, 
  RiDashboardLine,
  RiLineChartLine,
  RiTimeLine,
  RiTeamLine,
  RiLightbulbLine,
  RiCheckLine,
  RiArrowRightLine,
  RiSparklingLine,
  RiBrainLine,
  RiFlashlightLine
} from '@remixicon/react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="container mx-auto px-4 py-20 lg:py-32 relative z-10">
          <div className="w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
                  <RiSparklingLine className="w-4 h-4" />
                  Solusi POS Terpercaya untuk Bisnis F&B
                </div>

                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  Tingkatkan Efisiensi Restoran dengan <span className="text-primary">Teknologi AI</span>
                </h1>

                <p className="text-xl text-base-content/70 leading-relaxed">
                  SureYummy adalah platform POS all-in-one yang dirancang khusus untuk restoran dan cafe modern. Integrasikan pemesanan digital, manajemen dapur, dan analitik bisnis dalam satu sistem yang mudah digunakan.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link href="/signin" className="btn btn-primary btn-lg gap-2">
                    <RiRestaurantLine className="w-5 h-5" />
                    Coba Sekarang
                    <RiArrowRightLine className="w-5 h-5" />
                  </Link>
                  <Link href="#features" className="btn btn-outline btn-lg">
                    Lihat Fitur
                  </Link>
                </div>

                <div className="flex items-center gap-8 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                      <RiCheckLine className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="font-bold text-2xl">500+</p>
                      <p className="text-sm text-base-content/70">Restoran</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <RiBrainLine className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-2xl">AI</p>
                      <p className="text-sm text-base-content/70">Analytics</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                      <RiFlashlightLine className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-bold text-2xl">24/7</p>
                      <p className="text-sm text-base-content/70">Support</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Content - Mockup */}
              <div className="relative">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl shadow-2xl overflow-hidden border border-base-300">
                  {/* Placeholder for screenshot/mockup */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <RiRestaurantLine className="w-24 h-24 mx-auto text-primary/40" />
                      <p className="text-base-content/50 font-medium">Dashboard Preview</p>
                    </div>
                  </div>
                </div>
                {/* Floating Cards */}
                <div className="absolute -left-4 top-1/4 bg-base-100 p-4 rounded-xl shadow-xl border border-base-300 w-48">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                      <RiCheckLine className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-bold">Real-time</p>
                      <p className="text-xs text-base-content/70">Order Updates</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-4 bottom-1/4 bg-base-100 p-4 rounded-xl shadow-xl border border-base-300 w-48">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <RiPrinterLine className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">Auto Print</p>
                      <p className="text-xs text-base-content/70">Receipt</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-20 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 rounded-full text-warning text-sm font-medium mb-4">
                <RiLightbulbLine className="w-4 h-4" />
                Tantangan Bisnis F&B
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Masalah yang Sering Dihadapi <span className="text-primary">Pemilik Restoran</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Problems */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-error">❌</span> Masalah
                </h3>
                <div className="space-y-3">
                  {[
                    'Pesanan manual rawan salah dan hilang',
                    'Komunikasi dapur-kasir tidak efisien',
                    'Sulit tracking revenue & menu terlaris',
                    'Antrian pembayaran lambat',
                    'Data penjualan tidak terstruktur',
                  ].map((problem, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-error/5 rounded-lg border border-error/20">
                      <div className="w-6 h-6 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-error text-sm">✕</span>
                      </div>
                      <p className="text-base-content/80">{problem}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solutions */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span className="text-success">✓</span> Solusi Kami
                </h3>
                <div className="space-y-3">
                  {[
                    'QR Code ordering langsung ke sistem',
                    'Real-time sync kasir & kitchen display',
                    'Dashboard analytics dengan AI insights',
                    'Cetak struk otomatis & multi payment',
                    'Laporan lengkap harian & bulanan',
                  ].map((solution, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-success/5 rounded-lg border border-success/20">
                      <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <RiCheckLine className="w-4 h-4 text-success" />
                      </div>
                      <p className="text-base-content/80">{solution}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Fitur <span className="text-primary">Enterprise</span> untuk Bisnis Anda
              </h2>
              <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
                Platform terintegrasi dari pemesanan digital hingga manajemen operasional. Semua dalam satu dashboard.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <RiSmartphoneLine className="w-8 h-8" />,
                  title: 'Digital Ordering',
                  description: 'QR code ordering system yang memungkinkan pelanggan memesan langsung dari smartphone mereka. Kurangi antrian dan tingkatkan pengalaman pelanggan.',
                  color: 'primary'
                },
                {
                  icon: <RiRestaurantLine className="w-8 h-8" />,
                  title: 'Kitchen Display System',
                  description: 'Tampilan dapur digital dengan update pesanan real-time. Tim dapur dapat mengelola prioritas dan status pesanan dengan efisien.',
                  color: 'secondary'
                },
                {
                  icon: <RiPrinterLine className="w-8 h-8" />,
                  title: 'Smart Receipt',
                  description: 'Cetak struk otomatis dengan format profesional. Kompatibel dengan printer thermal 80mm dan mendukung berbagai metode pembayaran.',
                  color: 'accent'
                },
                {
                  icon: <RiDashboardLine className="w-8 h-8" />,
                  title: 'Control Center',
                  description: 'Dashboard komprehensif untuk monitoring revenue real-time, manajemen menu, kontrol meja, dan operasional restoran dalam satu platform.',
                  color: 'info'
                },
                {
                  icon: <RiLineChartLine className="w-8 h-8" />,
                  title: 'Business Intelligence',
                  description: 'Analitik mendalam dengan AI untuk mengidentifikasi tren penjualan, menu favorit, dan rekomendasi strategis untuk pertumbuhan bisnis Anda.',
                  color: 'success'
                },
                {
                  icon: <RiTimeLine className="w-8 h-8" />,
                  title: 'Transaction History',
                  description: 'Sistem tracking transaksi lengkap dengan filter advanced dan export data. Audit trail untuk setiap pesanan dengan detail timestamp.',
                  color: 'warning'
                },
              ].map((feature, i) => (
                <div key={i} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow border border-base-300">
                  <div className="card-body">
                    <div className={`w-16 h-16 rounded-2xl bg-${feature.color}/10 flex items-center justify-center mb-4 text-${feature.color}`}>
                      {feature.icon}
                    </div>
                    <h3 className="card-title text-xl mb-2">{feature.title}</h3>
                    <p className="text-base-content/70">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Kenapa Pilih <span className="text-primary">SureYummy</span>?
              </h2>
              <p className="text-xl text-base-content/70">
                Platform terpadu yang mengoptimalkan operasional dan meningkatkan revenue bisnis F&B
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: <RiBrainLine className="w-8 h-8" />,
                  title: 'AI-Powered Analytics',
                  description: 'Machine learning menganalisis pattern penjualan, prediksi demand, dan memberikan actionable insights untuk meningkatkan profit margin.',
                  highlight: 'AI'
                },
                {
                  icon: <RiFlashlightLine className="w-8 h-8" />,
                  title: 'Implementasi Cepat',
                  description: 'Onboarding lengkap dalam 24 jam. Termasuk training staff, integrasi hardware, dan migrasi data dari sistem lama.',
                  highlight: 'Fast'
                },
                {
                  icon: <RiTeamLine className="w-8 h-8" />,
                  title: 'Role-Based Access',
                  description: 'Kontrol akses granular untuk Owner, Manager, Kasir, dan Chef. Audit trail lengkap untuk setiap transaksi dan perubahan.',
                  highlight: 'Secure'
                },
                {
                  icon: <RiSmartphoneLine className="w-8 h-8" />,
                  title: 'Multi-Platform',
                  description: 'Web-based responsive design bekerja di semua device. Akses dashboard dari smartphone, tablet, atau desktop tanpa install app.',
                  highlight: 'Flexible'
                },
              ].map((reason, i) => (
                <div key={i} className="card bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg border border-base-300 hover:border-primary/30 transition-colors">
                  <div className="card-body">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        {reason.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold">{reason.title}</h3>
                          <span className="badge badge-primary badge-sm">{reason.highlight}</span>
                        </div>
                        <p className="text-base-content/70 leading-relaxed">{reason.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Cara <span className="text-primary">Kerja</span> SureYummy
              </h2>
              <p className="text-xl text-base-content/70">
                Workflow terintegrasi dari ordering hingga kitchen management
              </p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden lg:block"></div>

              <div className="space-y-12">
                {[
                  {
                    step: '01',
                    title: 'Digital Ordering',
                    description: 'Customer scan QR code di meja, browse menu digital dengan foto HD, customize order, dan submit langsung ke sistem.',
                    icon: <RiSmartphoneLine className="w-6 h-6" />
                  },
                  {
                    step: '02',
                    title: 'Order Processing',
                    description: 'Sistem validate order, calculate pricing dengan tax dan service charge, kemudian route ke kitchen dengan priority queue.',
                    icon: <RiRestaurantLine className="w-6 h-6" />
                  },
                  {
                    step: '03',
                    title: 'Kitchen Display',
                    description: 'Chef menerima order di kitchen display real-time, update status preparation, dan trigger notification ke kasir saat ready.',
                    icon: <RiTimeLine className="w-6 h-6" />
                  },
                  {
                    step: '04',
                    title: 'Payment & Receipt',
                    description: 'Kasir process payment dengan multiple methods (cash/card/e-wallet), auto-print thermal receipt, dan data masuk analytics.',
                    icon: <RiPrinterLine className="w-6 h-6" />
                  },
                ].map((step, i) => (
                  <div key={i} className="relative flex items-start gap-6 lg:gap-8">
                    {/* Step number */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-primary text-primary-content font-bold text-xl flex items-center justify-center shadow-lg relative z-10">
                        {step.step}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pt-2">
                      <div className="card bg-base-100 shadow-lg border border-base-300">
                        <div className="card-body">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              {step.icon}
                            </div>
                            <h3 className="text-2xl font-bold">{step.title}</h3>
                          </div>
                          <p className="text-base-content/70 text-lg">{step.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-primary-content">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Tingkatkan Efisiensi Restoran Anda Hari Ini
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Bergabung dengan ratusan restoran yang telah meningkatkan revenue dan efisiensi operasional dengan SureYummy.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/signin" className="btn btn-base-100 btn-lg gap-2 text-primary">
                <RiRestaurantLine className="w-5 h-5" />
                Jadwalkan Demo
                <RiArrowRightLine className="w-5 h-5" />
              </Link>
              <a href="#features" className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-primary">
                Lihat Fitur Lengkap
              </a>
            </div>
            <p className="mt-6 text-sm opacity-75">
              ✓ Free Trial 30 Hari  ✓ Setup dalam 24 Jam  ✓ Support Dedicated 24/7
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-base-300 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <RiRestaurantLine className="w-8 h-8 text-primary" />
                  <span className="text-2xl font-bold">SureYummy</span>
                </div>
                <p className="text-base-content/70 mb-4 max-w-md">
                  Platform POS all-in-one untuk restoran dan cafe modern. Integrasikan ordering, kitchen management, payment, dan analytics dalam satu sistem powerful.
                </p>
                <div className="flex gap-2">
                  <span className="badge badge-primary">Enterprise Ready</span>
                  <span className="badge badge-outline">Cloud-Based</span>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><Link href="#features" className="link link-hover text-base-content/70">Fitur</Link></li>
                  <li><Link href="#" className="link link-hover text-base-content/70">Cara Kerja</Link></li>
                  <li><Link href="/signin" className="link link-hover text-base-content/70">Login</Link></li>
                  <li><Link href="#" className="link link-hover text-base-content/70">Dokumentasi</Link></li>
                </ul>
              </div>

              {/* Tech Stack */}
              <div>
                <h3 className="font-bold text-lg mb-4">Tech Stack</h3>
                <ul className="space-y-2 text-base-content/70 text-sm">
                  <li>• Next.js 15 + TypeScript</li>
                  <li>• Prisma ORM + PostgreSQL</li>
                  <li>• Firebase Genkit AI</li>
                  <li>• DaisyUI + TailwindCSS</li>
                  <li>• Cloudflare R2 Storage</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-base-content/10 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-base-content/70 text-sm">
                  © 2025 SureYummy. All rights reserved.
                </p>
                <div className="flex gap-4 text-sm text-base-content/70">
                  <a href="#" className="link link-hover">Privacy Policy</a>
                  <a href="#" className="link link-hover">Terms of Service</a>
                  <a href="#" className="link link-hover">Contact</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
