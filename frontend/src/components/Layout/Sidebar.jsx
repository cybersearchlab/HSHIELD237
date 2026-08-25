import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { roleLabel } from "../../utils/roles";
import { NAV_SECTIONS } from "./navConfig";

function initialsFor(user) {
  if (!user) return "";
  const first = user.first_name?.trim();
  const last = user.last_name?.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  const source = user.email || user.username || "";
  return source.slice(0, 2).toUpperCase();
}

function displayNameFor(user) {
  if (!user) return "";
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return full || user.email;
}

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">
          <i className="ti ti-shield-lock" aria-hidden="true" />
        </div>
        <div>
          <div className="logo-name">
            H-SHIELD<span>237</span>
          </div>
          <div className="logo-sub">Simulateur de phishing éducatif</div>
        </div>
      </div>

      <nav className="nav" role="navigation">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => !item.roles || item.roles.includes(user?.role));
          if (items.length === 0) return null;
          return (
            <div key={section.label}>
              <div className="nav-section">{section.label}</div>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
                >
                  <i className={`ti ${item.icon}`} aria-hidden="true" /> {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="avatar">{initialsFor(user)}</div>
          <div>
            <div className="ava-name">{displayNameFor(user)}</div>
            <div className="ava-role">{roleLabel(user.role)}</div>
          </div>
        </div>
      )}
    </aside>
  );
}
