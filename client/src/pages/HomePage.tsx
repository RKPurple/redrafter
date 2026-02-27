import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "../config";
import "../global.css"
import "./HomePage.css"
import DraftPickCard from "../components/DraftPickCard";
import EmptyPickCard from "../components/EmptyPickCard";
import RedraftedPickCard from "../components/RedraftedPickCard";
import PlacedPickCard from "../components/PlacedPickCard";
import YearSelector from "../components/YearSelector";
import RedraftSlotsSelector from "../components/RedraftSlotsSelector";

type Player = {
  name: string;
  position: string | null;
  college_or_club: string | null;
  nba_stats_id: number | null;
  undrafted: boolean;
};

type DraftPick = {
  year: number;
  pick_number: number | null;
  drafted_by: string | null;
  traded_to: string | null;
  player: Player;
};

export function getPlayerHeadShot(nbaStatsId: number | null): string {
  const id = nbaStatsId ?? 0;
  return `${API_URL}/headshot/${id}`;
}

function HomePage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const isFirstRender = useRef(true);
  const [draft, setDraft] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(state?.selectedYear ?? 2015);
  const [draftYears, setDraftYears] = useState<number[]>([]);
  const [selectedPickIdx, setSelectedPickIdx] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Record<number, number>>(state?.assignments ?? {});
  const [redraftSlots, setRedraftSlots] = useState<number | "all">(state?.redraftSlots ?? "all");
  const [selectedRedraftPickNumber, setSelectedRedraftPickNumber] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<"original" | "redrafted">("original");

  useEffect(() => {
    fetch(`${API_URL}/draft-years`)
      .then((res) => {
        if(!res.ok) throw new Error("Failed to fetch draft years");
        return res.json();
      })
      .then((data: number[]) => {
        setDraftYears(data);
        if (data.length > 0) {
          setSelectedYear((prev) => (data.includes(prev) ? prev : data[0]));
        }
      })
      .catch((err: Error) => {
        console.error(err);
        setDraftYears([]);
      });
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      setAssignments({});
      setSelectedPickIdx(null);
    }
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/drafts/${selectedYear}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch draft");
        return res.json();
      })
      .then((data: DraftPick[]) => {
        setDraft(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedYear]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const draftOrder = draft
    .filter(pick => pick.pick_number !== null && pick.drafted_by !== null)
    .map(pick => ({
      pick_number: pick.pick_number!,
      drafted_by: pick.drafted_by!
    }));

  const limitedDraftOrder = redraftSlots === "all"
    ? draftOrder
    : draftOrder.slice(0, redraftSlots);

  function handleDraftPickClick(idx: number) {
    const isPlaced = Object.values(assignments).includes(idx);
    if (isPlaced) return;
    setSelectedRedraftPickNumber(null);
    if (selectedPickIdx === idx) {
      setSelectedPickIdx(null);
    } else {
      setSelectedPickIdx(idx);
      setMobileTab("redrafted");
    }
  }

  function handleEmptyPickClick(pickNumber: number) {
    if (selectedRedraftPickNumber !== null) {
      // Move selected redrafted card to this empty slot
      setAssignments(prev => {
        const next = { ...prev };
        next[pickNumber] = next[selectedRedraftPickNumber];
        delete next[selectedRedraftPickNumber];
        return next;
      });
      setSelectedRedraftPickNumber(null);
      return;
    }
    if (selectedPickIdx === null) return;
    setAssignments(prev => ({ ...prev, [pickNumber]: selectedPickIdx }));
    setSelectedPickIdx(null);
  }

  function handleUnassign(pickNumber: number) {
    setAssignments(prev => {
      const next = { ...prev };
      delete next[pickNumber];
      return next;
    });
  }

  function handleClear() {
    setAssignments({});
    setSelectedPickIdx(null);
    setSelectedRedraftPickNumber(null);
  }

  function resolvePicksForView() {
    return draftOrder.map(pick => {
      const assignedIdx = assignments[pick.pick_number];
      const assignedDraftPick = assignedIdx !== undefined ? draft[assignedIdx] : null;
      return {
        pick_number: pick.pick_number,
        drafted_by: pick.drafted_by,
        player: assignedDraftPick ? {
          name: assignedDraftPick.player.name,
          position: assignedDraftPick.player.position,
          college_or_club: assignedDraftPick.player.college_or_club,
          nba_stats_id: assignedDraftPick.player.nba_stats_id,
          original_pick_number: assignedDraftPick.pick_number,
          original_drafted_by: assignedDraftPick.drafted_by,
          traded_to: assignedDraftPick.traded_to,
        } : null,
      };
    });
  }

  function handleRedraftedPickClick(pickNumber: number) {
    if (selectedPickIdx !== null) {
      // Assignment mode: replace whatever is in this slot
      setAssignments(prev => ({ ...prev, [pickNumber]: selectedPickIdx }));
      setSelectedPickIdx(null);
      return;
    }
    if (selectedRedraftPickNumber === pickNumber) {
      setSelectedRedraftPickNumber(null);
      return;
    }
    if (selectedRedraftPickNumber !== null) {
      // Swap the two slots
      setAssignments(prev => {
        const next = { ...prev };
        const temp = next[selectedRedraftPickNumber];
        next[selectedRedraftPickNumber] = next[pickNumber];
        next[pickNumber] = temp;
        return next;
      });
      setSelectedRedraftPickNumber(null);
      return;
    }
    setSelectedRedraftPickNumber(pickNumber);
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <div className="header-left" />
        <div className="header-center">
          <YearSelector years={draftYears} selectedYear={selectedYear} onChange={setSelectedYear} />
          <h1>NBA Redraft</h1>
        </div>
        <div className="header-right">
          <RedraftSlotsSelector selected={redraftSlots} onChange={setRedraftSlots} />
          <button className="clear-button" onClick={handleClear}>Clear ✕</button>
          <button className="view-button" onClick={() => navigate("/view", { state: { resolvedPicks: resolvePicksForView(), assignments, selectedYear, redraftSlots } })}>
            View | Download | Share <span>→</span>
          </button>
        </div>
      </div>
      {/* Mobile Tab Bar */}
      <div className="mobile-tab-bar">
        <button
          className={`mobile-tab${mobileTab === "original" ? " active" : ""}`}
          onClick={() => setMobileTab("original")}
        >
          Original
        </button>
        <button
          className={`mobile-tab${mobileTab === "redrafted" ? " active" : ""}${selectedPickIdx !== null ? " has-pending" : ""}`}
          onClick={() => setMobileTab("redrafted")}
        >
          Redrafted{selectedPickIdx !== null && <span className="mobile-tab-dot" />}
        </button>
      </div>
      {/* Draft Picks */}
      <div className="picks-container">
        <div className={`picks-column-scroll${mobileTab !== "original" ? " mobile-hidden" : ""}`}>
          <div className="original-picks">
            {draft.map((pick, idx) => {
              const isPlaced = Object.values(assignments).includes(idx);
              return isPlaced ? (
                <PlacedPickCard
                  key={idx}
                  pickNumber={pick.pick_number}
                  playerName={pick.player.name}
                  draftedBy={pick.drafted_by}
                  tradedTo={pick.traded_to}
                />
              ) : (
                <DraftPickCard
                  key={idx}
                  pickNumber={pick.pick_number}
                  playerName={pick.player.name}
                  playerPosition={pick.player.position}
                  playerCollegeOrClub={pick.player.college_or_club}
                  draftedBy={pick.drafted_by}
                  tradedTo={pick.traded_to}
                  playerNbaStatsId={pick.player.nba_stats_id}
                  isSelected={selectedPickIdx === idx}
                  onClick={() => handleDraftPickClick(idx)}
                />
              );
            })}
          </div>
        </div>
        {/* Redrafted Picks */}
        <div className={`picks-column-scroll${mobileTab !== "redrafted" ? " mobile-hidden" : ""}`}>
          <div className="redrafted-picks">
            {limitedDraftOrder.map((pick, idx) => {
              const assignedDraftIdx = assignments[pick.pick_number];
              const assignedPlayer = assignedDraftIdx !== undefined ? draft[assignedDraftIdx] : null;
              return assignedPlayer ? (
                <RedraftedPickCard
                  key={idx}
                  redraftedPickNumber={pick.pick_number}
                  originalPickNumber={assignedPlayer.pick_number}
                  playerName={assignedPlayer.player.name}
                  playerPosition={assignedPlayer.player.position}
                  playerCollegeOrClub={assignedPlayer.player.college_or_club}
                  reDraftedBy={pick.drafted_by}
                  draftedBy={assignedPlayer.traded_to ?? assignedPlayer.drafted_by ?? "NBA"}
                  playerNbaStatsId={assignedPlayer.player.nba_stats_id}
                  isSelected={selectedRedraftPickNumber === pick.pick_number}
                  overlayType={
                    selectedPickIdx !== null ? "replace" :
                    selectedRedraftPickNumber !== null && selectedRedraftPickNumber !== pick.pick_number ? "swap" :
                    undefined
                  }
                  onClick={() => handleRedraftedPickClick(pick.pick_number)}
                  onUnassign={() => handleUnassign(pick.pick_number)}
                />
              ) : (
                <EmptyPickCard
                  key={idx}
                  pickNumber={pick.pick_number}
                  selectionTeam={pick.drafted_by}
                  isSelectionActive={selectedPickIdx !== null || selectedRedraftPickNumber !== null}
                  onClick={() => handleEmptyPickClick(pick.pick_number)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;