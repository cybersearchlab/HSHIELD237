import { useEffect, useRef, useState } from "react";

import { createResponsable, deleteResponsable, listResponsables, updateResponsable } from "../../api/responsables";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { DEPARTEMENT_ICONS, DEPARTEMENT_LABELS } from "../../utils/departements";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value) {
  return EMAIL_RE.test(value.trim());
}

const TOAST_ICONS = { success: "ti-check", info: "ti-info-circle", error: "ti-alert-circle" };
const TOAST_COLORS = { success: "#4ADE80", info: "#60A5FA", error: "#F87171" };

export default function ResponsablesPage() {
  const { user } = useAuth();
  const estAdministrateur = user?.role === "administrateur";

  const [responsables, setResponsables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalDepartement, setModalDepartement] = useState(null);
  const [formNom, setFormNom] = useState("");
  const [formEmail, setFormEmail] = useState("");
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
    listResponsables()
      .then(setResponsables)
      .catch((err) => {
        setError(
          err.response?.status === 403
            ? "Accès réservé à l'administrateur."
            : "Impossible de charger le registre des responsables."
        );
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (estAdministrateur) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estAdministrateur]);

  const parDepartement = Object.fromEntries(responsables.map((r) => [r.departement, r]));

  function openModal(departement, existing) {
    setModalDepartement(departement);
    setFormNom(existing?.nom || "");
    setFormEmail(existing?.email || "");
    setFormError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setFormError("");
    if (!formNom.trim()) {
      setFormError("Le nom du responsable est requis.");
      return;
    }
    if (!isValidEmail(formEmail)) {
      setFormError("Email non valide.");
      return;
    }
    setSaving(true);
    const existing = parDepartement[modalDepartement];
    try {
      if (existing) {
        await updateResponsable(existing.id, { nom: formNom, email: formEmail });
        showToast(`Responsable mis à jour pour ${DEPARTEMENT_LABELS[modalDepartement]}.`, "success");
      } else {
        await createResponsable({ departement: modalDepartement, nom: formNom, email: formEmail });
        showToast(`Responsable configuré pour ${DEPARTEMENT_LABELS[modalDepartement]}.`, "success");
      }
      setModalDepartement(null);
      load();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Impossible d'enregistrer ce responsable.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(existing) {
    if (
      !window.confirm(
        `Retirer ${existing.nom} comme responsable de ${DEPARTEMENT_LABELS[existing.departement]} ? Les nouvelles campagnes de ce département n'auront plus de demande de consentement générée automatiquement.`
      )
    ) {
      return;
    }
    try {
      await deleteResponsable(existing.id);
      showToast("Responsable retiré.", "success");
      load();
    } catch {
      showToast("Impossible de retirer ce responsable.", "error");
    }
  }

  if (!estAdministrateur) {
    return (
      <Layout pageTitle="Responsables" pageSubtitle="Configuration des responsables par département">
        <p style={{ color: "var(--red)", padding: "40px 0", textAlign: "center" }}>
          Accès réservé à l'administrateur.
        </p>
      </Layout>
    );
  }

  return (
    <Layout
      pageTitle="Responsables"
      pageSubtitle={
        loading ? undefined : `${responsables.length} / 10 départements avec un responsable configuré`
      }
    >
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
          Le nom et l'email renseignés ici alimentent automatiquement la demande de consentement de toute
          nouvelle campagne créée pour ce département — la personne qui crée la campagne ne saisit plus
          elle-même le responsable habilité à la valider, par souci de sécurité.
        </span>
      </div>

      {loading && <p style={{ color: "var(--text3)", padding: "40px 0", textAlign: "center" }}>Chargement…</p>}
      {!loading && error && <p style={{ color: "var(--red)", padding: "40px 0", textAlign: "center" }}>{error}</p>}

      {!loading && !error && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap">
            <table aria-label="Registre des responsables par département">
              <thead>
                <tr>
                  <th>Département</th>
                  <th>Responsable</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(DEPARTEMENT_LABELS).map(([dept, label]) => {
                  const existing = parDepartement[dept];
                  return (
                    <tr key={dept}>
                      <td className="td-name">
                        <i
                          className={`ti ${DEPARTEMENT_ICONS[dept] || "ti-building"}`}
                          style={{ color: "var(--text3)", marginRight: 6 }}
                        />
                        {label}
                      </td>
                      <td>
                        {existing ? existing.nom : <span className="badge badge-neutral">Non configuré</span>}
                      </td>
                      <td style={{ color: "var(--text3)" }}>{existing?.email || "—"}</td>
                      <td>
                        <div className="actions-cell">
                          <div className="action-btn" title="Configurer" onClick={() => openModal(dept, existing)}>
                            <i className={`ti ${existing ? "ti-pencil" : "ti-plus"}`} style={{ fontSize: 15 }} />
                          </div>
                          {existing && (
                            <div className="action-btn danger" title="Retirer" onClick={() => handleDelete(existing)}>
                              <i className="ti ti-trash" style={{ fontSize: 15 }} />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalDepartement && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setModalDepartement(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Responsable — {DEPARTEMENT_LABELS[modalDepartement]}</h3>
              <div className="close-btn" role="button" tabIndex={0} onClick={() => setModalDepartement(null)}>
                <i className="ti ti-x" />
              </div>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nom du responsable *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Ex : M. Jean-Pierre MBARGA, Directeur Général"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email du responsable *</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="responsable@entreprise.cm"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                  <div className="form-hint">
                    Le responsable devra se connecter avec un compte dont l'email correspond exactement à
                    celui-ci pour pouvoir valider ou refuser une demande.
                  </div>
                </div>
                {formError && (
                  <div className="form-error-text">
                    <i className="ti ti-alert-circle" /> {formError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalDepartement(null)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
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
