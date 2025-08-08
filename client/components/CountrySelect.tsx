import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import ReactCountryFlag from "react-country-flag";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

// Country names in Arabic and English
const COUNTRY_NAMES: Record<string, { en: string; ar: string }> = {
  US: { en: "United States", ar: "الولايات المتحدة" },
  EUR: { en: "European Union", ar: "الاتحاد الأوروبي" },
  GB: { en: "United Kingdom", ar: "المملكة المتحدة" },
  JP: { en: "Japan", ar: "اليابان" },
  CA: { en: "Canada", ar: "كندا" },
  AU: { en: "Australia", ar: "أستراليا" },
  DE: { en: "Germany", ar: "ألمانيا" },
  FR: { en: "France", ar: "فرنسا" },
  CN: { en: "China", ar: "الصين" },
  CH: { en: "Switzerland", ar: "سويسرا" },
  IT: { en: "Italy", ar: "إيطاليا" },
  ES: { en: "Spain", ar: "إسبانيا" },
  NL: { en: "Netherlands", ar: "هولندا" },
  SE: { en: "Sweden", ar: "السويد" },
  NO: { en: "Norway", ar: "النرويج" },
  DK: { en: "Denmark", ar: "الدنمارك" },
  RU: { en: "Russia", ar: "روسيا" },
  BR: { en: "Brazil", ar: "البرازيل" },
  IN: { en: "India", ar: "الهند" },
  MX: { en: "Mexico", ar: "المكسيك" },
  KR: { en: "South Korea", ar: "كوريا الجنوبية" },
  SG: { en: "Singapore", ar: "سنغافورة" },
  HK: { en: "Hong Kong", ar: "هونغ كونغ" },
  TW: { en: "Taiwan", ar: "تايوان" },
  TH: { en: "Thailand", ar: "تايلاند" },
  MY: { en: "Malaysia", ar: "ماليزيا" },
  ID: { en: "Indonesia", ar: "إندونيسيا" },
  PH: { en: "Philippines", ar: "الفلبين" },
  VN: { en: "Vietnam", ar: "فيتنام" },
  AE: { en: "UAE", ar: "الإما��ات" },
  SA: { en: "Saudi Arabia", ar: "السعودية" },
  QA: { en: "Qatar", ar: "قطر" },
  KW: { en: "Kuwait", ar: "الكويت" },
  BH: { en: "Bahrain", ar: "البحرين" },
  OM: { en: "Oman", ar: "عمان" },
  JO: { en: "Jordan", ar: "الأردن" },
  LB: { en: "Lebanon", ar: "لبنان" },
  EG: { en: "Egypt", ar: "مصر" },
  MA: { en: "Morocco", ar: "المغرب" },
  TN: { en: "Tunisia", ar: "تونس" },
  DZ: { en: "Algeria", ar: "الجزائر" },
  TR: { en: "Turkey", ar: "تركيا" },
  IL: { en: "Israel", ar: "إسرائيل" },
  ZA: { en: "South Africa", ar: "جنوب أفريقيا" },
  NZ: { en: "New Zealand", ar: "نيوزيلندا" },
  CL: { en: "Chile", ar: "تشيلي" },
  AR: { en: "Argentina", ar: "الأرجنتين" },
  CO: { en: "Colombia", ar: "كولومبيا" },
  PE: { en: "Peru", ar: "بيرو" },
  PL: { en: "Poland", ar: "بولندا" },
  CZ: { en: "Czech Republic", ar: "التشيك" },
  HU: { en: "Hungary", ar: "المجر" },
  GR: { en: "Greece", ar: "اليونان" },
  PT: { en: "Portugal", ar: "البرتغال" },
  IE: { en: "Ireland", ar: "أيرلندا" },
  AT: { en: "Austria", ar: "النمسا" },
  BE: { en: "Belgium", ar: "بلجيكا" },
  FI: { en: "Finland", ar: "فنلندا" },
};

export function CountrySelect({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: { code: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language, dir } = useLanguage();

  // Get country name in current language
  const getCountryName = (code: string) => {
    const names = COUNTRY_NAMES[code];
    if (!names) return code;
    return language === "ar" ? names.ar : names.en;
  };

  // Filter countries based on search
  const filteredCountries = options.filter((o) => {
    const searchTerm = q.toLowerCase();
    const englishName = COUNTRY_NAMES[o.code]?.en?.toLowerCase() || o.code.toLowerCase();
    const arabicName = COUNTRY_NAMES[o.code]?.ar || "";
    return (
      englishName.includes(searchTerm) ||
      arabicName.includes(searchTerm) ||
      o.code.toLowerCase().includes(searchTerm)
    );
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Position dropdown below button
  const [dropdownStyle, setDropdownStyle] = useState({});
  
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 320; // estimated max height
      
      // Check if there's enough space below
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let top = rect.bottom + 4;
      
      // If not enough space below but more space above, open upward
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        top = rect.top - dropdownHeight - 4;
      }
      
      setDropdownStyle({
        position: 'fixed',
        top: `${Math.max(4, top)}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        maxHeight: `${Math.min(dropdownHeight, Math.max(spaceBelow, spaceAbove) - 8)}px`,
        zIndex: 100,
      });
    }
  }, [open]);

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-background border border-border rounded-md shadow-lg overflow-hidden"
    >
      {/* Search Input */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={language === "ar" ? "البحث في الدول..." : "Search countries..."}
            className={cn(
              "w-full pl-10 pr-3 py-2 rounded border bg-background text-foreground placeholder:text-muted-foreground text-sm",
              dir === "rtl" && "text-right"
            )}
            autoFocus
          />
        </div>
      </div>

      {/* Countries List */}
      <div className="max-h-60 overflow-y-auto">
        {filteredCountries.length === 0 ? (
          <div className="p-3 text-center text-muted-foreground text-sm">
            {language === "ar" ? "لا توجد دول" : "No countries found"}
          </div>
        ) : (
          filteredCountries.map((o) => (
            <label
              key={o.code}
              className={cn(
                "flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors text-sm border-b border-border/50 last:border-b-0",
                dir === "rtl" && "flex-row-reverse"
              )}
            >
              <input
                type="checkbox"
                checked={value.includes(o.code)}
                onChange={() => {
                  onChange(
                    value.includes(o.code)
                      ? value.filter((v) => v !== o.code)
                      : [...value, o.code]
                  );
                }}
                className="rounded"
              />
              
              {/* Country Flag */}
              <div className="flex-shrink-0">
                {o.code === "EUR" ? (
                  <div className="w-5 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                    <span className="text-yellow-400 text-xs font-bold">EU</span>
                  </div>
                ) : (
                  <ReactCountryFlag
                    countryCode={o.code}
                    svg
                    className="w-5 h-4 rounded-sm"
                  />
                )}
              </div>
              
              {/* Country Name */}
              <span className={cn("flex-1", dir === "rtl" && "text-right")}>
                {getCountryName(o.code)}
              </span>
              
              {/* Country Code */}
              <span className="text-xs text-muted-foreground font-mono">
                {o.code}
              </span>
            </label>
          ))
        )}
      </div>

      {/* Actions */}
      <div className={cn(
        "flex justify-between items-center p-3 border-t border-border bg-muted/30",
        dir === "rtl" && "flex-row-reverse"
      )}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange([])}
          className="text-xs"
        >
          {language === "ar" ? "مسح الكل" : "Clear All"}
        </Button>
        
        <div className="text-xs text-muted-foreground">
          {value.length} {language === "ar" ? "محدد" : "selected"}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          className="text-xs"
        >
          {language === "ar" ? "إغلاق" : "Close"}
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button
        ref={buttonRef}
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "justify-between w-full h-9 text-xs",
          dir === "rtl" && "flex-row-reverse"
        )}
      >
        <span className="truncate">
          {value.length
            ? `${value.length} ${language === "ar" ? "دولة محددة" : "countries"}`
            : language === "ar" 
            ? "جميع الدول" 
            : "All countries"}
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
      </Button>
      
      {typeof document !== "undefined" && dropdown && createPortal(dropdown, document.body)}
    </>
  );
}
