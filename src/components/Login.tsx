import React, { useState, useEffect } from "react";
import { loginUser, registerUser, logoutUser, getAuthPlatform } from "../utils/authAdapter";
import { isPlatformElectron } from "../utils/platform";

const Login: React.FC<{ onAuthChange: (user: any) => void }> = ({ onAuthChange }) => {
  const [inputValue, setInputValue] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(isPlatformElectron());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isRegister) {
        await registerUser(inputValue, password);
        const loginResult = await loginUser(inputValue, password);
        onAuthChange(loginResult);
        setError(""); // Clear any previous errors
      } else {
        const user = await loginUser(inputValue, password);
        onAuthChange(user);
        setError(""); // Clear any previous errors
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      onAuthChange(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: 260,
      minWidth: 0,
      padding: 12,
      background: "#6c47c7",
      borderRadius: 14,
      boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
      color: "#fff",
      fontFamily: 'inherit',
      fontSize: 15,
      marginBottom: 12
    }}>
      <h3 style={{ textAlign: 'center', marginBottom: 14, fontWeight: 700, letterSpacing: 1, fontSize: 18 }}>⏰ {isRegister ? "Register" : "Login"}</h3>
      <form onSubmit={handleSubmit}>
        <input
          type={isElectron ? "text" : "email"}
          placeholder={isElectron ? "Username" : "Email"}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          required
          style={{
            width: "100%",
            marginBottom: 8,
            padding: "8px 10px",
            borderRadius: 7,
            border: "none",
            fontSize: 15,
            background: "#f5f5fa",
            color: "#333"
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            marginBottom: 10,
            padding: "8px 10px",
            borderRadius: 7,
            border: "none",
            fontSize: 15,
            background: "#f5f5fa",
            color: "#333"
          }}
        />
        <button type="submit" disabled={loading} style={{
          width: "100%",
          marginBottom: 8,
          padding: "8px 0",
          borderRadius: 7,
          border: "none",
          background: loading ? "#b9a7e6" : "#fff",
          color: loading ? "#fff" : "#6c47c7",
          fontWeight: 700,
          fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.2s"
        }}>
          {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>
      </form>
      <button onClick={() => {
        setIsRegister(r => !r);
        setError(""); // Clear errors when switching modes
      }} style={{
        width: "100%",
        marginBottom: 8,
        padding: "8px 0",
        borderRadius: 7,
        border: "none",
        background: "#fff",
        color: "#6c47c7",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        transition: "background 0.2s"
      }}>
        {isRegister ? "Already have an account? Login" : "No account? Register"}
      </button>
      {error && (
        <div style={{ 
          color: "#ffb3b3", 
          marginBottom: 8, 
          textAlign: 'center', 
          fontWeight: 600, 
          fontSize: 12,
          padding: 6,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 5,
          wordWrap: "break-word"
        }}>
          {error}
        </div>
      )}
      <button onClick={handleLogout} style={{
        width: "100%",
        marginTop: 2,
        padding: "7px 0",
        borderRadius: 7,
        border: "none",
        background: "#ff6b6b",
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        transition: "background 0.2s"
      }}>
        Logout
      </button>
    </div>
  );
};

export default Login;
