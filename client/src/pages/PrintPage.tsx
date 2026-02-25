import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_URL } from "../config";
import RedraftedPickCard from "../components/RedraftedPickCard";
import EmptyPickCard from "../components/EmptyPickCard";
import "../pages/ViewPage.css";

function PrintPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [picks, setPicks] = useState<any[]>([]);
    const [viewSlots, setViewSlots] = useState<number | "all">("all");
    const [page, setPage] = useState(0);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_URL}/print-data/${token}`)
            .then(res => res.json())
            .then(data => {
                setPicks(data.resolvedPicks);
                setViewSlots(data.viewSlots);
                setPage(data.page);
                setReady(true);
            });
    }, [token]);

    if (!ready) return null;

    const visiblePicks = viewSlots === "all"
        ? picks.slice(page * 30, (page + 1) * 30)
        : picks.slice(0, viewSlots as number);

    return (
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
    );
}

export default PrintPage;