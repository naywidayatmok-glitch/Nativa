import { ArrowUpRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { NATIVA_PATTERNS, PATTERN_META, type NativaPattern } from "../data/nativaQuestions.ts";
import { formatDateID } from "../lib/nativaScoring.ts";
import type { AssessmentRecord } from "../types/nativa.ts";

interface HistoryViewProps {
  assessments: AssessmentRecord[];
  onOpenReport: (assessmentId: string) => void;
}

export function HistoryView({ assessments, onOpenReport }: HistoryViewProps) {
  const [search, setSearch] = useState("");
  const [patternFilter, setPatternFilter] = useState<"ALL" | NativaPattern>("ALL");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...assessments]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .filter((a) => {
        if (patternFilter !== "ALL" && a.primary !== patternFilter) return false;
        if (!q) return true;
        return `${a.id} ${a.name} ${a.childId} ${a.assessor}`.toLowerCase().includes(q);
      });
  }, [assessments, search, patternFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#14281E]">Riwayat Asesmen</h1>
        <p className="mt-1 text-sm text-[#586A60]">
          Setiap sesi asesmen tersimpan sebagai rekam historis terpisah untuk memantau perkembangan
          dari waktu ke waktu.
        </p>
      </div>

      <section className="bg-white border border-[#E2E8E4] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EBF0ED] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-[#7A8C82] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama anak, ID asesmen, asesor..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8FAF8] border border-[#D7E1DA] rounded-lg focus:outline-none focus:bg-white focus:border-[#1E713B]"
            />
          </div>

          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F2F6F3] rounded-lg">
            <button
              type="button"
              onClick={() => setPatternFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                patternFilter === "ALL"
                  ? "bg-white text-[#14281E] shadow-xs"
                  : "text-[#586A60] hover:text-[#14281E]"
              }`}
            >
              Semua ({assessments.length})
            </button>
            {NATIVA_PATTERNS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPatternFilter(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  patternFilter === p
                    ? "bg-white text-[#14281E] shadow-xs"
                    : "text-[#586A60] hover:text-[#14281E]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#63766C]">
            Tidak ada riwayat asesmen yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F4F7F5] text-xs font-semibold text-[#4B6155] border-b border-[#E6ECE8]">
                  <th className="py-3 px-4">ID Asesmen</th>
                  <th className="py-3 px-4">Nama Anak</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Primary · Secondary</th>
                  {NATIVA_PATTERNS.map((p) => (
                    <th key={p} className="py-3 px-3 text-right">
                      {p.slice(0, 3)}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2EF]">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onOpenReport(item.id)}
                    className="hover:bg-[#F7FAF8] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-[#4F6358] tabular-nums whitespace-nowrap">
                      {item.id}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-[#14281E]">{item.name}</div>
                      <div className="text-xs text-[#6B7E74]">
                        {item.age || item.childId} · {item.assessor}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#54675D] tabular-nums whitespace-nowrap">
                      {formatDateID(item.date)}
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      <span
                        className="font-semibold"
                        style={{ color: PATTERN_META[item.primary].color }}
                      >
                        {item.primary}
                      </span>
                      <span className="text-[#7B8D83]"> · {item.secondary}</span>
                    </td>
                    {item.scores.map((sc, idx) => (
                      <td
                        key={NATIVA_PATTERNS[idx]}
                        className="py-3 px-3 text-right font-mono text-xs text-[#2B4035] tabular-nums"
                      >
                        {sc.toFixed(1)}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E713B] group-hover:underline">
                        Laporan
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
    </div>
  );
}
