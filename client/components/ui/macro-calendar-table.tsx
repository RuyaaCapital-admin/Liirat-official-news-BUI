import React from "react";
import { EconomicEvent } from "@shared/api";
import { cn } from "@/lib/utils";

interface MacroCalendarTableProps {
  events: EconomicEvent[];
  className?: string;
  language?: "ar" | "en";
  dir?: "rtl" | "ltr";
}

const getImportanceColor = (importance: number) => {
  switch (importance) {
    case 3:
      return "bg-red-500 text-white";
    case 2:
      return "bg-orange-500 text-white";
    case 1:
      return "bg-green-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getImportanceLabel = (importance: number) => {
  switch (importance) {
    case 3:
      return "High";
    case 2:
      return "Medium";
    case 1:
      return "Low";
    default:
      return "Unknown";
  }
};

const getCountryFlag = (country: string) => {
  const flagMap: Record<string, string> = {
    US: "🇺🇸",
    EUR: "🇪🇺",
    GB: "🇬🇧",
    JP: "🇯🇵",
    CA: "🇨🇦",
    AU: "🇦🇺",
    CHF: "🇨🇭",
    DE: "🇩🇪",
    FR: "🇫🇷",
    IT: "🇮🇹",
    ES: "🇪🇸",
    NL: "🇳🇱",
    CN: "🇨🇳",
  };
  return flagMap[country] || "🌍";
};

const formatTime = (time: string) => {
  if (!time) return "--:--";
  try {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return time;
  }
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return dateStr;
  }
};

export function MacroCalendarTable({
  events,
  className,
  language = "en",
  dir = "ltr",
}: MacroCalendarTableProps) {
  const t = (enText: string, arText: string) =>
    language === "ar" ? arText : enText;
  const textAlign = dir === "rtl" ? "text-right" : "text-left";

  return (
    <div className={cn("overflow-x-auto", className)} dir={dir}>
      <table className="w-full border-collapse bg-card rounded-lg overflow-hidden shadow-sm">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className={`${textAlign} p-4 font-semibold text-foreground`}>
              {t("Date", "التاريخ")}
            </th>
            <th className={`${textAlign} p-4 font-semibold text-foreground`}>
              {t("Time", "الوقت")}
            </th>
            <th className={`${textAlign} p-4 font-semibold text-foreground`}>
              {t("Country", "الدولة")}
            </th>
            <th className={`${textAlign} p-4 font-semibold text-foreground`}>
              {t("Event", "الحدث")}
            </th>
            <th className={`${textAlign} p-4 font-semibold text-foreground`}>
              {t("Category", "الفئة")}
            </th>
            <th className="text-center p-4 font-semibold text-foreground">
              {t("Importance", "الأهمية")}
            </th>
            <th className="text-center p-4 font-semibold text-foreground">
              {t("Previous", "السابق")}
            </th>
            <th className="text-center p-4 font-semibold text-foreground">
              {t("Forecast", "التوقع")}
            </th>
            <th className="text-center p-4 font-semibold text-foreground">
              {t("Actual", "الفعلي")}
            </th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center p-8 text-muted-foreground">
                {t(
                  "No economic events available",
                  "لا توجد أحداث اقتصادية متاحة",
                )}
              </td>
            </tr>
          ) : (
            events.map((event, index) => (
              <tr
                key={index}
                className="border-b border-border hover:bg-muted/25 transition-colors"
              >
                <td className="p-4 text-foreground font-medium">
                  {formatDate(event.date)}
                </td>
                <td className="p-4 text-foreground">
                  {formatTime(event.time)}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {getCountryFlag(event.country)}
                    </span>
                    <span className="text-foreground font-medium">
                      {event.country}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-foreground max-w-xs">
                  <div className="truncate" title={event.event}>
                    {event.event}
                  </div>
                </td>
                <td className="p-4">
                  {event.category && (
                    <span className="inline-block bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs font-medium">
                      {event.category}
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <span
                    className={cn(
                      "inline-block px-2 py-1 rounded-md text-xs font-bold",
                      getImportanceColor(event.importance),
                    )}
                  >
                    {getImportanceLabel(event.importance)}
                  </span>
                </td>
                <td className="p-4 text-center text-foreground">
                  {event.previous || "--"}
                </td>
                <td className="p-4 text-center text-foreground">
                  {event.forecast || "--"}
                </td>
                <td className="p-4 text-center">
                  <span
                    className={cn(
                      "font-semibold",
                      event.actual ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {event.actual || "--"}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
