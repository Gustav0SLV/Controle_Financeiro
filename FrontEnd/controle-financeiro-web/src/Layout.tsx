import { NavLink, Outlet } from "react-router-dom";

function linkStyle({ isActive }: { isActive: boolean }) {
  return {
    minWidth: 150,
    padding: "10px 18px",
    borderRadius: 999,
    textDecoration: "none",
    textAlign: "center",
    color: isActive ? "#0f172a" : "#334155",
    border: isActive ? "1px solid #bfdbfe" : "1px solid transparent",
    background: isActive ? "linear-gradient(180deg, #dbeafe 0%, #bfdbfe 100%)" : "transparent",
    boxShadow: isActive ? "0 4px 14px rgba(37, 99, 235, 0.25)" : "none",
    fontFamily: "Segoe UI, Arial",
    fontWeight: 600,
    transition: "all 0.2s ease",
  } as const;
}

export default function Layout() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
            padding: 10,
            borderRadius: 999,
            border: "1px solid #e2e8f0",
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
          }}
        >
        <NavLink to="/overview" style={linkStyle}>Visao Geral</NavLink>
        <NavLink to="/transactions" style={linkStyle}>Lancamentos</NavLink>
        <NavLink to="/categories" style={linkStyle}>Categorias</NavLink>
        </div>
      </div>

      <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 10, background: "#ffffff" }}>
        <Outlet />
      </div>
    </div>
  );
}
