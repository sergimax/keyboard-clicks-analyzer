import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyColorMode, readColorMode } from "./color-mode";
import "./styles/tokens.css";
import "./styles/links.css";
import "./styles/app.css";

applyColorMode(readColorMode());

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
