import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import {
  LegacyAppDetailsQueryRedirect,
  LegacyManageAppRedirect,
} from "@/pages/LegacyAppRoutes";
import Logout from "@/pages/Logout";
import Home from "@/pages/Home";

const Hub = lazy(() => import("@/pages/Hub"));

const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Login = lazy(() => import("@/pages/Login"));
const AppDetails = lazy(() => import("@/pages/AppDetails"));
const Admin = lazy(() => import("@/pages/Admin"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const UnderConstruction = lazy(() => import("@/pages/UnderConstruction"));
const Settings = lazy(() => import("@/pages/Settings"));
const Workstation = lazy(() => import("@/pages/Workstation"));
const ForBuilders = lazy(() => import("@/pages/ForBuilders"));
const VerifyApp = lazy(() => import("@/pages/VerifyApp"));
const Scan = lazy(() => import("@/pages/Scan"));
const McpBlueprintTest = lazy(() => import("@/pages/McpBlueprintTest"));
const McpBlueprintResultsIndex = lazy(() => import("@/pages/McpBlueprintResultsIndex"));
const McpBlueprintResultPage = lazy(() => import("@/pages/McpBlueprintResultPage"));
const GuidesIndex = lazy(() => import("@/pages/guides/GuidesIndex"));
const GuideArticle = lazy(() => import("@/pages/guides/GuideArticle"));

function Router() {
  return (
    <Switch>
      <Route path="/app-details" component={LegacyAppDetailsQueryRedirect}/>
      <Route path="/app-details/" component={LegacyAppDetailsQueryRedirect}/>
      <Route path="/manage-app" component={LegacyManageAppRedirect}/>
      <Route path="/manage-app/" component={LegacyManageAppRedirect}/>
      <Route path="/" component={Home}/>
      <Route path="/for-builders" component={ForBuilders}/>
      <Route path="/scan" component={Scan}/>
      <Route path="/mcp-test" component={McpBlueprintTest}/>
      <Route path="/mcp-blueprint-results/:id" component={McpBlueprintResultPage}/>
      <Route path="/mcp-blueprint-results" component={McpBlueprintResultsIndex}/>
      <Route path="/guides/:slug" component={GuideArticle}/>
      <Route path="/guides" component={GuidesIndex}/>
      <Route path="/hub" component={Hub}/>
      <Route path="/dashboard" component={Dashboard}/>
      <Route path="/login" component={Login}/>
      <Route path="/logout" component={Logout}/>
      <Route path="/app/:id" component={AppDetails}/>
      <Route path="/apps/:slug" component={AppDetails}/>
      <Route path="/verify/:id" component={VerifyApp}/>
      <Route path="/admin" component={Admin}/>
      <Route path="/faq" component={FAQ}/>
      <Route path="/privacy" component={Privacy}/>
      <Route path="/terms" component={Terms}/>
      <Route path="/under-construction" component={UnderConstruction}/>
      <Route path="/settings" component={Settings}/>
      <Route path="/workstation" component={Workstation}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <RouteErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Router />
          </Suspense>
        </RouteErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
