import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createCampagne,
  createDestinataire,
  deleteCampagne,
  deleteDestinataire,
  listCampagnes,
  listDestinataires,
  updateCampagne,
} from "../../api/campagnes";
import { envoyerCampagne, getConfigurationEnvoi, updateConfigurationEnvoi } from "../../api/simulation";
import Layout from "../../components/Layout";
import { DEPARTEMENT_LABELS } from "../../utils/departements";
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
  const [statutFilter, setStatutFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState({ count: 0, next: null, previous: null, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formDepartement, setFormDepartement] = useState("direction");
  const [formStatut, setFormStatut] = useState("brouillon");
  const [formPerimetreValide, setFormPerimetreValide] = useState(false);

  const [launchCampagne, setLaunchCampagne] = useState(null);
  const [launchLoading, setLaunchLoading] = useState(false);
  const [launchSaving, setLaunchSaving] = useState(false);
  const [launchExpediteurNom, setLaunchExpediteurNom] = useState("");
  const [launchExpediteurEmail, setLaunchExpediteurEmail] = useState("");
  const [launchReplyTo, setLaunchReplyTo] = useState("");
  const [launchDelai, setLaunchDelai] = useState(2);
  const [launchFieldErrors, setLaunchFieldErrors] = useState({});
  const [launchDestinataires, setLaunchDestinataires] = useState([]);
  const [destEmail, setDestEmail] = useState("");
  const [destDepartement, setDestDepartement] = useState("direction");
  const [destSaving, setDestSaving] = useState(false);
  const [destError, setDestError] = useState("");

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

  async function openLaunchModal(campagne) {
    setLaunchCampagne(campagne);
    setLaunchFieldErrors({});
    setLaunchExpediteurNom("");
    setLaunchExpediteurEmail("");
    setLaunchReplyTo("");
    setLaunchDelai(2);
    setLaunchDestinataires([]);
    setDestEmail("");
    setDestDepartement("direction");
    setDestError("");
    setLaunchLoading(true);
    try {
      const [config, destinataires] = await Promise.all([
        getConfigurationEnvoi(campagne.id),
        listDestinataires(campagne.id),
      ]);
      setLaunchExpediteurNom(config.expediteur_nom || "");
      setLaunchExpediteurEmail(config.expediteur_email || "");
      setLaunchReplyTo(config.reply_to || "");
      setLaunchDelai(config.delai_entre_envois ?? 2);
      setLaunchDestinataires(destinataires);
    } catch {
      showToast("Impossible de charger la configuration d'envoi.", "error");
    } finally {
      setLaunchLoading(false);
    }
  }

  async function handleAjouterDestinataire(event) {
    event.preventDefault();
    setDestError("");
    if (!isValidEmail(destEmail)) {
      setDestError("Email non valide.");
      return;
    }
    setDestSaving(true);
    try {
      const destinataire = await createDestinataire(launchCampagne.id, {
        email: destEmail,
        departement: destDepartement,
      });
      setLaunchDestinataires((prev) => [...prev, destinataire]);
      setDestEmail("");
    } catch (error) {
      setDestError(error.response?.data?.email?.[0] || "Impossible d'ajouter ce destinataire.");
    } finally {
      setDestSaving(false);
    }
  }

  async function handleSupprimerDestinataire(destinataire) {
    try {
      await deleteDestinataire(launchCampagne.id, destinataire.id);
      setLaunchDestinataires((prev) => prev.filter((d) => d.id !== destinataire.id));
    } catch {
      showToast("Impossible de supprimer ce destinataire.", "error");
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
      const trackings = await envoyerCampagne(launchCampagne.id);
      await updateCampagne(launchCampagne.id, { statut: "active" });
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
    setFormDepartement("direction");
    setFormStatut("brouillon");
    setFormPerimetreValide(false);
    setModalOpen(true);
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await createCampagne({
        departement: formDepartement,
        statut: formStatut,
        perimetre_valide: formPerimetreValide,
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
                        {c.perimetre_valide ? (
                          <span className="badge badge-success">Validé</span>
                        ) : (
                          <span className="badge badge-neutral">Non validé</span>
                        )}
                      </td>
                      <td style={{ color: "var(--text3)" }}>{formatDate(c.date_creation)}</td>
                      <td>
                        <div className="actions-cell">
                          {c.statut === "en_attente" && (
                            <div className="action-btn" onClick={() => openLaunchModal(c)} title="Lancer la campagne">
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
                <div className="form-group">
                  <label className="form-label">Département ciblé *</label>
                  <select
                    className="form-select"
                    value={formDepartement}
                    onChange={(e) => setFormDepartement(e.target.value)}
                  >
                    {Object.entries(DEPARTEMENT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Statut initial</label>
                  <select className="form-select" value={formStatut} onChange={(e) => setFormStatut(e.target.value)}>
                    {Object.entries(STATUT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="form-check">
                  <input
                    type="checkbox"
                    checked={formPerimetreValide}
                    onChange={(e) => setFormPerimetreValide(e.target.checked)}
                  />
                  Le périmètre de la campagne a déjà été validé
                </label>
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
                    <div className="form-group">
                      <label className="form-label">
                        Destinataires par département {launchDestinataires.length > 0 && `(${launchDestinataires.length})`}
                      </label>
                      <div className="form-hint" style={{ marginTop: 0, marginBottom: 8 }}>
                        Chaque destinataire reçoit automatiquement le scénario ciblant son
                        département (ou le scénario générique à défaut).
                      </div>
                      <div className="destinataire-list">
                        {launchDestinataires.length === 0 && (
                          <div className="destinataire-empty">Aucun destinataire ajouté pour l'instant.</div>
                        )}
                        {launchDestinataires.map((d) => (
                          <div className="destinataire-row" key={d.id}>
                            <span className="dest-email">{d.email}</span>
                            <span className="dest-dept">{d.departement_display}</span>
                            <i
                              className="ti ti-x dest-remove"
                              role="button"
                              tabIndex={0}
                              title="Retirer"
                              onClick={() => handleSupprimerDestinataire(d)}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="destinataire-add-row">
                        <input
                          className="form-input"
                          type="email"
                          placeholder="employe@entreprise.cm"
                          value={destEmail}
                          onChange={(e) => setDestEmail(e.target.value)}
                        />
                        <select
                          className="form-select"
                          style={{ maxWidth: 190 }}
                          value={destDepartement}
                          onChange={(e) => setDestDepartement(e.target.value)}
                        >
                          {Object.entries(DEPARTEMENT_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn"
                          disabled={destSaving}
                          onClick={handleAjouterDestinataire}
                        >
                          <i className="ti ti-plus" /> Ajouter
                        </button>
                      </div>
                      {destError && (
                        <div className="form-error-text">
                          <i className="ti ti-alert-circle" /> {destError}
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
