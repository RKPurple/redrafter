import { useEffect, useState } from "react";
import "./global.css"
import DraftPickCard from "./components/DraftPickCard";
import EmptyPickCard from "./components/EmptyPickCard";
import RedraftedPickCard from "./components/RedraftedPickCard";

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
    <div>
      <h1>{selectedYear} NBA Draft</h1>
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="year-select" style={{ marginRight: "0.5rem" }}>Year: </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          style={{ padding: "0.35rem 0.5rem", fontSize: "1rem", cursor: "pointer" }}
        >
          {draftYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <button onClick={() => setDraftFilter("all")}>All</button>
        <button onClick={() => setDraftFilter("drafted")}>drafted only</button>
        <button onClick={() => setDraftFilter("undrafted")}>undrafted only</button>
      </div>
      <div style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {draft.map((pick, idx) => (
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
              isPlaced={Object.values(assignments).includes(idx)}
              onClick={() => handleDraftPickClick(idx)}
            />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "600px", position: "absolute", right: "20px" }}>
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
  );
}

export default App;
