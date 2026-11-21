import { CheckCircle2, HeartHandshake, RefreshCw, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  NATIVA_PATTERNS,
  PARENT_QUESTIONS,
  PATTERN_META,
  SCORE_SCALE,
  type NativaPattern,
} from "../data/nativaQuestions.ts";
import { api, type ParentPortalChild } from "../lib/api.ts";
import { formatDateID } from "../lib/nativaScoring.ts";
import type { ParentSubmission, UserAccount } from "../types/nativa.ts";

interface ParentPortalViewProps {
  currentUser: UserAccount;
  onSubmitted?: () => Promise<void>;
  onNotify: (message: string, tone?: "success" | "error") => void;
}

export function ParentPortalView({
  currentUser,
  onSubmitted,
  onNotify,
}: ParentPortalViewProps) {
  const [children, setChildren] = useState<ParentPortalChild[]>([]);
  const [submissions, setSubmissions] = useState<ParentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedChildId, setSelectedChildId] = useState("");
  const [activePattern, setActivePattern] = useState<NativaPattern>("Grounder");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [generalNotes, setGeneralNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadPortal = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getParentPortal(currentUser.email);
      setChildren(data.children);
      setSubmissions(data.submissions);
      setSelectedChildId((prev) =>
        prev && data.children.some((c) => c.id === prev)
          ? prev
          : data.children[0]?.id || ""
      );
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Gagal memuat data Portal Orang Tua.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser.email, onNotify]);

  useEffect(() => {
    loadPortal();
  }, [loadPortal]);

  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / PARENT_QUESTIONS.length) * 100);

  const patternProgress = useMemo(() => {
    const map = {} as Record<NativaPattern, number>;
    for (const p of NATIVA_PATTERNS) {
      map[p] = PARENT_QUESTIONS.filter((q) => q.pattern === p && answers[q.code]).length;
    }
    return map;
  }, [answers]);

  const visibleQuestions = useMemo(
    () => PARENT_QUESTIONS.filter((q) => q.pattern === activePattern),
    [activePattern]
  );

  async function handleSubmit() {
    if (!selectedChildId) {
      onNotify("Pilih anak terlebih dahulu.", "error");
      return;
    }
    if (answeredCount < 10) {
      onNotify(
        `Mohon lengkapi lebih banyak pernyataan terlebih dahulu (${answeredCount}/50 terisi).`,
        "error"
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitParentInsight({
        childId: selectedChildId,
        answers,
        notes: generalNotes,
        submittedByEmail: currentUser.email,
        submittedByName: currentUser.name,
      });
      onNotify(`Parent Insight berhasil dikirim (${res.answerCount} jawaban).`);
      setAnswers({});
      setGeneralNotes("");
      await loadPortal();
      if (onSubmitted) await onSubmitted();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal mengirim Parent Insight.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#1E713B]">
            NATIVA · FAMILY PARTNERSHIP
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#14281E] mt-1">
            Portal Orang Tua
          </h1>
          <p className="mt-1 text-sm text-[#586A60]">
            Selamat datang, {currentUser.name}. Pengamatan harian Anda di rumah sangat membantu
            asesor memahami kecenderungan belajar anak.
          </p>
        </div>
        <button
          type="button"
          onClick={loadPortal}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#2E4237] bg-white border border-[#D4DFD7] hover:bg-[#F2F6F3] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Muat Ulang
        </button>
      </div>

      {/* Gentle Guidance */}
      <div className="bg-[#FAF8F0] border border-[#E9DFBE] rounded-xl px-5 py-4 text-xs leading-relaxed text-[#574B24] flex items-start gap-3">
        <HeartHandshake className="w-4 h-4 text-[#9A741B] shrink-0 mt-0.5" />
        <p>
          Parent Insight membantu asesor memahami perilaku dan kecenderungan belajar anak di rumah.
          Jawaban Anda menjadi salah satu sumber informasi asesmen, bukan diagnosis atau label
          permanen.
        </p>
      </div>

      {/* Linked Children */}
      <section className="bg-white border border-[#E2E8E4] rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#14281E]">Anak yang Terhubung</h2>
          <p className="text-xs text-[#64776D] mt-0.5">
            {currentUser.role === "ORANG_TUA"
              ? "Hanya anak yang ditautkan Admin ke akun Anda yang ditampilkan."
              : "Mode pratinjau Admin/Asesor menampilkan seluruh peserta didik terdaftar."}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-24 bg-[#F4F7F5] rounded-lg animate-pulse" />
            <div className="h-24 bg-[#F4F7F5] rounded-lg animate-pulse" />
          </div>
        ) : children.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#64776D]">
            Belum ada anak yang ditautkan ke akun ini. Hubungi Admin FATIHA untuk menautkan Child
            ID.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => {
              const isSelected = child.id === selectedChildId;
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildId(child.id)}
                  className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#F4FAF6] border-[#1E713B]"
                      : "bg-white border-[#E2E8E4] hover:border-[#B8CEC0]"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-sm text-[#14281E]">{child.name}</span>
                    <span className="font-mono text-[11px] text-[#1E713B] tabular-nums">
                      {child.id}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#64776D]">
                    Lahir: {child.dob ? formatDateID(child.dob) : "Belum diisi"}
                  </p>
                  <p className="mt-2 text-xs font-medium text-[#2E5E40]">
                    {child.latestSubmission
                      ? `Terkirim · ${child.latestSubmission.answerCount} jawaban (${formatDateID(
                          child.latestSubmission.submittedAt
                        )})`
                      : "Belum mengisi Parent Insight"}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 50-Item Parent Insight Questionnaire */}
      <section className="bg-white border border-[#E2E8E4] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#EBF0ED] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#14281E]">
                Parent Insight — Pengamatan di Rumah
              </h2>
              <p className="text-xs text-[#64776D] mt-0.5">
                Jawab 50 pernyataan berdasarkan kebiasaan anak dalam beberapa minggu terakhir.
              </p>
            </div>
            <div className="text-right font-mono text-xs text-[#1E713B] font-semibold tabular-nums whitespace-nowrap">
              {answeredCount} / 50 terjawab ({progressPct}%)
            </div>
          </div>

          <div className="h-2 bg-[#EEF2EF] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1E713B] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <label className="block w-full md:w-80 space-y-1">
              <span className="text-xs font-semibold text-[#2E4237]">Pilih Anak</span>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              >
                <option value="">Pilih anak</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.id}
                  </option>
                ))}
              </select>
            </label>

            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F2F6F3] rounded-lg">
              {NATIVA_PATTERNS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActivePattern(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activePattern === p
                      ? "bg-white text-[#14281E] shadow-xs"
                      : "text-[#586A60] hover:text-[#14281E]"
                  }`}
                >
                  {p} ({patternProgress[p]}/10)
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-[#55685D] flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
            <span className="font-semibold text-[#2E4237]">Skala jawaban:</span>
            {SCORE_SCALE.map((s) => (
              <span key={s.value}>
                <strong className="font-mono text-[#172C21]">{s.value}</strong> {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Questions for Active Pattern */}
        <div className="divide-y divide-[#EEF2EF] px-6">
          {visibleQuestions.map((q) => {
            const val = answers[q.code];
            return (
              <div
                key={q.code}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 max-w-2xl">
                  <span className="font-mono text-xs font-semibold text-[#64776D] w-10 shrink-0 pt-0.5 tabular-nums">
                    {q.code}
                  </span>
                  <div>
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: PATTERN_META[q.pattern].color }}
                    >
                      {q.pattern}
                    </span>
                    <p className="text-sm text-[#172820] leading-relaxed mt-0.5">{q.text}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-13 md:pl-0">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.code]: n }))}
                      className={`w-10 h-10 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                        val === n
                          ? "bg-[#1E713B] text-white border-[#1E713B]"
                          : "bg-white text-[#3B5045] border-[#D5E0D8] hover:border-[#1E713B] hover:text-[#1E713B]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pattern step navigation + Notes + Submit */}
        <div className="p-6 bg-[#F9FBF9] border-t border-[#E6ECE8] space-y-5">
          <div className="flex items-center justify-between gap-3">
            {NATIVA_PATTERNS.indexOf(activePattern) > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setActivePattern(NATIVA_PATTERNS[NATIVA_PATTERNS.indexOf(activePattern) - 1])
                }
                className="text-xs font-semibold text-[#4B6155] hover:text-[#14281E] cursor-pointer"
              >
                ← Pola sebelumnya ({NATIVA_PATTERNS[NATIVA_PATTERNS.indexOf(activePattern) - 1]})
              </button>
            ) : (
              <span />
            )}

            {NATIVA_PATTERNS.indexOf(activePattern) < NATIVA_PATTERNS.length - 1 && (
              <button
                type="button"
                onClick={() =>
                  setActivePattern(NATIVA_PATTERNS[NATIVA_PATTERNS.indexOf(activePattern) + 1])
                }
                className="text-xs font-semibold text-[#1E713B] hover:text-[#144E28] cursor-pointer"
              >
                Lanjut ke {NATIVA_PATTERNS[NATIVA_PATTERNS.indexOf(activePattern) + 1]} →
              </button>
            )}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#2E4237]">
              Catatan tambahan untuk asesor (opsional)
            </span>
            <textarea
              rows={3}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Ceritakan contoh perilaku, minat, atau situasi di rumah yang penting diketahui asesor."
              className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setGeneralNotes("");
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#4D6156] bg-white border border-[#D4DFD7] hover:bg-[#F2F6F3] rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Kosongkan Jawaban
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !selectedChildId}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Mengirim..." : "Kirim Parent Insight"}
            </button>
          </div>
        </div>
      </section>

      {/* Submission History */}
      <section className="bg-white border border-[#E2E8E4] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EBF0ED]">
          <h2 className="text-base font-semibold text-[#14281E]">Riwayat Pengiriman</h2>
          <p className="text-xs text-[#64776D] mt-0.5">
            Status pengiriman Parent Insight yang dapat langsung diimpor asesor ke formulir asesmen.
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-[#64776D]">
            Belum ada riwayat pengiriman Parent Insight.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F4F7F5] text-xs font-semibold text-[#4B6155] border-b border-[#E6ECE8]">
                  <th className="py-3 px-4">ID Kiriman</th>
                  <th className="py-3 px-4">Nama Anak</th>
                  <th className="py-3 px-4">Pengirim</th>
                  <th className="py-3 px-4">Tanggal Kirim</th>
                  <th className="py-3 px-4 text-right">Jumlah Item</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2EF]">
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="py-3 px-4 font-mono text-xs text-[#4F6358] tabular-nums">
                      {sub.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#14281E]">{sub.childName}</td>
                    <td className="py-3 px-4 text-xs text-[#54675D]">{sub.submittedByName}</td>
                    <td className="py-3 px-4 text-xs text-[#54675D] tabular-nums">
                      {formatDateID(sub.submittedAt)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-[#1E713B] font-semibold tabular-nums">
                      {sub.answerCount} / 50
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="text-center text-xs text-[#6B7E74] py-2">
        FATIHA Daycare and Learning Center · Tumbuh Bahagia, Belajar Sesuai Fitrah
      </footer>
    </div>
  );
}
