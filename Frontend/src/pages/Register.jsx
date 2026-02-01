import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const [role, setRole] = useState("reader");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const isAuthor = role === "author";

  const roleTitle = useMemo(
    () => (isAuthor ? "Create an Author account" : "Create a Reader account"),
    [isAuthor]
  );

  const roleDesc = useMemo(
    () =>
      isAuthor
        ? "Publish your work and reach readers through Pustakyatra."
        : "Save favorites, build your reading list, and explore Nepali books.",
    [isAuthor]
  );

  function updateField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setOk("");

    if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    setOk(`Registered as ${isAuthor ? "Author" : "Reader"} successfully (demo).`);
  }

  return (
    <div className="regPage">
      <main className="regContainer">
        <section className="regShell">
          <aside className="regSide">
            <div className="regSidePill">PUSTAKYATRA • Calm Nepali Digital Library</div>

            <h1 className="regSideTitle">
              Join Pustakyatra <span className="regSideAccent">today.</span>
            </h1>

            <p className="regSideText">
              A warm, simple space to read Nepali literature — and for authors to publish with ease.
              {isAuthor && " Complete your author profile, add your bio, and start publishing after registration."}
            </p>

            <div className="regSideStats">
              <div className="regStat">
                <div className="regStatNum">12k+</div>
                <div className="regStatLabel">Readers</div>
              </div>
              <div className="regStat">
                <div className="regStatNum">2.5k+</div>
                <div className="regStatLabel">Books</div>
              </div>
              <div className="regStat">
                <div className="regStatNum">450+</div>
                <div className="regStatLabel">Authors</div>
              </div>
            </div>

            <div className="regSideNote">
              {isAuthor 
                ? "Complete your author profile after registration in your dashboard." 
                : "You can switch account type anytime before submitting."
              }
            </div>
          </aside>

          <section className="regCard">
            <header className="regHeader">
              <div className="regHeaderTop">
                <h2 className="regTitle">{roleTitle}</h2>

                <div className="roleToggle">
                  <button
                    type="button"
                    className={`roleBtn ${role === "reader" ? "active" : ""}`}
                    onClick={() => setRole("reader")}
                  >
                    Reader
                  </button>
                  <button
                    type="button"
                    className={`roleBtn ${role === "author" ? "active" : ""}`}
                    onClick={() => setRole("author")}
                  >
                    Author
                  </button>
                </div>
              </div>

              <p className="regSubtitle">{roleDesc}</p>
            </header>

            <form className="regForm" onSubmit={handleSubmit}>
              <div className="regGrid">
                <div className="field">
                  <label>
                    Full Name<span>*</span>
                  </label>
                  <input
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="e.g., Krisala Reule"
                  />
                </div>

                <div className="field">
                  <label>
                    Email<span>*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="field">
                  <label>
                    Password<span>*</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="field">
                  <label>
                    Confirm Password<span>*</span>
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              {error && <div className="msg error">{error}</div>}
              {ok && <div className="msg ok">{ok}</div>}

              <button className="regSubmit" type="submit">
                Create Account <span className="arrow">→</span>
              </button>

              <div className="regFooterRow">
                Already have an account? <Link to="/login">Login</Link>
              </div>
            </form>
          </section>
        </section>
      </main>
    </div>
  );
}
