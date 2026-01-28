import { useEffect, useState } from "react";

type Player = {
  name: string;
  position: string | null;
  college_or_club: string | null;
  undrafted: boolean;
};

type DraftPick = {
  year: number;
  pick_number: number | null;
  drafted_by: string | null;
  traded_to: string | null;
  player: Player;
};

function App() {
  const [draft, setDraft] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/drafts/2025")
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
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>2025 NBA Draft</h1>
      <ul>
        {draft.map((pick, idx) => (
          <li key={idx}>
            {pick.pick_number ?? "UD"} —{" "}
            {pick.player.name} ({pick.player.position ?? "?"}) —{" "}
            {pick.drafted_by ?? "N/A"}
            {pick.traded_to && ` → ${pick.traded_to}`}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
