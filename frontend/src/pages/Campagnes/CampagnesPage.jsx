import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createCampagne,
  deleteCampagne,
  deletePageCapture,
  getPageCapture,
  listCampagnes,
  listScenarios,
  setPageCaptureFichier,
  setPageCaptureHtml,
  updateCampagne,
} from "../../api/campagnes";
import { listEmployes } from "../../api/employes";
import { envoyerCampagne, getConfigurationEnvoi, updateConfigurationEnvoi } from "../../api/simulation";
import Layout from "../../components/Layout";
import { useDepartements } from "../../context/DepartementsContext";
import { STATUT_LABELS } from "../../utils/statuts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value) {
  return EMAIL_RE.test(value.trim());
}

const STATUT_PILL_CLASS = {
  brouillon: "s-draft dot-draft",
  en_attente: "s-pending dot-pending",
  active: "s-active dot-active",
  terminee: "s-done dot-done",
};

const STATUT_FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "brouillon", label: "Brouillon" },
  { key: "en_attente", label: "En attente" },
  { key: "active", label: "Active" },
  { key: "terminee", label: "Terminée" },
];

const TOAST_ICONS = { success: "ti-check", info: "ti-info-circle", error: "ti-alert-circle" };
const TOAST_COLORS = { success: "#4ADE80", info: "#60A5FA", error: "#F87171" };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function CampagnesPage() {
  const { departements } = useDepartements();
  const [statutFilter, setStatutFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState({ count: 0, next: null, previous: null, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formDepartement, setFormDepartement] = useState("");

  const [launchCampagne, setLaunchCampagne] = useState(null);
  const [launchLoading, setLaunchLoading] = useState(false);
  const [launchSaving, setLaunchSaving] = useState(false);
  const [launchExpediteurNom, setLaunchExpediteurNom] = useState("");
  const [launchExpediteurEmail, setLaunchExpediteurEmail] = useState("");
  const [launchReplyTo, setLaunchReplyTo] = useState("");
  const [launchDelai, setLaunchDelai] = useState(2);
  const [launchFieldErrors, setLaunchFieldErrors] = useState({});
  // Annuaire des employés du département de la campagne — remplace
  // l'adresse de diffusion par un envoi individuel, ciblé (2026-08-27).
  const [launchEmployes, setLaunchEmployes] = useState([]);
  const [launchCible, setLaunchCible] = useState("tous"); // "tous" | "un_employe"
  const [launchEmployeId, setLaunchEmployeId] = useState("");
  // Scénarios de la campagne en cours de lancement — pour proposer, pour
  // chacun, la personnalisation de sa fausse page de capture.
  const [launchScenarios, setLaunchScenarios] = useState([]);

  // Sous-modale de personnalisation de la page de capture d'un scénario.
  const [capturePageScenario, setCapturePageScenario] = useState(null);
  const [capturePageMode, setCapturePageMode] = useState("html"); // "html" | "fichier"
  const [capturePageHtml, setCapturePageHtml] = useState("");
  const [capturePageFichier, setCapturePageFichier] = useState(null);
  const [capturePageSaving, setCapturePageSaving] = useState(false);
  const [capturePageError, setCapturePageError] = useState("");

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
      const result = await listCampagnes({ statut: statutFilter, page });
      setData(result);
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 403
          ? "Accès réservé aux rôles consultant et administrateur."
          : "Impossible de charger les campagnes."
      );
    } finally {
      setLoading(false);
    }
  }, [statutFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFilterClick(key) {
    setStatutFilter(key);
    setPage(1);
  }

  // Recherche appliquée côté client, sur la page actuellement chargée
  // (l'API ne propose pas encore de recherche texte côté serveur).
  const visibleResults = useMemo(() => {
    if (!search.trim()) return data.results;
    const q = search.trim().toLowerCase();
    return data.results.filter((c) => (c.departement_display || "").toLowerCase().includes(q));
  }, [data.results, search]);

  // Notifie directement dans l'onglet Campagnes qu'un responsable a refusé
  // — pas seulement visible depuis la page Consentements (demande
  // explicite de l'utilisateur).
  const campagnesRefusees = useMemo(
    () => visibleResults.filter((c) => c.consentement_statut === "refuse"),
    [visibleResults]
  );

  async function openLaunchModal(campagne) {
    setLaunchCampagne(campagne);
    setLaunchFieldErrors({});
    setLaunchExpediteurNom("");
    setLaunchExpediteurEmail("");
    setLaunchReplyTo("");
    setLaunchDelai(2);
    setLaunchEmployes([]);
    setLaunchCible("tous");
    setLaunchEmployeId("");
    setLaunchScenarios([]);
    setLaunchLoading(true);
    try {
      const [config, scenarios, employes] = await Promise.all([
        getConfigurationEnvoi(campagne.id),
        listScenarios(campagne.id),
        listEmployes({ departement: campagne.departement }),
      ]);
      // Le scénario le plus récent (partie « Expéditeur et destinataire » de
      // la page Générer un scénario) préremplit la configuration d'envoi
      // tant que celle-ci n'a pas déjà été renseignée explicitement.
      const dernierScenario = scenarios[0];
      setLaunchExpediteurNom(config.expediteur_nom || dernierScenario?.expediteur_nom || "");
      setLaunchExpediteurEmail(config.expediteur_email || dernierScenario?.expediteur_email || "");
      setLaunchReplyTo(config.reply_to || "");
      setLaunchDelai(config.delai_entre_envois ?? 2);
      setLaunchEmployes(employes);
      setLaunchScenarios(scenarios);
    } catch {
      showToast("Impossible de charger la configuration d'envoi.", "error");
    } finally {
      setLaunchLoading(false);
    }
  }

  // --- Personnalisation de la fausse page de capture d'un scénario ---

  async function openCapturePageModal(scenario) {
    setCapturePageScenario(scenario);
    setCapturePageMode("html");
    setCapturePageHtml("");
    setCapturePageFichier(null);
    setCapturePageError("");
    if (scenario.page_capture_personnalisee) {
      try {
        const detail = await getPageCapture(scenario.id);
        setCapturePageHtml(detail.page_capture_html || "");
      } catch {
        showToast("Impossible de charger la page personnalisée existante.", "error");
      }
    }
  }

  function closeCapturePageModal() {
    setCapturePageScenario(null);
    setCapturePageFichier(null);
  }

  function refreshScenarioDansLaListe(scenarioId, patch) {
    setLaunchScenarios((prev) => prev.map((s) => (s.id === scenarioId ? { ...s, ...patch } : s)));
  }

  async function handleCapturePageSubmit(event) {
    event.preventDefault();
    setCapturePageError("");
    if (capturePageMode === "fichier" && !capturePageFichier) {
      setCapturePageError("Choisissez un fichier .html à importer.");
      return;
    }
    if (capturePageMode === "html" && !capturePageHtml.trim()) {
      setCapturePageError("Collez le code HTML de la page.");
      return;
    }
    setCapturePageSaving(true);
    try {
      if (capturePageMode === "fichier") {
        await setPageCaptureFichier(capturePageScenario.id, capturePageFichier);
      } else {
        await setPageCaptureHtml(capturePageScenario.id, capturePageHtml);
      }
      refreshScenarioDansLaListe(capturePageScenario.id, { page_capture_personnalisee: true });
      showToast("Page de capture personnalisée enregistrée.", "success");
      closeCapturePageModal();
    } catch (error) {
      setCapturePageError(error.response?.data?.detail || "Impossible d'enregistrer cette page.");
    } finally {
      setCapturePageSaving(false);
    }
  }

  async function handleCapturePageSupprimer() {
    setCapturePageSaving(true);
    try {
      await deletePageCapture(capturePageScenario.id);
      refreshScenarioDansLaListe(capturePageScenario.id, { page_capture_personnalisee: false });
      showToast("Page de capture réinitialisée (générique).", "success");
      closeCapturePageModal();
    } catch {
      showToast("Impossible de réinitialiser cette page.", "error");
    } finally {
      setCapturePageSaving(false);
    }
  }

  function clearLaunchFieldError(field) {
    setLaunchFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validateLaunch() {
    const errors = {};
    if (!launchExpediteurEmail.trim()) errors.expediteur_email = "L'email de l'expéditeur affiché est requis.";
    else if (!isValidEmail(launchExpediteurEmail)) errors.expediteur_email = "Email non valide.";
    if (!launchReplyTo.trim()) errors.reply_to = "L'email de réponse (Reply-To) est requis.";
    else if (!isValidEmail(launchReplyTo)) errors.reply_to = "Email non valide.";
    if (!launchDelai || Number(launchDelai) < 0) errors.delai_entre_envois = "Le délai doit être un nombre positif.";
    if (launchEmployes.length === 0) {
      errors.destinataires =
        "Aucun employé n'est enregistré pour ce département — configurez l'annuaire des employés d'abord.";
    } else if (launchCible === "un_employe" && !launchEmployeId) {
      errors.destinataires = "Sélectionnez un employé.";
    }
    return errors;
  }

  async function handleLaunchSubmit(event) {
    event.preventDefault();
    const errors = validateLaunch();
    if (Object.keys(errors).length > 0) {
      setLaunchFieldErrors(errors);
      showToast("Veuillez corriger les champs signalés en rouge.", "error");
      return;
    }
    setLaunchFieldErrors({});
    setLaunchSaving(true);
    try {
      await updateConfigurationEnvoi(launchCampagne.id, {
        expediteur_nom: launchExpediteurNom,
        expediteur_email: launchExpediteurEmail,
        reply_to: launchReplyTo,
        delai_entre_envois: Number(launchDelai),
      });
      const trackings = await envoyerCampagne(launchCampagne.id, {
        cible: launchCible,
        employeId: launchCible === "un_employe" ? Number(launchEmployeId) : undefined,
      });
      await updateCampagne(launchCampagne.id, { statut: "active", perimetre_valide: true });
      setLaunchCampagne(null);
      showToast(`Campagne lancée — ${trackings.length} email${trackings.length > 1 ? "s" : ""} envoyé${trackings.length > 1 ? "s" : ""}.`, "success");
      load();
    } catch (error) {
      const detail = error.response?.data?.detail;
      showToast(detail || "Impossible de lancer cette campagne.", "error");
    } finally {
      setLaunchSaving(false);
    }
  }

  async function handleSupprimer(campagne) {
    if (
      !window.confirm(`Supprimer la campagne du département ${campagne.departement_display} ? Cette action est irréversible.`)
    ) {
      return;
    }
    try {
      await deleteCampagne(campagne.id);
      showToast("Campagne supprimée.", "success");
      load();
    } catch {
      showToast("Impossible de supprimer cette campagne.", "error");
    }
  }

  function openModal() {
    setFormDepartement(departements[0]?.code || "");
    setModalOpen(true);
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await createCampagne({
        departement: formDepartement,
        statut: "en_attente",
        perimetre_valide: false,
      });
      setModalOpen(false);
      showToast("Campagne créée.", "success");
      setStatutFilter("all");
      setPage(1);
      load();
    } catch {
      showToast("Impossible de créer la campagne.", "error");
    } finally {
      setSaving(false);
    }
  }

  const subtitle = loading
    ? undefined
    : `${data.count} campagne${data.count > 1 ? "s" : ""}${statutFilter !== "all" ? ` — filtre : ${STATUT_LABELS[statutFilter]}` : ""}`;

  return (
    <Layout pageTitle="Campagnes" pageSubtitle={subtitle} onNewCampaign={openModal}>
      <div className="camp-toolbar">
        <div className="search-wrap">
          <i className="ti ti-search" />
          <input
            type="text"
            placeholder="Rechercher un département…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          {STATUT_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-btn${statutFilter === f.key ? " active" : ""}`}
              onClick={() => handleFilterClick(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {campagnesRefusees.length > 0 && (
        <div className="alert-strip" role="alert">
          <i className="ti ti-alert-triangle" aria-hidden="true" />
          <span>
            <strong>
              {campagnesRefusees.length} campagne{campagnesRefusees.length > 1 ? "s" : ""} refusée
              {campagnesRefusees.length > 1 ? "s" : ""}
            </strong>{" "}
            par le responsable désigné — le motif est indiqué dans la colonne « Périmètre validé » du
            tableau ci-dessous.
          </span>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table aria-label="Liste des campagnes">
            <thead>
              <tr>
                <th>Département</th>
                <th>Statut</th>
                <th>Périmètre validé</th>
                <th>Créée le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--text3)", padding: 24 }}>
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--red)", padding: 24 }}>
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && visibleResults.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--text3)", padding: 24 }}>
                    Aucune campagne ne correspond à cette recherche.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                visibleResults.map((c) => {
                  const pillClasses = STATUT_PILL_CLASS[c.statut] || "s-draft dot-draft";
                  const [pillClass, dotClass] = pillClasses.split(" ");
                  return (
                    <tr key={c.id}>
                      <td className="td-name">{c.departement_display}</td>
                      <td>
                        <span className={`status-pill ${pillClass}`}>
                          <span className={`dot ${dotClass}`} /> {STATUT_LABELS[c.statut] || c.statut}
                        </span>
                      </td>
                      <td>
                        {c.consentement_statut === "refuse" ? (
                          <div>
                            <span
                              className="badge badge-danger"
                              title={c.consentement_motif_refus_details || undefined}
                            >
                              <i className="ti ti-x" style={{ fontSize: 10, verticalAlign: -1 }} /> Refusée
                            </span>
                            {c.consentement_motifs_refus_display?.length > 0 && (
                              <div style={{ fontSize: 11, color: "var(--red)", marginTop: 4, maxWidth: 220 }}>
                                {c.consentement_motifs_refus_display.join(" · ")}
                              </div>
                            )}
                            {c.consentement_motif_refus_details && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "var(--text3)",
                                  marginTop: 2,
                                  maxWidth: 220,
                                  fontStyle: "italic",
                                }}
                              >
                                « {c.consentement_motif_refus_details} »
                              </div>
                            )}
                          </div>
                        ) : c.perimetre_valide ? (
                          <span className="badge badge-success">Validé</span>
                        ) : (
                          <span className="badge badge-neutral">Non validé</span>
                        )}
                      </td>
                      <td style={{ color: "var(--text3)" }}>{formatDate(c.date_creation)}</td>
                      <td>
                        <div className="actions-cell">
                          {c.statut === "en_attente" && (
                            <div
                              className={`action-btn${c.perimetre_valide ? "" : " disabled"}`}
                              onClick={() => c.perimetre_valide && openLaunchModal(c)}
                              title={
                                c.perimetre_valide
                                  ? "Lancer la campagne"
                                  : c.consentement_statut === "refuse"
                                    ? "Campagne refusée par le responsable désigné — voir le motif ci-contre"
                                    : "En attente de validation du responsable désigné — voir Consentements"
                              }
                            >
                              <i className="ti ti-send" style={{ fontSize: 15 }} />
                            </div>
                          )}
                          <div className="action-btn danger" onClick={() => handleSupprimer(c)} title="Supprimer">
                            <i className="ti ti-trash" style={{ fontSize: 15 }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--text3)",
          }}
        >
          <span>
            {loading
              ? "Chargement…"
              : `${visibleResults.length} campagne${visibleResults.length > 1 ? "s" : ""} affichée${visibleResults.length > 1 ? "s" : ""} sur ${data.count}`}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-sm" disabled={!data.previous} onClick={() => setPage((p) => p - 1)}>
              <i className="ti ti-chevron-left" />
            </button>
            <button
              className="btn btn-sm"
              style={{ background: "var(--navy-mid)", color: "#fff", borderColor: "var(--navy-mid)" }}
            >
              {page}
            </button>
            <button className="btn btn-sm" disabled={!data.next} onClick={() => setPage((p) => p + 1)}>
              <i className="ti ti-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Nouvelle campagne</h3>
              <div className="close-btn" role="button" tabIndex={0} onClick={() => setModalOpen(false)}>
                <i className="ti ti-x" />
              </div>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Département ciblé *</label>
                  <select
                    className="form-select"
                    value={formDepartement}
                    onChange={(e) => setFormDepartement(e.target.value)}
                  >
                    {departements.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.nom}
                      </option>
                    ))}
                  </select>
                  <div className="form-hint">
                    La demande de consentement est générée automatiquement pour le responsable configuré pour ce
                    département (voir Responsables) — le bouton « Lancer » restera désactivé tant qu'il n'aura
                    pas validé la campagne depuis son propre compte.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Création…" : "Créer la campagne"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {launchCampagne && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setLaunchCampagne(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Lancer la campagne — {launchCampagne.departement_display}</h3>
              <div className="close-btn" role="button" tabIndex={0} onClick={() => setLaunchCampagne(null)}>
                <i className="ti ti-x" />
              </div>
            </div>
            <form onSubmit={handleLaunchSubmit}>
              <div className="modal-body">
                {launchLoading ? (
                  <p style={{ color: "var(--text3)", fontSize: 13 }}>Chargement de la configuration…</p>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Nom de l'expéditeur affiché</label>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Ex : Portail MINESUP"
                        value={launchExpediteurNom}
                        onChange={(e) => setLaunchExpediteurNom(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email de l'expéditeur affiché *</label>
                      <input
                        className={`form-input${launchFieldErrors.expediteur_email ? " input-error" : ""}`}
                        type="email"
                        placeholder="noreply@minesup-infos.cm"
                        value={launchExpediteurEmail}
                        onChange={(e) => {
                          setLaunchExpediteurEmail(e.target.value);
                          clearLaunchFieldError("expediteur_email");
                        }}
                      />
                      <div className="form-hint">
                        Distinct du compte SMTP authentifié — c'est l'adresse affichée dans le client de
                        messagerie du destinataire.
                      </div>
                      {launchFieldErrors.expediteur_email && (
                        <div className="form-error-text">
                          <i className="ti ti-alert-circle" /> {launchFieldErrors.expediteur_email}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email de réponse (Reply-To) *</label>
                      <input
                        className={`form-input${launchFieldErrors.reply_to ? " input-error" : ""}`}
                        type="email"
                        placeholder="reponses-test@hshield237.local"
                        value={launchReplyTo}
                        onChange={(e) => {
                          setLaunchReplyTo(e.target.value);
                          clearLaunchFieldError("reply_to");
                        }}
                      />
                      <div className="form-hint">
                        Adresse neutre et contrôlée : aucune réponse d'un employé ne partira vers une adresse
                        non maîtrisée.
                      </div>
                      {launchFieldErrors.reply_to && (
                        <div className="form-error-text">
                          <i className="ti ti-alert-circle" /> {launchFieldErrors.reply_to}
                        </div>
                      )}
                    </div>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                      <label className="form-label">Délai entre deux envois (secondes)</label>
                      <input
                        className={`form-input${launchFieldErrors.delai_entre_envois ? " input-error" : ""}`}
                        type="number"
                        min="0"
                        value={launchDelai}
                        onChange={(e) => {
                          setLaunchDelai(e.target.value);
                          clearLaunchFieldError("delai_entre_envois");
                        }}
                      />
                      <div className="form-hint">
                        Limite le débit d'envoi pour éviter d'être signalé comme trafic massif par le relais
                        SMTP du client.
                      </div>
                      {launchFieldErrors.delai_entre_envois && (
                        <div className="form-error-text">
                          <i className="ti ti-alert-circle" /> {launchFieldErrors.delai_entre_envois}
                        </div>
                      )}
                    </div>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                      <label className="form-label">Page de fausse capture</label>
                      {launchScenarios.length === 0 ? (
                        <div className="form-hint">Aucun scénario généré pour cette campagne.</div>
                      ) : (
                        <div className="team-list" style={{ marginBottom: 8 }}>
                          {launchScenarios.map((s) => (
                            <div className="team-row" key={s.id}>
                              <div className="team-info">
                                <div className="team-name">{s.objet_email}</div>
                                <div className="team-email">
                                  <span
                                    className={`badge ${s.page_capture_personnalisee ? "badge-success" : "badge-neutral"}`}
                                  >
                                    {s.page_capture_personnalisee ? "Page personnalisée" : "Page générique"}
                                  </span>
                                </div>
                              </div>
                              <button type="button" className="btn btn-sm" onClick={() => openCapturePageModal(s)}>
                                <i className="ti ti-code" /> {s.page_capture_personnalisee ? "Modifier" : "Personnaliser"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="form-hint">
                        Par défaut, la fausse page imite un formulaire de connexion générique. Vous pouvez la
                        remplacer par une page imitant un service réel : elle doit contenir un vrai formulaire
                        (balise &lt;form&gt; avec au moins un champ) pour que la soumission puisse être détectée —
                        le suivi est ajouté automatiquement, aucun code de suivi à écrire vous-même.
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                      <label className="form-label">Destinataires *</label>
                      {launchEmployes.length === 0 ? (
                        <div className="form-hint" style={{ color: "var(--red)" }}>
                          Aucun employé n'est enregistré pour le département {launchCampagne.departement_display} —
                          configurez l'annuaire depuis la page Employés avant de lancer cette campagne.
                        </div>
                      ) : (
                        <>
                          <label className="form-check" style={{ marginBottom: 8 }}>
                            <input
                              type="radio"
                              name="launch-cible"
                              checked={launchCible === "tous"}
                              onChange={() => {
                                setLaunchCible("tous");
                                clearLaunchFieldError("destinataires");
                              }}
                            />
                            Tous les employés du département ({launchEmployes.length})
                          </label>
                          <label className="form-check" style={{ marginBottom: 8 }}>
                            <input
                              type="radio"
                              name="launch-cible"
                              checked={launchCible === "un_employe"}
                              onChange={() => {
                                setLaunchCible("un_employe");
                                clearLaunchFieldError("destinataires");
                              }}
                            />
                            Un employé en particulier
                          </label>
                          {launchCible === "un_employe" && (
                            <select
                              className="form-select"
                              value={launchEmployeId}
                              onChange={(e) => {
                                setLaunchEmployeId(e.target.value);
                                clearLaunchFieldError("destinataires");
                              }}
                            >
                              <option value="">— Choisir —</option>
                              {launchEmployes.map((e) => (
                                <option key={e.id} value={e.id}>
                                  {e.nom} ({e.email})
                                </option>
                              ))}
                            </select>
                          )}
                          <div className="form-hint">
                            Chaque employé reçoit un email individuel — jamais une adresse de diffusion
                            visible par les autres destinataires.
                          </div>
                        </>
                      )}
                      {launchFieldErrors.destinataires && (
                        <div className="form-error-text">
                          <i className="ti ti-alert-circle" /> {launchFieldErrors.destinataires}
                        </div>
                      )}
                    </div>
                    <div className="consent-box">
                      <i className="ti ti-alert-triangle" />
                      <div>
                        <strong style={{ display: "block", marginBottom: 4 }}>
                          Délivrabilité non garantie par la plateforme
                        </strong>
                        La bonne réception de ces emails dépend de la configuration DNS (SPF, DKIM, DMARC) du
                        domaine d'envoi utilisé par le client. H-SHIELD237 ne peut pas garantir que les emails
                        simulés évitent les filtres anti-spam si cette configuration n'est pas en place côté
                        client.
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setLaunchCampagne(null)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={launchLoading || launchSaving}>
                  <i className="ti ti-send" /> {launchSaving ? "Envoi en cours…" : "Lancer la campagne"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {capturePageScenario && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && closeCapturePageModal()}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>Page de capture — {capturePageScenario.objet_email}</h3>
              <div className="close-btn" role="button" tabIndex={0} onClick={closeCapturePageModal}>
                <i className="ti ti-x" />
              </div>
            </div>
            <form onSubmit={handleCapturePageSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-check" style={{ marginBottom: 8 }}>
                    <input
                      type="radio"
                      name="capture-page-mode"
                      checked={capturePageMode === "html"}
                      onChange={() => setCapturePageMode("html")}
                    />
                    Coller le code HTML
                  </label>
                  <label className="form-check" style={{ marginBottom: 8 }}>
                    <input
                      type="radio"
                      name="capture-page-mode"
                      checked={capturePageMode === "fichier"}
                      onChange={() => setCapturePageMode("fichier")}
                    />
                    Importer un fichier .html
                  </label>
                </div>
                {capturePageMode === "html" ? (
                  <div className="form-group">
                    <label className="form-label">Code HTML de la page</label>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight: 220, fontFamily: "monospace", fontSize: 12 }}
                      placeholder="<html>…<form>…</form>…</html>"
                      value={capturePageHtml}
                      onChange={(e) => setCapturePageHtml(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Fichier .html</label>
                    <input
                      className="form-input"
                      type="file"
                      accept=".html,.htm,text/html"
                      onChange={(e) => setCapturePageFichier(e.target.files?.[0] || null)}
                    />
                  </div>
                )}
                <div className="form-hint">
                  La page doit contenir un vrai formulaire (&lt;form&gt; avec au moins un champ &lt;input&gt;,
                  &lt;textarea&gt; ou &lt;select&gt;) — c'est la seule contrainte : le suivi de la soumission
                  (détecter si des champs ont été remplis, jamais leur contenu) est ajouté automatiquement à la
                  page au moment où elle est servie à l'employé testé.
                </div>
                {capturePageError && (
                  <div className="form-error-text">
                    <i className="ti ti-alert-circle" /> {capturePageError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {capturePageScenario.page_capture_personnalisee && (
                  <button
                    type="button"
                    className="btn"
                    style={{ marginRight: "auto" }}
                    disabled={capturePageSaving}
                    onClick={handleCapturePageSupprimer}
                  >
                    <i className="ti ti-refresh" /> Revenir à la page générique
                  </button>
                )}
                <button type="button" className="btn" onClick={closeCapturePageModal}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={capturePageSaving}>
                  {capturePageSaving ? "Enregistrement…" : "Enregistrer"}
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
