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
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.75)",
                    padding: "10px 28px",
                    borderRadius: "999px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                }}
            >
                ← Back to Home
            </button>
        </div>
    );
}

export default NotFoundPage;
