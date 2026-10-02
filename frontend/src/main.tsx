import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AppProviders } from "./app/providers";
import { AppRoutes } from "./app/router";
import { ServerStatusBanner } from "./components/ServerStatusBanner";
import { pingApi } from "./hooks/useServerWakeup";
import { getServices } from "./services";
import "./styles/index.css";

const isApiMode = import.meta.env.VITE_DATA_SOURCE === "api";
const ping = isApiMode ? pingApi(import.meta.env.VITE_API_URL ?? "") : null;

createRoot(document.getElementById("root")!).render(
  <AppProviders services={getServices()}>
    {ping && <ServerStatusBanner ping={ping} />}
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AppProviders>,
);
