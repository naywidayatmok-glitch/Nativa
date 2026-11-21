import {
  ArrowLeftRight,
  ClipboardCheck,
  FileText,
  HeartHandshake,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AccountsView } from "./components/AccountsView.tsx";
import { AssessmentFormView } from "./components/AssessmentFormView.tsx";
import { AuthModal } from "./components/AuthModal.tsx";
import { ChildrenView } from "./components/ChildrenView.tsx";
import { CompareView } from "./components/CompareView.tsx";
import { DashboardView } from "./components/DashboardView.tsx";
import { HistoryView } from "./components/HistoryView.tsx";
import { ParentPortalView } from "./components/ParentPortalView.tsx";
import { ReportCertificateView } from "./components/ReportCertificateView.tsx";
import { api, getStoredToken, setStoredToken } from "./lib/api.ts";
import type {
  AssessmentRecord,
  ChildRecord,
  ParentSubmission,
  UserAccount,
} from "./types/nativa.ts";

type PageKey =
  | "dashboard"
  | "children"
  | "assessment"
  | "history"
  | "report"
  | "compare"
  | "parent-portal"
  | "accounts";

interface ToastMessage {
  id: number;
  text: string;
  tone: "success" | "error";
}

const PAGE_LABELS: Record<PageKey, string> = {
  dashboard: "Dashboard",
  children: "Database Anak",
  assessment: "Input Asesmen",
  history: "Riwayat Asesmen",
  report: "Laporan & Sertifikat",
  compare: "Perbandingan",
  "parent-portal": "Portal Orang Tua",
  accounts: "Manajemen Akun",
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [page, setPage] = useState<PageKey>("dashboard");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const [childrenList, setChildrenList] = useState<ChildRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [parentSubmissions, setParentSubmissions] = useState<ParentSubmission[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [selectedReportId, setSelectedReportId] = useState("");
  const [preselectedChildId, setPreselectedChildId] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = useCallback((text: string, tone: "success" | "error" = "success") => {
    const id = Date.now();
    setToast({ id, text, tone });
    window.setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4200);
  }, []);

  const refreshData = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await api.getAppData();
      setChildrenList(data.children);
      setAssessments(data.assessments);
      setParentSubmissions(data.parentSubmissions);
      setSelectedReportId((prev) =>
        prev && data.assessments.some((a) => a.id === prev)
          ? prev
          : data.assessments[data.assessments.length - 1]?.id || ""
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : "Gagal memuat data NATIVA.", "error");
    } finally {
      setLoadingData(false);
    }
  }, [notify]);

  useEffect(() => {
    let cancelled = false;
    async function initAuth() {
      try {
        const status = await api.getAuthStatus();
        if (cancelled) return;
        setHasAdmin(status.hasAdmin);

        if (status.hasAdmin && getStoredToken()) {
          try {
            const me = await api.getMe();
            if (!cancelled) {
              setCurrentUser(me.user);
              if (me.user.role === "ORANG_TUA") {
                setPage("parent-portal");
              }
            }
          } catch {
            setStoredToken("");
          }
        }
      } catch {
        if (!cancelled) setHasAdmin(true);
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    }
    initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  function handleAuthenticated(user: UserAccount) {
    setHasAdmin(true);
    setCurrentUser(user);
    if (user.role === "ORANG_TUA") {
      setPage("parent-portal");
    } else {
      setPage("dashboard");
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // ignore network error on logout
    }
    setStoredToken("");
    setCurrentUser(null);
    setChildrenList([]);
    setAssessments([]);
    setParentSubmissions([]);
    setSelectedReportId("");
    setPage("dashboard");
  }

  function handleOpenReport(assessmentId: string) {
    setSelectedReportId(assessmentId);
    setPage("report");
  }

  function handleStartAssessmentForChild(childId: string) {
    setPreselectedChildId(childId);
    setPage("assessment");
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F7F4] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <img
            src="/assets/aistudio/NATIFA_Colorful_Potential_Badge_1527cb16.webp"
            alt="NATIVA"
            referrerPolicy="no-referrer"
            className="w-14 h-14 object-contain mx-auto"
          />
          <p className="text-xs font-medium text-[#586A60]">Menyiapkan NATIVA...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <AuthModal
          mode={hasAdmin ? "login" : "bootstrap"}
          currentUser={null}
          onAuthenticated={handleAuthenticated}
          onNotify={notify}
        />
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`no-print fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl text-xs font-medium shadow-lg border ${
              toast.tone === "error"
                ? "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
                : "bg-[#143D28] text-white border-[#1E713B]"
            }`}
          >
            {toast.text}
          </div>
        )}
      </>
    );
  }

  const isParentOnly = currentUser.role === "ORANG_TUA";

  const navItems: Array<{ key: PageKey; label: string; icon: typeof LayoutDashboard }> = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "children", label: "Database Anak", icon: Users },
    { key: "assessment", label: "Input Asesmen", icon: ClipboardCheck },
    { key: "history", label: "Riwayat Asesmen", icon: History },
    { key: "report", label: "Laporan & Sertifikat", icon: FileText },
    { key: "compare", label: "Perbandingan", icon: ArrowLeftRight },
    { key: "parent-portal", label: "Portal Orang Tua", icon: HeartHandshake },
    ...(currentUser.role === "ADMIN"
      ? [{ key: "accounts" as PageKey, label: "Manajemen Akun", icon: ShieldCheck }]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F6] text-[#172820]">
      {/* Top Bar */}
      <header className="no-print sticky top-0 z-30 h-16 bg-white border-b border-[#E2E8E4] px-4 sm:px-6 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => setPage(isParentOnly ? "parent-portal" : "dashboard")}
          className="flex items-center gap-3 text-left whitespace-nowrap shrink-0 cursor-pointer"
        >
          <img
            src="/assets/aistudio/NATIFA_Colorful_Potential_Badge_1527cb16.webp"
            alt="FATIHA NATIVA"
            referrerPolicy="no-referrer"
            className="w-10 h-10 object-contain shrink-0"
          />
          <span className="text-lg font-extrabold tracking-tight text-[#1E713B]">NATIVA</span>
        </button>

        {/* Zone 2: Contextual Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[#64776D] truncate">
          <span>FATIHA Learning Center</span>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-[#172820]">{PAGE_LABELS[page]}</span>
        </div>

        {/* Zone 3: Account Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:block text-xs text-[#2E4237] whitespace-nowrap">
            <span className="font-medium">{currentUser.name}</span>
            <span className="text-[#85978D] mx-1.5">·</span>
            <span className="text-[#1E713B] font-semibold">
              {currentUser.role === "ORANG_TUA" ? "Orang Tua" : currentUser.role}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            title="Ganti Password"
            className="p-2 text-[#54675D] hover:text-[#14281E] hover:bg-[#F2F6F3] rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#54675D] hover:text-[#B4232C] hover:bg-[#FDF2F2] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar Navigation (Hidden for Parent-Only role) */}
        {!isParentOnly && (
          <aside className="no-print lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[#E2E8E4]">
            <nav
              aria-label="Navigasi utama NATIVA"
              className="p-3 lg:p-4 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = page === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPage(item.key)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? "bg-[#EAF4EC] text-[#175B2F] font-semibold"
                        : "text-[#475B50] hover:bg-[#F4F7F5] hover:text-[#14281E]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="hidden lg:block px-5 py-4 mt-4 border-t border-[#EEF2EF] text-[11px] leading-relaxed text-[#6F8278]">
              <p className="font-semibold text-[#3C5347]">FATIHA Daycare &amp; Learning Center</p>
              <p className="mt-0.5">Tumbuh Bahagia, Belajar Sesuai Fitrah</p>
            </div>
          </aside>
        )}

        {/* Active Page Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto">
          {loadingData ? (
            <div className="space-y-4">
              <div className="h-8 w-64 bg-[#E9EFEA] rounded-lg animate-pulse" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-white border border-[#E2E8E4] rounded-xl" />
                ))}
              </div>
              <div className="h-72 bg-white border border-[#E2E8E4] rounded-xl" />
            </div>
          ) : isParentOnly || page === "parent-portal" ? (
            <ParentPortalView
              currentUser={currentUser}
              onSubmitted={refreshData}
              onNotify={notify}
            />
          ) : page === "dashboard" ? (
            <DashboardView
              childrenList={childrenList}
              assessments={assessments}
              parentSubmissions={parentSubmissions}
              onStartAssessment={() => {
                setPreselectedChildId(undefined);
                setPage("assessment");
              }}
              onOpenReport={handleOpenReport}
              onNavigate={(p) => setPage(p as PageKey)}
            />
          ) : page === "children" ? (
            <ChildrenView
              childrenList={childrenList}
              assessments={assessments}
              onDataChanged={refreshData}
              onStartAssessmentForChild={handleStartAssessmentForChild}
              onNotify={notify}
            />
          ) : page === "assessment" ? (
            <AssessmentFormView
              childrenList={childrenList}
              currentUser={currentUser}
              preselectedChildId={preselectedChildId}
              onDataChanged={refreshData}
              onOpenReport={handleOpenReport}
              onNotify={notify}
            />
          ) : page === "history" ? (
            <HistoryView assessments={assessments} onOpenReport={handleOpenReport} />
          ) : page === "report" ? (
            <ReportCertificateView
              assessments={assessments}
              selectedAssessmentId={selectedReportId}
              onSelectAssessmentId={setSelectedReportId}
              onNotify={notify}
            />
          ) : page === "compare" ? (
            <CompareView assessments={assessments} />
          ) : page === "accounts" && currentUser.role === "ADMIN" ? (
            <AccountsView onNotify={notify} />
          ) : null}
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`no-print fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl text-xs font-medium shadow-lg border ${
            toast.tone === "error"
              ? "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]"
              : "bg-[#143D28] text-white border-[#1E713B]"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <AuthModal
          mode="password"
          currentUser={currentUser}
          onClose={() => setPasswordModalOpen(false)}
          onAuthenticated={handleAuthenticated}
          onNotify={notify}
        />
      )}
    </div>
  );
}
