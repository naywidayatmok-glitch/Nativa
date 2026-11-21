import { Pencil, Plus, Search, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { api } from "../lib/api.ts";
import { formatAgeFromDob, formatDateID } from "../lib/nativaScoring.ts";
import type { AssessmentRecord, ChildRecord } from "../types/nativa.ts";

interface ChildrenViewProps {
  childrenList: ChildRecord[];
  assessments: AssessmentRecord[];
  onDataChanged: () => Promise<void>;
  onStartAssessmentForChild: (childId: string) => void;
  onNotify: (message: string, tone?: "success" | "error") => void;
}

const emptyForm = {
  name: "",
  dob: "",
  gender: "" as "" | "Laki-laki" | "Perempuan",
  parent: "",
  contact: "",
  joinedDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

export function ChildrenView({
  childrenList,
  assessments,
  onDataChanged,
  onStartAssessmentForChild,
  onNotify,
}: ChildrenViewProps) {
  const [form, setForm] = useState(emptyForm);
  const [editingChild, setEditingChild] = useState<ChildRecord | null>(null);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const assessmentCountByChild = useMemo(() => {
    const map: Record<string, number> = {};
    assessments.forEach((a) => {
      map[a.childId] = (map[a.childId] || 0) + 1;
    });
    return map;
  }, [assessments]);

  const filteredChildren = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return childrenList;
    return childrenList.filter((c) =>
      `${c.id} ${c.name} ${c.parent} ${c.contact}`.toLowerCase().includes(q)
    );
  }, [childrenList, search]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      onNotify("Nama anak wajib diisi.", "error");
      return;
    }
    setSubmitting(true);
    try {
      if (editingChild) {
        await api.updateChild(editingChild.id, form);
        onNotify(`Data anak ${form.name} berhasil diperbarui.`);
        setEditingChild(null);
      } else {
        const created = await api.createChild(form);
        onNotify(`Data anak tersimpan dengan Child ID ${created.id}.`);
      }
      setForm({ ...emptyForm, joinedDate: new Date().toISOString().slice(0, 10) });
      await onDataChanged();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal menyimpan data anak.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(child: ChildRecord) {
    setEditingChild(child);
    setForm({
      name: child.name,
      dob: child.dob,
      gender: child.gender,
      parent: child.parent,
      contact: child.contact,
      joinedDate: child.joinedDate,
      notes: child.notes,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingChild(null);
    setForm({ ...emptyForm, joinedDate: new Date().toISOString().slice(0, 10) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#14281E]">Database Anak</h1>
        <p className="mt-1 text-sm text-[#586A60]">
          Satu Child ID tetap untuk setiap peserta didik agar rekam asesmen tersambung secara
          historis.
        </p>
      </div>

      {/* Add / Edit Child Form */}
      <section className="bg-white border border-[#E2E8E4] rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-base font-semibold text-[#14281E]">
            {editingChild ? `Edit Data Anak · ${editingChild.id}` : "Tambah Data Anak"}
          </h2>
          {editingChild && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A6D62] hover:text-[#172820] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">Nama Anak *</span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nama lengkap anak"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">Tanggal Lahir</span>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">Jenis Kelamin</span>
              <select
                value={form.gender}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    gender: e.target.value as "" | "Laki-laki" | "Perempuan",
                  }))
                }
                className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
              >
                <option value="">Pilih</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">Nama Orang Tua / Wali</span>
              <input
                type="text"
                value={form.parent}
                onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
                placeholder="Contoh: Ibu Nadia Rahmawati"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">Kontak (opsional)</span>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                placeholder="08xx-xxxx-xxxx"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">Tanggal Bergabung</span>
              <input
                type="date"
                value={form.joinedDate}
                onChange={(e) => setForm((f) => ({ ...f, joinedDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#2E4237]">Catatan Umum</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Catatan awal mengenai minat, kebiasaan, atau konteks perkembangan anak."
              className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
            />
          </label>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {submitting
                ? "Menyimpan..."
                : editingChild
                ? "Simpan Perubahan"
                : "Simpan Data Anak"}
            </button>
          </div>
        </form>
      </section>

      {/* Registered Children Table */}
      <section className="bg-white border border-[#E2E8E4] rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#EBF0ED]">
          <div>
            <h2 className="text-base font-semibold text-[#14281E]">
              Daftar Anak ({filteredChildren.length})
            </h2>
            <p className="text-xs text-[#64776D] mt-0.5">
              Child ID otomatis digunakan untuk menautkan akun Orang Tua dan sesi asesmen.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#7A8C82] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, Child ID, orang tua..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8FAF8] border border-[#D7E1DA] rounded-lg focus:outline-none focus:bg-white focus:border-[#1E713B]"
            />
          </div>
        </div>

        {filteredChildren.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-[#63766C]">
            Tidak ada data anak yang sesuai pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F4F7F5] text-xs font-semibold text-[#4B6155] border-b border-[#E6ECE8]">
                  <th className="py-3 px-4">Child ID</th>
                  <th className="py-3 px-4">Nama Anak</th>
                  <th className="py-3 px-4">Tanggal Lahir / Usia</th>
                  <th className="py-3 px-4">Orang Tua / Wali</th>
                  <th className="py-3 px-4">Kontak</th>
                  <th className="py-3 px-4 text-right">Asesmen</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2EF]">
                {filteredChildren.map((child) => {
                  const ageStr = formatAgeFromDob(child.dob);
                  const count = assessmentCountByChild[child.id] || 0;
                  return (
                    <tr key={child.id} className="hover:bg-[#F7FAF8] transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-medium text-[#1E713B] tabular-nums whitespace-nowrap">
                        {child.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#14281E] whitespace-nowrap">
                          {child.name}
                        </div>
                        {child.gender && (
                          <div className="text-xs text-[#6B7E74]">{child.gender}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#4C6055] whitespace-nowrap">
                        <div>{child.dob ? formatDateID(child.dob) : "—"}</div>
                        {ageStr && <div className="text-[#72847A]">{ageStr}</div>}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#31463B] whitespace-nowrap">
                        {child.parent || "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#54675D] tabular-nums whitespace-nowrap">
                        {child.contact || "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-[#2B4035] tabular-nums whitespace-nowrap">
                        {count} sesi
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onStartAssessmentForChild(child.id)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-[#1E713B] bg-[#EAF4EC] hover:bg-[#DCECE0] rounded-md transition-colors cursor-pointer"
                          >
                            Asesmen
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(child)}
                            title="Edit data anak"
                            className="p-1.5 text-[#54675D] hover:text-[#14281E] hover:bg-[#EDF2EE] rounded-md transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
