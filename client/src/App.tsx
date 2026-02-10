import { useEffect, useState } from "react";
import "./global.css"
import DraftPickCard from "./components/DraftPickCard";

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
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`;
}

const DRAFT_YEARS = [2025, 2024]

function App() {
  const [draft, setDraft] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2025);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`http://127.0.0.1:8000/drafts/${selectedYear}`)
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
          {DRAFT_YEARS.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

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
          />
        ))}
      </div>
    </div>
  );
}

export default App;
