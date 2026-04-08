import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import App from "./App";
import "./index.css";

const savedTheme = localStorage.getItem("richstok-theme");
const themeFromClock = (() => {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 7 ? "dark" : "light";
})();
const initialTheme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : themeFromClock;
document.documentElement.setAttribute("data-theme", initialTheme);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
