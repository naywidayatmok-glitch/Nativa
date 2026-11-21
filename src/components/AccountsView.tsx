import { Activity, KeyRound, RefreshCw, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api.ts";
import type { DiagnosticsSummary, UserAccount, UserRole } from "../types/nativa.ts";

interface AccountsViewProps {
  onNotify: (message: string, tone?: "success" | "error") => void;
}

export function AccountsView({ onNotify }: AccountsViewProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsSummary | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("ASESOR");
  const [password, setPassword] = useState("");
  const [childIds, setChildIds] = useState("");
  const [creating, setCreating] = useState(false);

  const [resetTarget, setResetTarget] = useState<UserAccount | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.listUsers();
      setUsers(list);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal memuat daftar pengguna.", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    if (password.length < 10) {
      onNotify("Password awal minimal 10 karakter.", "error");
      return;
    }
    setCreating(true);
    try {
      await api.createUser({ name, email, role, password, childIds });
      setName("");
      setEmail("");
      setPassword("");
      setChildIds("");
      onNotify("Akun pengguna baru berhasil dibuat.");
      await loadUsers();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal membuat akun.", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(user: UserAccount) {
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.setUserStatus(user.email, nextStatus);
      onNotify(`Status ${user.email} diubah menjadi ${nextStatus}.`);
      await loadUsers();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal memperbarui status akun.", "error");
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    if (tempPassword.length < 10) {
      onNotify("Password sementara minimal 10 karakter.", "error");
      return;
    }
    setResetting(true);
    try {
      await api.resetUserPassword(resetTarget.email, tempPassword);
      onNotify(`Password untuk ${resetTarget.email} berhasil direset.`);
      setResetTarget(null);
      setTempPassword("");
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal mereset password.", "error");
    } finally {
      setResetting(false);
    }
  }

  async function handleRunDiagnostics() {
    try {
      const diag = await api.getDiagnostics();
      setDiagnostics(diag);
      onNotify("Diagnostik database selesai.");
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Diagnostik gagal.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#14281E]">Manajemen Akun</h1>
        <p className="mt-1 text-sm text-[#586A60]">
          Kelola akses Admin, Asesor, dan Orang Tua beserta tautan Child ID untuk Portal Orang Tua.
        </p>
      </div>

      {/* Create User Form */}
      <section className="bg-white border border-[#E2E8E4] rounded-xl p-6">
        <h2 className="text-base font-semibold text-[#14281E] mb-4">Buat Akun Pengguna</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">Nama Lengkap *</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap pengguna"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">Email Login *</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@fatiha.id"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              >
                <option value="ASESOR">Asesor</option>
                <option value="ORANG_TUA">Orang Tua</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">
                Password Awal (min. 10 karakter) *
              </span>
              <input
                type="password"
                required
                minLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 10 karakter"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1.5 md:col-span-2">
              <span className="text-xs font-semibold text-[#2E4237]">
                Child ID terkait (khusus Orang Tua, pisahkan koma)
              </span>
              <input
                type="text"
                value={childIds}
                onChange={(e) => setChildIds(e.target.value)}
                placeholder="Contoh: FTH-2601, FTH-2602"
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            {creating ? "Membuat Akun..." : "Buat Akun"}
          </button>
        </form>
      </section>

      {/* Users Table */}
      <section className="bg-white border border-[#E2E8E4] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EBF0ED] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#14281E]">
              Daftar Pengguna ({users.length})
            </h2>
            <p className="text-xs text-[#64776D] mt-0.5">
              Aktifkan atau nonaktifkan akses kapan saja tanpa menghapus rekam asesmen.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadUsers}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#2E4237] bg-[#F2F6F3] hover:bg-[#E5EEE8] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Muat Ulang
            </button>
            <button
              type="button"
              onClick={handleRunDiagnostics}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1E713B] bg-[#EAF4EC] hover:bg-[#DCECE0] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              Diagnostik Database
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-[#64776D]">Memuat daftar pengguna...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F4F7F5] text-xs font-semibold text-[#4B6155] border-b border-[#E6ECE8]">
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Child ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2EF]">
                {users.map((u) => (
                  <tr key={u.email} className="hover:bg-[#F7FAF8]">
                    <td className="py-3 px-4 font-medium text-[#14281E] whitespace-nowrap">
                      {u.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#4C6256] whitespace-nowrap">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-[#2E4237] whitespace-nowrap">
                      {u.role === "ORANG_TUA" ? "Orang Tua" : u.role}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#64776D] whitespace-nowrap">
                      {u.childIds.length ? u.childIds.join(", ") : "—"}
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      <span
                        className={
                          u.status === "ACTIVE"
                            ? "font-semibold text-[#16793D]"
                            : "font-semibold text-[#B4232C]"
                        }
                      >
                        {u.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className="px-2.5 py-1.5 text-xs font-medium text-[#2E4237] bg-[#F2F6F3] hover:bg-[#E4EDE7] rounded-md transition-colors cursor-pointer"
                        >
                          {u.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetTarget(u);
                            setTempPassword("");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1E713B] bg-[#EAF4EC] hover:bg-[#DCECE0] rounded-md transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-3 h-3" />
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Diagnostics Summary */}
      {diagnostics && (
        <section className="bg-white border border-[#E2E8E4] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#14281E]">Hasil Diagnostik Database</h3>
            <button
              type="button"
              onClick={() => setDiagnostics(null)}
              className="text-xs text-[#64776D] hover:text-[#14281E] cursor-pointer"
            >
              Tutup
            </button>
          </div>
          <p className="text-xs text-[#54675D]">
            Engine: <strong className="text-[#14281E]">{diagnostics.databaseEngine}</strong> ·
            Penyimpanan: <span className="font-mono">{diagnostics.storagePath}</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div className="bg-[#F7FAF8] border border-[#E6ECE8] rounded-lg p-3">
              <div className="text-[11px] text-[#64776D]">DATABASE ANAK</div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#14281E] mt-1">
                {diagnostics.counts.children}
              </div>
            </div>
            <div className="bg-[#F7FAF8] border border-[#E6ECE8] rounded-lg p-3">
              <div className="text-[11px] text-[#64776D]">DATABASE ASESMEN</div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#14281E] mt-1">
                {diagnostics.counts.assessments}
              </div>
            </div>
            <div className="bg-[#F7FAF8] border border-[#E6ECE8] rounded-lg p-3">
              <div className="text-[11px] text-[#64776D]">PARENT INSIGHT</div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#14281E] mt-1">
                {diagnostics.counts.parentSubmissions}
              </div>
            </div>
            <div className="bg-[#F7FAF8] border border-[#E6ECE8] rounded-lg p-3">
              <div className="text-[11px] text-[#64776D]">REPORT BUILDER</div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#14281E] mt-1">
                {diagnostics.counts.reports}
              </div>
            </div>
            <div className="bg-[#F7FAF8] border border-[#E6ECE8] rounded-lg p-3">
              <div className="text-[11px] text-[#64776D]">USERS NATIVA</div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#14281E] mt-1">
                {diagnostics.counts.users}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#DDE5DF] rounded-xl max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#14281E]">Reset Password Pengguna</h3>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="p-1 text-[#64776D] hover:text-[#14281E] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#54675D]">
              Masukkan password sementara baru untuk{" "}
              <strong className="text-[#14281E]">{resetTarget.email}</strong> (minimal 10 karakter).
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="password"
                required
                minLength={10}
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Password sementara baru"
                className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#4B6155] bg-[#F2F6F3] hover:bg-[#E4EDE7] rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] disabled:opacity-50 rounded-lg cursor-pointer"
                >
                  {resetting ? "Mereset..." : "Simpan Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
