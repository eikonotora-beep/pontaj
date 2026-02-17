import React, { useState, useCallback, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./utils/firebase";
import Login from "./components/Login";
import { getAllProfiles, saveProfiles } from "./utils/storage";
import { saveUserDataToCloud, loadUserDataFromCloud } from "./utils/cloudSync";
import Calendar from "./components/Calendar";
import DayEntryForm from "./components/DayEntryForm";
import CalendarSelector from "./components/CalendarSelector";
import HolidayManager from "./components/HolidayManager";
import BottomNav from "./components/BottomNav";
import "./App.css";



function App() {
  const [user, setUser] = useState<any>(null);
  // Sync from cloud on login
  useEffect(() => {
    if (user && user.uid) {
      loadUserDataFromCloud(user.uid).then((cloudProfiles) => {
        if (cloudProfiles && cloudProfiles.length > 0) {
          saveProfiles(cloudProfiles);
        } else {
          // If no cloud data, push local data to cloud
          saveUserDataToCloud(user.uid, getAllProfiles());
        }
      });
    }
  }, [user]);

  // Sync to cloud on any local change if logged in
  useEffect(() => {
    if (!user || !user.uid) return;
    const handler = () => {
      saveUserDataToCloud(user.uid, getAllProfiles());
    };
    window.addEventListener("pontaj_profiles_changed", handler);
    return () => window.removeEventListener("pontaj_profiles_changed", handler);
  }, [user]);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);
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
    // Do NOT reset calendar month after save; just refresh data
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
            {/* Login UI above profiles */}
            <div style={{ marginBottom: 16 }}>
              <Login onAuthChange={setUser} />
              {user && <div style={{ color: 'green', fontWeight: 600, fontSize: 13, textAlign: 'center', marginTop: 4 }}>Logged in as: {user.email}</div>}
              {!user && <div style={{ color: 'gray', fontSize: 13, textAlign: 'center', marginTop: 4 }}>Not logged in (local mode)</div>}
            </div>
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
            <div style={{ marginTop: 16 }}>
              {/* Export to Excel button for debugging/backup */}
              <React.Suspense fallback={null}>
                {React.createElement(require("./components/ExportEntriesButton").default)}
              </React.Suspense>
            </div>
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
