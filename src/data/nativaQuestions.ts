export type NativaPattern = "Grounder" | "Analyst" | "Creator" | "Connector" | "Explorer";

export interface QuestionItem {
  code: string;
  pattern: NativaPattern;
  text: string;
}

export interface ActivityItem {
  code: string;
  name: string;
  guide: string;
}

export const NATIVA_PATTERNS: NativaPattern[] = [
  "Grounder",
  "Analyst",
  "Creator",
  "Connector",
  "Explorer"
];

export const PATTERN_META: Record<
  NativaPattern,
  {
    color: string;
    softBg: string;
    tendency: string;
    stimulation: string;
    shortLabel: string;
  }
> = {
  Grounder: {
    color: "#1E713B",
    softBg: "#EDF6F0",
    shortLabel: "Praktik & Konkret",
    tendency: "Belajar melalui pengalaman konkret, praktik langsung, detail, dan langkah yang terstruktur.",
    stimulation: "Practical life, balok, menyusun, menuang, meronce, dan aktivitas tangan sesuai usia."
  },
  Analyst: {
    color: "#2368A9",
    softBg: "#EDF4FB",
    shortLabel: "Pola & Logika",
    tendency: "Tertarik pada pola, aturan, pertanyaan, hubungan sebab-akibat, dan pemecahan masalah.",
    stimulation: "Puzzle, mengelompokkan benda, permainan sebab-akibat, mencocokkan pola, dan tantangan sederhana."
  },
  Creator: {
    color: "#B87D00",
    softBg: "#FDF6E7",
    shortLabel: "Imajinasi & Karya",
    tendency: "Menunjukkan imajinasi, gagasan, ekspresi, dan kemungkinan cara yang beragam.",
    stimulation: "Seni terbuka, pretend play, cerita bergambar, musik, gerak, dan bahan kreasi."
  },
  Connector: {
    color: "#B91C2C",
    softBg: "#FCEEEF",
    shortLabel: "Sosial & Empati",
    tendency: "Menunjukkan minat pada interaksi, komunikasi, kerja sama, dan hubungan sosial.",
    stimulation: "Bermain bergiliran, membaca bersama, permainan kooperatif, bercerita, dan tugas membantu."
  },
  Explorer: {
    color: "#69308F",
    softBg: "#F4EFF8",
    shortLabel: "Ingin Tahu & Eksplorasi",
    tendency: "Menunjukkan rasa ingin tahu, adaptasi, inisiatif, dan semangat menemukan hal baru.",
    stimulation: "Sensory play, eksplorasi alam, observasi lingkungan, variasi aktivitas, dan discovery play aman."
  }
};

export const SCORE_SCALE = [
  { value: 1, label: "Belum / tidak tampak" },
  { value: 2, label: "Jarang" },
  { value: 3, label: "Kadang" },
  { value: 4, label: "Sering" },
  { value: 5, label: "Sangat konsisten" }
] as const;

export const PARENT_QUESTIONS: QuestionItem[] = [
  {
    "code": "G01",
    "pattern": "Grounder",
    "text": "Anak lebih mudah memahami sesuatu ketika langsung mencoba daripada hanya mendengarkan penjelasan."
  },
  {
    "code": "G02",
    "pattern": "Grounder",
    "text": "Anak terbantu jika diberi contoh benda atau situasi yang nyata."
  },
  {
    "code": "G03",
    "pattern": "Grounder",
    "text": "Anak memperhatikan detail kecil saat bermain atau mengerjakan sesuatu."
  },
  {
    "code": "G04",
    "pattern": "Grounder",
    "text": "Anak menikmati kegiatan yang melibatkan tangan, gerak, atau praktik langsung."
  },
  {
    "code": "G05",
    "pattern": "Grounder",
    "text": "Anak tertarik pada aktivitas keseharian seperti menuang, merapikan, menyusun, atau memasang."
  },
  {
    "code": "G06",
    "pattern": "Grounder",
    "text": "Anak senang bermain dengan benda konkret seperti balok, alat rumah tangga aman, atau puzzle fisik."
  },
  {
    "code": "G07",
    "pattern": "Grounder",
    "text": "Anak lebih nyaman mengikuti langkah kegiatan yang jelas dan berurutan."
  },
  {
    "code": "G08",
    "pattern": "Grounder",
    "text": "Anak terlihat puas ketika menghasilkan sesuatu yang dapat dilihat atau disentuh."
  },
  {
    "code": "G09",
    "pattern": "Grounder",
    "text": "Anak mengamati cara kerja benda sebelum atau saat menggunakannya."
  },
  {
    "code": "G10",
    "pattern": "Grounder",
    "text": "Anak menikmati kegiatan membangun, menyusun, mengatur, atau membuat sesuatu."
  },
  {
    "code": "A01",
    "pattern": "Analyst",
    "text": "Anak sering bertanya alasan atau sebab dari suatu kejadian."
  },
  {
    "code": "A02",
    "pattern": "Analyst",
    "text": "Anak menikmati teka-teki, puzzle, atau tantangan mencari solusi."
  },
  {
    "code": "A03",
    "pattern": "Analyst",
    "text": "Anak mudah menangkap pola yang berulang."
  },
  {
    "code": "A04",
    "pattern": "Analyst",
    "text": "Anak senang mengelompokkan benda berdasarkan bentuk, warna, ukuran, atau fungsi."
  },
  {
    "code": "A05",
    "pattern": "Analyst",
    "text": "Anak tertarik pada permainan yang memiliki aturan."
  },
  {
    "code": "A06",
    "pattern": "Analyst",
    "text": "Anak mencoba menemukan solusi sendiri ketika menghadapi masalah sederhana."
  },
  {
    "code": "A07",
    "pattern": "Analyst",
    "text": "Anak memperhatikan hubungan sebab dan akibat."
  },
  {
    "code": "A08",
    "pattern": "Analyst",
    "text": "Anak menikmati tantangan yang membutuhkan pemikiran atau strategi."
  },
  {
    "code": "A09",
    "pattern": "Analyst",
    "text": "Anak suka membandingkan benda, pilihan, atau hasil."
  },
  {
    "code": "A10",
    "pattern": "Analyst",
    "text": "Anak ingin mengetahui bagaimana sesuatu bekerja."
  },
  {
    "code": "C01",
    "pattern": "Creator",
    "text": "Anak menikmati cerita imajinatif atau permainan pura-pura."
  },
  {
    "code": "C02",
    "pattern": "Creator",
    "text": "Anak senang menggambar, membuat karya, atau menciptakan sesuatu."
  },
  {
    "code": "C03",
    "pattern": "Creator",
    "text": "Anak sering memiliki ide berbeda dari contoh yang diberikan."
  },
  {
    "code": "C04",
    "pattern": "Creator",
    "text": "Anak menikmati kegiatan terbuka yang tidak hanya memiliki satu jawaban."
  },
  {
    "code": "C05",
    "pattern": "Creator",
    "text": "Anak dapat mengembangkan cerita dari gambar atau benda sederhana."
  },
  {
    "code": "C06",
    "pattern": "Creator",
    "text": "Anak tertarik mencoba berbagai cara untuk menghasilkan karya."
  },
  {
    "code": "C07",
    "pattern": "Creator",
    "text": "Anak menggunakan imajinasi saat bermain."
  },
  {
    "code": "C08",
    "pattern": "Creator",
    "text": "Anak sering mengubah aturan atau alur permainan menjadi versinya sendiri."
  },
  {
    "code": "C09",
    "pattern": "Creator",
    "text": "Anak menikmati kegiatan seni, musik, gerak, atau ekspresi kreatif."
  },
  {
    "code": "C10",
    "pattern": "Creator",
    "text": "Anak menemukan kegunaan baru dari benda yang tersedia."
  },
  {
    "code": "R01",
    "pattern": "Connector",
    "text": "Anak senang bermain atau melakukan kegiatan bersama orang lain."
  },
  {
    "code": "R02",
    "pattern": "Connector",
    "text": "Anak menikmati bercerita atau berbagi pengalaman."
  },
  {
    "code": "R03",
    "pattern": "Connector",
    "text": "Anak memperhatikan ekspresi atau perasaan orang di sekitarnya."
  },
  {
    "code": "R04",
    "pattern": "Connector",
    "text": "Anak tertarik pada kegiatan kelompok."
  },
  {
    "code": "R05",
    "pattern": "Connector",
    "text": "Anak bersedia bekerja sama untuk menyelesaikan kegiatan."
  },
  {
    "code": "R06",
    "pattern": "Connector",
    "text": "Anak merespons ketika diajak berbicara atau berdiskusi."
  },
  {
    "code": "R07",
    "pattern": "Connector",
    "text": "Anak terlihat termotivasi ketika mendapat apresiasi yang hangat."
  },
  {
    "code": "R08",
    "pattern": "Connector",
    "text": "Anak menunjukkan keinginan untuk membantu orang lain."
  },
  {
    "code": "R09",
    "pattern": "Connector",
    "text": "Anak berusaha menyampaikan keinginan atau perasaannya."
  },
  {
    "code": "R10",
    "pattern": "Connector",
    "text": "Anak menikmati percakapan dan kegiatan berbagi cerita."
  },
  {
    "code": "E01",
    "pattern": "Explorer",
    "text": "Anak tertarik mencoba kegiatan yang belum pernah dilakukan."
  },
  {
    "code": "E02",
    "pattern": "Explorer",
    "text": "Anak menikmati variasi atau perubahan kegiatan."
  },
  {
    "code": "E03",
    "pattern": "Explorer",
    "text": "Anak menunjukkan rasa ingin tahu terhadap lingkungan baru."
  },
  {
    "code": "E04",
    "pattern": "Explorer",
    "text": "Anak cepat tertarik pada pengalaman atau objek baru."
  },
  {
    "code": "E05",
    "pattern": "Explorer",
    "text": "Anak senang menjelajahi tempat atau area yang berbeda."
  },
  {
    "code": "E06",
    "pattern": "Explorer",
    "text": "Anak mencoba strategi alternatif ketika cara pertama belum berhasil."
  },
  {
    "code": "E07",
    "pattern": "Explorer",
    "text": "Anak menikmati kegiatan eksplorasi di luar ruangan."
  },
  {
    "code": "E08",
    "pattern": "Explorer",
    "text": "Anak mencari pengalaman baru dengan antusias."
  },
  {
    "code": "E09",
    "pattern": "Explorer",
    "text": "Anak dapat menyesuaikan diri ketika ada perubahan rutinitas."
  },
  {
    "code": "E10",
    "pattern": "Explorer",
    "text": "Anak senang menemukan sesuatu melalui eksplorasi mandiri."
  }
];

export const OBSERVATION_QUESTIONS: QuestionItem[] = [
  {
    "code": "OBS-G01",
    "pattern": "Grounder",
    "text": "Menggunakan benda secara langsung untuk memahami tugas."
  },
  {
    "code": "OBS-G02",
    "pattern": "Grounder",
    "text": "Meniru contoh praktik dengan cukup mudah."
  },
  {
    "code": "OBS-G03",
    "pattern": "Grounder",
    "text": "Memperhatikan detail saat menyusun atau merakit."
  },
  {
    "code": "OBS-G04",
    "pattern": "Grounder",
    "text": "Memilih aktivitas manipulatif atau motorik."
  },
  {
    "code": "OBS-G05",
    "pattern": "Grounder",
    "text": "Menyelesaikan langkah kegiatan secara berurutan."
  },
  {
    "code": "OBS-A01",
    "pattern": "Analyst",
    "text": "Mengajukan pertanyaan tentang alasan atau cara kerja."
  },
  {
    "code": "OBS-A02",
    "pattern": "Analyst",
    "text": "Mencari pola atau keteraturan."
  },
  {
    "code": "OBS-A03",
    "pattern": "Analyst",
    "text": "Mengelompokkan objek dengan dasar tertentu."
  },
  {
    "code": "OBS-A04",
    "pattern": "Analyst",
    "text": "Mencoba strategi untuk memecahkan masalah."
  },
  {
    "code": "OBS-A05",
    "pattern": "Analyst",
    "text": "Memahami atau mengingat aturan permainan."
  },
  {
    "code": "OBS-C01",
    "pattern": "Creator",
    "text": "Menghasilkan ide atau cara bermain yang bervariasi."
  },
  {
    "code": "OBS-C02",
    "pattern": "Creator",
    "text": "Menggunakan imajinasi dalam bermain."
  },
  {
    "code": "OBS-C03",
    "pattern": "Creator",
    "text": "Membuat karya atau cerita sendiri."
  },
  {
    "code": "OBS-C04",
    "pattern": "Creator",
    "text": "Mengembangkan kemungkinan dari bahan sederhana."
  },
  {
    "code": "OBS-C05",
    "pattern": "Creator",
    "text": "Menunjukkan ekspresi kreatif melalui media yang tersedia."
  },
  {
    "code": "OBS-R01",
    "pattern": "Connector",
    "text": "Menginisiasi interaksi dengan teman atau pendamping."
  },
  {
    "code": "OBS-R02",
    "pattern": "Connector",
    "text": "Berbagi ide atau cerita dengan orang lain."
  },
  {
    "code": "OBS-R03",
    "pattern": "Connector",
    "text": "Merespons emosi atau kebutuhan teman."
  },
  {
    "code": "OBS-R04",
    "pattern": "Connector",
    "text": "Bekerja sama dalam aktivitas bersama."
  },
  {
    "code": "OBS-R05",
    "pattern": "Connector",
    "text": "Mengomunikasikan kebutuhan dan perasaan."
  },
  {
    "code": "OBS-E01",
    "pattern": "Explorer",
    "text": "Mendekati objek atau area baru dengan rasa ingin tahu."
  },
  {
    "code": "OBS-E02",
    "pattern": "Explorer",
    "text": "Mencoba lebih dari satu cara saat bereksplorasi."
  },
  {
    "code": "OBS-E03",
    "pattern": "Explorer",
    "text": "Berpindah antaraktivitas dengan adaptif."
  },
  {
    "code": "OBS-E04",
    "pattern": "Explorer",
    "text": "Menemukan detail atau hal baru di lingkungan."
  },
  {
    "code": "OBS-E05",
    "pattern": "Explorer",
    "text": "Menunjukkan inisiatif dalam kegiatan eksplorasi."
  }
];

export const ACTIVITY_CHALLENGES: ActivityItem[] = [
  {
    "code": "ACT1",
    "name": "BUILD IT",
    "guide": "Menyusun balok atau bahan konstruksi aman; amati praktik langsung dan strategi pemecahan masalah."
  },
  {
    "code": "ACT2",
    "name": "CREATE IT",
    "guide": "Membuat karya bebas dari bahan sederhana; amati ide, imajinasi, dan proses kreatif."
  },
  {
    "code": "ACT3",
    "name": "TELL THE STORY",
    "guide": "Menyusun cerita dari gambar/benda; amati kreativitas dan komunikasi."
  },
  {
    "code": "ACT4",
    "name": "LET'S PLAY TOGETHER",
    "guide": "Permainan kolaboratif sederhana; amati interaksi dan kerja sama."
  },
  {
    "code": "ACT5",
    "name": "DISCOVER IT",
    "guide": "Eksplorasi benda/area baru yang aman; amati rasa ingin tahu dan adaptasi."
  }
];

export const ACTIVITY_PATTERN_MAP: Record<NativaPattern, string[]> = {
  Grounder: ["ACT1"],
  Analyst: ["ACT1"],
  Creator: ["ACT2", "ACT3"],
  Connector: ["ACT3", "ACT4"],
  Explorer: ["ACT5"]
};
