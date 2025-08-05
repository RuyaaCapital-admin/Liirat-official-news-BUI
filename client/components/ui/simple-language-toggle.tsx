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
        "h-9 w-9 p-0 font-medium transition-all duration-200",
        "hover:bg-primary/10 hover:text-primary",
        "border border-border/50 hover:border-primary/50 rounded-full",
        className,
      )}
      title={language === "ar" ? "Switch to English" : "Switch to Arabic"}
    >
      <span className="text-sm font-bold">
        {language === "ar" ? "EN" : "ع"}
      </span>
    </Button>
  );
}
