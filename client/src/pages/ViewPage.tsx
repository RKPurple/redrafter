import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../config";
import RedraftedPickCard from "../components/RedraftedPickCard";
import EmptyPickCard from "../components/EmptyPickCard";
import RedraftSlotsSelector from "../components/RedraftSlotsSelector";
import "./ViewPage.css";

type DraftPick = {
    year: number;
    pick_number: number | null;
    drafted_by: string | null;
    traded_to: string | null;
    player: {
        name: string;
        position: string | null;
        college_or_club: string | null;
        nba_stats_id: number | null;
        undrafted: boolean;
    };
};

function reconstructPicks(draft: DraftPick[], assignments: Record<number, number>) {
    const draftOrder = draft
        .filter(p => p.pick_number !== null && p.drafted_by !== null)
        .map(p => ({ pick_number: p.pick_number!, drafted_by: p.drafted_by! }));

    return draftOrder.map(pick => {
        const assignedIdx = assignments[pick.pick_number];
        const assigned = assignedIdx !== undefined ? draft[assignedIdx] : null;
        return {
            pick_number: pick.pick_number,
            drafted_by: pick.drafted_by,
            player: assigned ? {
                name: assigned.player.name,
                position: assigned.player.position,
                college_or_club: assigned.player.college_or_club,
                nba_stats_id: assigned.player.nba_stats_id,
                original_pick_number: assigned.pick_number,
                original_drafted_by: assigned.drafted_by,
                traded_to: assigned.traded_to,
            } : null,
        };
    });
}

function ViewPage() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [searchParams] = useSearchParams();

    const [resolvedPicks, setResolvedPicks] = useState<ReturnType<typeof reconstructPicks>>(state?.resolvedPicks ?? []);
    const [assignments, setAssignments] = useState<Record<number, number>>(state?.assignments ?? {});
    const [selectedYear, setSelectedYear] = useState<number>(state?.selectedYear ?? 2025);
    const [viewSlots, setViewSlots] = useState<number | "all">(state?.redraftSlots ?? "all");
    const [page, setPage] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [loadingShared, setLoadingShared] = useState(!state && !!searchParams.get("data"));
    const [shareLabel, setShareLabel] = useState("Share Link ↗");

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const itemsPerPage = isMobile ? 14 : 30;
    const isPaginated = viewSlots === "all" || (isMobile && viewSlots === 30);

    useEffect(() => {
        if (state || !searchParams.get("data")) return;
        try {
            const encoded = searchParams.get("data")!;
            const decoded = JSON.parse(atob(encoded));
            const { year, slots, assignments: sharedAssignments } = decoded;
            setSelectedYear(year);
            setViewSlots(slots);
            setAssignments(sharedAssignments);
            fetch(`${API_URL}/drafts/${year}`)
                .then(res => res.json())
                .then((draft: DraftPick[]) => {
                    setResolvedPicks(reconstructPicks(draft, sharedAssignments));
                    setLoadingShared(false);
                })
                .catch(() => setLoadingShared(false));
        } catch {
            setLoadingShared(false);
        }
    }, []);

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

    function handleShare() {
        const data = btoa(JSON.stringify({ year: selectedYear, slots: viewSlots, assignments }));
        const url = `${window.location.origin}/view?data=${data}`;
        navigator.clipboard.writeText(url);
        setShareLabel("Copied!");
        setTimeout(() => setShareLabel("Share ↗"), 2000);
    }

    if (loadingShared) return <div style={{ color: "white", padding: "2rem" }}>Loading...</div>;

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
                    <button className="share-button" onClick={handleShare}>{shareLabel}</button>
                    <button className="export-button" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? "Downloading..." : "Download ↓"}
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
