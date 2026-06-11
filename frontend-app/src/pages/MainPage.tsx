import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import SignupModal from "../components/SignupModal";
import { PENDING_DEMO_KEY } from "../lib/config";
import { isLoggedIn } from "../lib/storage";

export default function MainPage() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  const runDemo = () => {
    if (isLoggedIn()) {
      navigate("/upload?demo=local");
      return;
    }
    try {
      sessionStorage.setItem(PENDING_DEMO_KEY, "true");
    } catch {
      /* ignore */
    }
    setLoginOpen(true);
  };

  return (
    <>
      <header style={{ height: 80 }}>
        <img
          style={{ width: 150, height: "auto", marginLeft: 20 }}
          src="/img/logo.png"
          alt="hide.Ai"
          className="logo"
        />
        <nav>
          <ul className="list">
            <li>
              <a href="#">Privacy</a>
            </li>
            <li>
              <a href="#">How it Works</a>
            </li>
            <li>
              <a href="#">Contact</a>
            </li>
            <li>
              <a href="#">About us</a>
            </li>
          </ul>
        </nav>
        <a href="#" className="login_btn">
          <button type="button" onClick={() => setLoginOpen(true)}>
            Log In
          </button>
        </a>
      </header>

      <div className="container1">
        <div className="left_text">
          <p className="text">
            Detect it. <br />
            Decide it. <br />
            Hide it - with Hide.Ai.
          </p>
          <p
            style={{
              color: "rgb(101, 99, 99)",
              fontSize: 14,
              marginTop: 10,
              fontWeight: "normal",
            }}
          >
            We help you Identify and redact PII to Keep your data secure.
          </p>
          <button
            type="button"
            className="signup"
            onClick={() => setSignupOpen(true)}
          >
            Get started
          </button>
        </div>
        <div className="sign">
          <i className="fa-solid fa-shield" />
        </div>
      </div>

      <div className="container2">
        <div className="card">
          <div className="left_p">
            <div className="context_text">Active User</div>
            <div className="value">value</div>
          </div>
          <div className="icon">
            <i className="fa-solid fa-user" />
          </div>
        </div>
        <div className="card">
          <div className="left_p">
            <div className="context_text">File Processed</div>
            <div className="value">value</div>
          </div>
          <div className="icon">
            <i className="fa-solid fa-file" />
          </div>
        </div>
        <div className="card">
          <div className="left_p">
            <div className="context_text">PII Value Redacted</div>
            <div className="value">Value</div>
          </div>
          <div className="icon">
            <i className="fa-solid fa-circle-check" />
          </div>
        </div>
        <div
          className="card demo-card"
          onClick={runDemo}
          onKeyDown={(e) => e.key === "Enter" && runDemo()}
          role="button"
          tabIndex={0}
        >
          <div className="left_p">
            <div className="context_text">Try Free</div>
            <div className="value">Demo</div>
          </div>
          <div className="icon">
            <i className="fa-solid fa-download" />
          </div>
        </div>
      </div>

      <div className="footer">
        <div className="footer_left" />
        <div className="footer_right">
          <div className="footer_right1">
            <ul>
              <li style={{ fontWeight: "bold" }}>Learn More</li>
              <li>
                <a href="#">About us</a>
              </li>
              <li>
                <a href="#">Contact Us</a>
              </li>
              <li>
                <a href="#">Blog</a>
              </li>
            </ul>
          </div>
          <div className="footer_right2">
            <ul>
              <li style={{ fontWeight: "bold" }}>Community</li>
              <li>
                <a href="#">Support Center</a>
              </li>
            </ul>
          </div>
          <div className="footer_right3">
            <ul>
              <li style={{ fontWeight: "bold" }}>Follow Us</li>
              <li>
                <a href="#">Facebook</a>
              </li>
              <li>
                <a href="#">Twitter</a>
              </li>
              <li>
                <a href="#">Instagram</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onOpenLogin={() => {
          setSignupOpen(false);
          setLoginOpen(true);
        }}
      />
    </>
  );
}

export function HomePage() {
  return (
    <>
      <header style={{ display: "flex", flexDirection: "row", height: 80 }}>
        <img
          style={{ width: 180, marginLeft: 30 }}
          src="/img/logo.png"
          alt="Hide.Ai"
        />
        <div style={{ flex: 1, marginLeft: 780 }} className="header">
          <nav>
            <ul style={{ display: "flex", flexDirection: "row", gap: 20 }}>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <a href="#">Pricing</a>
              </li>
              <li>
                <a href="#">Result</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="hero">
        <div
          className="home_left"
          style={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
          <h1 style={{ fontWeight: "bold" }}>Welcome to Hide.Ai</h1>
          <p>
            This is your go-to solution for indentifying Personal Identifiable
            Information in your Documents.
            <br />
            Our advanced algorithms ensure that your sensitive data is handled
            with utmost precision and security.
          </p>
          <h3>How to Get Started:</h3>
          <p>
            Prepare your Document in a .docx format. <br />
            Use the &quot;Upload Document&quot; button to navigate to the upload
            sections.
            <br />
            Follows the instruction to upload and analyze your document.
          </p>
          <Link to="/">
            <button type="button">Upload Document</button>
          </Link>
        </div>
        <div className="home_right">
          <img src="" alt="" />
        </div>
      </div>

      <div
        style={{
          background: "#000",
          display: "flex",
          justifyContent: "space-between",
        }}
        className="home_footer"
      >
        <div className="list_home_footer_left">
          <ul>
            <li>
              <h4 style={{ color: "#ffffff" }}>Quick Links</h4>
            </li>
            <li>
              <a href="#">Privacy Policy</a>
            </li>
            <li>
              <a href="#">Terms of Services</a>
            </li>
            <li>
              <a href="#">Contact us</a>
            </li>
          </ul>
        </div>
        <div className="home_footer_right" style={{ marginRight: 30 }}>
          <p style={{ color: "#ffffff", marginTop: 5 }}>
            Contact Information <br />
            <span style={{ fontSize: 12 }}>Email: shashankfc8@gmail.com</span>
          </p>
        </div>
      </div>
    </>
  );
}
