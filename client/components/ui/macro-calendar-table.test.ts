import { describe, it, expect } from "vitest";
import { getDisplayedEvents } from "./macro-calendar-table";
import type { EconomicEvent } from "@shared/api";

describe("getDisplayedEvents", () => {
  const mockEvents: EconomicEvent[] = Array.from({ length: 15 }, (_, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
    time: "00:00",
    country: "US",
    event: `Event ${i + 1}`,
    category: "Economic",
    importance: 2,
  }));

  it("limits events to 10 when not expanded", () => {
    const result = getDisplayedEvents(mockEvents, false);
    expect(result).toHaveLength(10);
  });

  it("returns all events when expanded", () => {
    const result = getDisplayedEvents(mockEvents, true);
    expect(result).toHaveLength(mockEvents.length);
  });
});
