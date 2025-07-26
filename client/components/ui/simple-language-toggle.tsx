import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface SimpleLanguageToggleProps {
  className?: string;
}

export function SimpleLanguageToggle({ className }: SimpleLanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={cn(
        "h-9 px-3 font-medium transition-all duration-200",
        "hover:bg-primary/10 hover:text-primary",
        "border border-border/50 hover:border-primary/50",
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className="text-sm">{language === "ar" ? "🇸🇦" : "🇺🇸"}</span>
        <span className="text-xs font-semibold">
          {language === "ar" ? "AR" : "EN"}
        </span>
      </span>
    </Button>
  );
}
