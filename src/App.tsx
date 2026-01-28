import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { SkillTreesContextProvider } from "./contexts/SkillTreesContext";
import Search from "./pages/search/Search";

const queryClient = new QueryClient();

/**
 *
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SkillTreesContextProvider>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Search />} />
            <Route path="/paths/:startId/:endId" element={<Search />} />
          </Routes>
        </BrowserRouter>
      </SkillTreesContextProvider>
    </QueryClientProvider>
  );
}

export default App;
