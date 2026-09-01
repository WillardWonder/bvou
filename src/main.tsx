import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AppProvider } from "./app/AppContext";
import { App } from "./app/App";
import { registerServiceWorker } from "./app/registerServiceWorker";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </HashRouter>
  </StrictMode>,
);

registerServiceWorker();
