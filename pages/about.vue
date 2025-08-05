<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 font-sans scroll-smooth">
    <!-- Navbar -->
    <header class="sticky top-0 z-50 bg-gray-950 border-b border-gray-800">
      <div
        class="container mx-auto flex items-center justify-between px-4 py-4"
      >
        <div class="flex items-center space-x-3">
          <img
            src="/icons/icon_192x192.png"
            class="w-8 h-8"
            alt="KASTER logo"
          />
          <span class="text-xl font-semibold">KASTER</span>
        </div>
        <nav class="flex space-x-4 text-sm">
          <a href="#fitur" class="hover:text-primary-400">Fitur</a>
          <a href="#tentang" class="hover:text-primary-400">Tentang</a>
          <a href="#kebijakan" class="hover:text-primary-400">Kebijakan</a>
          <UButton size="sm" color="primary" to="/login">Login</UButton>
        </nav>
      </div>
    </header>

    <!-- Hero -->
    <section
      class="flex flex-col items-center justify-center text-center py-24 px-6"
    >
      <img
        src="/icons/icon_192x192.png"
        alt="KASTER Logo"
        class="w-24 h-24 mb-4"
      />
      <h1 class="text-4xl md:text-5xl font-bold mb-2">KASTER</h1>
      <p class="text-lg text-gray-300 mb-4">Aplikasi Kas Terpadu RT</p>
      <p class="text-gray-400 max-w-xl mb-6">
        Mencatat Keuangan Warga dengan Mudah dan Transparan.
      </p>
      <div class="flex gap-4">
        <UButton size="lg" color="primary" to="/login">Mulai Sekarang</UButton>
        <UButton
          size="lg"
          color="gray"
          variant="ghost"
          @click="scrollToSection('fitur')"
        >
          Pelajari Lebih Lanjut
        </UButton>
      </div>
    </section>

    <!-- Fitur -->
    <section id="fitur" class="bg-gray-900 py-20 px-6">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-2xl font-bold mb-4">Fitur Utama</h2>
        <p class="text-gray-400 mb-10">
          Solusi lengkap untuk pencatatan kas RT.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div>
            <h3 class="font-semibold text-lg mb-2">Pencatatan Kas Masuk</h3>
            <p class="text-gray-400">
              Catat iuran dan sumbangan warga secara real-time.
            </p>
          </div>
          <div>
            <h3 class="font-semibold text-lg mb-2">Pengeluaran Transparan</h3>
            <p class="text-gray-400">
              Setiap pengeluaran tercatat dan dapat diaudit.
            </p>
          </div>
          <div>
            <h3 class="font-semibold text-lg mb-2">Laporan Otomatis</h3>
            <p class="text-gray-400">
              Download PDF laporan bulanan dan tahunan kapan saja.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Tentang -->
    <section id="tentang" class="py-20 px-6">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-2xl font-bold mb-4">Tentang KASTER</h2>
        <p class="text-gray-400">
          KASTER (Kas Terpadu RT) adalah aplikasi yang dikembangkan untuk
          membantu pengurus RT dalam mengelola keuangan secara efisien dan
          terbuka. Dibuat oleh warga, untuk warga.
        </p>
      </div>
    </section>

    <!-- Kebijakan -->
    <section id="kebijakan" class="bg-gray-900 py-20 px-6">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-2xl font-bold mb-4">Kebijakan dan Ketentuan</h2>
        <p class="text-gray-400 mb-6">
          Dengan menggunakan KASTER, pengguna dianggap telah menyetujui
          kebijakan privasi dan ketentuan layanan berikut.
        </p>
        <div class="flex flex-col space-y-4 text-left text-sm text-gray-400">
          <p>
            <strong>Kebijakan Privasi:</strong> Data pengguna tidak dibagikan ke
            pihak ketiga.
          </p>
          <p>
            <strong>Ketentuan Layanan:</strong> Aplikasi digunakan untuk
            keperluan kas RT, tidak untuk bisnis atau profit pribadi.
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="text-center py-6 text-sm text-gray-500">
      &copy; {{ new Date().getFullYear() }} KASTER -
      <a href="https://wa.me/6285333920007">rt007.site</a>. Semua Hak
      Dilindungi.
    </footer>
  </div>
</template>

<script setup>
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}
</script>
