import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AppProviders } from "./app/providers";
import { AppRoutes } from "./app/router";
import { getServices } from "./services";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <AppProviders services={getServices()}>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AppProviders>,
);
