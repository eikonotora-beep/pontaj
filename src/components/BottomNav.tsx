import React from "react";
import { FaCalendarAlt, FaUser, FaCog } from "react-icons/fa";
import "../styles/BottomNav.css";

interface BottomNavProps {
  active: string;
  onNavigate: (section: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ active, onNavigate }) => {
  return (
    <nav className="bottom-nav">
      <button
        className={active === "calendar" ? "active" : ""}
        onClick={() => onNavigate("calendar")}
        aria-label="Calendar"
      >
        <FaCalendarAlt />
        <span>Calendar</span>
      </button>
      <button
        className={active === "profile" ? "active" : ""}
        onClick={() => onNavigate("profile")}
        aria-label="Profile"
      >
        <FaUser />
        <span>Profile</span>
      </button>
      <button
        className={active === "settings" ? "active" : ""}
        onClick={() => onNavigate("settings")}
        aria-label="Settings"
      >
        <FaCog />
        <span>Settings</span>
      </button>
    </nav>
  );
};

export default BottomNav;
