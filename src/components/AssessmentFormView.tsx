import { CheckCircle2, Download, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ACTIVITY_CHALLENGES,
  NATIVA_PATTERNS,
  OBSERVATION_QUESTIONS,
  PARENT_QUESTIONS,
  PATTERN_META,
  SCORE_SCALE,
  type NativaPattern,
} from "../data/nativaQuestions.ts";
import { api } from "../lib/api.ts";
import { calculateAssessmentResult, formatAgeFromDob } from "../lib/nativaScoring.ts";
import type { AssessmentRecord, ChildRecord, UserAccount } from "../types/nativa.ts";

interface AssessmentFormViewProps {
  childrenList: ChildRecord[];
  currentUser: UserAccount;
  preselectedChildId?: string;
  onDataChanged: () => Promise<void>;
  onOpenReport: (assessmentId: string) => void;
  onNotify: (message: string, tone?: "success" | "error") => void;
}

type SourceTab = "parent" | "observation" | "activities";

export function AssessmentFormView({
  childrenList,
  currentUser,
  preselectedChildId,
  onDataChanged,
  onOpenReport,
  onNotify,
}: AssessmentFormViewProps) {
  const [childId, setChildId] = useState(preselectedChildId || "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [age, setAge] = useState("");
  const [assessor, setAssessor] = useState(currentUser.name);
  const [assessmentId, setAssessmentId] = useState("");
  const [notes, setNotes] = useState("");

  const [parentScores, setParentScores] = useState<Record<string, number>>({});
  const [observationScores, setObservationScores] = useState<Record<string, number>>({});
  const [activityScores, setActivityScores] = useState<Record<string, number>>({});

  const [parentNotes, setParentNotes] = useState<Record<string, string>>({});
  const [observationNotes, setObservationNotes] = useState<Record<string, string>>({});
  const [activityNotes, setActivityNotes] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<SourceTab>("parent");
  const [patternFilter, setPatternFilter] = useState<"ALL" | NativaPattern>("ALL");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [savedResult, setSavedResult] = useState<AssessmentRecord | null>(null);

  useEffect(() => {
    if (preselectedChildId) {
      setChildId(preselectedChildId);
    }
  }, [preselectedChildId]);

  useEffect(() => {
    const child = childrenList.find((c) => c.id === childId);
    if (child?.dob) {
      const computed = formatAgeFromDob(child.dob, date);
      if (computed) setAge(computed);
    }
  }, [childId, date, childrenList]);

  const parentAnswered = Object.keys(parentScores).length;
  const observationAnswered = Object.keys(observationScores).length;
  const activityAnswered = Object.keys(activityScores).length;

  const liveCalc = useMemo(
    () => calculateAssessmentResult(parentScores, observationScores, activityScores),
    [parentScores, observationScores, activityScores]
  );

  const hasAnyAnswer = parentAnswered + observationAnswered + activityAnswered > 0;

  async function handleImportParentInsight() {
    if (!childId) {
      onNotify("Pilih anak terlebih dahulu sebelum mengambil jawaban orang tua.", "error");
      return;
    }
    setImporting(true);
    try {
      const submission = await api.getLatestParentInsight(childId);
      setParentScores(submission.answers);
      if (submission.notes && !notes) {
        setNotes(`Catatan Orang Tua: ${submission.notes}`);
      }
      onNotify(
        `Berhasil mengambil ${submission.answerCount} jawaban Parent Insight (${submission.id}).`
      );
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : "Belum ada kiriman Parent Insight untuk anak ini.",
        "error"
      );
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setChildId("");
    setDate(new Date().toISOString().slice(0, 10));
    setAge("");
    setAssessor(currentUser.name);
    setAssessmentId("");
    setNotes("");
    setParentScores({});
    setObservationScores({});
    setActivityScores({});
    setParentNotes({});
    setObservationNotes({});
    setActivityNotes({});
    setSavedResult(null);
  }

  async function handleSubmit() {
    if (!childId) {
      onNotify("Pilih anak terdaftar terlebih dahulu.", "error");
      return;
    }
    if (!date) {
      onNotify("Tanggal asesmen wajib diisi.", "error");
      return;
    }
    if (!assessor.trim()) {
      onNotify("Nama asesor wajib diisi.", "error");
      return;
    }
    if (!hasAnyAnswer) {
      onNotify("Isi minimal beberapa item penilaian sebelum menyimpan asesmen.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await api.createAssessment({
        childId,
        date,
        age,
        assessor: assessor.trim(),
        assessmentId: assessmentId.trim() || undefined,
        notes,
        parent: parentScores,
        observation: observationScores,
        activities: activityScores,
        itemNotes: {
          parent: parentNotes,
          observation: observationNotes,
          activities: activityNotes,
        },
      });
      setSavedResult(res.assessment);
      await onDataChanged();
      onNotify(`Asesmen ${res.assessment.id} berhasil dihitung dan disimpan.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal menyimpan asesmen.", "error");
    } finally {
      setSaving(false);
    }
  }

  const filteredParentQuestions = useMemo(
    () =>
      patternFilter === "ALL"
        ? PARENT_QUESTIONS
        : PARENT_QUESTIONS.filter((q) => q.pattern === patternFilter),
    [patternFilter]
  );

  const filteredObservationQuestions = useMemo(
    () =>
      patternFilter === "ALL"
        ? OBSERVATION_QUESTIONS
        : OBSERVATION_QUESTIONS.filter((q) => q.pattern === patternFilter),
    [patternFilter]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#14281E]">Input Asesmen NATIVA</h1>
        <p className="mt-1 text-sm text-[#586A60]">
          Padukan tiga sumber penilaian sesuai panduan workbook v1.3: Parent Insight (40%), Educator
          Observation (30%), dan Child Activity Challenge (30%).
        </p>
      </div>

      {/* Assessment Identity */}
      <section className="bg-white border border-[#E2E8E4] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#14281E]">Identitas Asesmen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#2E4237]">Anak *</span>
            <select
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
            >
              <option value="">Pilih anak terdaftar</option>
              {childrenList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.id}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#2E4237]">Tanggal Asesmen *</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#2E4237]">Usia saat asesmen</span>
            <input
              type="text"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Contoh: 4 tahun 2 bulan"
              className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#2E4237]">Nama Asesor *</span>
            <input
              type="text"
              value={assessor}
              onChange={(e) => setAssessor(e.target.value)}
              placeholder="Nama lengkap asesor"
              className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#2E4237]">ID Asesmen (opsional)</span>
            <input
              type="text"
              value={assessmentId}
              onChange={(e) => setAssessmentId(e.target.value)}
              placeholder="Otomatis jika dikosongkan"
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#2E4237]">Catatan / konteks umum</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Situasi kelas, mood anak, atau konteks sesi"
              className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
            />
          </label>
        </div>
      </section>

      {/* Live Preview Strip */}
      <section className="bg-white border border-[#E2E8E4] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#EEF2EF]">
          <div>
            <h2 className="text-sm font-semibold text-[#14281E]">
              Pratinjau Skor Sementara (Bobot 40% / 30% / 30%)
            </h2>
            <p className="text-xs text-[#64776D] mt-0.5 tabular-nums">
              Parent Insight {parentAnswered}/50 · Educator Observation {observationAnswered}/25 ·
              Activity Challenge {activityAnswered}/5
            </p>
          </div>
          {hasAnyAnswer && (
            <div className="text-xs text-[#374E42] whitespace-nowrap">
              Sementara: <strong className="text-[#1E713B]">{liveCalc.primary}</strong> ·{" "}
              {liveCalc.secondary} · {liveCalc.supporting}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4">
          {NATIVA_PATTERNS.map((pattern, i) => {
            const val = liveCalc.scores[i];
            const meta = PATTERN_META[pattern];
            return (
              <div key={pattern} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-[#172C21]">{pattern}</span>
                  <span className="font-mono font-semibold tabular-nums text-[#14281E]">
                    {val.toFixed(1)}
                  </span>
                </div>
                <div className="h-1.5 bg-[#EEF2EF] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{ width: `${val}%`, backgroundColor: meta.color }}
                  />
                </div>
                <div className="text-[11px] text-[#6B7E74]">{liveCalc.levels[i]}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Source Tabs + Questionnaire Body */}
      <section className="bg-white border border-[#E2E8E4] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EBF0ED] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F2F6F3] rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab("parent")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "parent"
                  ? "bg-white text-[#14281E] shadow-xs"
                  : "text-[#586A60] hover:text-[#14281E]"
              }`}
            >
              A. Parent Insight ({parentAnswered}/50)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("observation")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "observation"
                  ? "bg-white text-[#14281E] shadow-xs"
                  : "text-[#586A60] hover:text-[#14281E]"
              }`}
            >
              B. Educator Observation ({observationAnswered}/25)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("activities")}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === "activities"
                  ? "bg-white text-[#14281E] shadow-xs"
                  : "text-[#586A60] hover:text-[#14281E]"
              }`}
            >
              C. Activity Challenge ({activityAnswered}/5)
            </button>
          </div>

          {activeTab === "parent" && (
            <button
              type="button"
              onClick={handleImportParentInsight}
              disabled={importing}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#1E713B] bg-[#EAF4EC] hover:bg-[#DCECE0] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {importing ? "Mengambil..." : "Ambil Jawaban Orang Tua"}
            </button>
          )}
        </div>

        {/* Scale legend + Pattern Filter for A & B */}
        <div className="px-5 py-3 bg-[#F9FBF9] border-b border-[#EEF2EF] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-xs text-[#55685D] flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-[#2E4237]">Skala 1–5:</span>
            {SCORE_SCALE.map((s) => (
              <span key={s.value}>
                <strong className="font-mono text-[#172C21]">{s.value}</strong> {s.label}
              </span>
            ))}
          </div>

          {activeTab !== "activities" && (
            <div className="inline-flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setPatternFilter("ALL")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  patternFilter === "ALL"
                    ? "bg-[#1E713B] text-white"
                    : "text-[#586A60] hover:bg-[#EAF1EC]"
                }`}
              >
                Semua
              </button>
              {NATIVA_PATTERNS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPatternFilter(p)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    patternFilter === p
                      ? "bg-[#1E713B] text-white"
                      : "text-[#586A60] hover:bg-[#EAF1EC]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Question Rows */}
        <div className="divide-y divide-[#EEF2EF] px-5">
          {activeTab === "parent" &&
            filteredParentQuestions.map((q) => {
              const currentVal = parentScores[q.code];
              return (
                <div
                  key={q.code}
                  className="py-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center"
                >
                  <div className="lg:col-span-6 flex items-start gap-3">
                    <span className="font-mono text-xs font-semibold text-[#64776D] w-11 shrink-0 pt-0.5 tabular-nums">
                      {q.code}
                    </span>
                    <div>
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: PATTERN_META[q.pattern].color }}
                      >
                        {q.pattern}
                      </span>
                      <p className="text-sm text-[#172820] leading-snug mt-0.5">{q.text}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-3 flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setParentScores((prev) => ({ ...prev, [q.code]: n }))
                        }
                        className={`w-9 h-9 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                          currentVal === n
                            ? "bg-[#1E713B] text-white border-[#1E713B]"
                            : "bg-white text-[#3B5045] border-[#D5E0D8] hover:border-[#1E713B] hover:text-[#1E713B]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <div className="lg:col-span-3">
                    <input
                      type="text"
                      value={parentNotes[q.code] || ""}
                      onChange={(e) =>
                        setParentNotes((prev) => ({ ...prev, [q.code]: e.target.value }))
                      }
                      placeholder="Catatan (opsional)"
                      className="w-full px-3 py-1.5 text-xs bg-[#FAFBF9] border border-[#DDE6DF] rounded-lg focus:outline-none focus:bg-white focus:border-[#1E713B]"
                    />
                  </div>
                </div>
              );
            })}

          {activeTab === "observation" &&
            filteredObservationQuestions.map((q) => {
              const currentVal = observationScores[q.code];
              return (
                <div
                  key={q.code}
                  className="py-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center"
                >
                  <div className="lg:col-span-6 flex items-start gap-3">
                    <span className="font-mono text-xs font-semibold text-[#64776D] w-16 shrink-0 pt-0.5 tabular-nums">
                      {q.code}
                    </span>
                    <div>
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: PATTERN_META[q.pattern].color }}
                      >
                        {q.pattern}
                      </span>
                      <p className="text-sm text-[#172820] leading-snug mt-0.5">{q.text}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-3 flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setObservationScores((prev) => ({ ...prev, [q.code]: n }))
                        }
                        className={`w-9 h-9 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                          currentVal === n
                            ? "bg-[#1E713B] text-white border-[#1E713B]"
                            : "bg-white text-[#3B5045] border-[#D5E0D8] hover:border-[#1E713B] hover:text-[#1E713B]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <div className="lg:col-span-3">
                    <input
                      type="text"
                      value={observationNotes[q.code] || ""}
                      onChange={(e) =>
                        setObservationNotes((prev) => ({ ...prev, [q.code]: e.target.value }))
                      }
                      placeholder="Catatan observasi (opsional)"
                      className="w-full px-3 py-1.5 text-xs bg-[#FAFBF9] border border-[#DDE6DF] rounded-lg focus:outline-none focus:bg-white focus:border-[#1E713B]"
                    />
                  </div>
                </div>
              );
            })}

          {activeTab === "activities" &&
            ACTIVITY_CHALLENGES.map((act) => {
              const currentVal = activityScores[act.code];
              return (
                <div
                  key={act.code}
                  className="py-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center"
                >
                  <div className="lg:col-span-6 flex items-start gap-3">
                    <span className="font-mono text-xs font-semibold text-[#1E713B] w-12 shrink-0 pt-0.5 tabular-nums">
                      {act.code}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#14281E]">{act.name}</p>
                      <p className="text-xs text-[#5E7166] leading-relaxed mt-0.5">{act.guide}</p>
                    </div>
                  </div>

                  <div className="lg:col-span-3 flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setActivityScores((prev) => ({ ...prev, [act.code]: n }))
                        }
                        className={`w-9 h-9 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                          currentVal === n
                            ? "bg-[#1E713B] text-white border-[#1E713B]"
                            : "bg-white text-[#3B5045] border-[#D5E0D8] hover:border-[#1E713B] hover:text-[#1E713B]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <div className="lg:col-span-3">
                    <input
                      type="text"
                      value={activityNotes[act.code] || ""}
                      onChange={(e) =>
                        setActivityNotes((prev) => ({ ...prev, [act.code]: e.target.value }))
                      }
                      placeholder="Respons anak (opsional)"
                      className="w-full px-3 py-1.5 text-xs bg-[#FAFBF9] border border-[#DDE6DF] rounded-lg focus:outline-none focus:bg-white focus:border-[#1E713B]"
                    />
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-[#F9FBF9] border-t border-[#E6ECE8] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#4D6156] hover:text-[#14281E] bg-white border border-[#D4DFD7] hover:bg-[#F2F6F3] rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Kosongkan Form
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saving ? "Menghitung & Menyimpan..." : "Hitung & Simpan Asesmen"}
          </button>
        </div>
      </section>

      {/* Saved Result Confirmation */}
      {savedResult && (
        <section className="bg-white border border-[#1E713B]/40 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBF0ED]">
            <div>
              <p className="text-xs font-semibold text-[#1E713B]">Asesmen Tersimpan</p>
              <h2 className="text-xl font-bold text-[#14281E] mt-0.5">
                Hasil NATIVA · {savedResult.name}
              </h2>
              <p className="text-xs text-[#64776D] font-mono mt-0.5">{savedResult.id}</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenReport(savedResult.id)}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Buka Laporan &amp; Sertifikat
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {NATIVA_PATTERNS.map((pattern, i) => (
              <div key={pattern} className="space-y-1.5">
                <div className="text-xs font-semibold text-[#54675D]">{pattern}</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#14281E]">
                  {savedResult.scores[i].toFixed(1)}
                </div>
                <div className="h-1.5 bg-[#EEF2EF] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${savedResult.scores[i]}%`,
                      backgroundColor: PATTERN_META[pattern].color,
                    }}
                  />
                </div>
                <div className="text-xs text-[#6B7E74]">{savedResult.levels[i]}</div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-sm text-[#354B3F] space-y-1">
            <p>
              Primary: <strong className="text-[#14281E]">{savedResult.primary}</strong> · Secondary:{" "}
              <strong className="text-[#14281E]">{savedResult.secondary}</strong> · Supporting:{" "}
              <strong className="text-[#14281E]">{savedResult.supporting}</strong>
            </p>
            <p className="text-xs text-[#64776D]">{savedResult.consistency}</p>
          </div>
        </section>
      )}
    </div>
  );
}
