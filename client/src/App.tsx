import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DateFilterProvider } from "./contexts/DateFilterContext";
import Home from "./pages/Home";
import Setup from "./pages/Setup";
import ChatView from "./pages/ChatView";
import Stats from "./pages/Stats";
import Agents from "./pages/Agents";
import AgentDetails from "./pages/AgentDetails";
import AgentComparison from "./pages/AgentComparison";
import Operators from "./pages/Operators";
import Team from "./pages/Team";

function Router() {
  return (
    <Switch>
      <Route path="/setup" component={Setup} />
      <Route path="/" component={Home} />
      <Route path="/chat/:chatId" component={ChatView} />
      <Route path="/agents" component={Agents} />
      <Route path="/agents/compare" component={AgentComparison} />
      <Route path="/agents/:agentId" component={AgentDetails} />
      <Route path="/operators" component={Operators} />
      <Route path="/team" component={Team} />
      <Route path="/stats" component={Stats} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <DateFilterProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </DateFilterProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
