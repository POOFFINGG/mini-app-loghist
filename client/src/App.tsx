import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import CreateRequest from "@/pages/CreateRequest";
import Requests from "@/pages/Requests";
import Database from "@/pages/Database";
import Tracking from "@/pages/Tracking";
import { BottomNav } from "@/components/layout/BottomNav";
import Auth from "@/pages/Auth";
import Register from "@/pages/Register";
import RequestDetail from "@/pages/RequestDetail";
import Profile from "@/pages/Profile";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";

const PUBLIC_ROUTES = ["/", "/auth", "/register", "/onboarding"];

function isAdminPath(loc: string) {
  return loc === "/admin" || loc.startsWith("/admin/");
}

function AdminRouter() {
  return (
    <div className="dark">
      <Switch>
        <Route path="/admin" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route component={AdminLogin} />
      </Switch>
      <Toaster />
    </div>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  if (!isLoading && !isAuthenticated && !PUBLIC_ROUTES.includes(location)) {
    setLocation("/auth");
    return null;
  }

  if (!isLoading && isAuthenticated && PUBLIC_ROUTES.includes(location)) {
    setLocation("/home");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Switch>
        <Route path="/" component={Onboarding} />
        <Route path="/auth" component={Auth} />
        <Route path="/register" component={Register} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/home" component={Home} />
        <Route path="/create-request" component={CreateRequest} />
        <Route path="/requests" component={Requests} />
        <Route path="/requests/:id" component={RequestDetail} />
        <Route path="/database" component={Database} />
        <Route path="/track" component={Tracking} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
      {isAuthenticated && <BottomNav />}
    </>
  );
}

function App() {
  const [location] = useLocation();

  if (isAdminPath(location)) {
    return (
      <QueryClientProvider client={queryClient}>
        <AdminRouter />
      </QueryClientProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="max-w-md mx-auto bg-background min-h-screen text-foreground font-sans selection:bg-primary/20 transition-colors duration-300">
            <AppRouter />
            <Toaster />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
