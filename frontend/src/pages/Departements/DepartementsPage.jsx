import { useEffect, useRef, useState } from "react";

import { createDepartement, deleteDepartement, updateDepartement } from "../../api/departements";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { useDepartements } from "../../context/DepartementsContext";
import { DEPARTEMENT_ICONS } from "../../utils/departements";

const TOAST_ICONS = { success: "ti-check", info: "ti-info-circle", error: "ti-alert-circle" };
const TOAST_COLORS = { success: "#4ADE80", info: "#60A5FA", error: "#F87171" };

export default function DepartementsPage() {
  const { user } = useAuth();
  const estAdministrateur = user?.role === "administrateur";
  const { departements, loading, refresh } = useDepartements();

  const [modalCible, setModalCible] = useState(null); // { id, nom } pour éditer, {} pour créer, null = fermé
  const [formNom, setFormNom] = useState("");
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

  function openCreateModal() {
    setModalCible({});
    setFormNom("");
    setFormError("");
  }

  function openEditModal(dept) {
    setModalCible(dept);
    setFormNom(dept.nom);
    setFormError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setFormError("");
    if (!formNom.trim()) {
      setFormError("Le nom du département est requis.");
      return;
    }
    setSaving(true);
    try {
      if (modalCible?.id) {
        await updateDepartement(modalCible.id, { nom: formNom.trim() });
        showToast(`Département renommé en « ${formNom.trim()} ».`, "success");
      } else {
        await createDepartement({ nom: formNom.trim() });
        showToast(`Département « ${formNom.trim()} » ajouté.`, "success");
      }
      setModalCible(null);
      refresh();
    } catch (err) {
      setFormError(
        err.response?.data?.nom?.[0] || err.response?.data?.detail || "Impossible d'enregistrer ce département."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(dept) {
    if (
      !window.confirm(
        `Supprimer le département « ${dept.nom} » ? Cette action est bloquée si des campagnes, destinataires, responsables, templates ou employés y font encore référence.`
      )
    ) {
      return;
    }
    try {
      await deleteDepartement(dept.id);
      showToast("Département supprimé.", "success");
      refresh();
    } catch (err) {
      showToast(
        err.response?.data?.detail || "Impossible de supprimer ce département.",
        "error"
      );
    }
  }

  if (!estAdministrateur) {
    return (
      <Layout pageTitle="Départements" pageSubtitle="Configuration des départements de l'entreprise">
        <p style={{ color: "var(--red)", padding: "40px 0", textAlign: "center" }}>
          Accès réservé à l'administrateur.
        </p>
      </Layout>
    );
  }

  return (
    <Layout
      pageTitle="Départements"
      pageSubtitle={
        loading
          ? undefined
          : `${departements.length} département${departements.length > 1 ? "s" : ""} configuré${departements.length > 1 ? "s" : ""}`
      }
      actions={
        <button className="btn btn-primary" onClick={openCreateModal}>
          <i className="ti ti-plus" /> Ajouter un département
        </button>
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
          Toutes les entreprises n'ont pas les mêmes départements — configurez ici la liste réelle de
          l'entreprise cliente. Un changement de nom se répercute immédiatement partout dans l'application
          (campagnes, résultats, historique…). La suppression d'un département déjà utilisé est bloquée
          pour éviter de laisser des données orphelines.
        </span>
      </div>

      {loading && <p style={{ color: "var(--text3)", padding: "40px 0", textAlign: "center" }}>Chargement…</p>}

      {!loading && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap">
            <table aria-label="Départements de l'entreprise">
              <thead>
                <tr>
                  <th>Département</th>
                  <th>Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departements.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "var(--text3)", padding: 24 }}>
                      Aucun département configuré.
                    </td>
                  </tr>
                )}
                {departements.map((dept) => (
                  <tr key={dept.id}>
                    <td className="td-name">
                      <i
                        className={`ti ${DEPARTEMENT_ICONS[dept.code] || "ti-building"}`}
                        style={{ color: "var(--text3)", marginRight: 6 }}
                      />
                      {dept.nom}
                    </td>
                    <td style={{ color: "var(--text3)" }}>{dept.code}</td>
                    <td>
                      <div className="actions-cell">
                        <div className="action-btn" title="Renommer" onClick={() => openEditModal(dept)}>
                          <i className="ti ti-pencil" style={{ fontSize: 15 }} />
                        </div>
                        <div className="action-btn danger" title="Supprimer" onClick={() => handleDelete(dept)}>
                          <i className="ti ti-trash" style={{ fontSize: 15 }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalCible && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setModalCible(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modalCible.id ? `Renommer — ${modalCible.nom}` : "Ajouter un département"}</h3>
              <div className="close-btn" role="button" tabIndex={0} onClick={() => setModalCible(null)}>
                <i className="ti ti-x" />
              </div>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nom du département *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Ex : Support technique"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    autoFocus
                  />
                  {!modalCible.id && (
                    <div className="form-hint">
                      Un identifiant technique stable est généré automatiquement à partir du nom.
                    </div>
                  )}
                </div>
                {formError && (
                  <div className="form-error-text">
                    <i className="ti ti-alert-circle" /> {formError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalCible(null)}>
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
