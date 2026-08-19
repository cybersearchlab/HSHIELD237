import { useEffect, useRef, useState } from "react";

import { listCampagnes } from "../../api/campagnes";
import { generateManuel, generateViaAPI } from "../../api/generation";
import Layout from "../../components/Layout";
import { departementLabel } from "../../utils/departements";
import { statutLabel } from "../../utils/statuts";

const TOAST_ICONS = { success: "ti-check", info: "ti-info-circle", error: "ti-alert-circle" };
const TOAST_COLORS = { success: "#4ADE80", info: "#60A5FA", error: "#F87171" };

export default function GenererScenarioPage() {
  const [mode, setMode] = useState("api"); // "api" | "manuel"

  const [campagnes, setCampagnes] = useState([]);
  const [campagnesLoading, setCampagnesLoading] = useState(true);
  const [campagneId, setCampagneId] = useState("");

  // Mode API
  const [contexteAdditionnel, setContexteAdditionnel] = useState("");

  // Mode manuel — le consultant colle ici le texte déjà rédigé via claude.ai
  // (ou tout autre LLM) dans l'interface web, sans passer par l'API.
  const [objetEmail, setObjetEmail] = useState("");
  const [corpsEmail, setCorpsEmail] = useState("");
  const [urlFaussePage, setUrlFaussePage] = useState("");
  const [pieceJointe, setPieceJointe] = useState(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

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

  function switchMode(nextMode) {
    setMode(nextMode);
    setResult(null);
  }

  async function handleGenerateAPI(event) {
    event.preventDefault();
    if (!campagneId) {
      showToast("Sélectionnez une campagne.", "error");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const scenario = await generateViaAPI({
        campagne: Number(campagneId),
        contexte_additionnel: contexteAdditionnel,
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
    if (!campagneId) {
      showToast("Sélectionnez une campagne.", "error");
      return;
    }
    if (!objetEmail || !corpsEmail || !urlFaussePage) {
      showToast("Veuillez remplir l'objet, le corps et l'URL de la fausse page.", "error");
      return;
    }
    setLoading(true);
    try {
      const scenario = await generateManuel({
        campagne: campagneId,
        objet_email: objetEmail,
        corps_email: corpsEmail,
        url_fausse_page: urlFaussePage,
        secteur_cible: selectedCampagne ? departementLabel(selectedCampagne.departement) : "",
        piece_jointe: pieceJointe,
      });
      setResult(scenario);
      showToast("Scénario enregistré avec succès.", "success");
    } catch {
      showToast("Impossible d'enregistrer le scénario.", "error");
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
            ? "L'IA adapte le scénario au département ciblé et à la réalité numérique locale — BEAC, MTN MoMo, MINESUP, ARMP, fournisseurs internationaux…"
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
          <form onSubmit={mode === "api" ? handleGenerateAPI : handleSaveManuel}>
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
                <select className="form-select" value={campagneId} onChange={(e) => setCampagneId(e.target.value)}>
                  {campagnesLoading && <option value="">Chargement…</option>}
                  {!campagnesLoading && campagnes.length === 0 && <option value="">Aucune campagne disponible</option>}
                  {campagnes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.departement_display || departementLabel(c.departement)} — {statutLabel(c.statut)} (#{c.id})
                    </option>
                  ))}
                </select>
              </div>

              {mode === "api" && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contexte additionnel (optionnel)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Ex : Ce département utilise une messagerie Gmail, travaille avec des fournisseurs chinois, reçoit des notifications de la BEAC…"
                    value={contexteAdditionnel}
                    onChange={(e) => setContexteAdditionnel(e.target.value)}
                  />
                </div>
              )}
            </div>

            {mode === "manuel" && (
              <div className="step-card" style={{ marginBottom: 16 }}>
                <div className="step-head">
                  <div className="step-num">2</div>
                  <div>
                    <div className="step-title">Contenu du scénario</div>
                    <div className="step-sub">Collez ici le texte déjà rédigé via claude.ai</div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Objet de l'email *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Ex : Suspension de compte urgente — Mise en conformité BEAC"
                    value={objetEmail}
                    onChange={(e) => setObjetEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Corps de l'email *</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 140 }}
                    placeholder="Collez ici le texte généré par claude.ai…"
                    value={corpsEmail}
                    onChange={(e) => setCorpsEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">URL de la fausse page *</label>
                  <input
                    className="form-input"
                    type="url"
                    placeholder="https://portail-verif.hshield237.local/"
                    value={urlFaussePage}
                    onChange={(e) => setUrlFaussePage(e.target.value)}
                  />
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
          <div className="preview-card">
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
                      <span className="em-key">Objet :</span>
                      <span className="em-val">{result.objet_email}</span>
                    </div>
                    <div className="email-meta-row">
                      <span className="em-key">Page :</span>
                      <span className="em-val">{result.url_fausse_page}</span>
                    </div>
                    {result.piece_jointe && (
                      <div className="email-meta-row">
                        <span className="em-key">Pièce jointe :</span>
                        <span className="em-val">{result.piece_jointe.split("/").pop()}</span>
                      </div>
                    )}
                  </div>
                  <div className="email-subject-line">{result.objet_email}</div>
                  <div className="email-content">{result.corps_email}</div>
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
