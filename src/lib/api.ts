import type {
  AssessmentItemNotes,
  AssessmentRecord,
  ChildRecord,
  DiagnosticsSummary,
  ParentSubmission,
  ReportExtra,
  UserAccount,
  UserRole,
  UserStatus,
} from "../types/nativa.ts";

const SESSION_KEY = "nativa_session_token";

export function getStoredToken(): string {
  try {
    return localStorage.getItem(SESSION_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredToken(token: string): void {
  try {
    if (token) localStorage.setItem(SESSION_KEY, token);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore storage quota errors
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Permintaan gagal (${res.status})`);
  }
  return data as T;
}

export interface AppDataResponse {
  children: ChildRecord[];
  assessments: AssessmentRecord[];
  parentSubmissions: ParentSubmission[];
}

export interface ParentPortalChild extends ChildRecord {
  latestSubmission: ParentSubmission | null;
}

export interface ParentPortalResponse {
  children: ParentPortalChild[];
  submissions: ParentSubmission[];
}

export const api = {
  getAuthStatus: () => request<{ hasAdmin: boolean; userCount: number }>("/api/auth/status"),

  getMe: () => request<{ user: UserAccount }>("/api/auth/me"),

  bootstrapAdmin: (name: string, email: string, password: string) =>
    request<{ user: UserAccount; token: string }>("/api/auth/bootstrap-admin", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ user: UserAccount; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ ok: boolean }>("/api/auth/logout", {
      method: "POST",
    }),

  changePassword: (email: string, oldPassword: string, newPassword: string) =>
    request<{ ok: boolean }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ email, oldPassword, newPassword }),
    }),

  getAppData: () => request<AppDataResponse>("/api/app-data"),

  createChild: (payload: Omit<ChildRecord, "id" | "createdAt">) =>
    request<ChildRecord>("/api/children", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateChild: (id: string, payload: Partial<Omit<ChildRecord, "id" | "createdAt">>) =>
    request<ChildRecord>(`/api/children/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  createAssessment: (payload: {
    childId: string;
    date: string;
    age: string;
    assessor: string;
    assessmentId?: string;
    notes: string;
    parent: Record<string, number>;
    observation: Record<string, number>;
    activities: Record<string, number>;
    itemNotes: AssessmentItemNotes;
  }) =>
    request<{ assessment: AssessmentRecord }>("/api/assessments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getAssessmentDetail: (id: string) =>
    request<{ assessment: AssessmentRecord; reportExtra: ReportExtra | null }>(
      `/api/assessments/${encodeURIComponent(id)}`
    ),

  saveReportExtra: (assessmentId: string, payload: Omit<ReportExtra, "assessmentId" | "updatedAt">) =>
    request<ReportExtra>(`/api/reports/${encodeURIComponent(assessmentId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getParentPortal: (email: string) =>
    request<ParentPortalResponse>(`/api/parent-portal?email=${encodeURIComponent(email)}`),

  getLatestParentInsight: (childId: string) =>
    request<ParentSubmission>(`/api/parent-insights/latest/${encodeURIComponent(childId)}`),

  submitParentInsight: (payload: {
    childId: string;
    answers: Record<string, number>;
    notes: string;
    submittedByEmail: string;
    submittedByName: string;
  }) =>
    request<ParentSubmission>("/api/parent-insights", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listUsers: () => request<UserAccount[]>("/api/users"),

  createUser: (payload: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
    childIds: string;
  }) =>
    request<UserAccount>("/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  setUserStatus: (email: string, status: UserStatus) =>
    request<UserAccount>(`/api/users/${encodeURIComponent(email)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  resetUserPassword: (email: string, password: string) =>
    request<{ ok: boolean }>(`/api/users/${encodeURIComponent(email)}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  getDiagnostics: () => request<DiagnosticsSummary>("/api/diagnostics"),
};
