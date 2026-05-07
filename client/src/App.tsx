import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ViewPage from "./pages/ViewPage";
import PrintPage from "./pages/PrintPage";
import NotFoundPage from "./pages/NotFoundPage";
import TeamPage from "./pages/TeamPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/view" element={<ViewPage />} />
      <Route path="/print" element={<PrintPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;