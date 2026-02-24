import { useLocation, useNavigate } from "react-router-dom";
import "./ViewPage.css";

function ViewPage() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { resolvedPicks, assignments, selectedYear, redraftSlots } = state;
    return (
        <div className="view-page">
            <div className="view-page-header">
                <button onClick={() => navigate("/", { state: { assignments, selectedYear, redraftSlots } })}>Back</button>
                <h1>View Page</h1>
            </div>
        </div>
    );
}

export default ViewPage;