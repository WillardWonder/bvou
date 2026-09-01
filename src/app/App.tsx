import { Navigate, Route, Routes } from "react-router-dom";
import { BRAND, ROUTES } from "../domain";
import { useApp } from "./AppContext";
import { AppShell } from "../components/AppShell";
import { GlobalFeedback } from "../components/GlobalFeedback";
import { RequireAdmin, RequireAthlete, RequireAuth, RequireCoach } from "../components/RouteGuards";
import { SignInPage } from "../features/auth/SignInPage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { TodayPage } from "../features/today/TodayPage";
import { BeforePracticePage } from "../features/practice/BeforePracticePage";
import { AfterPracticePage } from "../features/practice/AfterPracticePage";
import { ResetSweepPage } from "../features/reset-sweep/ResetSweepPage";
import { UniversityPage } from "../features/curriculum/UniversityPage";
import { LessonPage } from "../features/curriculum/LessonPage";
import { CompetitionPage } from "../features/competition/CompetitionPage";
import { ConfidenceBankPage } from "../features/confidence/ConfidenceBankPage";
import { DevelopmentPage } from "../features/development/DevelopmentPage";
import { TeamPage } from "../features/team/TeamPage";
import { CoachHomePage } from "../features/coach/CoachHomePage";
import { CoachContentPage } from "../features/coach/CoachContentPage";
import { AdminPage } from "../features/admin/AdminPage";
import { PracticeBoardPage } from "../features/board/PracticeBoardPage";

function StartRoute() {
  const { session } = useApp();
  if (!session) return <Navigate to={ROUTES.signIn} replace />;
  if (!session.profile.onboardingComplete && session.membership.role === "athlete") return <Navigate to={ROUTES.onboarding} replace />;
  return <Navigate to={session.membership.role === "athlete" ? ROUTES.today : session.membership.role === "board" ? ROUTES.board(session.teamId, "current") : ROUTES.coach} replace />;
}

function NotFound() {
  return <div className="not-found"><img src={BRAND.compactLogo} alt=""/><h1>That page is off the mat.</h1><p>Return to the part of the app your team uses.</p><StartRoute/></div>;
}

export function App() {
  return (
    <>
      <Routes>
        <Route path={ROUTES.signIn} element={<SignInPage />} />
        <Route element={<RequireAuth />}>
          <Route path={ROUTES.onboarding} element={<OnboardingPage />} />
          <Route path="/board/:teamId/:sessionId" element={<PracticeBoardPage />} />
          <Route element={<AppShell />}>
            <Route element={<RequireAthlete />}>
              <Route path={ROUTES.today} element={<TodayPage />} />
              <Route path="/app/practice/before/:sessionId" element={<BeforePracticePage />} />
              <Route path="/app/practice/after/:sessionId" element={<AfterPracticePage />} />
              <Route path={ROUTES.resetSweep} element={<ResetSweepPage />} />
              <Route path={ROUTES.curriculum} element={<UniversityPage />} />
              <Route path="/app/you-university/:lessonId" element={<LessonPage />} />
              <Route path={ROUTES.compete} element={<CompetitionPage />} />
              <Route path={ROUTES.confidence} element={<ConfidenceBankPage />} />
              <Route path={ROUTES.develop} element={<DevelopmentPage />} />
              <Route path={ROUTES.team} element={<TeamPage />} />
            </Route>
            <Route element={<RequireCoach />}>
              <Route path={ROUTES.coach} element={<CoachHomePage />} />
              <Route path={ROUTES.coachContent} element={<CoachContentPage />} />
            </Route>
            <Route element={<RequireAdmin />}>
              <Route path={ROUTES.coachAdmin} element={<AdminPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="/" element={<StartRoute />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <GlobalFeedback />
    </>
  );
}
