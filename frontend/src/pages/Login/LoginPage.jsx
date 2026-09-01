import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { demanderReinitialisation } from "../../api/accounts";
import { login } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

const NAVY = "#0F1F3D";
const RED = "#C0392B";
const MUTED = "#8A97AC";
const TEXT_GREY = "#4A5568";

const TOAST_ICONS = {
  success: "ti-check",
  info: "ti-info-circle",
  error: "ti-alert-circle",
};
const TOAST_COLORS = {
  success: "#4ADE80",
  info: "#60A5FA",
  error: "#F87171",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function showToast(message, type = "info") {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  // "Mot de passe oublié ?" et "Contacter l'administrateur" pointent vers
  // le même mécanisme : aucun lien de réinitialisation n'est envoyé
  // directement à la personne — sa demande est enregistrée et
  // l'administrateur, notifié par email, déclenche lui-même la
  // réinitialisation depuis Paramètres > Équipe (voir
  // apps.accounts.views.MotDePasseOublieView côté backend).
  async function handleMotDePasseOublie(event) {
    event?.preventDefault?.();
    let cible = email.trim();
    if (!cible) {
      cible = (window.prompt("Indiquez votre adresse email pour prévenir l'administrateur :") || "").trim();
      if (!cible) return;
    }
    try {
      const data = await demanderReinitialisation(cible);
      showToast(data.detail, "success");
    } catch {
      showToast("Impossible d'envoyer la demande pour le moment. Réessayez.", "error");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email || !password) {
      showToast("Veuillez remplir tous les champs.", "error");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      await refresh();
      navigate("/", { replace: true });
    } catch (error) {
      const status = error.response?.status;
      const message =
        status === 401
          ? "Adresse email ou mot de passe incorrect."
          : "Impossible de se connecter pour le moment. Réessayez.";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* LEFT */}
        <aside style={styles.aside}>
          <div style={styles.circleTop} />
          <div style={styles.circleBottom} />

          <div style={{ display: "flex", alignItems: "center", gap: 13, position: "relative", zIndex: 1 }}>
            <div style={styles.logoBox}>
              <i className="ti ti-shield-lock" style={{ color: "#fff", fontSize: 22 }} />
            </div>
            <div>
              <div style={{ fontSize: 21, fontWeight: 600, color: "#fff", letterSpacing: "-.02em", lineHeight: 1 }}>
                H-SHIELD<span style={{ color: RED }}>237</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.36)", marginTop: 4 }}>
                Simulateur de phishing éducatif
              </div>
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={styles.aiBadge}>
              <i className="ti ti-robot" style={{ fontSize: 13 }} /> Propulsé par intelligence artificielle
            </div>
            <h1 style={styles.heroTitle}>
              Sensibilisez vos équipes aux <span style={{ color: RED }}>cybermenaces</span> réelles du marché
              camerounais
            </h1>
            <p style={styles.heroText}>
              Générez des campagnes de phishing personnalisées et mesurez la résilience humaine de votre
              organisation en quelques clics.
            </p>
          </div>

          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.22)", position: "relative", zIndex: 1, marginTop: 20 }}>
            H-SHIELD237 v1.0 · CRL Yaoundé · 2026
          </div>
        </aside>

        {/* RIGHT */}
        <main style={styles.main}>
          <div style={{ marginBottom: 30 }}>
            <h2 style={styles.title}>Connexion</h2>
            <p style={{ fontSize: 13.5, color: TEXT_GREY, margin: 0 }}>
              Accédez à votre espace consultant H-SHIELD237
            </p>
          </div>

          <div style={styles.noticeBox}>
            <i className="ti ti-lock" style={{ fontSize: 16, color: RED, flexShrink: 0, marginTop: 1 }} />
            <span>
              Accès réservé aux consultants et responsables autorisés. Toute campagne de simulation requiert un
              consentement préalable explicite et validé.
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={styles.label}>Adresse email</label>
              <div style={{ position: "relative" }}>
                <i className="ti ti-mail" style={styles.inputIconLeft} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="entreprise@institution.com"
                  style={styles.input}
                  autoComplete="username"
                />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={styles.label}>Mot de passe</label>
              <div style={{ position: "relative" }}>
                <i className="ti ti-lock" style={styles.inputIconLeft} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  style={{ ...styles.input, paddingRight: 40 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.eyeButton}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  <i className={`ti ${showPassword ? "ti-eye-off" : "ti-eye"}`} />
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <label style={styles.rememberLabel}>
                <input type="checkbox" style={styles.checkbox} /> Se souvenir de moi
              </label>
              <a href="#" onClick={handleMotDePasseOublie} style={styles.link}>
                Mot de passe oublié ?
              </a>
            </div>

            <button type="submit" disabled={loading} style={styles.submitButton}>
              <i
                className={`ti ${loading ? "ti-loader-2" : "ti-login"}`}
                style={{ fontSize: 18, animation: loading ? "spin .6s linear infinite" : undefined }}
              />
              {loading ? "Connexion en cours…" : "Se connecter"}
            </button>
          </form>

          <div style={{ marginTop: 26, textAlign: "center", fontSize: 12, color: MUTED, lineHeight: 1.8 }}>
            <a href="#" onClick={handleMotDePasseOublie} style={{ ...styles.link, fontWeight: 500 }}>
              Contacter l'administrateur →
            </a>
          </div>
        </main>
      </div>

      {toast && (
        <div style={styles.toast}>
          <i
            className={`ti ${TOAST_ICONS[toast.type] || "ti-info-circle"}`}
            style={{ fontSize: 17, flexShrink: 0, color: TOAST_COLORS[toast.type] || "#60A5FA" }}
          />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    width: "100%",
    maxWidth: 960,
    minHeight: 620,
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)",
    border: "1px solid rgba(255,255,255,.6)",
  },
  aside: {
    background: NAVY,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "44px 48px",
    position: "relative",
    overflow: "hidden",
  },
  circleTop: {
    position: "absolute",
    borderRadius: "50%",
    background: "rgba(255,255,255,.05)",
    width: 480,
    height: 480,
    top: -150,
    right: -180,
    pointerEvents: "none",
  },
  circleBottom: {
    position: "absolute",
    borderRadius: "50%",
    background: "rgba(255,255,255,.05)",
    width: 260,
    height: 260,
    bottom: -80,
    left: -100,
    pointerEvents: "none",
  },
  logoBox: {
    width: 44,
    height: 44,
    background: RED,
    borderRadius: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(192,57,43,.4)",
  },
  aiBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    background: "rgba(192,57,43,.2)",
    border: "1px solid rgba(192,57,43,.4)",
    borderRadius: 20,
    padding: "5px 13px",
    fontSize: 11.5,
    color: "#F5B7B1",
    marginBottom: 22,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: 600,
    color: "#fff",
    lineHeight: 1.22,
    letterSpacing: "-.025em",
    margin: "0 0 16px",
  },
  heroText: {
    fontSize: 13.5,
    color: "rgba(255,255,255,.5)",
    lineHeight: 1.75,
    maxWidth: 330,
    margin: 0,
  },
  main: {
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "52px 48px",
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: NAVY,
    letterSpacing: "-.02em",
    margin: "0 0 6px",
  },
  noticeBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: "rgba(192,57,43,.08)",
    border: "1px solid rgba(192,57,43,.25)",
    borderRadius: 8,
    padding: "11px 14px",
    marginBottom: 24,
    fontSize: 12.5,
    color: "#7B241C",
    lineHeight: 1.55,
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: ".07em",
    marginBottom: 7,
  },
  input: {
    width: "100%",
    padding: "11px 12px 11px 40px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,.16)",
    background: "#F7F8FC",
    color: NAVY,
    fontSize: 13.5,
    fontFamily: "inherit",
  },
  inputIconLeft: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 17,
    color: MUTED,
    pointerEvents: "none",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 17,
    color: MUTED,
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    display: "flex",
    alignItems: "center",
  },
  rememberLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: TEXT_GREY,
    cursor: "pointer",
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    accentColor: "#1B2A5A",
  },
  link: {
    fontSize: 13,
    color: "#1B2A5A",
    textDecoration: "none",
    fontWeight: 500,
  },
  submitButton: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    background: RED,
    border: "none",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  toast: {
    position: "fixed",
    bottom: 24,
    right: 24,
    background: NAVY,
    color: "#fff",
    padding: "12px 18px",
    borderRadius: 12,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,.2)",
    zIndex: 999,
    maxWidth: 360,
  },
};
