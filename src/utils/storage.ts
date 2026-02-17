// @ts-ignore
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz';
import { DayEntry, MonthSummary, Calendar, Profile } from "../types/index";
import { isWeekday, isWeekend, roundToNearestMinute, isRomanianHoliday } from "../utils/dateUtils";
// ...existing code...
// Profile and calendar storage keys
export const PROFILES_STORAGE_KEY = "pontaj_profiles";
export const ACTIVE_PROFILE_KEY = "pontaj_active_profile";
export const ACTIVE_CALENDAR_KEY = "pontaj_active_calendar";

// Profile management
export function getAllProfiles(): Profile[] {
  const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveProfiles(profiles: Profile[]): void {
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

export function getActiveProfileId(): string | null {
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function setActiveProfile(id: string): void {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

export function getProfileById(id: string): Profile | null {
  const profiles = getAllProfiles();
  return profiles.find((p) => p.id === id) || null;
}

export function createProfile(name: string): Profile {
  const profiles = getAllProfiles();
  const id = `profile_${Date.now()}`;
  const profile: Profile = { id, name, calendars: [], createdAt: new Date() };
  profiles.push(profile);
  saveProfiles(profiles);
  setActiveProfile(id);
  return profile;
}

export function deleteProfile(id: string): void {
  let profiles = getAllProfiles();
  profiles = profiles.filter((p) => p.id !== id);
  saveProfiles(profiles);
  // If deleted profile was active, set another as active
  const activeId = getActiveProfileId();
  if (activeId === id && profiles.length > 0) {
    setActiveProfile(profiles[0].id);
  }
}

export function renameProfile(id: string, newName: string): void {
  const profiles = getAllProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx >= 0) {
    profiles[idx].name = newName;
    saveProfiles(profiles);
  }
}

// ...existing code after monthlyBreakdown loop...

export const getActiveProfile = (): Profile | null => {
  const id = getActiveProfileId();
  if (!id) {
    const profiles = getAllProfiles();
    if (profiles.length === 0) {
      return createProfile("Profile 1");
    } else {
      setActiveProfile(profiles[0].id);
      return profiles[0];
    }
  }
  return getProfileById(id) || null;
};

// Calendar Management (within active profile)

export const createCalendar = (name: string): Calendar => {
  const profile = getActiveProfile();
  if (!profile) throw new Error("No active profile");
  const id = `calendar_${Date.now()}`;
  const calendar: Calendar = {
    id,
    name,
    createdAt: new Date(),
    entries: [],
  };
  profile.calendars.push(calendar);
  // Save updated profile
  const profiles = getAllProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile;
  saveProfiles(profiles);
  setActiveCalendar(id);
  return calendar;
};

export const getAllCalendars = (): Calendar[] => {
  const profile = getActiveProfile();
  return profile ? profile.calendars : [];
};

export const getCalendarById = (id: string): Calendar | undefined => {
  const profile = getActiveProfile();
  return profile?.calendars.find((c) => c.id === id);
};

export const saveCalendar = (calendar: Calendar): void => {
  const profile = getActiveProfile();
  if (!profile) return;
  const idx = profile.calendars.findIndex((c) => c.id === calendar.id);
  if (idx >= 0) {
    profile.calendars[idx] = calendar;
  } else {
    profile.calendars.push(calendar);
  }
  // Save updated profile
  const profiles = getAllProfiles();
  const pidx = profiles.findIndex((p) => p.id === profile.id);
  if (pidx >= 0) profiles[pidx] = profile;
  saveProfiles(profiles);
};

export const deleteCalendar = (id: string): void => {
  const profile = getActiveProfile();
  if (!profile) return;
  profile.calendars = profile.calendars.filter((c) => c.id !== id);
  // Save updated profile
  const profiles = getAllProfiles();
  const pidx = profiles.findIndex((p) => p.id === profile.id);
  if (pidx >= 0) profiles[pidx] = profile;
  saveProfiles(profiles);
  // If deleted calendar was active, switch to first available
  if (getActiveCalendarId() === id) {
    if (profile.calendars.length > 0) {
      setActiveCalendar(profile.calendars[0].id);
    } else {
      localStorage.removeItem(ACTIVE_CALENDAR_KEY);
    }
  }
};

export const renameCalendar = (id: string, newName: string): void => {
  const profile = getActiveProfile();
  if (!profile) return;
  const calendar = profile.calendars.find((c) => c.id === id);
  if (calendar) {
    calendar.name = newName;
    // Save updated profile
    const profiles = getAllProfiles();
    const pidx = profiles.findIndex((p) => p.id === profile.id);
    if (pidx >= 0) profiles[pidx] = profile;
    saveProfiles(profiles);
  }
};

export const setActiveCalendar = (id: string): void => {
  localStorage.setItem(ACTIVE_CALENDAR_KEY, id);
};

export const getActiveCalendarId = (): string | null => {
  return localStorage.getItem(ACTIVE_CALENDAR_KEY);
};

export const getActiveCalendar = (): Calendar | null => {
  const id = getActiveCalendarId();
  const profile = getActiveProfile();
  if (!profile) return null;
  if (!id) {
    if (profile.calendars.length === 0) {
      return createCalendar("Personal");
    } else {
      setActiveCalendar(profile.calendars[0].id);
      return profile.calendars[0];
    }
  }
  return profile.calendars.find((c) => c.id === id) || null;
};


// Entry Management Functions (for active calendar)

export const saveEntry = (entry: DayEntry): void => {
  const calendar = getActiveCalendar();
  if (!calendar) return;

  // Always save entry date as a string in 'YYYY-MM-DD' in Europe/Bucharest timezone
  let localDateString = entry.date;
  if (typeof entry.date === 'object' && entry.date !== null && 'getFullYear' in entry.date) {
    // Convert to Bucharest time and format as YYYY-MM-DD
    const tzDate = utcToZonedTime(entry.date, 'Europe/Bucharest');
    localDateString = formatTz(tzDate, 'yyyy-MM-dd', { timeZone: 'Europe/Bucharest' });
  }
  entry.date = localDateString;

  const existingIndex = calendar.entries.findIndex(
    (e) => e.date === localDateString
  );

  if (existingIndex >= 0) {
    calendar.entries[existingIndex] = entry;
  } else {
    calendar.entries.push(entry);
  }

  saveCalendar(calendar);
};

export const getAllEntries = (): DayEntry[] => {
  const calendar = getActiveCalendar();
  return calendar ? calendar.entries : [];
};

export const getEntryByDate = (date: Date): DayEntry | undefined => {
  const entries = getAllEntries();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const localDateString = `${year}-${month}-${day}`;
  return entries.find(e => e.date === localDateString);
};

export const deleteEntry = (date: Date): void => {
  const calendar = getActiveCalendar();
  if (!calendar) return;
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const localDateString = `${year}-${month}-${day}`;
  calendar.entries = calendar.entries.filter(e => e.date !== localDateString);
  saveCalendar(calendar);
};
// Helper to revive Date objects from JSON
function dateReviver(key: string, value: any) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return new Date(value);
  }
  return value;
}


export const calculateMonthlySummary = (
  year: number,
  month: number
): MonthSummary => {
  const entries = getAllEntries();
  const monthEntries = entries.filter((entry) => {
    // Convert to local time for comparison
    const entryDate = new Date(entry.date);
    const localYear = entryDate.getFullYear();
    const localMonth = entryDate.getMonth();
    return localYear === year && localMonth === month;
  });
  let totalWeekend = 0;
  // If no entries at all, or no entries for the month, return all summary values as zero
  if (entries.length === 0 || monthEntries.length === 0) {
    return {
      totalFTL: 0,
      totalOL: 0,
      totalWeekend: 0,
      workDays: 0,
      offDays: 0,
      csMonth: 0,
      csTotal: 0,
      osMonth: 0,
      osTotal: 0,
      csBalance: 0,
      osDebt90d: 0,
    };
  }

  let totalFTL = 0;
  let totalOL = 0;
  let workDays = 0;
  let csMonth = 0;
  let csTotal = 0;

  // Sum total OL and weekend hours from entries (for the month)
  monthEntries.forEach((entry, idx) => {
    // Always use local time for calculations
    const entryDate = new Date(entry.date);
    const dayTotalMinutes = entry.shifts.reduce(
      (sum, shift) => sum + shift.duration,
      0
    );

    totalOL += dayTotalMinutes;

    // sum CS minutes for this month
    const csForDay = entry.shifts
      .filter((s) => s.type === "cs")
      .reduce((sum, s) => sum + s.duration, 0);
    csMonth += csForDay;

    // Generalized weekend/holiday calculation for all months
    const isWeekendOrHoliday = isRomanianHoliday(entryDate) || isWeekend(entryDate);
    for (const shift of entry.shifts) {
      if (shift.type === "day" && isWeekendOrHoliday) {
        totalWeekend += shift.duration;
      }
      if (shift.type === "night") {
        // Always use the next calendar day, not just the next entry
        const nextDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate() + 1);
        const isCurrentWeekendOrHoliday = isWeekendOrHoliday;
        const isNextWeekendOrHoliday = isRomanianHoliday(nextDate) || isWeekend(nextDate);
        // Rule 1: Night on weekend/holiday, next day also weekend/holiday: count actual hours
        if (isCurrentWeekendOrHoliday && isNextWeekendOrHoliday) {
          totalWeekend += shift.duration;
        // Rule 2: Night on weekend/holiday, next day NOT weekend/holiday: count 5:15
        } else if (isCurrentWeekendOrHoliday && !isNextWeekendOrHoliday) {
          totalWeekend += 5 * 60 + 15;
        // Rule 3: Night NOT on weekend/holiday, next day IS weekend/holiday: count 7:15
        } else if (!isCurrentWeekendOrHoliday && isNextWeekendOrHoliday) {
          totalWeekend += 7 * 60 + 15;
        }
      }
    }
    if (isWeekday(entryDate)) {
      workDays += 1;
    }
  });

  // Calculate total FTL as every weekday that is not a holiday in the month counts for 8 hours
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let ftlDaysCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    // Use isRomanianHoliday, which checks both official and manual holidays
    if (isWeekday(date) && !isRomanianHoliday(date)) {
      ftlDaysCount += 1;
    }
  }

  totalFTL = ftlDaysCount * 8 * 60; // minutes

  // Build a breakdown for all months up to and including the current month
  const all = getAllEntries();
  let startYear = year;
  let startMonth = month;
  if (all.length > 0) {
    const sortedAll = all
      .map((e) => new Date(e.date))
      .sort((a, b) => a.getTime() - b.getTime());
    startYear = sortedAll[0].getFullYear();
    startMonth = sortedAll[0].getMonth();
  }

  let cur = new Date(startYear, startMonth, 1);
  const target = new Date(year, month, 1);
  // Store per-month breakdowns
  const monthlyBreakdown: {
    year: number;
    month: number;
    monthOL: number;
    monthFTL: number;
    monthOS: number;
    monthCS: number;
    osDebt90d: number;
    osTotalAfterDebt: number;
  }[] = [];
  // Rolling CS/debt logic
  let prevOsTotalAfterDebt = 0;
  let csPool = 0; // Accumulates all CS entered up to the current month
  // Track all debts by month for robust chaining
  let debts: { month: number; year: number; amount: number }[] = [];
  // Build a list of all months from the first entry to the target month
  const allMonths: { year: number; month: number }[] = [];
  let tempCur = new Date(startYear, startMonth, 1);
  while (tempCur <= target) {
    allMonths.push({ year: tempCur.getFullYear(), month: tempCur.getMonth() });
    tempCur = new Date(tempCur.getFullYear(), tempCur.getMonth() + 1, 1);
  }

  for (let idx = 0; idx < allMonths.length; idx++) {
    const { year: y, month: m } = allMonths[idx];
    const monthEntriesAll = all.filter((entry) => {
      const d = new Date(entry.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });

    const monthOL = monthEntriesAll.reduce(
      (sum, entry) => sum + entry.shifts.reduce((s, sh) => s + sh.duration, 0),
      0
    );

    // calculate month FTL (weekdays * 8h)
    const dim = new Date(y, m + 1, 0).getDate();
    let monthWeekdays = 0;
    for (let d = 1; d <= dim; d++) {
      const dt = new Date(y, m, d);
      if (isWeekday(dt) && !isRomanianHoliday(dt)) monthWeekdays += 1;
    }
    const monthFTL = monthWeekdays * 8 * 60;

    const monthOS = monthOL - monthFTL;

    // Add new debt (OS from this month) to debts array if positive
    if (monthOS > 0) {
      debts.push({ month: m, year: y, amount: monthOS });
    }

    // CS entered this month
    const monthCS = monthEntriesAll.reduce(
      (sum, entry) =>
        sum + entry.shifts.filter((s) => s.type === "cs").reduce((s2, s3) => s2 + s3.duration, 0),
      0
    );

    // Apply CS to oldest unpaid debt (starting with N-3, then N-4, etc.)
    let csToApply = monthCS;
    let csApplied = 0;
    // Try to apply to debt from N-3
    let debtMonthCS = m - 3;
    let debtYearCS = y;
    while (debtMonthCS < 0) {
      debtMonthCS += 12;
      debtYearCS -= 1;
    }
    let debtObjCS = debts.find(d => d.year === debtYearCS && d.month === debtMonthCS);
    if (debtObjCS && debtObjCS.amount > 0 && csToApply > 0) {
      const applied = Math.min(csToApply, debtObjCS.amount);
      debtObjCS.amount -= applied;
      csToApply -= applied;
      csApplied += applied;
    }
    // If any CS left, apply to debt from N-4
    if (csToApply > 0) {
      let debtMonth90d = m - 4;
      let debtYear90d = y;
      while (debtMonth90d < 0) {
        debtMonth90d += 12;
        debtYear90d -= 1;
      }
      let debtObj90d = debts.find(d => d.year === debtYear90d && d.month === debtMonth90d);
      if (debtObj90d && debtObj90d.amount > 0) {
        const applied = Math.min(csToApply, debtObj90d.amount);
        debtObj90d.amount -= applied;
        csToApply -= applied;
        csApplied += applied;
      }
    }

    // Remove debts that are fully paid
    debts = debts.filter((d) => d.amount > 0);


    // OS Debt (90d) is the remaining amount of the debt from exactly 4 months ago (if any)
    let debtMonth90d = m - 4;
    let debtYear90d = y;
    while (debtMonth90d < 0) {
      debtMonth90d += 12;
      debtYear90d -= 1;
    }
    // Find the original OS value from 4 months ago
    let originalOs90d = 0;
    let origMonthObj = monthlyBreakdown.find(d => d.year === debtYear90d && d.month === debtMonth90d);
    if (origMonthObj) {
      originalOs90d = origMonthObj.monthOS > 0 ? origMonthObj.monthOS : 0;
    }
    // The remaining debt for display
    let osDebt90d = 0;
    let debtObj90d = debts.find(d => d.year === debtYear90d && d.month === debtMonth90d);
    if (debtObj90d) {
      osDebt90d = debtObj90d.amount;
    }

    // Subtract the original OS value from 4 months ago when it becomes overdue
    const overdueOs = originalOs90d;
    const osTotalAfterDebt = roundToNearestMinute(prevOsTotalAfterDebt + monthOS - overdueOs);
    prevOsTotalAfterDebt = osTotalAfterDebt;

    monthlyBreakdown.push({
      year: y,
      month: m,
      monthOL,
      monthFTL,
      monthOS,
      monthCS: csApplied, // Show CS applied to debt from 3 months ago
      osDebt90d,
      osTotalAfterDebt,
    });
  }

  // Find the current month in the breakdown
  const thisMonth = monthlyBreakdown.find((mm) => mm.year === year && mm.month === month);
  const osMonth = thisMonth ? thisMonth.monthOS : 0;
  const osDebt90d = thisMonth ? thisMonth.osDebt90d : 0;
  // CS entered in the current month (not just applied to old debt)
  const csEntered = thisMonth ? thisMonth.monthCS : 0;
  // OS Total is the chained value after all debt/CS logic
  const osTotal = thisMonth ? thisMonth.osTotalAfterDebt : 0;
  const csBalance = osTotal;

  return {
    totalFTL: roundToNearestMinute(totalFTL),
    totalOL: roundToNearestMinute(totalOL),
    totalWeekend: roundToNearestMinute(totalWeekend),
    workDays,
    offDays: 0,
    csMonth: roundToNearestMinute(csEntered),
    csTotal: roundToNearestMinute(csEntered),
    osMonth: roundToNearestMinute(osMonth),
    osTotal: roundToNearestMinute(osTotal),
    csBalance: roundToNearestMinute(csBalance),
    osDebt90d: roundToNearestMinute(osDebt90d),
  };
};

// Debug helper: attach a function to window to inspect per-month breakdown and raw entries
if (typeof window !== "undefined") {
  (window as any).pontajDebug = (y?: number, m?: number) => {
    // if year/month provided, call calculateMonthlySummary for that point
    if (typeof y === "number" && typeof m === "number") {
      // @ts-ignore
      const s = calculateMonthlySummary(y, m);
      console.log("Monthly summary for", `${m + 1}/${y}`, s);
      return s;
    }

    const profiles = localStorage.getItem(PROFILES_STORAGE_KEY);
    const parsed = profiles ? JSON.parse(profiles) : [];
    console.log("Stored profiles:", parsed);
    const activeProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    const activeCalendarId = localStorage.getItem(ACTIVE_CALENDAR_KEY);
    const profile = parsed.find((p: any) => p.id === activeProfileId) || parsed[0];
    if (!profile) {
      console.warn("No profile data found in localStorage.");
      return parsed;
    }
    const cal = (profile.calendars || []).find((c: any) => c.id === activeCalendarId) || (profile.calendars || [])[0];
    if (!cal) {
      console.warn("No calendar data found in active profile.");
      return { profiles: parsed, activeProfile: profile };
    }
    const entries = (cal.entries || []).map((e: any) => ({
      date: new Date(e.date).toDateString(),
      minutes: e.shifts.reduce((s: number, sh: any) => s + (sh.duration || 0), 0),
      shifts: e.shifts.map((s: any) => s.type).join(","),
    }));
    console.table(entries);
    return { profiles: parsed, activeProfile: profile, activeCalendar: cal, entries };
  };
}
