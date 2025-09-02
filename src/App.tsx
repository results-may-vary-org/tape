import "./App.css";
import Home from "@/pages/Home";
import {AppProvider} from "@/context/AppContext";
import {ModalProvider} from "@/context/ModalContext";
import {Toaster} from "sonner";
import {ThemeProvider} from "@/context/theme-provider.tsx";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ModalProvider>
        <AppProvider>
          <Home />
          <Toaster richColors />
        </AppProvider>
      </ModalProvider>
    </ThemeProvider>
  );
}

export default App;
