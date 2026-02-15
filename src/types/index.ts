export type ShiftType = "day" | "night" | "neither" | "cs" | "co" | "cm" | "inv";

export interface DayEntry {
  id: string;
  date: Date;
  shifts: {
    type: ShiftType;
    startTime: string;
    endTime: string;
    duration: number;
  }[];
  notes?: string;
}

export interface MonthSummary {
  totalFTL: number; // Full-time total in minutes (weekdays * 8h)
  totalOL: number; // Total hours input
  totalWeekend: number; // Weekend hours
  workDays: number; // Total working days
  offDays: number; // Total off days
  csMonth: number; // CS minutes for the month
  csTotal: number; // Cumulative CS minutes up to and including this month
  osMonth: number; // OS for the current month (minutes)
  osTotal: number; // Cumulative OS total up to this month (minutes)
  csBalance: number; // CS balance = osTotal - cumulative CS minutes
  osDebt90d: number; // OS minutes unpaid by CS within 90 days (red warning)
}

export interface ShiftConfig {
  type: ShiftType;
  label: string;
  defaultStart: string;
  defaultEnd: string;
}


export interface Calendar {
  id: string;
  name: string;
  createdAt: Date;
  entries: DayEntry[];
}

export interface Profile {
  id: string;
  name: string;
  createdAt: Date;
  calendars: Calendar[];
}
