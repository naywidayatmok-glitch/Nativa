import {
  ACTIVITY_PATTERN_MAP,
  NATIVA_PATTERNS,
  OBSERVATION_QUESTIONS,
  PARENT_QUESTIONS,
  type NativaPattern,
} from "../data/nativaQuestions.ts";
import type { ComponentScores } from "../types/nativa.ts";

export function getScoreLevel(score: number): string {
  if (score >= 80) return "Sangat Tampak";
  if (score >= 65) return "Kuat";
  if (score >= 50) return "Berkembang";
  if (score >= 35) return "Mulai Tampak";
  return "Bukti Terbatas";
}

function validAvg(values: Array<number | undefined | null>): number | null {
  const nums = values
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);
  if (!nums.length) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function toIndex100(avg: number | null): number | null {
  if (avg === null) return null;
  return Number((((avg - 1) / 4) * 100).toFixed(1));
}

export function calculateComponentScores(
  parentAnswers: Record<string, number>,
  observationAnswers: Record<string, number>,
  activityAnswers: Record<string, number>
): ComponentScores {
  const parent = {} as Record<NativaPattern, number | null>;
  const observation = {} as Record<NativaPattern, number | null>;
  const activity = {} as Record<NativaPattern, number | null>;

  for (const pattern of NATIVA_PATTERNS) {
    const pVals = PARENT_QUESTIONS.filter((q) => q.pattern === pattern).map(
      (q) => parentAnswers?.[q.code]
    );
    const oVals = OBSERVATION_QUESTIONS.filter((q) => q.pattern === pattern).map(
      (q) => observationAnswers?.[q.code]
    );
    const aVals = ACTIVITY_PATTERN_MAP[pattern].map((code) => activityAnswers?.[code]);

    parent[pattern] = toIndex100(validAvg(pVals));
    observation[pattern] = toIndex100(validAvg(oVals));
    activity[pattern] = toIndex100(validAvg(aVals));
  }

  return { parent, observation, activity };
}

export interface CalculatedAssessment {
  scores: number[];
  levels: string[];
  primary: NativaPattern;
  secondary: NativaPattern;
  supporting: NativaPattern;
  consistency: string;
  components: ComponentScores;
}

export function calculateAssessmentResult(
  parentAnswers: Record<string, number>,
  observationAnswers: Record<string, number>,
  activityAnswers: Record<string, number>
): CalculatedAssessment {
  const components = calculateComponentScores(
    parentAnswers,
    observationAnswers,
    activityAnswers
  );

  const scores = NATIVA_PATTERNS.map((pattern) => {
    const p = components.parent[pattern];
    const o = components.observation[pattern];
    const a = components.activity[pattern];

    let weightedSum = 0;
    let totalWeight = 0;

    if (p !== null) {
      weightedSum += p * 0.4;
      totalWeight += 0.4;
    }
    if (o !== null) {
      weightedSum += o * 0.3;
      totalWeight += 0.3;
    }
    if (a !== null) {
      weightedSum += a * 0.3;
      totalWeight += 0.3;
    }

    if (totalWeight === 0) return 0;
    return Number((weightedSum / totalWeight).toFixed(1));
  });

  const ranked = NATIVA_PATTERNS.map((pattern, idx) => ({
    pattern,
    score: scores[idx],
    idx,
  })).sort((a, b) => b.score - a.score || a.idx - b.idx);

  const primary = ranked[0].pattern;
  const secondary = ranked[1].pattern;
  const supporting = ranked[2].pattern;
  const levels = scores.map(getScoreLevel);

  // Evaluate cross-source consistency (Parent Insight vs Educator Observation & Activity)
  const diffs: number[] = [];
  for (const pattern of NATIVA_PATTERNS) {
    const p = components.parent[pattern];
    const o = components.observation[pattern];
    if (p !== null && o !== null) {
      diffs.push(Math.abs(p - o));
    }
  }

  let consistency =
    "Data lintas sumber belum lengkap; lengkapi ketiga sumber untuk memantau konsistensi rumah dan kelas.";
  if (diffs.length >= 3) {
    const avgDiff = diffs.reduce((s, d) => s + d, 0) / diffs.length;
    if (avgDiff <= 10) {
      consistency = `Konsistensi tinggi antara pengamatan rumah dan kelas (selisih rata-rata ${avgDiff.toFixed(1)} poin). Kecenderungan ${primary} dan ${secondary} tampak stabil di berbagai konteks.`;
    } else if (avgDiff <= 20) {
      consistency = `Konsistensi cukup baik dengan variasi situasional wajar (selisih rata-rata ${avgDiff.toFixed(1)} poin). Perlu diskusi ringan antara orang tua dan pendamping untuk konteks aktivitas.`;
    } else {
      consistency = `Terdapat perbedaan konteks rumah dan kelas (selisih rata-rata ${avgDiff.toFixed(1)} poin). Disarankan berdiskusi bersama orang tua untuk memahami faktor lingkungan yang memengaruhi respons anak.`;
    }
  }

  return {
    scores,
    levels,
    primary,
    secondary,
    supporting,
    consistency,
    components,
  };
}

export function formatAgeFromDob(dob: string, refDate?: string): string {
  if (!dob) return "";
  const birth = new Date(dob);
  const ref = refDate ? new Date(refDate) : new Date();
  if (Number.isNaN(birth.getTime()) || Number.isNaN(ref.getTime())) return "";

  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  if (ref.getDate() < birth.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return "";
  if (years === 0) return `${months} bulan`;
  if (months === 0) return `${years} tahun`;
  return `${years} tahun ${months} bulan`;
}

export function formatDateID(isoDate: string): string {
  if (!isoDate) return "—";
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return isoDate;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dt);
}
