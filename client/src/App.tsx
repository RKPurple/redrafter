import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ViewPage from "./pages/ViewPage";
import PrintPage from "./pages/PrintPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/view" element={<ViewPage />} />
      <Route path="/print" element={<PrintPage />} />
    </Routes>
  );
}

export default App;