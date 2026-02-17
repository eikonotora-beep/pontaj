import React, { useState } from "react";
import { auth } from "../utils/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

const Login: React.FC<{ onAuthChange: (user: any) => void }> = ({ onAuthChange }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthChange(userCredential.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onAuthChange(null);
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
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
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
      <button onClick={() => setIsRegister(r => !r)} style={{
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
      {error && <div style={{ color: "#ffb3b3", marginBottom: 8, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{error}</div>}
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
