import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { listCampagnes } from "../../api/campagnes";
import { createConsentement, listConsentements, refuserConsentement, validerConsentement } from "../../api/gouvernance";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value) {
  return EMAIL_RE.test(value.trim());
}

const STATUT_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "en_attente", label: "En attente" },
  { key: "valide", label: "Validés" },
  { key: "refuse", label: "Refusés" },
];

const STATUS_ICON = {
  en_attente: { icon: "ti-clock", bg: "var(--orange)" },
  valide: { icon: "ti-check", bg: "var(--green)" },
  refuse: { icon: "ti-x", bg: "var(--red)" },
};

const TOAST_ICONS = { success: "ti-check", info: "ti-info-circle", error: "ti-alert-circle" };
const TOAST_COLORS = { success: "#4ADE80", info: "#60A5FA", error: "#F87171" };

function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConsentementsPage() {
  const { user } = useAuth();

  const [statutFilter, setStatutFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [consentements, setConsentements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [campagnes, setCampagnes] = useState([]);
  const [campagnesLoading, setCampagnesLoading] = useState(false);
  const [formCampagneId, setFormCampagneId] = useState("");
  const [formResponsableNom, setFormResponsableNom] = useState("");
  const [formResponsableEmail, setFormResponsableEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(message, type = "info") {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listConsentements();
      setConsentements(data);
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 403
          ? "Accès réservé aux rôles consultant, administrateur et responsable."
          : "Impossible de charger les consentements."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isMyResponsability = useCallback(
    (c) => user?.role === "responsable" && user.email?.toLowerCase() === c.responsable_email.toLowerCase(),
    [user]
  );

  const counts = useMemo(
    () => ({
      total: consentements.length,
      en_attente: consentements.filter((c) => c.statut === "en_attente").length,
      valide: consentements.filter((c) => c.statut === "valide").length,
      refuse: consentements.filter((c) => c.statut === "refuse").length,
    }),
    [consentements]
  );

  const visibleResults = useMemo(() => {
    let data = consentements;
    if (statutFilter !== "all") data = data.filter((c) => c.statut === statutFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter((c) =>
        `${c.campagne_departement_display} ${c.responsable_nom} ${c.responsable_email}`.toLowerCase().includes(q)
      );
    }
    return data;
  }, [consentements, statutFilter, search]);

  async function handleValider(c) {
    setActionId(c.id);
    try {
      await validerConsentement(c.id);
      showToast(`Consentement validé pour ${c.campagne_departement_display}.`, "success");
      load();
    } catch (error) {
      showToast(error.response?.data?.detail || "Impossible de valider ce consentement.", "error");
    } finally {
      setActionId(null);
    }
  }

  async function handleRefuser(c) {
    if (!window.confirm(`Refuser le consentement pour la campagne ${c.campagne_departement_display} ?`)) return;
    setActionId(c.id);
    try {
      await refuserConsentement(c.id);
      showToast(`Consentement refusé pour ${c.campagne_departement_display}.`, "info");
      load();
    } catch (error) {
      showToast(error.response?.data?.detail || "Impossible de refuser ce consentement.", "error");
    } finally {
      setActionId(null);
    }
  }

  function openModal() {
    setFormCampagneId("");
    setFormResponsableNom("");
    setFormResponsableEmail("");
    setFormError("");
    setModalOpen(true);
    setCampagnesLoading(true);
    listCampagnes({})
      .then((data) => {
        setCampagnes(data.results);
        if (data.results.length > 0) setFormCampagneId(String(data.results[0].id));
      })
      .catch(() => showToast("Impossible de charger la liste des campagnes.", "error"))
      .finally(() => setCampagnesLoading(false));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setFormError("");
    if (!formCampagneId) {
      setFormError("Sélectionnez une campagne.");
      return;
    }
    if (!formResponsableNom.trim()) {
      setFormError("Le nom du responsable est requis.");
      return;
    }
    if (!isValidEmail(formResponsableEmail)) {
      setFormError("Email du responsable non valide.");
      return;
    }
    setSaving(true);
    try {
      await createConsentement(formCampagneId, {
        responsable_nom: formResponsableNom,
        responsable_email: formResponsableEmail,
      });
      setModalOpen(false);
      showToast("Demande de consentement envoyée.", "success");
      load();
    } catch (error) {
      setFormError(error.response?.data?.detail || "Impossible de créer cette demande.");
    } finally {
      setSaving(false);
    }
  }

  const subtitle = loading
    ? undefined
    : `${counts.total} consentement${counts.total > 1 ? "s" : ""} · ${counts.en_attente} en attente de validation`;

  return (
    <Layout pageTitle="Consentements" pageSubtitle={subtitle}>
      <div className="metrics">
        <div className="metric m-navy">
          <div className="metric-label">
            <i className="ti ti-shield-check" /> Consentements totaux
          </div>
          <div className="metric-value">{counts.total}</div>
          <div className="metric-sub">toutes campagnes confondues</div>
        </div>
        <div className="metric m-orange">
          <div className="metric-label">
            <i className="ti ti-clock" /> En attente
          </div>
          <div className="metric-value" style={{ color: "var(--orange)" }}>
            {counts.en_attente}
          </div>
          <div className="metric-sub">nécessite une action</div>
        </div>
        <div className="metric m-green">
          <div className="metric-label">
            <i className="ti ti-check" /> Validés
          </div>
          <div className="metric-value" style={{ color: "var(--green)" }}>
            {counts.valide}
          </div>
          <div className="metric-sub">campagnes autorisées</div>
        </div>
        <div className="metric m-red">
          <div className="metric-label">
            <i className="ti ti-x" /> Refusés
          </div>
          <div className="metric-value" style={{ color: "var(--red)" }}>
            {counts.refuse}
          </div>
          <div className="metric-sub">campagnes bloquées</div>
        </div>
      </div>

      <div className="camp-toolbar">
        <div className="search-wrap">
          <i className="ti ti-search" />
          <input
            type="text"
            placeholder="Rechercher par département ou responsable…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          {STATUT_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-btn${statutFilter === f.key ? " active" : ""}`}
              onClick={() => setStatutFilter(f.key)}
            >
              {f.label} ({f.key === "all" ? counts.total : counts[f.key]})
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={openModal}>
          <i className="ti ti-plus" /> Nouvelle demande
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="consent-timeline">
          {loading && (
            <div style={{ textAlign: "center", color: "var(--text3)", padding: 32 }}>Chargement…</div>
          )}
          {!loading && error && (
            <div style={{ textAlign: "center", color: "var(--red)", padding: 32 }}>{error}</div>
          )}
          {!loading && !error && visibleResults.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text3)", padding: 32 }}>
              Aucun consentement trouvé.
            </div>
          )}
          {!loading &&
            !error &&
            visibleResults.map((c) => {
              const iconInfo = STATUS_ICON[c.statut] || STATUS_ICON.en_attente;
              const badgeClass =
                c.statut === "valide" ? "badge-success" : c.statut === "refuse" ? "badge-danger" : "badge-warning";
              const canAct = c.statut === "en_attente" && isMyResponsability(c);
              return (
                <div className="consent-row" key={c.id}>
                  <div className="consent-status-icon" style={{ background: `${iconInfo.bg}22` }}>
                    <i className={`ti ${iconInfo.icon}`} style={{ color: iconInfo.bg }} />
                  </div>
                  <div className="consent-body">
                    <div className="consent-top-row">
                      <div>
                        <div className="consent-title">Campagne — {c.campagne_departement_display}</div>
                      </div>
                      <span className={`badge ${badgeClass}`}>{c.statut_display}</span>
                    </div>
                    <div className="consent-meta">
                      <div className="consent-meta-item">
                        <i className="ti ti-user" /> Responsable : {c.responsable_nom} ({c.responsable_email})
                      </div>
                    </div>
                    {c.statut === "en_attente" && !canAct && (
                      <div className="consent-signature">
                        <i className="ti ti-clock" style={{ color: "var(--orange)" }} />
                        En attente de validation par {c.responsable_nom}.
                      </div>
                    )}
                    {c.statut !== "en_attente" && (
                      <div className="consent-signature">
                        <i className={`ti ${c.statut === "valide" ? "ti-signature" : "ti-x"}`} />
                        {c.statut === "valide" ? "Validé" : "Refusé"} le {formatDateTime(c.date_validation)}
                      </div>
                    )}
                  </div>
                  <div className="consent-actions">
                    {canAct && (
                      <>
                        <button
                          className="btn btn-sm"
                          style={{ color: "var(--red)", borderColor: "var(--red-border)" }}
                          disabled={actionId === c.id}
                          onClick={() => handleRefuser(c)}
                        >
                          Refuser
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          disabled={actionId === c.id}
                          onClick={() => handleValider(c)}
                        >
                          {actionId === c.id ? "…" : "Valider"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: "14px 18px",
          background: "var(--blue-light)",
          border: "1px solid rgba(26,95,160,.2)",
          borderRadius: "var(--radius)",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          fontSize: 12.5,
          color: "var(--text2)",
        }}
      >
        <i className="ti ti-info-circle" style={{ color: "var(--blue)", fontSize: 16, flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong>Cadre de gouvernance H-SHIELD237 :</strong> aucune campagne ne peut être lancée sans validation
          explicite, authentifiée et horodatée du responsable habilité — effectuée depuis l'application, jamais
          déclarée par le consultant. Chaque décision est journalisée dans le registre d'audit.
        </span>
      </div>

      {modalOpen && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Nouvelle demande de consentement</h3>
              <div className="close-btn" role="button" tabIndex={0} onClick={() => setModalOpen(false)}>
                <i className="ti ti-x" />
              </div>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Campagne *</label>
                  <select
                    className="form-select"
                    value={formCampagneId}
                    onChange={(e) => setFormCampagneId(e.target.value)}
                  >
                    {campagnesLoading && <option value="">Chargement…</option>}
                    {!campagnesLoading && campagnes.length === 0 && (
                      <option value="">Aucune campagne disponible</option>
                    )}
                    {campagnes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.departement_display} (#{c.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nom du responsable habilité *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Ex : M. Jean-Pierre MBARGA, Directeur Général"
                    value={formResponsableNom}
                    onChange={(e) => setFormResponsableNom(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email du responsable *</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="responsable@entreprise.cm"
                    value={formResponsableEmail}
                    onChange={(e) => setFormResponsableEmail(e.target.value)}
                  />
                  <div className="form-hint">
                    Le responsable devra se connecter à la plateforme avec un compte dont l'email correspond
                    exactement à celui-ci pour pouvoir valider ou refuser cette demande.
                  </div>
                </div>
                {formError && (
                  <div className="form-error-text">
                    <i className="ti ti-alert-circle" /> {formError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Envoi…" : "Envoyer la demande"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "var(--navy)",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: "var(--radius-lg)",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,.2)",
            zIndex: 999,
            maxWidth: 360,
          }}
        >
          <i className={`ti ${TOAST_ICONS[toast.type]}`} style={{ fontSize: 17, color: TOAST_COLORS[toast.type] }} />
          <span>{toast.message}</span>
        </div>
      )}
    </Layout>
  );
}
