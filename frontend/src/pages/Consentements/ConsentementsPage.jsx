import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { listCampagnes } from "../../api/campagnes";
import { genererConsentement, listConsentements, refuserConsentement, validerConsentement } from "../../api/gouvernance";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { MOTIFS_REFUS } from "../../utils/motifsRefus";

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
  const estAdministrateur = user?.role === "administrateur";

  const [statutFilter, setStatutFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [consentements, setConsentements] = useState([]);
  const [campagnesSansConsentement, setCampagnesSansConsentement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [genId, setGenId] = useState(null);

  const [refuserCible, setRefuserCible] = useState(null);
  const [refuserMotifs, setRefuserMotifs] = useState([]);
  const [refuserDetails, setRefuserDetails] = useState("");
  const [refuserError, setRefuserError] = useState("");
  const [refuserSaving, setRefuserSaving] = useState(false);

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
      if (estAdministrateur) {
        const campagnesData = await listCampagnes({});
        const idsAvecConsentement = new Set(data.map((c) => c.campagne));
        setCampagnesSansConsentement(campagnesData.results.filter((c) => !idsAvecConsentement.has(c.id)));
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estAdministrateur]);

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

  function openRefuserModal(c) {
    setRefuserCible(c);
    setRefuserMotifs([]);
    setRefuserDetails("");
    setRefuserError("");
  }

  function toggleMotif(value) {
    setRefuserMotifs((prev) => (prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]));
  }

  async function handleRefuserSubmit(event) {
    event.preventDefault();
    setRefuserError("");
    if (refuserMotifs.length === 0) {
      setRefuserError("Sélectionnez au moins un motif de refus.");
      return;
    }
    if (refuserMotifs.includes("autre") && !refuserDetails.trim()) {
      setRefuserError("Précisez le motif dans le champ de texte pour « Autre ».");
      return;
    }
    setRefuserSaving(true);
    try {
      await refuserConsentement(refuserCible.id, { motifs: refuserMotifs, details: refuserDetails.trim() });
      showToast(`Consentement refusé pour ${refuserCible.campagne_departement_display}.`, "info");
      setRefuserCible(null);
      load();
    } catch (error) {
      setRefuserError(error.response?.data?.detail || "Impossible de refuser ce consentement.");
    } finally {
      setRefuserSaving(false);
    }
  }

  async function handleGenerer(campagne) {
    setGenId(campagne.id);
    try {
      await genererConsentement(campagne.id);
      showToast(`Demande de consentement générée pour la campagne #${campagne.id}.`, "success");
      load();
    } catch (error) {
      showToast(
        error.response?.data?.detail || "Impossible de générer cette demande.",
        "error"
      );
    } finally {
      setGenId(null);
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

      <div
        style={{
          marginBottom: 16,
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
          <strong>Cadre de gouvernance H-SHIELD237 :</strong> chaque demande de consentement est générée
          automatiquement à partir du responsable configuré par l'administrateur pour le département de la
          campagne (voir Responsables) — plus aucune saisie libre par la personne qui crée la campagne. Aucune
          campagne ne peut être lancée sans validation explicite, authentifiée et horodatée du responsable
          désigné, effectuée depuis son propre compte. Chaque décision est journalisée dans le registre d'audit.
        </span>
      </div>

      {estAdministrateur && campagnesSansConsentement.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Campagnes sans demande de consentement</div>
              <div className="card-sub">
                Aucun responsable n'était configuré pour ce département au moment de la création — générez la
                demande manuellement une fois le registre complété (voir Responsables).
              </div>
            </div>
          </div>
          <div className="consent-timeline">
            {campagnesSansConsentement.map((c) => (
              <div className="consent-row" key={c.id}>
                <div className="consent-status-icon" style={{ background: "rgba(90,102,120,.15)" }}>
                  <i className="ti ti-alert-triangle" style={{ color: "var(--text3)" }} />
                </div>
                <div className="consent-body">
                  <div className="consent-title">Campagne #{c.id} — {c.departement_display}</div>
                </div>
                <div className="consent-actions">
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={genId === c.id}
                    onClick={() => handleGenerer(c)}
                  >
                    {genId === c.id ? "…" : "Générer la demande"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    {c.statut === "valide" && (
                      <div className="consent-signature">
                        <i className="ti ti-signature" />
                        Validé le {formatDateTime(c.date_validation)}
                      </div>
                    )}
                    {c.statut === "refuse" && (
                      <div className="consent-signature" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                        <div>
                          <i className="ti ti-x" /> Refusé le {formatDateTime(c.date_validation)}
                        </div>
                        {c.motifs_refus_display?.length > 0 && (
                          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text2)" }}>
                            {c.motifs_refus_display.map((m) => (
                              <li key={m}>{m}</li>
                            ))}
                          </ul>
                        )}
                        {c.motif_refus_details && (
                          <div style={{ fontStyle: "italic", color: "var(--text2)" }}>« {c.motif_refus_details} »</div>
                        )}
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
                          onClick={() => openRefuserModal(c)}
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

      {refuserCible && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setRefuserCible(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Refuser — {refuserCible.campagne_departement_display}</h3>
              <div className="close-btn" role="button" tabIndex={0} onClick={() => setRefuserCible(null)}>
                <i className="ti ti-x" />
              </div>
            </div>
            <form onSubmit={handleRefuserSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Motif du refus * (une ou plusieurs raisons)</label>
                  <div className="checkbox-group">
                    {MOTIFS_REFUS.map((m) => (
                      <label className="form-check" key={m.value}>
                        <input
                          type="checkbox"
                          checked={refuserMotifs.includes(m.value)}
                          onChange={() => toggleMotif(m.value)}
                        />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Précisions{refuserMotifs.includes("autre") ? " *" : " (optionnel)"}
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Détaillez le contexte de ce refus…"
                    value={refuserDetails}
                    onChange={(e) => setRefuserDetails(e.target.value)}
                  />
                </div>
                {refuserError && (
                  <div className="form-error-text">
                    <i className="ti ti-alert-circle" /> {refuserError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setRefuserCible(null)}>
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "var(--red)", borderColor: "var(--red)" }}
                  disabled={refuserSaving}
                >
                  {refuserSaving ? "Envoi…" : "Confirmer le refus"}
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
