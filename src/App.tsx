import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
        <Search />
      </SkillTreesContextProvider>
    </QueryClientProvider>
  );
}

export default App;
