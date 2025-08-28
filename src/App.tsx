import "./App.css";
import React from "react";
import Home from "@/pages/Home";
import { AppProvider } from "@/context/AppContext";
import { ModalProvider } from "@/context/ModalContext";
import { Toaster } from "sonner";

function App() {
  return (
    <ModalProvider>
      <AppProvider>
        <Home />
        <Toaster richColors />
      </AppProvider>
    </ModalProvider>
  );
}

export default App;
