import React, { useState, useCallback, useEffect } from "react";
import { onAuthStateChangedListener, getAuthPlatform } from "./utils/authAdapter";
import Login from "./components/Login";
import { getAllProfiles, saveProfiles, setActiveProfile, setActiveCalendar } from "./utils/storage";
import { saveUserDataToCloud, loadUserDataFromCloud } from "./utils/cloudSync";
import Calendar from "./components/Calendar";
import DayEntryForm from "./components/DayEntryForm";
import CalendarSelector from "./components/CalendarSelector";
import HolidayManager from "./components/HolidayManager";
import BottomNav from "./components/BottomNav";
import "./App.css";

function App() {
  const [user, setUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [syncError, setSyncError] = useState<string>("");
  const [authPlatform, setAuthPlatform] = useState<string>("");

  // Initialize auth listener (works for both platforms)
  useEffect(() => {
    setAuthPlatform(getAuthPlatform());
    const unsubscribe = onAuthStateChangedListener((authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  // Sync from cloud on login (only for web/Firebase)
  useEffect(() => {
    if (!user || !user.uid || authPlatform.includes("Local")) {
      setSyncStatus("idle");
      setSyncError("");
      return;
    }

    const loadCloud = async () => {
      try {
        setSyncStatus("syncing");
        setSyncError("");
        const cloudData = await loadUserDataFromCloud(user.uid);
        if (cloudData) {
          saveProfiles(cloudData.profiles || []);
          setTimeout(() => {
            const profiles = cloudData.profiles || [];
            let selectedProfileId = cloudData.activeProfileId;
            if (!selectedProfileId && profiles.length > 0) {
              selectedProfileId = profiles[0].id;
              setActiveProfile(selectedProfileId);
            } else if (selectedProfileId) {
              setActiveProfile(selectedProfileId);
            }
            let selectedCalendarId = cloudData.activeCalendarId;
            const calendars = profiles.find(p => p.id === selectedProfileId)?.calendars || [];
            if (!selectedCalendarId && calendars.length > 0) {
              selectedCalendarId = calendars[0].id;
              setActiveCalendar(selectedCalendarId);
            } else if (selectedCalendarId) {
              setActiveCalendar(selectedCalendarId);
            }
            setRefreshKey((prev) => prev + 1);
          }, 0);
        } else {
          saveProfiles([]);
          setActiveProfile("");
          setActiveCalendar("");
          setRefreshKey((prev) => prev + 1);
        }
        setSyncStatus("synced");
      } catch (err: any) {
        setSyncStatus("error");
        setSyncError(err?.message || "Cloud sync failed");
      }
    };

    loadCloud();
  }, [user, authPlatform]);

  // Sync to cloud on any local change (only for web/Firebase)
  useEffect(() => {
    if (!user || !user.uid || authPlatform.includes("Local")) return;
    const handler = async () => {
      try {
        setSyncStatus("syncing");
        setSyncError("");
        await saveUserDataToCloud(
          user.uid,
          getAllProfiles(),
          localStorage.getItem("pontaj_active_profile"),
          localStorage.getItem("pontaj_active_calendar")
        );
        setSyncStatus("synced");
      } catch (err: any) {
        setSyncStatus("error");
        setSyncError(err?.message || "Cloud sync failed");
      }
    };
    window.addEventListener("pontaj_profiles_changed", handler);
    return () => window.removeEventListener("pontaj_profiles_changed", handler);
  }, [user, authPlatform]);

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
            {/* Login UI above profiles */}
            <div style={{ marginBottom: 16 }}>
              <Login onAuthChange={setUser} />
              {user && <div style={{ color: 'green', fontWeight: 600, fontSize: 13, textAlign: 'center', marginTop: 4 }}>✅ {user.email}</div>}
              {!user && <div style={{ color: 'gray', fontSize: 13, textAlign: 'center', marginTop: 4 }}>📍 {authPlatform}</div>}
              {user && authPlatform.includes("Firebase") && (
                <div className={`sync-status sync-${syncStatus}`}>
                  {syncStatus === "syncing" && "☁️ Syncing..."}
                  {syncStatus === "synced" && "☁️ Synced"}
                  {syncStatus === "error" && `❌ Sync error${syncError ? `: ${syncError}` : ""}`}
                </div>
              )}
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
