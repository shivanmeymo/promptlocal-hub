import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Suspense, lazy } from "react";
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const ManageEvents = lazy(() => import("./pages/ManageEvents"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const EditEvent = lazy(() => import("./pages/EditEvent"));
const DataIntegrity = lazy(() => import("./pages/DataIntegrity"));
const Terms = lazy(() => import("./pages/Terms"));
const ConnectionTest = lazy(() => import("./pages/ConnectionTest"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ApprovalResult = lazy(() => import("./pages/ApprovalResult"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<div className="p-8 text-center" role="status" aria-live="polite">Loading...</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/create-event" element={<CreateEvent />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/manage-events" element={<ManageEvents />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/event/:id" element={<EventDetails />} />
                  <Route path="/edit-event/:id" element={<EditEvent />} />
                  <Route path="/data-integrity" element={<DataIntegrity />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/connection-test" element={<ConnectionTest />} />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/approval-result" element={<ApprovalResult />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
