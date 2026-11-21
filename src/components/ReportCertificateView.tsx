import { ChevronDown, ChevronUp, Printer, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NATIVA_PATTERNS, PATTERN_META } from "../data/nativaQuestions.ts";
import { api } from "../lib/api.ts";
import {
  calculateComponentScores,
  formatDateID,
  getScoreLevel,
} from "../lib/nativaScoring.ts";
import type { AssessmentRecord, ReportExtra } from "../types/nativa.ts";
import { RadarChart } from "./RadarChart.tsx";

interface ReportCertificateViewProps {
  assessments: AssessmentRecord[];
  selectedAssessmentId: string;
  onSelectAssessmentId: (id: string) => void;
  onNotify: (message: string, tone?: "success" | "error") => void;
}

type ReportMode = "certificate" | "parent" | "individual";

interface BuilderFormState {
  observationFindings: string;
  helpfulSituations: string;
  uncomfortableSituations: string;
  parentVoice: string;
  action: string;
  frequency: string;
  owner: string;
  indicator: string;
  followupDate: string;
  changes: string;
  effectiveStrategies: string;
  adjustments: string;
  nextPlan: string;
}

const emptyBuilder: BuilderFormState = {
  observationFindings: "",
  helpfulSituations: "",
  uncomfortableSituations: "",
  parentVoice: "",
  action: "",
  frequency: "",
  owner: "",
  indicator: "",
  followupDate: "",
  changes: "",
  effectiveStrategies: "",
  adjustments: "",
  nextPlan: "",
};

export function ReportCertificateView({
  assessments,
  selectedAssessmentId,
  onSelectAssessmentId,
  onNotify,
}: ReportCertificateViewProps) {
  const [mode, setMode] = useState<ReportMode>("certificate");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderForm, setBuilderForm] = useState<BuilderFormState>(emptyBuilder);
  const [reportExtra, setReportExtra] = useState<ReportExtra | null>(null);
  const [savingBuilder, setSavingBuilder] = useState(false);

  const sortedAssessments = useMemo(
    () =>
      [...assessments].sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      ),
    [assessments]
  );

  const effectiveId = selectedAssessmentId || sortedAssessments[0]?.id || "";
  const assessment = useMemo(
    () => assessments.find((a) => a.id === effectiveId) || null,
    [assessments, effectiveId]
  );

  useEffect(() => {
    if (!effectiveId) {
      setReportExtra(null);
      setBuilderForm(emptyBuilder);
      return;
    }
    let cancelled = false;
    api
      .getAssessmentDetail(effectiveId)
      .then((res) => {
        if (cancelled) return;
        const extra = res.reportExtra;
        setReportExtra(extra);
        const firstPlan = extra?.actionPlan?.[0];
        setBuilderForm({
          observationFindings: extra?.observationFindings || "",
          helpfulSituations: extra?.helpfulSituations || "",
          uncomfortableSituations: extra?.uncomfortableSituations || "",
          parentVoice: extra?.parentVoice || "",
          action: firstPlan?.action || "",
          frequency: firstPlan?.frequency || "",
          owner: firstPlan?.owner || "",
          indicator: firstPlan?.indicator || "",
          followupDate: extra?.followupDate || "",
          changes: extra?.changes || "",
          effectiveStrategies: extra?.effectiveStrategies || "",
          adjustments: extra?.adjustments || "",
          nextPlan: extra?.nextPlan || "",
        });
      })
      .catch(() => {
        if (!cancelled) {
          setReportExtra(null);
          setBuilderForm(emptyBuilder);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveId]);

  const componentScores = useMemo(() => {
    if (!assessment) return null;
    return calculateComponentScores(
      assessment.parent,
      assessment.observation,
      assessment.activities
    );
  }, [assessment]);

  async function handleSaveBuilder() {
    if (!assessment) return;
    setSavingBuilder(true);
    try {
      const saved = await api.saveReportExtra(assessment.id, {
        observationFindings: builderForm.observationFindings,
        helpfulSituations: builderForm.helpfulSituations,
        uncomfortableSituations: builderForm.uncomfortableSituations,
        parentVoice: builderForm.parentVoice,
        actionPlan: [
          {
            area: "Rencana aksi 2–4 minggu",
            action: builderForm.action,
            frequency: builderForm.frequency,
            owner: builderForm.owner,
            indicator: builderForm.indicator,
          },
        ],
        followupDate: builderForm.followupDate,
        changes: builderForm.changes,
        effectiveStrategies: builderForm.effectiveStrategies,
        adjustments: builderForm.adjustments,
        nextPlan: builderForm.nextPlan,
      });
      setReportExtra(saved);
      onNotify("Catatan Report Builder berhasil disimpan.");
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Gagal menyimpan Report Builder.", "error");
    } finally {
      setSavingBuilder(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-2xl font-bold tracking-tight text-[#14281E]">
          Laporan &amp; Sertifikat
        </h1>
        <p className="mt-1 text-sm text-[#586A60]">
          Sertifikat profil resmi, ringkasan ramah orang tua, dan laporan individual lengkap dengan
          Report Builder asesor.
        </p>
      </div>

      {/* Controls Bar */}
      <section className="no-print bg-white border border-[#E2E8E4] rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <label className="block flex-1 max-w-xl space-y-1.5">
            <span className="text-xs font-semibold text-[#2E4237]">Pilih Sesi Asesmen</span>
            <select
              value={effectiveId}
              onChange={(e) => onSelectAssessmentId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
            >
              {sortedAssessments.length === 0 ? (
                <option value="">Belum ada asesmen</option>
              ) : (
                sortedAssessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {formatDateID(a.date)} · {a.id}
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setBuilderOpen((o) => !o)}
              disabled={!assessment}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#2E4237] bg-[#F2F6F3] hover:bg-[#E5EEE8] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Report Builder
              {builderOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              disabled={!assessment}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Simpan PDF
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F2F6F3] rounded-lg">
          <button
            type="button"
            onClick={() => setMode("certificate")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === "certificate"
                ? "bg-white text-[#14281E] shadow-xs"
                : "text-[#586A60] hover:text-[#14281E]"
            }`}
          >
            Sertifikat Profil
          </button>
          <button
            type="button"
            onClick={() => setMode("parent")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === "parent"
                ? "bg-white text-[#14281E] shadow-xs"
                : "text-[#586A60] hover:text-[#14281E]"
            }`}
          >
            Ringkasan Orang Tua
          </button>
          <button
            type="button"
            onClick={() => setMode("individual")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === "individual"
                ? "bg-white text-[#14281E] shadow-xs"
                : "text-[#586A60] hover:text-[#14281E]"
            }`}
          >
            Laporan Individual
          </button>
        </div>
      </section>

      {/* Report Builder Collapsible Panel */}
      {builderOpen && assessment && (
        <section className="no-print bg-white border border-[#E2E8E4] rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-[#14281E]">
              Report Builder — Area Kerja Asesor
            </h2>
            <p className="text-xs text-[#64776D] mt-0.5">
              Lengkapi temuan observasi, rencana aksi 2–4 minggu, dan tinjau ulang sesuai sheet
              REPORT BUILDER pada workbook NATIVA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">
                Perilaku yang paling sering terlihat
              </span>
              <textarea
                rows={2}
                value={builderForm.observationFindings}
                onChange={(e) =>
                  setBuilderForm((f) => ({ ...f, observationFindings: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">
                Situasi yang membantu anak terlibat
              </span>
              <textarea
                rows={2}
                value={builderForm.helpfulSituations}
                onChange={(e) =>
                  setBuilderForm((f) => ({ ...f, helpfulSituations: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">
                Situasi yang membuat anak kurang nyaman
              </span>
              <textarea
                rows={2}
                value={builderForm.uncomfortableSituations}
                onChange={(e) =>
                  setBuilderForm((f) => ({ ...f, uncomfortableSituations: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#2E4237]">
                Suara dan perspektif orang tua
              </span>
              <textarea
                rows={2}
                value={builderForm.parentVoice}
                onChange={(e) => setBuilderForm((f) => ({ ...f, parentVoice: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-[#EEF2EF] space-y-3">
            <h3 className="text-sm font-semibold text-[#1E713B]">Rencana Aksi 2–4 Minggu</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block space-y-1.5 md:col-span-3">
                <span className="text-xs font-semibold text-[#2E4237]">
                  Area &amp; aktivitas / strategi stimulasi
                </span>
                <textarea
                  rows={2}
                  value={builderForm.action}
                  onChange={(e) => setBuilderForm((f) => ({ ...f, action: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#2E4237]">Frekuensi</span>
                <input
                  type="text"
                  value={builderForm.frequency}
                  onChange={(e) => setBuilderForm((f) => ({ ...f, frequency: e.target.value }))}
                  placeholder="Contoh: 3x per minggu"
                  className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#2E4237]">Penanggung jawab</span>
                <input
                  type="text"
                  value={builderForm.owner}
                  onChange={(e) => setBuilderForm((f) => ({ ...f, owner: e.target.value }))}
                  placeholder="Pendamping & Orang Tua"
                  className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#2E4237]">Indikator sederhana</span>
                <input
                  type="text"
                  value={builderForm.indicator}
                  onChange={(e) => setBuilderForm((f) => ({ ...f, indicator: e.target.value }))}
                  placeholder="Tanda keterlibatan yang diharapkan"
                  className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
                />
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-[#EEF2EF] space-y-3">
            <h3 className="text-sm font-semibold text-[#1E713B]">Tinjau Ulang</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#2E4237]">Tanggal tindak lanjut</span>
                <input
                  type="date"
                  value={builderForm.followupDate}
                  onChange={(e) =>
                    setBuilderForm((f) => ({ ...f, followupDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#2E4237]">
                  Perubahan yang terlihat
                </span>
                <input
                  type="text"
                  value={builderForm.changes}
                  onChange={(e) => setBuilderForm((f) => ({ ...f, changes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#2E4237]">Strategi yang efektif</span>
                <input
                  type="text"
                  value={builderForm.effectiveStrategies}
                  onChange={(e) =>
                    setBuilderForm((f) => ({ ...f, effectiveStrategies: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#2E4237]">
                  Hal yang perlu disesuaikan
                </span>
                <input
                  type="text"
                  value={builderForm.adjustments}
                  onChange={(e) => setBuilderForm((f) => ({ ...f, adjustments: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
                />
              </label>

              <label className="block space-y-1.5 md:col-span-2">
                <span className="text-xs font-semibold text-[#2E4237]">Rencana berikutnya</span>
                <input
                  type="text"
                  value={builderForm.nextPlan}
                  onChange={(e) => setBuilderForm((f) => ({ ...f, nextPlan: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#D4DFD7] rounded-lg focus:outline-none focus:border-[#1E713B]"
                />
              </label>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleSaveBuilder}
              disabled={savingBuilder}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingBuilder ? "Menyimpan..." : "Simpan Report Builder"}
            </button>
          </div>
        </section>
      )}

      {/* Report / Certificate Viewport */}
      {!assessment ? (
        <div className="bg-white border border-[#E2E8E4] rounded-xl px-6 py-16 text-center text-sm text-[#64776D]">
          Pilih asesmen untuk menampilkan laporan atau sertifikat.
        </div>
      ) : mode === "certificate" ? (
        <div className="space-y-8">
          {/* PAGE 1: OFFICIAL CERTIFICATE */}
          <article className="print-sheet relative overflow-hidden bg-white border border-[#D8E4DC] rounded-md max-w-[1080px] mx-auto shadow-sm">
            <div className="nativa-cert-corner-tl absolute top-0 left-0 w-44 h-44 sm:w-56 sm:h-56 pointer-events-none" />
            <div className="nativa-cert-corner-br absolute bottom-0 right-0 w-44 h-44 sm:w-56 sm:h-56 pointer-events-none" />

            <div className="relative z-10 px-6 py-10 sm:px-14 sm:py-12">
              <div className="flex items-center justify-center gap-3.5">
                <img
                  src="/assets/aistudio/NATIFA_Colorful_Potential_Badge_1527cb16.webp"
                  alt="Logo FATIHA Daycare and Learning Center"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <div className="text-xl font-extrabold tracking-wide text-[#17613C]">NATIVA</div>
                  <div className="text-xs text-[#61756A]">
                    Natural Intelligence &amp; Talent Assessment
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center text-[11px] font-bold tracking-[0.26em] text-[#A27E28]">
                SERTIFIKAT HASIL ASESMEN
              </div>
              <h2 className="mt-1.5 text-center text-2xl sm:text-3xl font-extrabold tracking-[0.08em] text-[#123E2E]">
                SERTIFIKAT PROFIL NATIVA
              </h2>
              <p className="mt-1 text-center text-sm font-medium text-[#367453]">
                Pemetaan Potensi dan Kecenderungan Belajar Anak
              </p>

              <p className="mt-6 text-center text-xs tracking-wider text-[#597267]">
                Diberikan kepada
              </p>
              <div
                className="mt-1 text-center text-4xl sm:text-5xl italic font-semibold text-[#17613C]"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {assessment.name}
              </div>
              <p className="mt-2 text-center text-xs text-[#6B7E74] max-w-xl mx-auto">
                Atas partisipasi dalam proses pemetaan perkembangan dan kecenderungan belajar
                melalui kerangka NATIVA di FATIHA Daycare and Learning Center.
              </p>

              {/* Profile summary 2-column split */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 max-w-3xl mx-auto items-stretch">
                <div className="md:col-span-6 bg-[#F7FAF7] border border-[#DFEAE2] rounded-lg p-6 flex flex-col justify-between">
                  <div>
                    <div className="text-center text-[11px] font-bold tracking-[0.14em] text-[#1B6541] mb-3">
                      RINGKASAN PROFIL
                    </div>
                    <div className="divide-y divide-[#E0EAE3]">
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-wider text-[#6F8277]">
                          PRIMARY
                        </span>
                        <span className="text-sm font-bold text-[#154931]">
                          {assessment.primary}
                        </span>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-wider text-[#6F8277]">
                          SECONDARY
                        </span>
                        <span className="text-sm font-bold text-[#154931]">
                          {assessment.secondary}
                        </span>
                      </div>
                      <div className="py-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-wider text-[#6F8277]">
                          SUPPORTING
                        </span>
                        <span className="text-sm font-bold text-[#154931]">
                          {assessment.supporting}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-[11px] leading-relaxed text-[#6E7F76]">
                    Profil ini menggambarkan kecenderungan yang tampak pada saat asesmen, bukan
                    label permanen bagi anak.
                  </p>
                </div>

                <div className="md:col-span-6 bg-gradient-to-br from-[#F7FAF7] to-[#EDF5EF] border border-[#DCE7DF] rounded-lg p-6 text-center flex flex-col justify-center">
                  <div className="text-[11px] font-bold tracking-[0.14em] text-[#1B6541]">
                    PROFIL UTAMA ANAK
                  </div>
                  <div
                    className="mt-3 text-4xl font-bold text-[#17613C]"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {assessment.primary}
                  </div>
                  <p className="mt-1.5 text-xs text-[#66796F]">
                    Kecenderungan yang paling menonjol dalam asesmen ini
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#DAE7DE] text-xs text-[#4C6457] space-y-1">
                    <div>
                      Secondary: <strong className="text-[#174B33]">{assessment.secondary}</strong>
                    </div>
                    <div>
                      Supporting:{" "}
                      <strong className="text-[#174B33]">{assessment.supporting}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate Footer */}
              <div className="mt-8 pt-4 border-t border-[#DCE6DF] max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 items-end text-center">
                <div>
                  <div className="text-xs font-bold text-[#224A36]">
                    {formatDateID(assessment.date)}
                  </div>
                  <div className="text-[10px] tracking-[0.14em] text-[#7D8D84] mt-1">
                    TANGGAL ASESMEN
                  </div>
                </div>
                <div className="text-[10px] leading-relaxed text-[#7B8B82]">
                  NATIVA bukan tes IQ, diagnosis klinis, atau prediksi masa depan.
                </div>
                <div>
                  <div className="text-xs font-bold text-[#224A36]">{assessment.assessor}</div>
                  <div className="text-[10px] tracking-[0.14em] text-[#7D8D84] mt-1">ASESOR</div>
                </div>
              </div>

              <div className="mt-5 text-center text-[11px] font-extrabold tracking-[0.18em] text-[#1C754B]">
                TUMBUH BAHAGIA, BELAJAR SESUAI FITRAH
              </div>
            </div>
          </article>

          {/* PAGE 2: PROFIL LIMA POLA NATIVA & 40/30/30 CONTRIBUTION */}
          <article className="print-sheet print-break-before bg-white border border-[#D8E4DC] rounded-md max-w-[1080px] mx-auto px-6 py-8 sm:px-14 sm:py-10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#1E713B]">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/NATIFA_Colorful_Potential_Badge_1527cb16.webp"
                  alt="Logo FATIHA"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <div className="text-lg font-extrabold text-[#17613C]">NATIVA</div>
                  <div className="text-[10px] font-semibold tracking-[0.12em] text-[#6F8076]">
                    HASIL PEMETAAN POTENSI ANAK
                  </div>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-base font-bold text-[#143E2B]">{assessment.name}</div>
                <div className="text-xs font-mono text-[#6F8076] tabular-nums">
                  {formatDateID(assessment.date)} · {assessment.id}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-[#143E2B]">
                PROFIL LIMA POLA NATIVA
              </h2>
              <p className="mt-1 text-xs text-[#64776D] max-w-2xl mx-auto">
                Grafik berikut merangkum kecenderungan belajar anak berdasarkan tiga sumber
                informasi: Parent Insight, Educator Observation, dan Child Activity Challenge.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7">
                <div className="text-center text-[11px] font-bold tracking-[0.14em] text-[#1B6541] mb-2">
                  GRAFIK PROFIL NATIVA
                </div>
                <RadarChart scores={assessment.scores} />
              </div>

              <div className="md:col-span-5 bg-[#F7FAF7] border border-[#E1EAE3] rounded-lg p-5 space-y-3">
                <div className="text-center text-[11px] font-bold tracking-[0.14em] text-[#1B6541]">
                  RINGKASAN HASIL
                </div>
                <div className="bg-[#EAF4EC] border border-[#CBE2D0] rounded-md p-3">
                  <div className="text-[10px] font-bold tracking-wider text-[#4C6E5A]">PRIMARY</div>
                  <div className="text-lg font-bold text-[#154A31] mt-0.5">
                    {assessment.primary}
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E1EAE3] text-xs">
                  <span className="font-semibold text-[#64776D]">SECONDARY</span>
                  <span className="font-bold text-[#154A31]">{assessment.secondary}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#E1EAE3] text-xs">
                  <span className="font-semibold text-[#64776D]">SUPPORTING</span>
                  <span className="font-bold text-[#154A31]">{assessment.supporting}</span>
                </div>
                <p className="text-xs leading-relaxed text-[#4C6256]">{assessment.consistency}</p>
                <p className="text-[11px] leading-relaxed text-[#6E7F76]">
                  Skor menggambarkan kecenderungan yang tampak saat asesmen. Semua pola tetap dapat
                  distimulasi dan dikembangkan secara seimbang.
                </p>
              </div>
            </div>

            {/* 3-Source Contribution Table */}
            <div className="mt-8">
              <h3 className="text-xs font-bold tracking-[0.12em] text-[#1B6541] mb-3">
                KONTRIBUSI TIGA SUMBER ASESMEN
              </h3>
              <div className="overflow-x-auto border border-[#E2E8E4] rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#EDF4EE] text-[#284C37] border-b border-[#DCE7DF]">
                      <th className="py-2.5 px-4">Pola NATIVA</th>
                      <th className="py-2.5 px-4 text-right">Parent Insight (40%)</th>
                      <th className="py-2.5 px-4 text-right">Educator Observation (30%)</th>
                      <th className="py-2.5 px-4 text-right">Activity Challenge (30%)</th>
                      <th className="py-2.5 px-4 text-right">Skor Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2EF] font-mono tabular-nums">
                    {NATIVA_PATTERNS.map((pattern, idx) => {
                      const pVal = componentScores?.parent[pattern];
                      const oVal = componentScores?.observation[pattern];
                      const aVal = componentScores?.activity[pattern];
                      return (
                        <tr key={pattern}>
                          <td className="py-2.5 px-4 font-sans font-semibold text-[#172C21]">
                            {pattern}
                          </td>
                          <td className="py-2.5 px-4 text-right text-[#465C50]">
                            {pVal === null || pVal === undefined ? "—" : pVal.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-[#465C50]">
                            {oVal === null || oVal === undefined ? "—" : oVal.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-[#465C50]">
                            {aVal === null || aVal === undefined ? "—" : aVal.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-[#143E2B]">
                            {assessment.scores[idx].toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 text-[11px] leading-relaxed text-[#5C6F65] space-y-2">
              <p>
                <strong className="text-[#1D3B2C]">Cara membaca laporan:</strong> Parent Insight
                memuat perspektif orang tua tentang kebiasaan anak; Educator Observation memuat
                pengamatan pendamping/asesor; Child Activity Challenge memuat respons anak saat
                melakukan aktivitas terstruktur. Ketiganya dipadukan sesuai bobot perhitungan NATIVA
                untuk membentuk skor akhir setiap pola.
              </p>
              <p className="text-[#72847A]">
                NATIVA (Natural Intelligence &amp; Talent Assessment) merupakan kerangka pemetaan
                perkembangan dan kecenderungan belajar. Hasil bukan tes IQ, diagnosis, atau label
                permanen.
              </p>
            </div>

            <div className="mt-4 text-right text-xs text-[#4C6256]">
              Asesor: <strong className="text-[#143E2B]">{assessment.assessor}</strong>
            </div>
          </article>
        </div>
      ) : (
        /* PARENT SUMMARY OR INDIVIDUAL REPORT */
        <article className="print-sheet bg-white border border-[#E2E8E4] rounded-xl max-w-4xl mx-auto p-6 sm:p-10 space-y-6">
          <div className="flex items-center gap-4 pb-5 border-b border-[#E5ECE7]">
            <img
              src="/assets/aistudio/NATIFA_Colorful_Potential_Badge_1527cb16.webp"
              alt="Logo FATIHA"
              referrerPolicy="no-referrer"
              className="w-16 h-16 object-contain"
            />
            <div>
              <div className="text-xl font-bold text-[#1E713B]">NATIVA</div>
              <div className="text-xs font-semibold tracking-wider text-[#64776D]">
                {mode === "parent" ? "RINGKASAN UNTUK ORANG TUA" : "LAPORAN PROFIL INDIVIDUAL"}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#14281E]">{assessment.name}</h2>
            <p className="mt-1 text-xs text-[#5E7166]">
              Usia: {assessment.age || "—"} · Tanggal asesmen: {formatDateID(assessment.date)} ·
              Asesor: {assessment.assessor} · ID: <span className="font-mono">{assessment.id}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-6 space-y-3">
              <h3 className="text-base font-semibold text-[#1E713B]">1. Ringkasan Profil</h3>
              <div className="text-sm text-[#2A3F34] space-y-1">
                <p>
                  Primary: <strong>{assessment.primary}</strong> · Secondary:{" "}
                  <strong>{assessment.secondary}</strong> · Supporting:{" "}
                  <strong>{assessment.supporting}</strong>
                </p>
                <p className="text-xs leading-relaxed text-[#5C6F65]">{assessment.consistency}</p>
              </div>
            </div>
            <div className="md:col-span-6">
              <RadarChart scores={assessment.scores} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-[#1E713B]">2. Peta Lima Pola NATIVA</h3>
            <div className="overflow-x-auto border border-[#E2E8E4] rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4F7F5] text-[#355142] border-b border-[#E6ECE8]">
                    <th className="py-2.5 px-3.5">Pola</th>
                    <th className="py-2.5 px-3.5 text-right">Skor</th>
                    <th className="py-2.5 px-3.5">Level</th>
                    <th className="py-2.5 px-3.5">Gambaran Kecenderungan</th>
                    <th className="py-2.5 px-3.5">Ide Stimulasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2EF]">
                  {NATIVA_PATTERNS.map((pattern, i) => {
                    const score = assessment.scores[i];
                    const meta = PATTERN_META[pattern];
                    return (
                      <tr key={pattern}>
                        <td className="py-3 px-3.5 font-semibold text-[#14281E] whitespace-nowrap">
                          {pattern}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-semibold tabular-nums text-[#14281E]">
                          {score.toFixed(1)}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-[#4C6256]">
                          {getScoreLevel(score)}
                        </td>
                        <td className="py-3 px-3.5 text-[#3B5045] leading-relaxed">
                          {meta.tendency}
                        </td>
                        <td className="py-3 px-3.5 text-[#3B5045] leading-relaxed">
                          {meta.stimulation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-[#1E713B]">
              3. Interpretasi dan Pendampingan
            </h3>
            <p className="text-sm leading-relaxed text-[#354B3F]">
              Hasil ini merangkum kecenderungan yang paling tampak pada saat asesmen. Anak tetap
              perlu diberi kesempatan mengembangkan seluruh pola melalui pengalaman yang beragam.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div className="bg-[#F8FAF8] border border-[#E6ECE8] rounded-lg p-4">
                <div className="font-semibold text-[#14281E] mb-1">Temuan Observasi</div>
                <p className="text-[#4B6155]">
                  {reportExtra?.observationFindings ||
                    "Belum diisi. Gunakan Report Builder untuk menambahkan temuan."}
                </p>
              </div>
              <div className="bg-[#F8FAF8] border border-[#E6ECE8] rounded-lg p-4">
                <div className="font-semibold text-[#14281E] mb-1">Situasi yang Membantu</div>
                <p className="text-[#4B6155]">
                  {reportExtra?.helpfulSituations ||
                    "Belum diisi. Gunakan Report Builder untuk menambahkan catatan."}
                </p>
              </div>
              <div className="bg-[#F8FAF8] border border-[#E6ECE8] rounded-lg p-4">
                <div className="font-semibold text-[#14281E] mb-1">Perspektif Orang Tua</div>
                <p className="text-[#4B6155]">
                  {reportExtra?.parentVoice ||
                    "Belum diisi. Gunakan Report Builder untuk menambahkan perspektif orang tua."}
                </p>
              </div>
              {mode === "individual" && (
                <div className="bg-[#F8FAF8] border border-[#E6ECE8] rounded-lg p-4">
                  <div className="font-semibold text-[#14281E] mb-1">Rencana Aksi 2–4 Minggu</div>
                  <p className="text-[#4B6155]">
                    {reportExtra?.actionPlan?.[0]?.action ||
                      "Belum diisi. Lengkapi rencana aksi melalui Report Builder."}
                  </p>
                  {reportExtra?.actionPlan?.[0]?.frequency && (
                    <p className="mt-1 text-[#687C71]">
                      Frekuensi: {reportExtra.actionPlan[0].frequency} · Penanggung jawab:{" "}
                      {reportExtra.actionPlan[0].owner || "—"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6ECE8] space-y-2">
            <h3 className="text-sm font-semibold text-[#1E713B]">Pesan untuk Orang Tua</h3>
            <p className="text-sm leading-relaxed text-[#354B3F]">
              Setiap anak memiliki cara unik untuk belajar dan bertumbuh. Hasil NATIVA membantu kita
              memilih pengalaman yang lebih sesuai, bukan membatasi anak pada satu tipe. Berikan
              kesempatan mencoba berbagai aktivitas dan amati perkembangannya dari waktu ke waktu.
            </p>
            <p className="text-xs text-[#6B7E74]">
              NATIVA adalah kerangka pemetaan perkembangan. Hasil bukan tes IQ, diagnosis, atau
              prediksi masa depan.
            </p>
          </div>
        </article>
      )}
    </div>
  );
}
