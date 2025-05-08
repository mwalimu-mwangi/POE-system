import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Submissions from "@/pages/submissions";
import SubmissionDetail from "@/pages/submission-detail";
import Assessment from "@/pages/assessment";
import Verification from "@/pages/verification";
import VerificationDetail from "@/pages/verification-detail";
import Reports from "@/pages/reports";
import UserManagement from "@/pages/user-management";
import ActivityLogs from "@/pages/activity-logs";
import Settings from "@/pages/settings";
import Notifications from "@/pages/notifications";
import EducationalStructure from "@/pages/educational-structure";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/submissions" component={Submissions} />
      <ProtectedRoute path="/submissions/:id" component={SubmissionDetail} />
      <ProtectedRoute path="/assessment" component={Assessment} />
      <ProtectedRoute path="/verification" component={Verification} />
      <ProtectedRoute path="/verification/:id" component={VerificationDetail} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/user-management" component={UserManagement} />
      <ProtectedRoute path="/educational-structure" component={EducationalStructure} />
      <ProtectedRoute path="/activity-logs" component={ActivityLogs} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/notifications" component={Notifications} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
