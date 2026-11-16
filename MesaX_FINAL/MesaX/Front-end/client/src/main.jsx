import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Fontes hospedadas no próprio site (nenhuma requisição a terceiros).
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
