import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, setStoredToken } from "../lib/api.ts";
import type { UserAccount } from "../types/nativa.ts";

interface AuthModalProps {
  mode: "login" | "bootstrap" | "password";
  currentUser: UserAccount | null;
  onClose?: () => void;
  onAuthenticated: (user: UserAccount) => void;
  onNotify: (message: string, tone?: "success" | "error") => void;
}

export function AuthModal({
  mode,
  currentUser,
  onClose,
  onAuthenticated,
  onNotify,
}: AuthModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorText("");
    setSubmitting(true);
    try {
      const res = await api.login(email, password);
      setStoredToken(res.token);
      onAuthenticated(res.user);
      onNotify(`Selamat datang, ${res.user.name}.`);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBootstrapSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorText("");
    if (password.length < 10) {
      setErrorText("Password Admin minimal 10 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorText("Konfirmasi password tidak cocok.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.bootstrapAdmin(name, email, password);
      setStoredToken(res.token);
      onAuthenticated(res.user);
      onNotify(`Akun Admin utama ${res.user.name} berhasil diaktifkan.`);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Gagal mengaktifkan Admin.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    setErrorText("");
    if (newPassword.length < 10) {
      setErrorText("Password baru minimal 10 karakter.");
      return;
    }
    setSubmitting(true);
    try {
      await api.changePassword(currentUser.email, oldPassword, newPassword);
      onNotify("Password berhasil diperbarui.");
      if (onClose) onClose();
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Gagal mengganti password.");
    } finally {
      setSubmitting(false);
    }
  }

  const isFullscreenGate = mode === "login" || mode === "bootstrap";

  const card = (
    <div className="bg-white border border-[#DCE5DF] rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src="/assets/aistudio/NATIFA_Colorful_Potential_Badge_1527cb16.webp"
            alt="Logo FATIHA Daycare and Learning Center"
            referrerPolicy="no-referrer"
            className="w-13 h-13 object-contain shrink-0"
          />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[#14281E]">
              {mode === "bootstrap"
                ? "Aktivasi Admin Pertama"
                : mode === "login"
                ? "Masuk ke NATIVA"
                : "Ganti Password"}
            </h1>
            <p className="text-xs text-[#64776D] mt-0.5">
              Natural Intelligence &amp; Talent Assessment
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#64776D] hover:text-[#14281E] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {mode === "bootstrap" ? (
        <>
          <p className="text-xs leading-relaxed text-[#54675D]">
            Buat akun Admin utama FATIHA untuk memulai penggunaan NATIVA. Setelah aktif, Admin
            dapat menambahkan akun Asesor dan Orang Tua melalui menu Manajemen Akun.
          </p>
          <form onSubmit={handleBootstrapSubmit} className="space-y-3.5">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#2E4237]">Nama Admin *</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap pengelola"
                className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#2E4237]">Email Admin *</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fatiha.id"
                className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#2E4237]">
                Password (minimal 10 karakter) *
              </span>
              <input
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 10 karakter"
                className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#2E4237]">Konfirmasi Password *</span>
              <input
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>

            {errorText && <p className="text-xs text-[#B4232C]">{errorText}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-sm font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? "Mengaktifkan..." : "Buat Akun Admin & Mulai"}
            </button>
          </form>
        </>
      ) : mode === "login" ? (
        <>
          <p className="text-xs text-[#586A60]">
            Gunakan email dan password akun FATIHA Anda untuk mengakses workspace NATIVA.
          </p>
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#2E4237]">Email</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@fatiha.id"
                className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-[#2E4237]">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>

            {errorText && <p className="text-xs text-[#B4232C]">{errorText}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-sm font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? "Memproses..." : "Masuk"}
            </button>
          </form>
          <div className="pt-3 border-t border-[#EEF2EF] text-center text-[11px] text-[#708278]">
            FATIHA Daycare and Learning Center · Tumbuh Bahagia, Belajar Sesuai Fitrah
          </div>
        </>
      ) : (
        <form onSubmit={handleChangePassword} className="space-y-3.5">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#2E4237]">Password Saat Ini</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-[#2E4237]">
              Password Baru (min. 10 karakter)
            </span>
            <input
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
            />
          </label>

          {errorText && <p className="text-xs text-[#B4232C]">{errorText}</p>}

          <div className="flex justify-end gap-2 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#4B6155] bg-[#F2F6F3] hover:bg-[#E4EDE7] rounded-lg cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] disabled:opacity-50 rounded-lg cursor-pointer"
            >
              {submitting ? "Menyimpan..." : "Simpan Password"}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (isFullscreenGate) {
    return (
      <div className="min-h-screen bg-[#F5F7F4] flex items-center justify-center p-4">
        {card}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#102218]/45 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {card}
    </div>
  );
}
