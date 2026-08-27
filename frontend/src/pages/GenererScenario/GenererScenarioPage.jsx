import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listCampagnes } from "../../api/campagnes";
import { generateManuel, generateViaAPI } from "../../api/generation";
import { listTemplates } from "../../api/templatesDepartement";
import Layout from "../../components/Layout";
import { departementLabel } from "../../utils/departements";
import { statutLabel } from "../../utils/statuts";

const TOAST_ICONS = { success: "ti-check", info: "ti-info-circle", error: "ti-alert-circle" };
const TOAST_COLORS = { success: "#4ADE80", info: "#60A5FA", error: "#F87171" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
  return EMAIL_RE.test(value.trim());
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function GenererScenarioPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("api"); // "api" | "manuel"

  const [campagnes, setCampagnes] = useState([]);
  const [campagnesLoading, setCampagnesLoading] = useState(true);
  const [campagneId, setCampagneId] = useState("");

  // Mode API
  const [contexteAdditionnel, setContexteAdditionnel] = useState("");
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateId, setTemplateId] = useState("");

  // Expéditeur et destinataire — communs aux deux modes. Le destinataire
  // peut être une adresse de diffusion (liste de distribution) représentant
  // tout le département déjà ciblé par la campagne.
  const [expediteurNom, setExpediteurNom] = useState("");
  const [expediteurEmail, setExpediteurEmail] = useState("");
  const [destinataireEmail, setDestinataireEmail] = useState("");

  // Mode manuel — le consultant colle ici le texte déjà rédigé via claude.ai
  // (ou tout autre LLM) dans l'interface web, sans passer par l'API.
  const [objetEmail, setObjetEmail] = useState("");
  const [corpsEmail, setCorpsEmail] = useState("");
  const [urlFaussePage, setUrlFaussePage] = useState("");
  const [pieceJointe, setPieceJointe] = useState(null);
  const [estHtml, setEstHtml] = useState(false);
  const [previewTab, setPreviewTab] = useState("rendu"); // "rendu" | "code"
  const corpsEmailRef = useRef(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const campagneRef = useRef(null);
  const expediteurEmailRef = useRef(null);
  const destinataireEmailRef = useRef(null);
  const objetEmailRef = useRef(null);
  const urlFaussePageRef = useRef(null);

  const FIELD_REFS = {
    campagne: campagneRef,
    expediteur_email: expediteurEmailRef,
    destinataire_email: destinataireEmailRef,
    objet_email: objetEmailRef,
    corps_email: corpsEmailRef,
    url_fausse_page: urlFaussePageRef,
  };
  const FIELD_ORDER = ["campagne", "expediteur_email", "destinataire_email", "objet_email", "corps_email", "url_fausse_page"];

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const previewHeaderRef = useRef(null);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    if ((loading || result) && previewHeaderRef.current) {
      previewHeaderRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, result]);

  function clearFieldError(field) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function scrollToFirstError(errors) {
    for (const key of FIELD_ORDER) {
      if (errors[key] && FIELD_REFS[key]?.current) {
        FIELD_REFS[key].current.scrollIntoView({ behavior: "smooth", block: "center" });
        FIELD_REFS[key].current.focus?.();
        break;
      }
    }
  }

  function showToast(message, type = "info") {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    listCampagnes({})
      .then((data) => {
        setCampagnes(data.results);
        if (data.results.length > 0) setCampagneId(String(data.results[0].id));
      })
      .catch(() => showToast("Impossible de charger la liste des campagnes.", "error"))
      .finally(() => setCampagnesLoading(false));
  }, []);

  const selectedCampagne = campagnes.find((c) => String(c.id) === String(campagneId));

  // Un template n'est pertinent qu'en mode API, et seulement pour le
  // département de la campagne sélectionnée — recharger la liste et
  // réinitialiser le choix à chaque changement de campagne évite de
  // proposer un template d'un autre département.
  useEffect(() => {
    setTemplateId("");
    if (mode !== "api" || !selectedCampagne) {
      setTemplates([]);
      return;
    }
    let cancelled = false;
    setTemplatesLoading(true);
    listTemplates(selectedCampagne.departement)
      .then((data) => !cancelled && setTemplates(data))
      .catch(() => !cancelled && setTemplates([]))
      .finally(() => !cancelled && setTemplatesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [mode, selectedCampagne?.departement, selectedCampagne?.id]);

  const selectedTemplate = templates.find((t) => String(t.id) === String(templateId));

  function switchMode(nextMode) {
    setMode(nextMode);
    setResult(null);
    setPreviewTab("rendu");
    setFieldErrors({});
  }

  function validateExpediteurDestinataire() {
    const errors = {};
    if (expediteurEmail.trim() && !isValidEmail(expediteurEmail)) {
      errors.expediteur_email = "Email non valide.";
    }
    if (destinataireEmail.trim() && !isValidEmail(destinataireEmail)) {
      errors.destinataire_email = "Email non valide.";
    }
    return errors;
  }

  function validateManuel() {
    const errors = { ...validateExpediteurDestinataire() };
    if (!campagneId) errors.campagne = "Sélectionnez une campagne.";
    if (!objetEmail.trim()) errors.objet_email = "L'objet de l'email est requis.";
    if (!corpsEmail.trim()) errors.corps_email = "Le corps de l'email est requis.";
    if (!urlFaussePage.trim()) errors.url_fausse_page = "L'URL de la fausse page est requise.";
    else if (!isValidUrl(urlFaussePage)) errors.url_fausse_page = "URL non valide.";
    return errors;
  }

  function handleInsertImage() {
    const url = window.prompt("URL de l'image à insérer (ex : https://exemple.cm/logo.png)");
    if (!url) return;
    const tag = `<img src="${url}" alt="" style="max-width:100%" />`;
    const textarea = corpsEmailRef.current;
    if (textarea && typeof textarea.selectionStart === "number") {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      setCorpsEmail((prev) => prev.slice(0, start) + tag + prev.slice(end));
    } else {
      setCorpsEmail((prev) => `${prev}\n${tag}`);
    }
  }

  function handleCreerCampagne() {
    navigate("/campagnes");
  }

  async function handleGenerateAPI(event) {
    event.preventDefault();
    const errors = validateExpediteurDestinataire();
    if (!campagneId) errors.campagne = "Sélectionnez une campagne.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast("Veuillez corriger les champs signalés en rouge.", "error");
      scrollToFirstError(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    setResult(null);
    try {
      const scenario = await generateViaAPI({
        campagne: Number(campagneId),
        contexte_additionnel: contexteAdditionnel,
        expediteur_nom: expediteurNom,
        expediteur_email: expediteurEmail,
        destinataire_email: destinataireEmail,
        template: templateId ? Number(templateId) : null,
      });
      setResult(scenario);
      showToast("Scénario généré avec succès.", "success");
    } catch (error) {
      const detail = error.response?.data?.detail;
      showToast(detail || "Impossible de générer le scénario par IA.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveManuel(event) {
    event.preventDefault();
    const errors = validateManuel();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast("Veuillez corriger les champs signalés en rouge.", "error");
      scrollToFirstError(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const scenario = await generateManuel({
        campagne: campagneId,
        objet_email: objetEmail,
        corps_email: corpsEmail,
        url_fausse_page: urlFaussePage,
        secteur_cible: selectedCampagne ? departementLabel(selectedCampagne.departement) : "",
        piece_jointe: pieceJointe,
        expediteur_nom: expediteurNom,
        expediteur_email: expediteurEmail,
        destinataire_email: destinataireEmail,
        est_html: estHtml,
      });
      setResult(scenario);
      showToast("Scénario enregistré avec succès.", "success");
    } catch (error) {
      const data = error.response?.data;
      if (data && typeof data === "object") {
        const serverErrors = {};
        Object.entries(data).forEach(([key, value]) => {
          serverErrors[key] = Array.isArray(value) ? value.join(" ") : String(value);
        });
        setFieldErrors(serverErrors);
        scrollToFirstError(serverErrors);
      }
      const detail = data && typeof data === "object" ? Object.values(data).flat().join(" ") : null;
      showToast(detail || "Impossible d'enregistrer le scénario.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout pageTitle="Générer un scénario">
      <div className="gen-page-header">
        <h2>Générer un scénario de phishing</h2>
        <p>
          {mode === "api"
            ? "L'IA adapte le scénario au département ciblé et à la réalité numérique locale de votre entreprise."
            : "Rédigez le texte du scénario vous-même dans claude.ai (ou tout autre LLM), puis collez-le ci-dessous."}
        </p>
      </div>

      <div className="mode-toggle" role="group" aria-label="Mode de génération">
        <button
          type="button"
          className={`sector-btn${mode === "api" ? " selected" : ""}`}
          onClick={() => switchMode("api")}
        >
          <i className="ti ti-robot" /> Génération par IA
        </button>
        <button
          type="button"
          className={`sector-btn${mode === "manuel" ? " selected" : ""}`}
          onClick={() => switchMode("manuel")}
        >
          <i className="ti ti-edit" /> Saisie manuelle
        </button>
      </div>

      <div className="gen-layout">
        <div className="gen-left">
          <form onSubmit={mode === "api" ? handleGenerateAPI : handleSaveManuel} noValidate>
            <div className="step-card" style={{ marginBottom: 16 }}>
              <div className="step-head">
                <div className="step-num">1</div>
                <div>
                  <div className="step-title">Campagne ciblée</div>
                  <div className="step-sub">Le département provient de la campagne sélectionnée</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Campagne *</label>
                <select
                  ref={campagneRef}
                  className={`form-select${fieldErrors.campagne ? " input-error" : ""}`}
                  value={campagneId}
                  onChange={(e) => {
                    setCampagneId(e.target.value);
                    clearFieldError("campagne");
                  }}
                >
                  {campagnesLoading && <option value="">Chargement…</option>}
                  {!campagnesLoading && campagnes.length === 0 && <option value="">Aucune campagne disponible</option>}
                  {campagnes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.departement_display || departementLabel(c.departement)} — {statutLabel(c.statut)} (#{c.id})
                    </option>
                  ))}
                </select>
                {fieldErrors.campagne && (
                  <div className="form-error-text">
                    <i className="ti ti-alert-circle" /> {fieldErrors.campagne}
                  </div>
                )}
              </div>

              {mode === "api" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Template de départ (optionnel)</label>
                    <select
                      className="form-select"
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      disabled={templatesLoading || templates.length === 0}
                    >
                      <option value="">
                        {templatesLoading
                          ? "Chargement…"
                          : templates.length === 0
                            ? "Aucun template pour ce département — scénario libre"
                            : "Aucun — scénario libre"}
                      </option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nom} ({t.nombre_utilisations}× utilisé)
                        </option>
                      ))}
                    </select>
                    {selectedTemplate && (
                      <div className="form-hint">
                        <i className="ti ti-info-circle" /> L'IA partira de cette structure et l'adaptera, plutôt
                        que d'en inventer une nouvelle.
                      </div>
                    )}
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Contexte additionnel (optionnel)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Ex : Ce département utilise une messagerie Gmail, travaille avec des fournisseurs chinois, reçoit des notifications de la BEAC…"
                      value={contexteAdditionnel}
                      onChange={(e) => setContexteAdditionnel(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="step-card" style={{ marginBottom: 16 }}>
              <div className="step-head">
                <div className="step-num">2</div>
                <div>
                  <div className="step-title">Expéditeur et destinataire</div>
                  <div className="step-sub">
                    Affichés dans l'aperçu de l'email simulé. Le destinataire peut être une
                    adresse de diffusion représentant tout le département déjà ciblé par la
                    campagne.
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nom de l'expéditeur affiché</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ex : Portail MINESUP"
                  value={expediteurNom}
                  onChange={(e) => setExpediteurNom(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email de l'expéditeur affiché</label>
                <input
                  ref={expediteurEmailRef}
                  className={`form-input${fieldErrors.expediteur_email ? " input-error" : ""}`}
                  type="email"
                  placeholder="noreply@minesup-infos.cm"
                  value={expediteurEmail}
                  onChange={(e) => {
                    setExpediteurEmail(e.target.value);
                    clearFieldError("expediteur_email");
                  }}
                />
                {fieldErrors.expediteur_email && (
                  <div className="form-error-text">
                    <i className="ti ti-alert-circle" /> {fieldErrors.expediteur_email}
                  </div>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email du destinataire</label>
                <input
                  ref={destinataireEmailRef}
                  className={`form-input${fieldErrors.destinataire_email ? " input-error" : ""}`}
                  type="email"
                  placeholder="departement@votre-entreprise.cm"
                  value={destinataireEmail}
                  onChange={(e) => {
                    setDestinataireEmail(e.target.value);
                    clearFieldError("destinataire_email");
                  }}
                />
                {fieldErrors.destinataire_email && (
                  <div className="form-error-text">
                    <i className="ti ti-alert-circle" /> {fieldErrors.destinataire_email}
                  </div>
                )}
              </div>
            </div>

            {mode === "manuel" && (
              <div className="step-card" style={{ marginBottom: 16 }}>
                <div className="step-head">
                  <div className="step-num">3</div>
                  <div>
                    <div className="step-title">Contenu du scénario</div>
                    <div className="step-sub">Collez ici le texte déjà rédigé via claude.ai</div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Objet de l'email *</label>
                  <input
                    ref={objetEmailRef}
                    className={`form-input${fieldErrors.objet_email ? " input-error" : ""}`}
                    type="text"
                    placeholder="Ex : Suspension de compte urgente — Mise en conformité BEAC"
                    value={objetEmail}
                    onChange={(e) => {
                      setObjetEmail(e.target.value);
                      clearFieldError("objet_email");
                    }}
                  />
                  {fieldErrors.objet_email && (
                    <div className="form-error-text">
                      <i className="ti ti-alert-circle" /> {fieldErrors.objet_email}
                    </div>
                  )}
                </div>

                <div className="content-mode-toggle" role="group" aria-label="Format du corps de l'email">
                  <button
                    type="button"
                    className={`mini-toggle-btn${!estHtml ? " selected" : ""}`}
                    onClick={() => setEstHtml(false)}
                  >
                    <i className="ti ti-file-text" /> Texte
                  </button>
                  <button
                    type="button"
                    className={`mini-toggle-btn${estHtml ? " selected" : ""}`}
                    onClick={() => setEstHtml(true)}
                  >
                    <i className="ti ti-code" /> HTML
                  </button>
                  {estHtml && (
                    <button type="button" className="mini-toggle-btn" onClick={handleInsertImage}>
                      <i className="ti ti-photo" /> Insérer une image
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Corps de l'email * {estHtml && "(HTML)"}</label>
                  <textarea
                    ref={corpsEmailRef}
                    className={`form-textarea${fieldErrors.corps_email ? " input-error" : ""}`}
                    style={{ minHeight: 140, fontFamily: estHtml ? "monospace" : "inherit" }}
                    placeholder={
                      estHtml
                        ? "<p>Collez ou rédigez ici le HTML de l'email…</p>"
                        : "Collez ici le texte généré par claude.ai…"
                    }
                    value={corpsEmail}
                    onChange={(e) => {
                      setCorpsEmail(e.target.value);
                      clearFieldError("corps_email");
                    }}
                  />
                  {fieldErrors.corps_email && (
                    <div className="form-error-text">
                      <i className="ti ti-alert-circle" /> {fieldErrors.corps_email}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">URL de la fausse page *</label>
                  <input
                    ref={urlFaussePageRef}
                    className={`form-input${fieldErrors.url_fausse_page ? " input-error" : ""}`}
                    type="url"
                    placeholder="https://portail-verif.hshield237.local/"
                    value={urlFaussePage}
                    onChange={(e) => {
                      setUrlFaussePage(e.target.value);
                      clearFieldError("url_fausse_page");
                    }}
                  />
                  {fieldErrors.url_fausse_page && (
                    <div className="form-error-text">
                      <i className="ti ti-alert-circle" /> {fieldErrors.url_fausse_page}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pièce jointe (optionnel)</label>
                  <input
                    className="form-input"
                    type="file"
                    onChange={(e) => setPieceJointe(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn-gen" disabled={loading || campagnesLoading}>
              <i className={`ti ${loading ? "ti-loader-2" : mode === "api" ? "ti-sparkles" : "ti-device-floppy"}`} />
              {loading
                ? "Génération en cours…"
                : mode === "api"
                  ? "Générer le scénario par IA"
                  : "Enregistrer le scénario"}
            </button>
          </form>
        </div>

        <div className="gen-right">
          <div className="preview-card" ref={previewHeaderRef}>
            {!result && !loading && (
              <div className="preview-placeholder">
                <div className="placeholder-icon">
                  <i className="ti ti-mail-forward" />
                </div>
                <div className="placeholder-title">Aperçu du scénario</div>
                <div className="placeholder-sub">
                  {mode === "api"
                    ? 'Configurez le contexte à gauche puis cliquez sur "Générer le scénario par IA" pour voir l\'aperçu ici.'
                    : "Remplissez le formulaire à gauche puis enregistrez pour voir l'aperçu ici."}
                </div>
              </div>
            )}

            {loading && (
              <div className="loading-state active">
                <div className="spinner" />
                <div className="loading-text">
                  <strong>
                    {mode === "api" ? "L'IA génère votre scénario…" : "Enregistrement du scénario…"}
                  </strong>
                  {mode === "api" && "Construction du prompt contextuel · Appel au service Claude"}
                </div>
              </div>
            )}

            {result && !loading && (
              <div>
                <div className="preview-header">
                  <div className="preview-header-left">
                    <i className="ti ti-mail" />
                    <div>
                      <div className="preview-title">Aperçu de l'email simulé</div>
                      <div className="preview-sub">{result.secteur_cible}</div>
                    </div>
                  </div>
                  <span className="preview-badge">{mode === "api" ? "Scénario IA" : "Saisie manuelle"}</span>
                </div>

                <div className="preview-body">
                  <div className="email-meta">
                    <div className="email-meta-row">
                      <span className="em-key">De :</span>
                      <span className="em-val">
                        {result.expediteur_nom || result.expediteur_email
                          ? `${result.expediteur_nom ? `${result.expediteur_nom} ` : ""}${
                              result.expediteur_email ? `<${result.expediteur_email}>` : ""
                            }`
                          : "—"}
                      </span>
                    </div>
                    <div className="email-meta-row">
                      <span className="em-key">À :</span>
                      <span className="em-val">{result.destinataire_email || "—"}</span>
                    </div>
                    <div className="email-meta-row">
                      <span className="em-key">Objet :</span>
                      <span className="em-val">{result.objet_email}</span>
                    </div>
                    {result.piece_jointe && (
                      <div className="email-meta-row">
                        <span className="em-key">Pièce jointe :</span>
                        <span className="em-val">{result.piece_jointe.split("/").pop()}</span>
                      </div>
                    )}
                  </div>

                  {result.est_html && (
                    <div className="preview-tabs" role="group" aria-label="Affichage du contenu HTML">
                      <button
                        type="button"
                        className={`mini-toggle-btn${previewTab === "rendu" ? " selected" : ""}`}
                        onClick={() => setPreviewTab("rendu")}
                      >
                        <i className="ti ti-eye" /> Aperçu
                      </button>
                      <button
                        type="button"
                        className={`mini-toggle-btn${previewTab === "code" ? " selected" : ""}`}
                        onClick={() => setPreviewTab("code")}
                      >
                        <i className="ti ti-code" /> Code HTML
                      </button>
                    </div>
                  )}

                  {result.est_html && previewTab === "rendu" && (
                    <div className="email-content" dangerouslySetInnerHTML={{ __html: result.corps_email }} />
                  )}
                  {result.est_html && previewTab === "code" && (
                    <pre className="email-code-block">{result.corps_email}</pre>
                  )}
                  {!result.est_html && <div className="email-content">{result.corps_email}</div>}

                  {result.url_fausse_page && (
                    <a
                      href={result.url_fausse_page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="email-cta"
                    >
                      <i className="ti ti-external-link" /> Accéder à la page →
                    </a>
                  )}

                  <div className="sim-warning">
                    <i className="ti ti-shield-exclamation" />
                    <span>
                      Simulation éducative H-SHIELD237 — scénario enregistré (id #{result.id}) sur la campagne
                      sélectionnée. Aucune donnée réelle n'est collectée.
                    </span>
                  </div>
                </div>

                <div className="preview-actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      navigator.clipboard?.writeText(result.corps_email);
                      showToast("Corps de l'email copié dans le presse-papier.", "success");
                    }}
                  >
                    <i className="ti ti-copy" /> Copier
                  </button>
                  {mode === "api" && (
                    <button type="button" className="btn" onClick={handleGenerateAPI} disabled={loading}>
                      <i className="ti ti-refresh" /> Régénérer
                    </button>
                  )}
                  <button type="button" className="btn btn-primary" onClick={handleCreerCampagne}>
                    <i className="ti ti-send" /> Créer une campagne
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
