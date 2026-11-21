import { ArrowUpRight, Plus } from "lucide-react";
import { NATIVA_PATTERNS, PATTERN_META } from "../data/nativaQuestions.ts";
import { formatDateID } from "../lib/nativaScoring.ts";
import type { AssessmentRecord, ChildRecord, ParentSubmission } from "../types/nativa.ts";

interface DashboardViewProps {
  childrenList: ChildRecord[];
  assessments: AssessmentRecord[];
  parentSubmissions: ParentSubmission[];
  onStartAssessment: () => void;
  onOpenReport: (assessmentId: string) => void;
  onNavigate: (page: string) => void;
}

export function DashboardView({
  childrenList,
  assessments,
  parentSubmissions,
  onStartAssessment,
  onOpenReport,
  onNavigate,
}: DashboardViewProps) {
  const grounderCount = assessments.filter((a) => a.primary === "Grounder").length;
  const explorerCount = assessments.filter((a) => a.primary === "Explorer").length;

  const patternDistribution = NATIVA_PATTERNS.map((pattern) => {
    const count = assessments.filter((a) => a.primary === pattern).length;
    const pct = assessments.length ? Math.round((count / assessments.length) * 100) : 0;
    const avgScore = assessments.length
      ? assessments.reduce((sum, a) => sum + (a.scores[NATIVA_PATTERNS.indexOf(pattern)] || 0), 0) /
        assessments.length
      : 0;
    return { pattern, count, pct, avgScore };
  });

  const recentAssessments = [...assessments]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#14281E]">
            Ringkasan Pemetaan Potensi
          </h1>
          <p className="mt-1 text-sm text-[#586A60]">
            Ikhtisar perkembangan peserta didik dan distribusi lima pola belajar NATIVA di FATIHA.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartAssessment}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Asesmen Baru
        </button>
      </div>

      {/* 4-column metric strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8E4] rounded-xl p-5">
          <p className="text-xs font-medium text-[#5F7268]">Total Anak Terdaftar</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#14281E] font-mono tabular-nums">
            {childrenList.length}
          </p>
          <p className="mt-1.5 text-xs text-[#6B7E74]">
            {parentSubmissions.length} kiriman Parent Insight
          </p>
        </div>

        <div className="bg-white border border-[#E2E8E4] rounded-xl p-5">
          <p className="text-xs font-medium text-[#5F7268]">Total Sesi Asesmen</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#1E713B] font-mono tabular-nums">
            {assessments.length}
          </p>
          <p className="mt-1.5 text-xs text-[#6B7E74]">Tersimpan dalam rekam historis</p>
        </div>

        <div className="bg-white border border-[#E2E8E4] rounded-xl p-5">
          <p className="text-xs font-medium text-[#5F7268]">Primary Grounder</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#14281E] font-mono tabular-nums">
            {grounderCount}
          </p>
          <p className="mt-1.5 text-xs text-[#6B7E74]">Praktik langsung &amp; konkret</p>
        </div>

        <div className="bg-white border border-[#E2E8E4] rounded-xl p-5">
          <p className="text-xs font-medium text-[#5F7268]">Primary Explorer</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-[#14281E] font-mono tabular-nums">
            {explorerCount}
          </p>
          <p className="mt-1.5 text-xs text-[#6B7E74]">Rasa ingin tahu &amp; eksplorasi</p>
        </div>
      </div>

      {/* Main 2-column content: Recent Assessments + 5-Pattern Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Recent Assessments Table */}
        <section className="xl:col-span-8 bg-white border border-[#E2E8E4] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#EBF0ED]">
            <div>
              <h2 className="text-base font-semibold text-[#14281E]">Asesmen Terbaru</h2>
              <p className="text-xs text-[#64776D] mt-0.5">
                Klik baris untuk membuka laporan profil dan sertifikat.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("history")}
              className="text-xs font-semibold text-[#1E713B] hover:text-[#144E28] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Lihat semua riwayat
            </button>
          </div>

          {recentAssessments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-[#5F7268]">Belum ada sesi asesmen yang tersimpan.</p>
              <button
                type="button"
                onClick={onStartAssessment}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#1E713B] hover:bg-[#16582D] rounded-lg transition-colors cursor-pointer"
              >
                Mulai Asesmen Pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F4F7F5] text-xs font-semibold text-[#4B6155] border-b border-[#E6ECE8]">
                    <th className="py-3 px-4">ID Asesmen</th>
                    <th className="py-3 px-4">Nama Anak</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Primary</th>
                    <th className="py-3 px-4">Secondary</th>
                    <th className="py-3 px-4 text-right">Laporan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2EF]">
                  {recentAssessments.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => onOpenReport(item.id)}
                      className="hover:bg-[#F7FAF8] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-[#4F6358] tabular-nums whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#14281E] whitespace-nowrap">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#5B6F64] tabular-nums whitespace-nowrap">
                        {formatDateID(item.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: PATTERN_META[item.primary].color }}
                        >
                          {item.primary}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#4C6055] whitespace-nowrap">
                        {item.secondary}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1E713B] group-hover:underline">
                          Buka
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 5-Pattern Distribution */}
        <section className="xl:col-span-4 bg-white border border-[#E2E8E4] rounded-xl p-5">
          <h2 className="text-base font-semibold text-[#14281E]">Distribusi Lima Pola NATIVA</h2>
          <p className="text-xs text-[#64776D] mt-0.5">
            Proporsi pola utama dan rerata skor lintas asesmen.
          </p>

          <div className="mt-5 space-y-4">
            {patternDistribution.map(({ pattern, count, pct, avgScore }) => {
              const meta = PATTERN_META[pattern];
              return (
                <div key={pattern} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-[#172C21]">{pattern}</span>
                      <span className="text-[#72847A]"> · {meta.shortLabel}</span>
                    </div>
                    <div className="font-mono tabular-nums text-[#41574B] whitespace-nowrap">
                      {count} sesi · {avgScore.toFixed(1)}
                    </div>
                  </div>
                  <div className="h-2 bg-[#EEF2EF] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(avgScore, pct)}%`,
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Developmental Framework Notice */}
      <div className="bg-[#FAF8F0] border border-[#E9DFBE] rounded-xl px-5 py-4 text-xs leading-relaxed text-[#574B24]">
        <span className="font-semibold text-[#3C3315]">Catatan Kerangka NATIVA:</span> NATIVA
        (Natural Intelligence &amp; Talent Assessment) merupakan kerangka pemetaan perkembangan
        untuk membantu orang tua dan pendamping memahami kecenderungan belajar anak. Hasil bukan tes
        IQ, diagnosis, atau label permanen.
      </div>
    </div>
  );
}
