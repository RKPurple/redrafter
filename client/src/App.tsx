import { useEffect, useState } from "react";
import "./global.css"
import "./App.css"
import DraftPickCard from "./components/DraftPickCard";
import EmptyPickCard from "./components/EmptyPickCard";
import RedraftedPickCard from "./components/RedraftedPickCard";
import PlacedPickCard from "./components/PlacedPickCard";
import YearSelector from "./components/YearSelector";

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

type DraftFilter = "all" | "drafted" | "undrafted";

export function getPlayerHeadShot(nbaStatsId: number | null): string {
  const id = nbaStatsId ?? 0;
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`;
}

function App() {
  const [draft, setDraft] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [draftYears, setDraftYears] = useState<number[]>([]);
  const [draftFilter, setDraftFilter] = useState<DraftFilter>("all");
  const [selectedPickIdx, setSelectedPickIdx] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Record<number, number>>({});

  useEffect(() => {
    fetch("http://127.0.0.1:8000/draft-years")
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
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (draftFilter !== "all") params.set("draft_filter", draftFilter);
    const query = params.toString();
    fetch(`http://127.0.0.1:8000/drafts/${selectedYear}${query ? `?${query}` : ""}`)
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
  }, [selectedYear, draftFilter]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const draftOrder = draft
    .filter(pick => pick.pick_number !== null && pick.drafted_by !== null)
    .map(pick => ({
      pick_number: pick.pick_number!,
      drafted_by: pick.drafted_by!
    }));

  function handleDraftPickClick(idx: number) {
    const isPlaced = Object.values(assignments).includes(idx);
    if (isPlaced) return;
    setSelectedPickIdx(prev => prev === idx ? null : idx);
  }

  function handleEmptyPickClick(pickNumber: number) {
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

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <YearSelector years={draftYears} selectedYear={selectedYear} onChange={setSelectedYear} />
        <h1>NBA ReDraft</h1>
      </div>
      {/* Draft Picks */}
      <div className="picks-container">
        <div className="picks-column-scroll">
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
        <div className="picks-column-scroll">
          <div className="redrafted-picks">
            {draftOrder.map((pick, idx) => {
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
                  onClick={() => {}}
                  onUnassign={() => handleUnassign(pick.pick_number)}
                />
              ) : (
                <EmptyPickCard
                  key={idx}
                  pickNumber={pick.pick_number}
                  selectionTeam={pick.drafted_by}
                  isSelectionActive={selectedPickIdx !== null}
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

export default App;
