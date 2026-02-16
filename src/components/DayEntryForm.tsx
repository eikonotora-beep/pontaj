import React, { useEffect, useState } from "react";
// @ts-ignore
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz';
import { DayEntry, ShiftType } from "../types/index";
import { isRomanianHoliday, isWeekend } from "../utils/dateUtils";
import { getEntryByDate, saveEntry } from "../utils/storage";
import ShiftInput from "./ShiftInput";
import "../styles/DayEntryForm.css";

interface DayEntryFormProps {
  date: Date;
  onSave: () => void;
  onClose: () => void;
}

const DayEntryForm: React.FC<DayEntryFormProps> = ({
  date,
  onSave,
  onClose,
}) => {
  const [entry, setEntry] = useState<DayEntry>(() => {
    // Always use Bucharest time for entry date
    const roDate = utcToZonedTime(date, 'Europe/Bucharest');
    const year = roDate.getFullYear();
    const month = (roDate.getMonth() + 1).toString().padStart(2, '0');
    const day = roDate.getDate().toString().padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    const existing = getEntryByDate(roDate);
    if (existing) return existing;
    return {
      id: `${roDate.getTime()}`,
      date: localDateString,
      shifts: [],
      notes: "",
    };
  });

  const [selectedShifts, setSelectedShifts] = useState<ShiftType[]>(() => {
    const existing = getEntryByDate(date);
    return existing ? existing.shifts.map((s) => s.type) : [];
  });
  const [repeatEnabled, setRepeatEnabled] = useState<boolean>(false);
  const [repeatInterval, setRepeatInterval] = useState<number>(1);
  const [repeatUntil, setRepeatUntil] = useState<string>(
    formatTz(utcToZonedTime(new Date(), 'Europe/Bucharest'), 'yyyy-MM-dd', { timeZone: 'Europe/Bucharest' })
  );

  const shiftOptions: ShiftType[] = ["day", "night", "neither", "cs"];
  const isHoliday = isRomanianHoliday(date);
  const [invHours, setInvHours] = useState<{ [key: string]: number }>({});

  const handleAddShift = (shiftType: ShiftType) => {
    if (!selectedShifts.includes(shiftType)) {
      setSelectedShifts([...selectedShifts, shiftType]);
      // Add a default shift object so the shift is saved even if user doesn't change times
      const getDefaults = (t: ShiftType) => {
        switch (t) {
          case "day":
            return { start: "06:45", end: "19:15" };
          case "night":
            return { start: "18:45", end: "07:15" };
          case "cs":
            return { start: "", end: "", duration: 0 };
          case "co":
            return { start: "", end: "", duration: 8 * 60 };
          case "cm":
            return { start: "", end: "", duration: 8 * 60 };
          case "inv":
            return { start: "", end: "", duration: 0 };
          default:
            return { start: "08:00", end: "16:00" };
        }
      };

      const d = getDefaults(shiftType);
      const newShift: any =
        shiftType === "co" || shiftType === "cs" || shiftType === "cm" || shiftType === "inv"
          ? { type: shiftType, startTime: d.start || "", endTime: d.end || "", duration: d.duration ?? 0 }
          : { type: shiftType, startTime: d.start, endTime: d.end, duration: calculateShiftDuration(d.start, d.end) };

      setEntry({
        ...entry,
        shifts: [...entry.shifts, newShift],
      });
    }
  };

  const handleShiftChange = (
    shiftType: ShiftType,
    startTime: string,
    endTime: string
  ) => {
    const updatedShifts = entry.shifts.map((shift) =>
      shift.type === shiftType
        ? {
            ...shift,
            startTime,
            endTime,
            duration: calculateShiftDuration(startTime, endTime),
          }
        : shift
    );

    if (!updatedShifts.some((s) => s.type === shiftType)) {
      updatedShifts.push({
        type: shiftType,
        startTime,
        endTime,
        duration: calculateShiftDuration(startTime, endTime),
      });
    }

    setEntry({ ...entry, shifts: updatedShifts });
  };

  const handleRemoveShift = (shiftType: ShiftType) => {
    setSelectedShifts(selectedShifts.filter((s) => s !== shiftType));
    setEntry({
      ...entry,
      shifts: entry.shifts.filter((s) => s.type !== shiftType),
    });
  };

  const shiftIsCO = (s: ShiftType) => s === "co";

  const handleSave = () => {
    // Prepare shifts: for CO set duration = 8h (480 min)
    const preparedShifts = entry.shifts.map((s) => {
      if (s.type === "co") {
        return { ...s, startTime: "", endTime: "", duration: 8 * 60 };
      }
      return { ...s, duration: calculateShiftDuration(s.startTime, s.endTime) };
    });

    if (repeatEnabled) {
      // Always use Bucharest time for repeat range
      const until = utcToZonedTime(new Date(repeatUntil + "T23:59:59"), 'Europe/Bucharest');
      if (isNaN(until.getTime())) {
        // invalid until date, fallback to single save
        saveEntry({ ...entry, shifts: preparedShifts });
        onSave();
        return;
      }

      const results: DayEntry[] = [];
      let current = utcToZonedTime(new Date(entry.date + 'T00:00:00'), 'Europe/Bucharest');
      current.setHours(0, 0, 0, 0);

      // compute preview: how many entries and total minutes will be created
      let previewCount = 0;
      let previewMinutes = 0;
      let previewCur = new Date(current);
      while (previewCur <= until) {
        const isWeekendOrHolidayPreview = isWeekend(previewCur) || isRomanianHoliday(previewCur);
        let dayMinutes = 0;
        preparedShifts.forEach((s) => {
          if (s.type === "co" || s.type === "cm") {
            if (!isWeekendOrHolidayPreview) dayMinutes += 8 * 60;
          } else {
            dayMinutes += s.duration || 0;
          }
        });
        // If there will be any minutes for the day, count it as an entry
        if (dayMinutes > 0) {
          previewCount += 1;
          previewMinutes += dayMinutes;
        }
        previewCur = new Date(previewCur.getTime() + repeatInterval * 24 * 60 * 60 * 1000);
      }

      const previewMsg = `This will create ${previewCount} entries totalling ${Math.floor(previewMinutes / 60)}h ${previewMinutes % 60}m. Continue?`;
      if (!window.confirm(previewMsg)) {
        return;
      }

      while (current <= until) {
        // For CO/CM we only generate hours on weekdays and non-holidays
        const isWeekendOrHoliday = isWeekend(current) || isRomanianHoliday(current);

        let shiftsForDay = preparedShifts.map((s) => ({ ...s }));

        // Handle CO & CM: weekdays = 8h, weekends/holidays = 0h
        shiftsForDay = shiftsForDay.map((s) => {
          if (s.type === "co" || s.type === "cm") {
            return isWeekendOrHoliday
              ? { ...s, duration: 0, startTime: "", endTime: "" }
              : { ...s, duration: 8 * 60, startTime: "", endTime: "" };
          }
          return s;
        });

        const roYear = current.getFullYear();
        const roMonth = (current.getMonth() + 1).toString().padStart(2, '0');
        const roDay = current.getDate().toString().padStart(2, '0');
        const newEntry: DayEntry = {
          ...entry,
          id: `${current.getTime()}`,
          date: `${roYear}-${roMonth}-${roDay}`,
          shifts: shiftsForDay,
        };
        results.push(newEntry);

        current = new Date(current.getTime() + repeatInterval * 24 * 60 * 60 * 1000);
      }

      results.forEach((e) => saveEntry(e));
      onSave();
      return;
    }

    // Single save: if entry contains CO/CM and the date is weekend/holiday, set duration 0
    // Convert entry.date string to Date in Bucharest time for checks
    const entryDateObj = utcToZonedTime(new Date(entry.date + 'T00:00:00'), 'Europe/Bucharest');
    const isWeekendOrHoliday = isWeekend(entryDateObj) || isRomanianHoliday(entryDateObj);
    let finalShifts = preparedShifts.map((s) => ({ ...s }));
    if (finalShifts.some((s) => s.type === "co" || s.type === "cm")) {
      finalShifts = finalShifts.map((s) =>
        s.type === "co" || s.type === "cm"
          ? isWeekendOrHoliday
            ? { ...s, duration: 0, startTime: "", endTime: "" }
            : { ...s, duration: 8 * 60, startTime: "", endTime: "" }
          : s
      );
    }

    saveEntry({ ...entry, shifts: finalShifts });
    onSave();
  };

  const calculateShiftDuration = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    let startMs = startH * 60 + startM;
    let endMs = endH * 60 + endM;

    if (endMs < startMs) {
      endMs += 24 * 60;
    }

    return endMs - startMs;
  };

  return (
    <div className="day-entry-overlay">
      <div className={`day-entry-form ${isHoliday ? "holiday" : ""}`}>
        <div className="form-header">
          <h2>{date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h2>
          {isHoliday && <span className="holiday-badge">🎉 Holiday</span>}
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="shifts-section">
          {selectedShifts.map((shiftType) => {
            const shift = entry.shifts.find((s) => s.type === shiftType);
            if (shiftType === "co" || shiftType === "cm") {
              return (
                  <div key={shiftType} className={`shift-input ${shiftType}-shift`}>
                  <label className="shift-label">{shiftType.toUpperCase()}</label>
                  <div className="shift-inputs">
                    <div className="duration">
                      <span className="duration-label">8h 0m</span>
                    </div>
                    <button className="remove-btn" onClick={() => handleRemoveShift(shiftType)} title={`Remove ${shiftType.toUpperCase()}`}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            }

            if (shiftType === "inv") {
              const invDuration = invHours[shiftType] || 0;
              return (
                <div key={shiftType} className="shift-input inv-shift">
                  <label className="shift-label">INV</label>
                  <div className="shift-inputs">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Hours"
                      value={invDuration || ""}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value) || 0;
                        setInvHours({ ...invHours, [shiftType]: hours });
                        // Update entry shifts
                        const updated = entry.shifts.map((s) =>
                          s.type === "inv" ? { ...s, duration: hours * 60 } : s
                        );
                        setEntry({ ...entry, shifts: updated });
                      }}
                      className="inv-input"
                      style={{ width: "80px" }}
                    />
                    <span style={{ marginLeft: "0.5rem" }}>h</span>
                    <button className="remove-btn" onClick={() => handleRemoveShift(shiftType)} title="Remove INV">
                      ✕
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <ShiftInput
                key={shiftType}
                shiftType={shiftType}
                onShiftChange={handleShiftChange}
                onRemoveShift={handleRemoveShift}
                startTime={shift?.startTime}
                endTime={shift?.endTime}
              />
            );
          })}

          <div className="add-shift">
            <label>Add Shift:</label>
            <div className="shift-buttons">
              {shiftOptions
                .filter((s) => !selectedShifts.includes(s))
                .map((shiftType) => (
                  <button
                    key={shiftType}
                    className="add-shift-btn"
                    onClick={() => handleAddShift(shiftType)}
                  >
                    + {shiftType.toUpperCase()}
                  </button>
                ))}
              {/* allow CO, CM, INV as options */}
              {!selectedShifts.includes("co") && (
                <button className="add-shift-btn" onClick={() => handleAddShift("co")}>+ CO</button>
              )}
              {!selectedShifts.includes("cm") && (
                <button className="add-shift-btn" onClick={() => handleAddShift("cm")}>+ CM</button>
              )}
              {!selectedShifts.includes("inv") && (
                <button className="add-shift-btn" onClick={() => handleAddShift("inv")}>+ INV</button>
              )}
            </div>
          </div>

          <div className="notes-section">
            <label>Notes:</label>
            <textarea
              value={entry.notes || ""}
              onChange={(e) =>
                setEntry({ ...entry, notes: e.target.value })
              }
              placeholder="Add any notes..."
              className="notes-input"
            />
          </div>

          <div className="repeat-section">
            <label>
              <input
                type="checkbox"
                checked={repeatEnabled}
                onChange={(e) => setRepeatEnabled(e.target.checked)}
              />
              Repeat
            </label>

            {repeatEnabled && (
              <div className="repeat-controls">
                <label>
                  Every
                  <input
                    type="number"
                    min={1}
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(Number(e.target.value) || 1)}
                    className="repeat-interval"
                  />
                  day(s)
                </label>

                <label>
                  Until
                  <input
                    type="date"
                    value={repeatUntil}
                    onChange={(e) => setRepeatUntil(e.target.value)}
                    className="repeat-until"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-save" onClick={handleSave}>
            Save
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DayEntryForm;
