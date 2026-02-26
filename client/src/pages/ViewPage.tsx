import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import RedraftedPickCard from "../components/RedraftedPickCard";
import EmptyPickCard from "../components/EmptyPickCard";
import RedraftSlotsSelector from "../components/RedraftSlotsSelector";
import "./ViewPage.css";

function ViewPage() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { resolvedPicks, assignments, selectedYear, redraftSlots } = state;
    const [viewSlots, setViewSlots] = useState<number | "all">(redraftSlots)
    const [page, setPage] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const itemsPerPage = isMobile ? 14 : 30;
    const isPaginated = viewSlots === "all" || (isMobile && viewSlots === 30);

    function handleViewSlotsChange(value: number | "all") {
        setViewSlots(value);
        setPage(0);
    }

    async function handleExport() {
        setIsExporting(true);
        const res = await fetch(`${API_URL}/print-data`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resolvedPicks, selectedYear, viewSlots, page }),
        });
        const { token } = await res.json();

        const imageRes = await fetch(`${API_URL}/screenshot/${token}`);
        const blob = await imageRes.blob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${selectedYear}-redraft.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
    }

    const visiblePicks = isPaginated
        ? resolvedPicks.slice(page * itemsPerPage, (page + 1) * itemsPerPage)
        : resolvedPicks.slice(0, viewSlots as number);
    
    return (
        <div className="view-page">
            <div className="view-page-header">
                <div className="view-page-header-left">
                    <button className="back-button" onClick={() => navigate("/", { state: { assignments, selectedYear, redraftSlots: viewSlots } })}>← Back</button>
                </div>
                <h1>{selectedYear} Redrafted</h1>
                <div className="view-page-header-right">
                    <RedraftSlotsSelector selected={viewSlots} onChange={handleViewSlotsChange} />
                    <button className="export-button" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? "Exporting..." : "Export ↓"}
                    </button>
                </div>
            </div>
            <div className="view-body">
                <div className={`view-content view-content--${viewSlots}`}>
                    {visiblePicks.map((pick) =>
                        pick.player ? (
                            <RedraftedPickCard
                                key={pick.pick_number}
                                readOnly={true}
                                redraftedPickNumber={pick.pick_number}
                                originalPickNumber={pick.player.original_pick_number}
                                playerName={pick.player.name}
                                playerPosition={pick.player.position}
                                playerCollegeOrClub={pick.player.college_or_club}
                                reDraftedBy={pick.drafted_by}
                                draftedBy={pick.player.traded_to ?? pick.player.original_drafted_by}
                                playerNbaStatsId={pick.player.nba_stats_id}
                                onClick={() => {}}
                                onUnassign={() => {}}
                            />
                        ) : (
                            <EmptyPickCard
                                key={pick.pick_number}
                                readOnly={true}
                                pickNumber={pick.pick_number}
                                selectionTeam={pick.drafted_by}
                                isSelectionActive={false}
                                onClick={() => {}}
                            />
                        )
                    )}
                </div>
            </div>
            {isPaginated && (
                <div className="view-pagination">
                    <button className="pagination-prev" onClick={() => setPage(p => p - 1)} disabled={page === 0}>←</button>
                    <span>{`Picks ${page * itemsPerPage + 1}–${Math.min((page + 1) * itemsPerPage, resolvedPicks.length)}`}</span>
                    <button className="pagination-next" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * itemsPerPage >= resolvedPicks.length}>→</button>
                </div>
            )}
        </div>
    );
}

export default ViewPage;