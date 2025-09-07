const express = require("express");
const path = require("path");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Fungsi untuk mendapatkan waktu WITA
function getWITATime() {
  const now = new Date();
  // WITA adalah UTC+8, tapi kita perlu adjust untuk timezone lokal
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const witaTime = new Date(utcTime + 8 * 3600000); // UTC+8
  return witaTime;
}

// Fungsi untuk format tanggal Indonesia
function formatIndonesianDate(date) {
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const time = date.toTimeString().slice(0, 5);

  return `${dayName}, ${day} ${month} ${year} - ${time} WITA`;
}

// Route untuk halaman utama
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Route untuk halaman create
app.get("/create", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "create.html"));
});

// API untuk mendapatkan waktu WITA saat ini
app.get("/api/current-time", (req, res) => {
  const witaTime = getWITATime();
  res.json({
    currentTime: witaTime,
    formatted: formatIndonesianDate(witaTime),
    timezone: "WITA (UTC+8)",
  });
});

// API untuk menyimpan checklist dan mengirim ke WhatsApp
app.post("/api/save-checklist", async (req, res) => {
  try {
    const { date, title, status, description } = req.body;

    if (!date || !title || !status) {
      return res.status(400).json({
        success: false,
        message: "Date, title, dan status harus diisi!",
      });
    }

    // Ambil dan format tanggal yang diperlukan
    const witaTime = getWITATime(); // Tetap diperlukan untuk data response
    const formattedTaskDate = formatIndonesianDate(new Date(date)).split(' - ')[0];

    // --- Format pesan untuk WhatsApp (sesuai permintaan) ---

    let message = `📖 *Tugas Saya:*\n${title}`;

    message += `\n\n🗓️ *Untuk Tanggal:*\n${formattedTaskDate}`;

    if (description && description.trim()) {
      message += `\n\n📝 *Deskripsi:*\n${description}`;
    }

    // Bagian "Dibuat pada" sudah dihapus dari pesan ini
    
    message += `\n\n📌 Tolong buatkan saya *pengingat*. 
Tanyakan kepada saya dahulu apakah perlu konfirmasi jam atau tidak? jika saya menjawab tidak langsung set pengingat, jika saya menulis iya tanyakan jam berapa, jika di deskripsi ada deadline/tenggat anda set pengingat ingatkan 3 jam sebelum tenggat tersebut `;

    // Encode message untuk URL WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/+12063274402?text=${encodedMessage}`;

    // Response sukses (data `createdAt` tetap ada di response, tapi tidak dikirim ke WA)
    res.json({
      success: true,
      message: "Checklist berhasil disimpan!",
      whatsappUrl: whatsappUrl,
      data: {
        date,
        title,
        status,
        description,
        createdAt: witaTime,
        formatted: formattedTaskDate,
      },
    });
  } catch (error) {
    console.error("Error saving checklist:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menyimpan checklist",
    });
  }
});

// API untuk mendapatkan checklist berdasarkan tanggal
app.get("/api/checklist/:date", (req, res) => {
  try {
    const { date } = req.params;

    // Dalam implementasi nyata, Anda bisa mengambil data dari database
    // Untuk sekarang, kita return format yang diharapkan
    res.json({
      success: true,
      date: date,
      checklists: [], // Array kosong karena data disimpan di localStorage
    });
  } catch (error) {
    console.error("Error getting checklist:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil checklist",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log("Timezone: WITA (UTC+8)");
});
