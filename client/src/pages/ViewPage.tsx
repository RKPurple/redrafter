import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import RedraftedPickCard from "../components/RedraftedPickCard";
import EmptyPickCard from "../components/EmptyPickCard";
import "./ViewPage.css";

function ViewPage() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { resolvedPicks, assignments, selectedYear, redraftSlots } = state;
    const [viewSlots, setViewSlots] = useState<number | "all">(redraftSlots)
    const [page, setPage] = useState(0);

    function handleViewSlotsChange(value: number | "all") {
        setViewSlots(value);
        setPage(0);
    }

    const visiblePicks = viewSlots === "all"
        ? resolvedPicks.slice(page * 30, (page + 1) * 30)
        : resolvedPicks.slice(0, viewSlots);
    
    return (
        <div className="view-page">
            <div className="view-page-header">
                <div className="view-page-header-left">
                    <button onClick={() => navigate("/", { state: { assignments, selectedYear, redraftSlots: viewSlots } })}>Back</button>
                </div>
                <h1>{selectedYear} Redrafted</h1>
                <div className="view-page-header-right">
                    <select value={viewSlots} onChange={e => handleViewSlotsChange(e.target.value === "all" ? "all" : Number(e.target.value))}>
                        <option value="all">All</option>
                        <option value={5}>Top 5</option>
                        <option value={14}>Lottery Picks</option>
                        <option value={30}>First Round</option>
                    </select>
                    <button>Export Image</button> {/* TODO: Implement export image functionality */}
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
            {viewSlots === "all" && (
                <div className="view-pagination">
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Prev</button>
                    <span>{page === 0 ? "1st Round" : page === 1 ? "2nd Round" : `Picks ${page * 30 + 1}–${Math.min((page + 1) * 30, resolvedPicks.length)}`}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 30 >= resolvedPicks.length}>Next →</button>
                </div>
            )}
        </div>
    );
}

export default ViewPage;