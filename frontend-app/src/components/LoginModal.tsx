import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/api";
import { DUMMY_LOGIN, PENDING_DEMO_KEY } from "../lib/config";
import {
  getSavedCredentials,
  setSavedCredentials,
} from "../lib/storage";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    const creds = getSavedCredentials();
    if (creds?.email) {
      setEmail(creds.email);
      setPassword(creds.password);
      setRemember(true);
      return;
    }
    setEmail(DUMMY_LOGIN.email);
    setPassword(DUMMY_LOGIN.password);
    setRemember(true);
  }, [open]);

  const finishLogin = (goToDemo: boolean) => {
    onClose();
    navigate(goToDemo ? "/upload?demo=local" : "/upload");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    if (
      trimmedEmail === DUMMY_LOGIN.email &&
      password === DUMMY_LOGIN.password
    ) {
      try {
        if (remember) setSavedCredentials({ email, password });
        else setSavedCredentials(null);
      } catch {
        /* ignore */
      }
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem(
        "authUser",
        JSON.stringify({ email, name: "Demo User", demo: true }),
      );

      let goToDemo = false;
      try {
        goToDemo = sessionStorage.getItem(PENDING_DEMO_KEY) === "true";
        sessionStorage.removeItem(PENDING_DEMO_KEY);
      } catch {
        /* ignore */
      }
      finishLogin(goToDemo);
      return;
    }

    try {
      const result = await login(email, password);
      if (result.ok) {
        try {
          if (remember) setSavedCredentials({ email, password });
          else setSavedCredentials(null);
        } catch {
          /* ignore */
        }

        const token =
          result.data.token ?? result.data.access_token ?? result.data.jwt ?? null;
        if (token) localStorage.setItem("authToken", token);
        else localStorage.setItem("isAuthenticated", "true");

        if (result.data.user || result.data.email || email) {
          localStorage.setItem(
            "authUser",
            JSON.stringify(result.data.user ?? { email }),
          );
        }

        let goToDemo = false;
        try {
          goToDemo = sessionStorage.getItem(PENDING_DEMO_KEY) === "true";
          sessionStorage.removeItem(PENDING_DEMO_KEY);
        } catch {
          /* ignore */
        }
        finishLogin(goToDemo);
        return;
      }

      setError(result.data.detail ?? "Login failed");
    } catch {
      setError("Failed to connect to auth server.");
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
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                margin: "10px 0 0 0",
                color: "#000",
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember credentials on this device
            </label>
            <p style={{ color: "#000", margin: 20 }}>
              Forgot Password?{" "}
              <a style={{ color: "rgb(34, 62, 114)" }} href="#">
                Click Here!
              </a>
            </p>
            {error && (
              <p style={{ color: "red", margin: "10px 0" }}>{error}</p>
            )}
            <div className="btn-field">
              {!loading && (
                <button type="submit" className="sign_up">
                  Submit
                </button>
              )}
              {loading && <div className="spinner" />}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
