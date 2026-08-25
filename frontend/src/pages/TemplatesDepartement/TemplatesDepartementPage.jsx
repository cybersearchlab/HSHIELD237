import { useEffect, useMemo, useRef, useState } from "react";

import { createTemplate, deleteTemplate, listTemplates, updateTemplate } from "../../api/templatesDepartement";
import Layout from "../../components/Layout";
import { DEPARTEMENT_ICONS, DEPARTEMENT_LABELS } from "../../utils/departements";

const TOAST_ICONS = { success: "ti-check", info: "ti-info-circle", error: "ti-alert-circle" };
const TOAST_COLORS = { success: "#4ADE80", info: "#60A5FA", error: "#F87171" };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function TemplatesDepartementPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [departementFilter, setDepartementFilter] = useState("all");

  const [modalTemplate, setModalTemplate] = useState(undefined); // undefined = fermée, null = création, objet = édition
  const [formNom, setFormNom] = useState("");
  const [formDepartement, setFormDepartement] = useState("direction");
  const [formPrompt, setFormPrompt] = useState("");
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

  function load() {
    setLoading(true);
    setError(null);
    listTemplates()
      .then(setTemplates)
      .catch((err) => {
        setError(
          err.response?.status === 403
            ? "Accès réservé aux rôles consultant et administrateur."
            : "Impossible de charger les templates."
        );
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const countsByDept = useMemo(() => {
    const counts = {};
    templates.forEach((t) => {
      counts[t.departement] = (counts[t.departement] || 0) + 1;
    });
    return counts;
  }, [templates]);

  const visibleTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesDept = departementFilter === "all" || t.departement === departementFilter;
      const matchesSearch = !q || t.nom.toLowerCase().includes(q) || t.prompt_structure.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [templates, search, departementFilter]);

  const plusUtilise = useMemo(() => {
    const utilises = templates.filter((t) => t.nombre_utilisations > 0);
    if (utilises.length === 0) return null;
    return utilises.reduce((max, t) => (t.nombre_utilisations > max.nombre_utilisations ? t : max), utilises[0]);
  }, [templates]);

  const departementsCouverts = Object.keys(countsByDept).length;

  function openCreateModal() {
    setModalTemplate(null);
    setFormNom("");
    setFormDepartement("direction");
    setFormPrompt("");
    setFormError("");
  }

  function openEditModal(t) {
    setModalTemplate(t);
    setFormNom(t.nom);
    setFormDepartement(t.departement);
    setFormPrompt(t.prompt_structure);
    setFormError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setFormError("");
    if (!formNom.trim()) {
      setFormError("Le nom du template est requis.");
      return;
    }
    if (!formPrompt.trim()) {
      setFormError("La structure du prompt est requise.");
      return;
    }
    setSaving(true);
    try {
      if (modalTemplate) {
        await updateTemplate(modalTemplate.id, {
          nom: formNom,
          departement: formDepartement,
          prompt_structure: formPrompt,
        });
        showToast(`Template « ${formNom} » mis à jour.`, "success");
      } else {
        await createTemplate({ nom: formNom, departement: formDepartement, prompt_structure: formPrompt });
        showToast(`Template « ${formNom} » créé.`, "success");
      }
      setModalTemplate(undefined);
      load();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Impossible d'enregistrer ce template.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t) {
    if (!window.confirm(`Supprimer le template « ${t.nom} » ? Cette action est irréversible.`)) return;
    try {
      await deleteTemplate(t.id);
      showToast("Template supprimé.", "success");
      load();
    } catch {
      showToast("Impossible de supprimer ce template.", "error");
    }
  }

  return (
    <Layout
      pageTitle="Templates par département"
      pageSubtitle={loading ? undefined : `${templates.length} template${templates.length > 1 ? "s" : ""} · ${departementsCouverts} / 10 départements couverts`}
    >
      {loading && <p style={{ color: "var(--text3)", padding: "40px 0", textAlign: "center" }}>Chargement…</p>}
      {!loading && error && <p style={{ color: "var(--red)", padding: "40px 0", textAlign: "center" }}>{error}</p>}

      {!loading && !error && (
        <>
          <div className="metrics">
            <div className="metric m-navy">
              <div className="metric-label">
                <i className="ti ti-template" /> Templates
              </div>
              <div className="metric-value">{templates.length}</div>
              <div className="metric-sub">réutilisables lors d'une génération par IA</div>
            </div>
            <div className="metric m-navy">
              <div className="metric-label">
                <i className="ti ti-building" /> Départements couverts
              </div>
              <div className="metric-value">{departementsCouverts} / 10</div>
            </div>
            <div className="metric m-red">
              <div className="metric-label">
                <i className="ti ti-flame" /> Plus utilisé
              </div>
              <div className="metric-value" style={{ fontSize: 16, color: "var(--red)" }}>
                {plusUtilise ? plusUtilise.nom : "Aucun encore"}
              </div>
              <div className="metric-sub">
                {plusUtilise
                  ? `${plusUtilise.nombre_utilisations} génération${plusUtilise.nombre_utilisations > 1 ? "s" : ""}`
                  : "Utilisez-en un pour voir apparaître ce classement"}
              </div>
            </div>
          </div>

          <div className="camp-toolbar">
            <div className="search-wrap">
              <i className="ti ti-search" />
              <input
                type="text"
                placeholder="Rechercher un template…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <i className="ti ti-plus" /> Nouveau template
            </button>
          </div>

          <div className="tpl-layout">
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 13 }}>
                Départements
              </div>
              <div
                className={`dept-nav-item${departementFilter === "all" ? " selected" : ""}`}
                onClick={() => setDepartementFilter("all")}
              >
                <div className="dept-icon" style={{ background: "var(--blue-light)" }}>
                  <i className="ti ti-layout-grid" style={{ color: "var(--blue)" }} />
                </div>
                <div className="dept-name">Tous</div>
                <span className="badge badge-neutral">{templates.length}</span>
              </div>
              {Object.entries(DEPARTEMENT_LABELS).map(([dept, label]) => (
                <div
                  key={dept}
                  className={`dept-nav-item${departementFilter === dept ? " selected" : ""}`}
                  onClick={() => setDepartementFilter(dept)}
                >
                  <div className="dept-icon" style={{ background: "var(--surface2)" }}>
                    <i className={`ti ${DEPARTEMENT_ICONS[dept] || "ti-building"}`} style={{ color: "var(--text3)" }} />
                  </div>
                  <div className="dept-name">{label}</div>
                  <span className="badge badge-neutral">{countsByDept[dept] || 0}</span>
                </div>
              ))}
            </div>

            <div>
              {visibleTemplates.length === 0 ? (
                <div className="card" style={{ textAlign: "center", color: "var(--text3)", padding: 40 }}>
                  Aucun template trouvé.
                </div>
              ) : (
                <div className="tpl-grid">
                  {visibleTemplates.map((t) => (
                    <div className="tpl-card" key={t.id}>
                      <div className="tpl-card-header">
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0 }}>
                          <div className="dept-icon" style={{ background: "var(--blue-light)", flexShrink: 0 }}>
                            <i
                              className={`ti ${DEPARTEMENT_ICONS[t.departement] || "ti-building"}`}
                              style={{ color: "var(--blue)" }}
                            />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="tpl-card-title">{t.nom}</div>
                            <div style={{ fontSize: 11.5, color: "var(--text3)" }}>{t.departement_display}</div>
                          </div>
                        </div>
                      </div>
                      <div className="tpl-card-body">{t.prompt_structure}</div>
                      <div className="tpl-card-footer">
                        <div style={{ display: "flex", gap: 12 }}>
                          <span style={{ fontSize: 11, color: "var(--text3)" }}>
                            <i className="ti ti-send" style={{ fontSize: 13, verticalAlign: -2 }} />{" "}
                            <strong style={{ color: "var(--text2)" }}>{t.nombre_utilisations}×</strong> utilisé
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text3)" }}>
                            <i className="ti ti-calendar" style={{ fontSize: 13, verticalAlign: -2 }} />{" "}
                            {formatDate(t.date_creation)}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <div className="action-btn" title="Modifier" onClick={() => openEditModal(t)}>
                            <i className="ti ti-pencil" style={{ fontSize: 15 }} />
                          </div>
                          <div className="action-btn danger" title="Supprimer" onClick={() => handleDelete(t)}>
                            <i className="ti ti-trash" style={{ fontSize: 15 }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {modalTemplate !== undefined && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setModalTemplate(undefined)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modalTemplate ? "Modifier le template" : "Nouveau template"}</h3>
              <div className="close-btn" role="button" tabIndex={0} onClick={() => setModalTemplate(undefined)}>
                <i className="ti ti-x" />
              </div>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nom du template *</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Ex : Facture fournisseur en retard"
                      value={formNom}
                      onChange={(e) => setFormNom(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Département *</label>
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
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Structure du prompt *</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 160 }}
                    placeholder="Décrivez la structure du scénario que l'IA devra adapter (prétexte, ton, éléments à inclure)…"
                    value={formPrompt}
                    onChange={(e) => setFormPrompt(e.target.value)}
                  />
                  <div className="form-hint">
                    <i className="ti ti-info-circle" /> Cette structure sera fournie à l'IA comme base à adapter au
                    moment de la génération — pas un email déjà rédigé, un guide de contenu.
                  </div>
                </div>
                {formError && (
                  <div className="form-error-text">
                    <i className="ti ti-alert-circle" /> {formError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalTemplate(undefined)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Enregistrement…" : modalTemplate ? "Enregistrer" : "Créer le template"}
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
