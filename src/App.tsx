import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";

const App = () => (
    <TooltipProvider>
      <Sonner />
      <Index />
    </TooltipProvider>
);

export default App;
