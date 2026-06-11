import { useState, type FormEvent } from "react";
import { signup } from "../lib/api";

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export default function SignupModal({
  open,
  onClose,
  onOpenLogin,
}: SignupModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("red");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (confirm !== password) {
      setMessageColor("red");
      setMessage("Passwords do not match!");
      return;
    }

    if (confirm.length < 8) {
      setMessageColor("red");
      setMessage("Password must be at least 8 characters long!");
      return;
    }

    setLoading(true);

    try {
      const result = await signup(name, email, password);
      if (result.ok) {
        setMessageColor("lightgreen");
        setMessage(result.data.message ?? "Account created.");
      } else {
        setMessageColor("red");
        setMessage(result.data.detail ?? "Signup failed");
      }
    } catch {
      setMessageColor("red");
      setMessage("Failed to connect to auth server.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="signup-modal" style={{ display: "flex" }}>
      <div className="sign_up_box">
        <button type="button" onClick={onClose} className="closeSignup">
          <i className="fa-solid fa-circle-xmark" />
        </button>
        <h1>Sign Up</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <div className="input-field">
              <i className="fa-solid fa-user" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Full Name"
                required
              />
            </div>
            <div className="input-field">
              <i className="fa-solid fa-envelope" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email"
                required
              />
            </div>
            <div className="input-field">
              <i className="fa-solid fa-lock" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setMessage("");
                }}
                placeholder="Enter password"
                required
              />
            </div>
            <div className="input-field">
              <i className="fa-solid fa-lock" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setMessage("");
                }}
                placeholder="Confirm Password"
                required
              />
            </div>
            {message && (
              <p style={{ marginTop: 10, color: messageColor }}>{message}</p>
            )}
            <div className="btn-field">
              {!loading && (
                <button type="submit">Sign up</button>
              )}
              {loading && <div className="spinner" />}
              {!loading && (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="disable"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
