import { useEffect, useMemo, useRef, useState } from "react";

import { createEmploye, deleteEmploye, listEmployes, updateEmploye } from "../../api/employes";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { useDepartements } from "../../context/DepartementsContext";
import { DEPARTEMENT_ICONS } from "../../utils/departements";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value) {
  return EMAIL_RE.test(value.trim());
}

const TOAST_ICONS = { success: "ti-check", info: "ti-info-circle", error: "ti-alert-circle" };
const TOAST_COLORS = { success: "#4ADE80", info: "#60A5FA", error: "#F87171" };

export default function EmployesPage() {
  const { user } = useAuth();
  const estAdministrateur = user?.role === "administrateur";
  const { departements } = useDepartements();

  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [departementFilter, setDepartementFilter] = useState("all");

  const [modalEmploye, setModalEmploye] = useState(undefined); // undefined = fermée, null = création, objet = édition
  const [formNom, setFormNom] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDepartement, setFormDepartement] = useState("");
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
    listEmployes()
      .then(setEmployes)
      .catch((err) => {
        setError(
          err.response?.status === 403
            ? "Accès réservé aux rôles consultant et administrateur."
            : "Impossible de charger l'annuaire des employés."
        );
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (estAdministrateur) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estAdministrateur]);

  const countsByDept = useMemo(() => {
    const counts = {};
    employes.forEach((e) => {
      counts[e.departement] = (counts[e.departement] || 0) + 1;
    });
    return counts;
  }, [employes]);

  const visibleEmployes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employes.filter((e) => {
      const matchesDept = departementFilter === "all" || e.departement === departementFilter;
      const matchesSearch = !q || e.nom.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [employes, search, departementFilter]);

  function openCreateModal() {
    setModalEmploye(null);
    setFormNom("");
    setFormEmail("");
    setFormDepartement(departementFilter !== "all" ? departementFilter : departements[0]?.code || "");
    setFormError("");
  }

  function openEditModal(e) {
    setModalEmploye(e);
    setFormNom(e.nom);
    setFormEmail(e.email);
    setFormDepartement(e.departement);
    setFormError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setFormError("");
    if (!formNom.trim()) {
      setFormError("Le nom de l'employé est requis.");
      return;
    }
    if (!isValidEmail(formEmail)) {
      setFormError("Email non valide.");
      return;
    }
    setSaving(true);
    try {
      if (modalEmploye) {
        await updateEmploye(modalEmploye.id, { nom: formNom, email: formEmail, departement: formDepartement });
        showToast(`Employé « ${formNom} » mis à jour.`, "success");
      } else {
        await createEmploye({ nom: formNom, email: formEmail, departement: formDepartement });
        showToast(`Employé « ${formNom} » ajouté.`, "success");
      }
      setModalEmploye(undefined);
      load();
    } catch (err) {
      setFormError(
        err.response?.data?.email?.[0] || err.response?.data?.detail || "Impossible d'enregistrer cet employé."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e) {
    if (!window.confirm(`Retirer ${e.nom} (${e.email}) de l'annuaire ?`)) return;
    try {
      await deleteEmploye(e.id);
      showToast("Employé retiré.", "success");
      load();
    } catch {
      showToast("Impossible de retirer cet employé.", "error");
    }
  }

  if (!estAdministrateur) {
    return (
      <Layout pageTitle="Employés" pageSubtitle="Annuaire des employés par département">
        <p style={{ color: "var(--red)", padding: "40px 0", textAlign: "center" }}>
          Accès réservé à l'administrateur.
        </p>
      </Layout>
    );
  }

  return (
    <Layout
      pageTitle="Employés"
      pageSubtitle={loading ? undefined : `${employes.length} employé${employes.length > 1 ? "s" : ""} enregistré${employes.length > 1 ? "s" : ""}`}
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
          Cet annuaire remplace l'adresse de diffusion pour l'envoi d'une campagne : au lancement, le
          consultant peut choisir d'envoyer à tous les employés du département de la campagne, ou à un seul
          en particulier — chacun reçoit un email individuel, jamais une adresse visible par les autres
          destinataires.
        </span>
      </div>

      {loading && <p style={{ color: "var(--text3)", padding: "40px 0", textAlign: "center" }}>Chargement…</p>}
      {!loading && error && <p style={{ color: "var(--red)", padding: "40px 0", textAlign: "center" }}>{error}</p>}

      {!loading && !error && (
        <>
          <div className="camp-toolbar">
            <div className="search-wrap">
              <i className="ti ti-search" />
              <input
                type="text"
                placeholder="Rechercher un employé…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <i className="ti ti-plus" /> Nouvel employé
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
                <span className="badge badge-neutral">{employes.length}</span>
              </div>
              {departements.map(({ code: dept, nom: label }) => (
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

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div className="table-wrap">
                <table aria-label="Annuaire des employés">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Département</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEmployes.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", color: "var(--text3)", padding: 24 }}>
                          Aucun employé trouvé.
                        </td>
                      </tr>
                    )}
                    {visibleEmployes.map((e) => (
                      <tr key={e.id}>
                        <td className="td-name">{e.nom}</td>
                        <td style={{ color: "var(--text3)" }}>{e.email}</td>
                        <td>
                          <i
                            className={`ti ${DEPARTEMENT_ICONS[e.departement] || "ti-building"}`}
                            style={{ color: "var(--text3)", marginRight: 6 }}
                          />
                          {e.departement_display}
                        </td>
                        <td>
                          <div className="actions-cell">
                            <div className="action-btn" title="Modifier" onClick={() => openEditModal(e)}>
                              <i className="ti ti-pencil" style={{ fontSize: 15 }} />
                            </div>
                            <div className="action-btn danger" title="Retirer" onClick={() => handleDelete(e)}>
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
          </div>
        </>
      )}

      {modalEmploye !== undefined && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setModalEmploye(undefined)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modalEmploye ? "Modifier l'employé" : "Nouvel employé"}</h3>
              <div className="close-btn" role="button" tabIndex={0} onClick={() => setModalEmploye(undefined)}>
                <i className="ti ti-x" />
              </div>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Ex : Jeanne MBALLA"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="jeanne.mballa@entreprise.cm"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Département *</label>
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
                </div>
                {formError && (
                  <div className="form-error-text">
                    <i className="ti ti-alert-circle" /> {formError}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalEmploye(undefined)}>
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
