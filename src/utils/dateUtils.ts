// Romanian legal holidays for 2024-2026
export const romanianHolidays: Record<string, string[]> = {
  2024: [
    "2024-01-01",
    "2024-01-02",
    "2024-01-06",
    "2024-01-07",
    "2024-01-24",
    "2024-05-01",
    "2024-06-01",
    "2024-08-15",
    "2024-08-30",
  ],
  2025: [
    "2025-01-01",
    "2025-01-02",
    "2025-01-06",
    "2025-01-07",
    "2025-01-24",
    "2025-05-01",
    "2025-06-01",
    "2025-08-15",
    "2025-08-30",
  ],
  2026: [
    "2026-01-01",
    "2026-01-02",
    "2026-01-06",
    "2026-01-07",
    "2026-01-24",
    "2026-05-01",
    "2026-06-01",
    "2026-08-15",
    "2026-08-30",
  ],
};

export const isRomanianHoliday = (date: Date): boolean => {
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  // Check manual holidays in localStorage first
  let manual: string[] = [];
  try {
    const stored = localStorage.getItem(`manualHolidays_${year}`);
    if (stored) manual = JSON.parse(stored);
  } catch {}

  const holidays = romanianHolidays[year as keyof typeof romanianHolidays] || [];
  return manual.includes(dateStr) || holidays.includes(dateStr);
};

export const roundToNearestMinute = (minutes: number): number => {
  return Math.round(minutes);
};

export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const calculateWorkHours = (
  startTime: string,
  endTime: string
): number => {
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);

  // If end time is earlier than start time, it's a night shift
  if (end < start) {
    end += 24 * 60; // Add 24 hours
  }

  return end - start;
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

export const isWeekday = (date: Date): boolean => {
  return !isWeekend(date);
};
