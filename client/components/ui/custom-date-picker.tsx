import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Check, X } from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

interface CustomDatePickerProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function CustomDatePicker({
  value,
  onValueChange,
  className,
}: CustomDatePickerProps) {
  const { t, language, dir } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value === "custom" ? new Date() : undefined,
  );
  const [tempValue, setTempValue] = useState(value);

  const dateLocale = language === "ar" ? ar : enUS;

  const presetOptions = [
    {
      value: "today",
      label: language === "ar" ? "اليوم" : "Today",
      getDate: () => new Date(),
    },
    {
      value: "tomorrow",
      label: language === "ar" ? "غداً" : "Tomorrow",
      getDate: () => addDays(new Date(), 1),
    },
    {
      value: "weekly",
      label: language === "ar" ? "الأسبوع" : "Weekly",
      isGroup: true,
      subOptions: [
        {
          value: "this-week",
          label: language === "ar" ? "هذا الأسبوع" : "This Week",
          getDate: () => ({
            from: startOfWeek(new Date()),
            to: endOfWeek(new Date()),
          }),
        },
        {
          value: "next-week",
          label: language === "ar" ? "الأسبوع القادم" : "Next Week",
          getDate: () => ({
            from: startOfWeek(addDays(new Date(), 7)),
            to: endOfWeek(addDays(new Date(), 7)),
          }),
        },
      ]
    },
    {
      value: "this-month",
      label: language === "ar" ? "الشهر" : "Monthly",
      getDate: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      }),
    },
    {
      value: "next",
      label: language === "ar" ? "القادم" : "Next",
      getDate: () => ({
        from: addDays(new Date(), 1),
        to: addDays(new Date(), 7),
      }),
    },
  ];

  const getCurrentLabel = () => {
    // Check for suboptions first
    for (const preset of presetOptions) {
      if (preset.subOptions) {
        const subOption = preset.subOptions.find((sub) => sub.value === value);
        if (subOption) return subOption.label;
      }
    }

    const preset = presetOptions.find((p) => p.value === value);
    if (preset) return preset.label;

    if (value === "custom" && selectedDate) {
      return format(selectedDate, "PPP", { locale: dateLocale });
    }

    return t("calendar.select.date");
  };

  const handlePresetSelect = (presetValue: string) => {
    setTempValue(presetValue);
    if (presetValue !== "custom") {
      setSelectedDate(undefined);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setTempValue("custom");
    }
  };

  const handleApply = () => {
    onValueChange(tempValue);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setSelectedDate(value === "custom" ? selectedDate : undefined);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span>{getCurrentLabel()}</span>
          <CalendarIcon className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {language === "ar" ? "اختيار التاريخ" : "Select Date"}
          </DialogTitle>
          <DialogDescription>
            {language === "ar"
              ? "اختر التاريخ لتصفية الأحداث الاقتصادية"
              : "Choose a date to filter economic events"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preset Options */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {language === "ar" ? "خيارات سريعة" : "Quick Options"}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {presetOptions.map((preset) => (
                <div key={preset.value}>
                  {preset.subOptions ? (
                    <div className="col-span-2 space-y-1">
                      <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                        {preset.label}
                      </div>
                      <div className="grid grid-cols-2 gap-1 ml-2">
                        {preset.subOptions.map((subOption) => (
                          <Button
                            key={subOption.value}
                            variant={tempValue === subOption.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePresetSelect(subOption.value)}
                            className="justify-start text-xs"
                          >
                            {subOption.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant={tempValue === preset.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePresetSelect(preset.value)}
                      className="justify-start text-xs"
                    >
                      {preset.label}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Date Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {language === "ar" ? "تاريخ مخصص" : "Custom Date"}
              </h4>
              <Button
                variant={tempValue === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetSelect("custom")}
                className="text-xs"
              >
                {t("date.custom")}
              </Button>
            </div>

            {tempValue === "custom" && (
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={dateLocale}
                  className="rounded-md border"
                  disabled={(date) => date < new Date("1900-01-01")}
                />
              </div>
            )}
          </div>

          {/* Selected Date Display */}
          {tempValue === "custom" && selectedDate && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {language === "ar" ? "التاريخ المحدد:" : "Selected Date:"}
                </span>
                <Badge variant="secondary">
                  {format(selectedDate, "PPP", { locale: dateLocale })}
                </Badge>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1"
              disabled={tempValue === "custom" && !selectedDate}
            >
              <Check className="w-4 h-4 mr-2" />
              {t("common.confirm")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
