import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { NATIVA_PATTERNS } from "../data/nativaQuestions.ts";
import { formatDateID } from "../lib/nativaScoring.ts";
import type { AssessmentRecord } from "../types/nativa.ts";
import { RadarChart } from "./RadarChart.tsx";

interface CompareViewProps {
  assessments: AssessmentRecord[];
}

export function CompareView({ assessments }: CompareViewProps) {
  const defaultPair = useMemo(() => {
    const byChild: Record<string, AssessmentRecord[]> = {};
    assessments.forEach((a) => {
      byChild[a.childId] = [...(byChild[a.childId] || []), a];
    });
    for (const list of Object.values(byChild)) {
      if (list.length >= 2) {
        const ordered = [...list].sort((x, y) => x.date.localeCompare(y.date));
        return { first: ordered[0].id, second: ordered[ordered.length - 1].id };
      }
    }
    return { first: assessments[0]?.id || "", second: assessments[1]?.id || "" };
  }, [assessments]);

  const [idA, setIdA] = useState(defaultPair.first);
  const [idB, setIdB] = useState(defaultPair.second);

  const sessionA = assessments.find((a) => a.id === idA) || null;
  const sessionB = assessments.find((a) => a.id === idB) || null;

  const sameChild = Boolean(sessionA && sessionB && sessionA.childId === sessionB.childId);
  const sameSession = Boolean(sessionA && sessionB && sessionA.id === sessionB.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#14281E]">Perbandingan Asesmen</h1>
        <p className="mt-1 text-sm text-[#586A60]">
          Bandingkan dua sesi milik anak yang sama untuk melihat perkembangan kecenderungan belajar
          antar periode.
        </p>
      </div>

      {assessments.length < 2 ? (
        <section className="bg-white border border-[#E2E8E4] rounded-xl px-6 py-14 text-center space-y-2">
          <p className="text-sm font-medium text-[#14281E]">
            Belum cukup data untuk perbandingan asesmen.
          </p>
          <p className="text-xs text-[#64776D] max-w-md mx-auto">
            Tambahkan minimal dua sesi asesmen untuk anak yang sama agar grafik perbandingan dan
            perubahan skor dapat ditampilkan.
          </p>
        </section>
      ) : (
        <>
          {/* Selector */}
          <section className="bg-white border border-[#E2E8E4] rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#2E4237]">
                  Asesmen Awal (Baseline)
                </span>
                <select
                  value={idA}
                  onChange={(e) => setIdA(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
                >
                  <option value="">Pilih asesmen awal</option>
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {formatDateID(a.date)} · {a.id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[#2E4237]">
                  Asesmen Terbaru (Tindak Lanjut)
                </span>
                <select
                  value={idB}
                  onChange={(e) => setIdB(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D4DFD7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E713B]/25 focus:border-[#1E713B]"
                >
                  <option value="">Pilih asesmen terbaru</option>
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {formatDateID(a.date)} · {a.id}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {sessionA && sessionB && !sameChild && (
              <div className="mt-4 px-4 py-3 bg-[#FFF8EB] border border-[#F0D9A8] rounded-lg text-xs text-[#6B4E16]">
                Dua sesi yang dipilih berasal dari anak yang berbeda ({sessionA.name} vs{" "}
                {sessionB.name}). Pilih dua asesmen milik anak yang sama agar perbandingan valid.
              </div>
            )}

            {sameSession && (
              <div className="mt-4 px-4 py-3 bg-[#F4F7F5] border border-[#DCE5DF] rounded-lg text-xs text-[#4C6256]">
                Anda memilih sesi yang sama pada kedua kolom. Pilih sesi dari tanggal berbeda untuk
                melihat perubahan skor.
              </div>
            )}
          </section>

          {/* Comparison Results */}
          {sessionA && sessionB && sameChild && (
            <section className="bg-white border border-[#E2E8E4] rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EBF0ED]">
                <div>
                  <h2 className="text-lg font-bold text-[#14281E]">{sessionA.name}</h2>
                  <p className="text-xs text-[#5E7166] inline-flex items-center gap-2 mt-0.5">
                    <span>
                      {formatDateID(sessionA.date)} ({sessionA.id})
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#1E713B]" />
                    <span>
                      {formatDateID(sessionB.date)} ({sessionB.id})
                    </span>
                  </p>
                </div>
                <div className="text-xs text-[#4B6155]">
                  Primary: <strong>{sessionA.primary}</strong> →{" "}
                  <strong className="text-[#1E713B]">{sessionB.primary}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5">
                  <RadarChart
                    scores={sessionB.scores}
                    compareScores={sessionA.scores}
                    compareLabel={`Awal (${formatDateID(sessionA.date)})`}
                    primaryLabel={`Terbaru (${formatDateID(sessionB.date)})`}
                  />
                </div>

                <div className="lg:col-span-7 overflow-x-auto border border-[#E2E8E4] rounded-lg">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#F4F7F5] text-xs font-semibold text-[#4B6155] border-b border-[#E6ECE8]">
                        <th className="py-3 px-4">Pola NATIVA</th>
                        <th className="py-3 px-4 text-right">Awal</th>
                        <th className="py-3 px-4 text-right">Terbaru</th>
                        <th className="py-3 px-4 text-right">Perubahan</th>
                        <th className="py-3 px-4">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF2EF]">
                      {NATIVA_PATTERNS.map((pattern, i) => {
                        const initial = sessionA.scores[i];
                        const latest = sessionB.scores[i];
                        const diff = Number((latest - initial).toFixed(1));
                        const statusText =
                          diff >= 5
                            ? "Skor meningkat"
                            : diff <= -5
                            ? "Skor menurun"
                            : "Relatif stabil";
                        const diffColor =
                          diff >= 5
                            ? "text-[#16793D]"
                            : diff <= -5
                            ? "text-[#B4232C]"
                            : "text-[#586A60]";

                        return (
                          <tr key={pattern}>
                            <td className="py-3 px-4 font-semibold text-[#14281E]">{pattern}</td>
                            <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-[#54675D]">
                              {initial.toFixed(1)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums text-[#14281E]">
                              {latest.toFixed(1)}
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums ${diffColor}`}
                            >
                              {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                            </td>
                            <td className={`py-3 px-4 text-xs font-medium ${diffColor}`}>
                              {statusText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
