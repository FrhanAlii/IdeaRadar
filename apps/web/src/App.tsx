import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import SettingsPage from "./pages/Settings";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Discover from "./pages/Discover";
import Saved from "./pages/Saved";
import Trends from "./pages/Trends";
import CrawlJobs from "./pages/CrawlJobs";
import AuthCallback from "./pages/AuthCallback";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";

const queryClient = new QueryClient();

const ProtectedDashboard = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/discover" replace />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/discover"   element={<ProtectedDashboard><Discover /></ProtectedDashboard>} />
            <Route path="/saved"      element={<ProtectedDashboard><Saved /></ProtectedDashboard>} />
            <Route path="/trends"     element={<ProtectedDashboard><Trends /></ProtectedDashboard>} />
            <Route path="/crawl-jobs" element={<ProtectedDashboard><CrawlJobs /></ProtectedDashboard>} />
            <Route path="/dashboard"  element={<ProtectedDashboard><Dashboard /></ProtectedDashboard>} />
            <Route path="/calendar"   element={<ProtectedDashboard><Calendar /></ProtectedDashboard>} />
            <Route path="/settings"   element={<ProtectedDashboard><SettingsPage /></ProtectedDashboard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
