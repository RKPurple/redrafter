import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ViewPage from "./pages/ViewPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/view" element={<ViewPage />} />
    </Routes>
  );
}

export default App;