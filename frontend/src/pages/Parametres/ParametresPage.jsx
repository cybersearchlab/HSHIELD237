import { useEffect, useRef, useState } from "react";

import {
  changerMotDePasse,
  changerRole,
  creerUtilisateur,
  listDemandesReinitialisation,
  listUtilisateurs,
  reinitialiserMotDePasseUtilisateur,
  traiterDemandeReinitialisation,
  updateProfil,
} from "../../api/accounts";
import { createParametreExterne, listParametresExternes, updateParametreExterne } from "../../api/parametresExternes";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS, roleLabel } from "../../utils/roles";

// Rôles qu'un administrateur peut attribuer — mêmes 3 valeurs que le
// backend (CreerUtilisateurSerializer/ChangerRoleSerializer), "employe"
// (rôle historique) volontairement hors périmètre.
const ROLES_ATTRIBUABLES = ["consultant", "responsable", "administrateur"];

// Les 8 réglages connus côté backend (apps.parametres.models.CLES_CONNUES),
// avec un libellé et une icône lisibles par un non-IT.
const CLES_PARAMETRES = [
  { cle: "ANTHROPIC_API_KEY", label: "Clé API Claude (Anthropic)", icon: "ti-key", secret: true },
  { cle: "ANTHROPIC_MODEL", label: "Modèle Claude utilisé", icon: "ti-robot", secret: false },
  { cle: "EMAIL_HOST", label: "Serveur SMTP (hôte)", icon: "ti-server", secret: false },
  { cle: "EMAIL_PORT", label: "Serveur SMTP (port)", icon: "ti-plug", secret: false },
  { cle: "EMAIL_HOST_USER", label: "Identifiant SMTP", icon: "ti-user", secret: false },
  { cle: "EMAIL_HOST_PASSWORD", label: "Mot de passe SMTP", icon: "ti-lock", secret: true },
  { cle: "EMAIL_USE_TLS", label: "SMTP en TLS (true/false)", icon: "ti-shield-lock", secret: false },
  { cle: "SIMULATION_BASE_URL", label: "URL publique de la plateforme", icon: "ti-world", secret: false },
];

const TOAST_ICONS = { success: "ti-check", info: "ti-info-circle", error: "ti-alert-circle" };
const TOAST_COLORS = { success: "#4ADE80", info: "#60A5FA", error: "#F87171" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value) {
  return EMAIL_RE.test(value.trim());
}

function initialsFor(nom, email) {
  const trimmed = (nom || "").trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/);
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : trimmed.slice(0, 2).toUpperCase();
  }
  return (email || "").slice(0, 2).toUpperCase();
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ParametresPage() {
  const { user, refresh } = useAuth();
  const estAdmin = user?.role === "administrateur";
  const [tab, setTab] = useState("profil");

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  function showToast(message, type = "info") {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  if (!user) return null;

  return (
    <Layout pageTitle="Paramètres" pageSubtitle="Profil, sécurité, équipe et intégrations">
      <div className="settings-layout">
        <div className="settings-nav">
          <div className={`settings-nav-item${tab === "profil" ? " active" : ""}`} onClick={() => setTab("profil")}>
            <i className="ti ti-user" /> Profil
          </div>
          <div className={`settings-nav-item${tab === "securite" ? " active" : ""}`} onClick={() => setTab("securite")}>
            <i className="ti ti-lock" /> Sécurité
          </div>
          {estAdmin && (
            <div className={`settings-nav-item${tab === "equipe" ? " active" : ""}`} onClick={() => setTab("equipe")}>
              <i className="ti ti-users" /> Équipe
            </div>
          )}
          {estAdmin && (
            <div className={`settings-nav-item${tab === "api" ? " active" : ""}`} onClick={() => setTab("api")}>
              <i className="ti ti-robot" /> API &amp; IA
            </div>
          )}
        </div>

        <div>
          {tab === "profil" && <PanelProfil user={user} refresh={refresh} showToast={showToast} />}
          {tab === "securite" && <PanelSecurite showToast={showToast} />}
          {tab === "equipe" && estAdmin && <PanelEquipe user={user} showToast={showToast} />}
          {tab === "api" && estAdmin && <PanelApiIa showToast={showToast} />}
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed", bottom: 24, right: 24, background: "var(--navy)", color: "#fff",
            padding: "12px 18px", borderRadius: "var(--radius-lg)", fontSize: 13, display: "flex",
            alignItems: "center", gap: 10, boxShadow: "0 8px 24px rgba(0,0,0,.2)", zIndex: 999, maxWidth: 360,
          }}
        >
          <i className={`ti ${TOAST_ICONS[toast.type]}`} style={{ fontSize: 17, color: TOAST_COLORS[toast.type] }} />
          <span>{toast.message}</span>
        </div>
      )}
    </Layout>
  );
}

// ── Onglet Profil ───────────────────────────────────────────────────
function PanelProfil({ user, refresh, showToast }) {
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [email, setEmail] = useState(user.email || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setError("Email non valide.");
      return;
    }
    setSaving(true);
    try {
      await updateProfil({ first_name: firstName, last_name: lastName, email });
      await refresh();
      showToast("Profil mis à jour avec succès.", "success");
    } catch (err) {
      setError(err.response?.data?.email?.[0] || "Impossible d'enregistrer le profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-section">
      <div className="settings-section-title">Informations du profil</div>
      <div className="settings-section-sub">Ces informations vous identifient auprès du reste de l'équipe.</div>
      <div className="settings-avatar-row">
        <div className="settings-avatar">{initialsFor(`${firstName} ${lastName}`, email)}</div>
        <div style={{ fontSize: 12, color: "var(--text3)" }}>{roleLabel(user.role)}</div>
      </div>
      <form onSubmit={handleSave}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Prénom</label>
            <input className="form-input" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Nom</label>
            <input className="form-input" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Adresse email</label>
          <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {error && (
          <div className="form-error-text">
            <i className="ti ti-alert-circle" /> {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 6 }}>
          <i className="ti ti-device-floppy" /> {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}

// ── Onglet Sécurité ─────────────────────────────────────────────────
function PanelSecurite({ showToast }) {
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (nouveau !== confirmation) {
      setError("La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }
    setSaving(true);
    try {
      await changerMotDePasse({ ancien_mot_de_passe: ancien, nouveau_mot_de_passe: nouveau });
      setAncien("");
      setNouveau("");
      setConfirmation("");
      showToast("Mot de passe mis à jour.", "success");
    } catch (err) {
      const data = err.response?.data || {};
      setError(data.ancien_mot_de_passe?.[0] || data.nouveau_mot_de_passe?.[0] || "Impossible de mettre à jour le mot de passe.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-section">
      <div className="settings-section-title">Mot de passe</div>
      <div className="settings-section-sub">Modifiez régulièrement votre mot de passe pour sécuriser votre compte.</div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Mot de passe actuel</label>
          <input className="form-input" type="password" value={ancien} onChange={(e) => setAncien(e.target.value)} placeholder="••••••••••" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nouveau mot de passe</label>
            <input className="form-input" type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} placeholder="••••••••••" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe</label>
            <input className="form-input" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="••••••••••" />
          </div>
        </div>
        {error && (
          <div className="form-error-text">
            <i className="ti ti-alert-circle" /> {error}
          </div>
        )}
        <button type="submit" className="btn btn-navy" disabled={saving}>
          <i className="ti ti-lock" /> {saving ? "Mise à jour…" : "Mettre à jour le mot de passe"}
        </button>
      </form>
    </div>
  );
}

// ── Onglet Équipe (administrateur) ─────────────────────────────────
function PanelEquipe({ user, showToast }) {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formPrenom, setFormPrenom] = useState("");
  const [formNom, setFormNom] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("consultant");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([listUtilisateurs(), listDemandesReinitialisation()])
      .then(([u, d]) => {
        setUtilisateurs(u);
        setDemandes(d.filter((demande) => demande.statut === "en_attente"));
      })
      .catch(() => showToast("Impossible de charger l'équipe.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openModal() {
    setFormPrenom("");
    setFormNom("");
    setFormEmail("");
    setFormRole("consultant");
    setFormError("");
    setModalOpen(true);
  }

  async function handleCreate(event) {
    event.preventDefault();
    setFormError("");
    if (!formNom.trim()) {
      setFormError("Le nom est requis.");
      return;
    }
    if (!isValidEmail(formEmail)) {
      setFormError("Email non valide.");
      return;
    }
    setSaving(true);
    try {
      const data = await creerUtilisateur({
        first_name: formPrenom, last_name: formNom, email: formEmail, role: formRole,
      });
      showToast(
        data.email_envoye
          ? `Compte créé pour ${formEmail} — un mot de passe temporaire lui a été envoyé par email.`
          : `Compte créé pour ${formEmail}, mais l'email n'a pas pu être envoyé — utilisez « Réinitialiser le mot de passe » pour réessayer.`,
        data.email_envoye ? "success" : "info"
      );
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.email?.[0] || err.response?.data?.detail || "Impossible de créer ce compte.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangerRole(u, role) {
    setBusyId(u.id);
    try {
      await changerRole(u.id, role);
      showToast(`Rôle mis à jour pour ${u.email}.`, "success");
      load();
    } catch {
      showToast("Impossible de changer ce rôle.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReinitialiser(u) {
    if (!window.confirm(`Réinitialiser le mot de passe de ${u.email} ? Un nouveau mot de passe temporaire lui sera envoyé par email.`)) {
      return;
    }
    setBusyId(u.id);
    try {
      const data = await reinitialiserMotDePasseUtilisateur(u.id);
      showToast(
        data.email_envoye
          ? `Mot de passe réinitialisé — email envoyé à ${u.email}.`
          : `Mot de passe réinitialisé, mais l'email n'a pas pu être envoyé à ${u.email}.`,
        data.email_envoye ? "success" : "info"
      );
    } catch {
      showToast("Impossible de réinitialiser ce mot de passe.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleTraiterDemande(demande) {
    setBusyId(`demande-${demande.id}`);
    try {
      const data = await traiterDemandeReinitialisation(demande.id);
      showToast(
        data.email_envoye
          ? `Demande traitée — nouveau mot de passe envoyé à ${demande.utilisateur_email}.`
          : `Demande marquée traitée, mais l'email n'a pas pu être envoyé.`,
        data.email_envoye ? "success" : "info"
      );
      load();
    } catch (err) {
      showToast(err.response?.data?.detail || "Impossible de traiter cette demande.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {demandes.length > 0 && (
        <div className="settings-section">
          <div className="settings-section-title">Demandes de réinitialisation en attente</div>
          <div className="settings-section-sub">
            Soumises depuis « Mot de passe oublié ? »/« Contacter l'administrateur » sur la page de connexion.
          </div>
          <div className="team-list">
            {demandes.map((d) => (
              <div className="team-row" key={d.id}>
                <div className="team-avatar" style={{ background: "var(--orange)" }}>
                  <i className="ti ti-help" style={{ fontSize: 16 }} />
                </div>
                <div className="team-info">
                  <div className="team-name">{d.email_saisi}</div>
                  <div className="team-email">
                    {d.utilisateur_email ? "Compte existant" : "Aucun compte connu pour cet email"} · {formatDate(d.date_demande)}
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  disabled={!d.utilisateur_email || busyId === `demande-${d.id}`}
                  title={!d.utilisateur_email ? "Aucun compte à réinitialiser" : undefined}
                  onClick={() => handleTraiterDemande(d)}
                >
                  {busyId === `demande-${d.id}` ? "…" : "Traiter"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="settings-section">
        <div className="card-header" style={{ marginBottom: 6 }}>
          <div>
            <div className="settings-section-title" style={{ marginBottom: 2 }}>Membres de l'équipe</div>
            <div className="settings-section-sub" style={{ marginBottom: 0 }}>
              {loading ? "Chargement…" : `${utilisateurs.length} compte${utilisateurs.length > 1 ? "s" : ""}`}
            </div>
          </div>
          <button className="btn btn-primary" onClick={openModal}>
            <i className="ti ti-user-plus" /> Nouvel utilisateur
          </button>
        </div>

        {!loading && (
          <div className="team-list">
            {utilisateurs.map((u) => {
              const estSoi = u.id === user.id;
              const roleConnu = ROLES_ATTRIBUABLES.includes(u.role);
              return (
                <div className="team-row" key={u.id}>
                  <div className="team-avatar">{initialsFor(`${u.first_name} ${u.last_name}`, u.email)}</div>
                  <div className="team-info">
                    <div className="team-name">
                      {`${u.first_name} ${u.last_name}`.trim() || u.email}
                      {estSoi && <span className="badge badge-accent" style={{ marginLeft: 6 }}>Vous</span>}
                    </div>
                    <div className="team-email">{u.email}</div>
                  </div>
                  {roleConnu ? (
                    <select
                      className="role-select"
                      value={u.role}
                      disabled={estSoi || busyId === u.id}
                      onChange={(e) => handleChangerRole(u, e.target.value)}
                    >
                      {ROLES_ATTRIBUABLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="badge badge-neutral">{roleLabel(u.role)}</span>
                  )}
                  {!estSoi && (
                    <button
                      className="action-btn"
                      title="Réinitialiser le mot de passe"
                      disabled={busyId === u.id}
                      onClick={() => handleReinitialiser(u)}
                    >
                      <i className="ti ti-key" style={{ fontSize: 15 }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Nouvel utilisateur</h3>
              <div className="close-btn" role="button" tabIndex={0} onClick={() => setModalOpen(false)}>
                <i className="ti ti-x" />
              </div>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Prénom</label>
                    <input className="form-input" type="text" value={formPrenom} onChange={(e) => setFormPrenom(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nom *</label>
                    <input className="form-input" type="text" value={formNom} onChange={(e) => setFormNom(e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="prenom.nom@entreprise.cm" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Rôle *</label>
                  <select className="form-select" value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                    {ROLES_ATTRIBUABLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  <div className="form-hint">
                    Aucun mot de passe à saisir : un mot de passe temporaire est généré et envoyé par email au
                    titulaire du compte.
                  </div>
                </div>
                {formError && (
                  <div className="form-error-text">
                    <i className="ti ti-alert-circle" /> {formError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Création…" : "Créer le compte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Onglet API & IA (administrateur) ───────────────────────────────
function PanelApiIa({ showToast }) {
  const [parametres, setParametres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCle, setModalCle] = useState(null);
  const [formValeur, setFormValeur] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    listParametresExternes()
      .then(setParametres)
      .catch(() => showToast("Impossible de charger les paramètres externes.", "error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parDefinition = Object.fromEntries(parametres.map((p) => [p.cle, p]));

  function openModal(definition) {
    setModalCle(definition.cle);
    setFormValeur("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const existant = parDefinition[modalCle];
      if (existant) {
        await updateParametreExterne(existant.id, { valeur: formValeur });
      } else {
        await createParametreExterne({ cle: modalCle, valeur: formValeur });
      }
      showToast("Paramètre enregistré.", "success");
      setModalCle(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.detail || "Impossible d'enregistrer ce paramètre.", "error");
    } finally {
      setSaving(false);
    }
  }

  const definitionModale = CLES_PARAMETRES.find((d) => d.cle === modalCle);

  return (
    <div className="settings-section">
      <div className="settings-section-title">Clés API et services externes</div>
      <div className="settings-section-sub">
        Ces réglages priment sur le fichier de configuration du serveur dès qu'ils sont renseignés ici.
      </div>
      {!loading &&
        CLES_PARAMETRES.map((def) => {
          const existant = parDefinition[def.cle];
          return (
            <div className="api-key-row" key={def.cle}>
              <i className={`ti ${def.icon}`} style={{ color: "var(--text3)", fontSize: 16 }} />
              <span style={{ fontSize: 12.5, color: "var(--text2)", minWidth: 200 }}>{def.label}</span>
              <span className="api-key-val">
                {existant ? existant.valeur_affichee || "(vide)" : "Non configuré — valeur par défaut du serveur utilisée"}
              </span>
              <button className="btn btn-sm" onClick={() => openModal(def)}>
                <i className={`ti ${existant ? "ti-pencil" : "ti-plus"}`} /> {existant ? "Modifier" : "Configurer"}
              </button>
            </div>
          );
        })}

      {modalCle && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setModalCle(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{definitionModale?.label}</h3>
              <div className="close-btn" role="button" tabIndex={0} onClick={() => setModalCle(null)}>
                <i className="ti ti-x" />
              </div>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Valeur *</label>
                  <input
                    className="form-input"
                    type={definitionModale?.secret ? "password" : "text"}
                    value={formValeur}
                    onChange={(e) => setFormValeur(e.target.value)}
                    autoFocus
                  />
                  {definitionModale?.secret && (
                    <div className="form-hint">
                      Cette valeur ne sera plus jamais affichée en clair après enregistrement (seuls les 4 derniers
                      caractères resteront visibles).
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalCle(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !formValeur.trim()}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
