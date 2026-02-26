import { useNavigate } from "react-router-dom";
import pageNotFound from "../assets/pagenotfound.jpg";
import "../global.css";

function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: "2rem",
        }}>
            <img
                src={pageNotFound}
                alt="Page not found"
                style={{ maxHeight: "60vh", maxWidth: "90vw", objectFit: "contain" }}
            />
            <button
                onClick={() => navigate("/")}
                style={{
                    fontFamily: "var(--font-buttons)",
                    background: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.75)",
                    padding: "10px 20px",
                    borderRadius: "999px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    transform: "translateX(-2px)",
                }}
                onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.background = "rgba(224,58,62,0.2)";
                    el.style.borderColor = "rgba(224,58,62,0.5)";
                    el.style.color = "#e03a3e";
                }}
                onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.background = "rgba(255,255,255,0.08)";
                    el.style.borderColor = "rgba(255,255,255,0.15)";
                    el.style.color = "rgba(255,255,255,0.75)";
                }}
            >
                ← Back to Home
            </button>
        </div>
    );
}

export default NotFoundPage;
