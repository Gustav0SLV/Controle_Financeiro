import { NavLink, Outlet } from "react-router-dom";

function linkStyle({ isActive }: { isActive: boolean }) {
  return {
    padding: "10px 12px",
    borderRadius: 10,
    textDecoration: "none",
    color: "black",
    border: "1px solid #ddd",
    background: isActive ? "#f3f3f3" : "white",
    fontFamily: "Arial",
  } as const;
}

export default function Layout() {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <NavLink to="/overview" style={linkStyle}>Overview</NavLink>
        <NavLink to="/transactions" style={linkStyle}>Lançamentos</NavLink>
        <NavLink to="/categories" style={linkStyle}>Categorias</NavLink>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 10 }}>
        <Outlet />
      </div>
    </div>
  );
}