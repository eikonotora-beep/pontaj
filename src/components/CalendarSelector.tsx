import React, { useState, useEffect } from "react";
import {
  getAllProfiles,
  getActiveProfileId,
  setActiveProfile,
  createProfile,
  deleteProfile,
  renameProfile,
  getAllCalendars,
  getActiveCalendarId,
  setActiveCalendar,
  createCalendar,
  deleteCalendar,
  renameCalendar,
} from "../utils/storage";
import { Calendar, Profile } from "../types/index";
import "../styles/CalendarSelector.css";

interface CalendarSelectorProps {
  onCalendarChange: () => void;
}

const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  onCalendarChange,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [activeCalendarId, setActiveCalendarId] = useState<string | null>(null);
  const [showNewProfileForm, setShowNewProfileForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [renamingProfile, setRenamingProfile] = useState<string | null>(null);
  const [renamingProfileValue, setRenamingProfileValue] = useState("");
  const [showNewCalendarForm, setShowNewCalendarForm] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [renamingCalendar, setRenamingCalendar] = useState<string | null>(null);
  const [renamingCalendarValue, setRenamingCalendarValue] = useState("");

  useEffect(() => {
    loadProfilesAndCalendars();
  }, []);

  const loadProfilesAndCalendars = () => {
    const allProfiles = getAllProfiles();
    setProfiles(allProfiles);
    const activeProfile = getActiveProfileId();
    setActiveProfileId(activeProfile);
    if (activeProfile) {
      setCalendars(getAllCalendars());
      setActiveCalendarId(getActiveCalendarId());
    } else if (allProfiles.length > 0) {
      setActiveProfile(allProfiles[0].id);
      setActiveProfileId(allProfiles[0].id);
      setCalendars(allProfiles[0].calendars);
      setActiveCalendarId(allProfiles[0].calendars[0]?.id || null);
    } else {
      setCalendars([]);
      setActiveCalendarId(null);
    }
  };

  // Profile handlers
  const handleAddProfile = () => {
    if (newProfileName.trim()) {
      createProfile(newProfileName.trim());
      setNewProfileName("");
      setShowNewProfileForm(false);
      loadProfilesAndCalendars();
      onCalendarChange();
    }
  };

  const handleSelectProfile = (id: string) => {
    setActiveProfile(id);
    setActiveProfileId(id);
    setCalendars(getAllCalendars());
    setActiveCalendarId(getActiveCalendarId());
    onCalendarChange();
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length > 1 && window.confirm("Delete this profile and all its calendars?")) {
      deleteProfile(id);
      loadProfilesAndCalendars();
      onCalendarChange();
    }
  };

  const handleRenameProfile = (id: string, oldName: string) => {
    setRenamingProfile(id);
    setRenamingProfileValue(oldName);
  };

  const handleSaveRenameProfile = (id: string) => {
    if (renamingProfileValue.trim()) {
      renameProfile(id, renamingProfileValue.trim());
      setRenamingProfile(null);
      loadProfilesAndCalendars();
      onCalendarChange();
    }
  };

  // Calendar handlers (within active profile)
  const handleAddCalendar = () => {
    if (newCalendarName.trim()) {
      createCalendar(newCalendarName.trim());
      setNewCalendarName("");
      setShowNewCalendarForm(false);
      loadProfilesAndCalendars();
      onCalendarChange();
    }
  };

  const handleSelectCalendar = (id: string) => {
    setActiveCalendar(id);
    setActiveCalendarId(id);
    onCalendarChange();
  };

  const handleDeleteCalendar = (id: string) => {
    if (calendars.length > 1 && window.confirm("Delete this calendar?")) {
      deleteCalendar(id);
      loadProfilesAndCalendars();
      onCalendarChange();
    }
  };

  const handleRenameCalendar = (id: string, oldName: string) => {
    setRenamingCalendar(id);
    setRenamingCalendarValue(oldName);
  };

  const handleSaveRenameCalendar = (id: string) => {
    if (renamingCalendarValue.trim()) {
      renameCalendar(id, renamingCalendarValue.trim());
      setRenamingCalendar(null);
      loadProfilesAndCalendars();
      onCalendarChange();
    }
  };


  // Key press handler for both profile and calendar renaming
  const handleKeyPress = (
    e: React.KeyboardEvent,
    callback: () => void,
    cancelCallback?: () => void
  ) => {
    if (e.key === "Enter") {
      callback();
    } else if (e.key === "Escape") {
      if (cancelCallback) cancelCallback();
    }
  };

  return (
    <div className="calendar-selector">
      <div className="selector-header">
        <h3>Profiles</h3>
        <button
          className="add-calendar-btn"
          onClick={() => setShowNewProfileForm(!showNewProfileForm)}
          title="Add new profile"
        >
          +
        </button>
      </div>

      {showNewProfileForm && (
        <div className="new-calendar-form">
          <input
            type="text"
            placeholder="Profile name..."
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            onKeyPress={(e) =>
              handleKeyPress(e, () => handleAddProfile())
            }
            className="calendar-input"
            autoFocus
          />
          <div className="form-buttons">
            <button
              className="btn-confirm"
              onClick={handleAddProfile}
              disabled={!newProfileName.trim()}
            >
              Create
            </button>
            <button
              className="btn-cancel-small"
              onClick={() => {
                setShowNewProfileForm(false);
                setNewProfileName("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="calendars-list">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={`calendar-item ${activeProfileId === profile.id ? "active" : ""}`}
          >
            {renamingProfile === profile.id ? (
              <div className="rename-form">
                <input
                  type="text"
                  value={renamingProfileValue}
                  onChange={(e) => setRenamingProfileValue(e.target.value)}
                  onKeyPress={(e) =>
                    handleKeyPress(e, () => handleSaveRenameProfile(profile.id), () => setRenamingProfile(null))
                  }
                  className="rename-input"
                  autoFocus
                />
                <button
                  className="btn-confirm-small"
                  onClick={() => handleSaveRenameProfile(profile.id)}
                >
                  ✓
                </button>
                <button
                  className="btn-cancel-small"
                  onClick={() => setRenamingProfile(null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <button
                  className="calendar-name"
                  onClick={() => handleSelectProfile(profile.id)}
                >
                  {profile.name}
                </button>
                <div className="calendar-actions">
                  <button
                    className="btn-rename"
                    onClick={() => handleRenameProfile(profile.id, profile.name)}
                    title="Rename"
                  >
                    ✎
                  </button>
                  {profiles.length > 1 && (
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteProfile(profile.id)}
                      title="Delete"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="selector-header" style={{ marginTop: 24 }}>
        <h3>Calendars</h3>
        <button
          className="add-calendar-btn"
          onClick={() => setShowNewCalendarForm(!showNewCalendarForm)}
          title="Add new calendar"
          disabled={!activeProfileId}
        >
          +
        </button>
      </div>

      {showNewCalendarForm && (
        <div className="new-calendar-form">
          <input
            type="text"
            placeholder="Calendar name..."
            value={newCalendarName}
            onChange={(e) => setNewCalendarName(e.target.value)}
            onKeyPress={(e) =>
              handleKeyPress(e, () => handleAddCalendar())
            }
            className="calendar-input"
            autoFocus
          />
          <div className="form-buttons">
            <button
              className="btn-confirm"
              onClick={handleAddCalendar}
              disabled={!newCalendarName.trim()}
            >
              Create
            </button>
            <button
              className="btn-cancel-small"
              onClick={() => {
                setShowNewCalendarForm(false);
                setNewCalendarName("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="calendars-list">
        {calendars.map((cal) => (
          <div
            key={cal.id}
            className={`calendar-item ${activeCalendarId === cal.id ? "active" : ""}`}
          >
            {renamingCalendar === cal.id ? (
              <div className="rename-form">
                <input
                  type="text"
                  value={renamingCalendarValue}
                  onChange={(e) => setRenamingCalendarValue(e.target.value)}
                  onKeyPress={(e) =>
                    handleKeyPress(e, () => handleSaveRenameCalendar(cal.id), () => setRenamingCalendar(null))
                  }
                  className="rename-input"
                  autoFocus
                />
                <button
                  className="btn-confirm-small"
                  onClick={() => handleSaveRenameCalendar(cal.id)}
                >
                  ✓
                </button>
                <button
                  className="btn-cancel-small"
                  onClick={() => setRenamingCalendar(null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <button
                  className="calendar-name"
                  onClick={() => handleSelectCalendar(cal.id)}
                >
                  {cal.name}
                </button>
                <div className="calendar-actions">
                  <button
                    className="btn-rename"
                    onClick={() => handleRenameCalendar(cal.id, cal.name)}
                    title="Rename"
                  >
                    ✎
                  </button>
                  {calendars.length > 1 && (
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteCalendar(cal.id)}
                      title="Delete"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarSelector;
