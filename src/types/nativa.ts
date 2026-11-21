import type { NativaPattern } from "../data/nativaQuestions.ts";

export type UserRole = "ADMIN" | "ASESOR" | "ORANG_TUA";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  childIds: string[];
  mustChangePassword?: boolean;
  createdAt: string;
}

export interface ChildRecord {
  id: string;
  name: string;
  dob: string;
  gender: "Laki-laki" | "Perempuan" | "";
  parent: string;
  contact: string;
  joinedDate: string;
  notes: string;
  createdAt: string;
}

export interface AssessmentItemNotes {
  parent: Record<string, string>;
  observation: Record<string, string>;
  activities: Record<string, string>;
}

export interface AssessmentRecord {
  id: string;
  childId: string;
  name: string;
  date: string;
  age: string;
  assessor: string;
  notes: string;
  scores: number[]; // Ordered: Grounder, Analyst, Creator, Connector, Explorer
  levels: string[];
  primary: NativaPattern;
  secondary: NativaPattern;
  supporting: NativaPattern;
  consistency: string;
  parent: Record<string, number>;
  observation: Record<string, number>;
  activities: Record<string, number>;
  itemNotes: AssessmentItemNotes;
  createdAt: string;
}

export interface ActionPlanItem {
  area: string;
  action: string;
  frequency: string;
  owner: string;
  indicator: string;
}

export interface ReportExtra {
  assessmentId: string;
  observationFindings: string;
  helpfulSituations: string;
  uncomfortableSituations: string;
  parentVoice: string;
  actionPlan: ActionPlanItem[];
  followupDate: string;
  changes: string;
  effectiveStrategies: string;
  adjustments: string;
  nextPlan: string;
  updatedAt: string;
}

export interface ParentSubmission {
  id: string;
  childId: string;
  childName: string;
  submittedByEmail: string;
  submittedByName: string;
  submittedAt: string;
  answers: Record<string, number>;
  answerCount: number;
  notes: string;
}

export interface ComponentScores {
  parent: Record<NativaPattern, number | null>;
  observation: Record<NativaPattern, number | null>;
  activity: Record<NativaPattern, number | null>;
}

export interface DiagnosticsSummary {
  databaseEngine: string;
  storagePath: string;
  counts: {
    children: number;
    assessments: number;
    users: number;
    parentSubmissions: number;
    reports: number;
  };
  collections: string[];
  lastUpdated: string;
}
