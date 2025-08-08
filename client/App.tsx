import "./global.css";
import React, { useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import { LanguageProvider, useLanguage } from "@/contexts/language-context";
import { AlertProvider } from "@/contexts/alert-context";
import Index from "./pages/Index";
import AITradingAssistant from "./pages/AITradingAssistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const TempoRoutes = () => {
  return import.meta.env.VITE_TEMPO ? useRoutes(routes) : null;
};

const AppContent = () => {
  const { language, dir } = useLanguage();

  useEffect(() => {
    // Update document direction and language
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  return (
    <BrowserRouter>
      {/* Tempo routes */}
      <TempoRoutes />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/ai-trading" element={<AITradingAssistant />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        {import.meta.env.VITE_TEMPO && <Route path="/tempobook/*" />}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AlertProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </AlertProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
