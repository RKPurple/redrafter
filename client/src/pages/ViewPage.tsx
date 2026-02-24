import { useLocation } from "react-router-dom";

function ViewPage() {
    const { state } = useLocation();
    const { assignments } = state;
    return (
        <div>
            <h1>View Page</h1>
        </div>
    );
}

export default ViewPage;