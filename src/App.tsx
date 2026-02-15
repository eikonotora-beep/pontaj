import React, { useState, useCallback } from "react";
import Calendar from "./components/Calendar";
import DayEntryForm from "./components/DayEntryForm";
import CalendarSelector from "./components/CalendarSelector";
import HolidayManager from "./components/HolidayManager";
import BottomNav from "./components/BottomNav";
import "./App.css";



function App() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSection, setActiveSection] = useState<string>("calendar");

  // Refresh everything on profile or calendar change
  const handleProfileOrCalendarChange = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    setSelectedDate(null);
    setShowForm(false);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowForm(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
  }, []);

  const handleFormSave = useCallback(() => {
    setShowForm(false);
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>⏰ Pontaj Calendar</h1>
        <p>Track your work hours with daily shifts</p>
      </header>

      <main
        className="app-main"
        style={{
          display: "flex",
          flexDirection: window.innerWidth < 700 ? "column" : "row",
          minHeight: "calc(100vh - 120px)",
        }}
      >
        {(activeSection === "profile" || window.innerWidth >= 700) && (
          <aside className="app-sidebar">
            <CalendarSelector onCalendarChange={handleProfileOrCalendarChange} />
          </aside>
        )}

        {activeSection === "calendar" && (
          <div className="app-content" key={refreshKey}>
            <Calendar onDayClick={handleDayClick} selectedDate={selectedDate ?? undefined} />
          </div>
        )}

        {(activeSection === "settings" || window.innerWidth >= 700) && (
          <aside className="app-sidebar" style={{ minWidth: 220, marginLeft: window.innerWidth < 700 ? 0 : 24 }}>
            <HolidayManager year={new Date().getFullYear()} />
          </aside>
        )}
      </main>

      {showForm && selectedDate && (
        <DayEntryForm
          date={selectedDate}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}

      {/* Bottom navigation for mobile */}
      <BottomNav active={activeSection} onNavigate={setActiveSection} />
    </div>
  );
}

export default App;
