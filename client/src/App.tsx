import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
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

function Router() {
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
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <div className="max-w-md mx-auto bg-background min-h-screen text-foreground font-sans selection:bg-primary/20 transition-colors duration-300">
          <Router />
          <Toaster />
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
