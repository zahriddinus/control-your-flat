// Bootstrap birinchi yuklanadi, shunda komponentlardagi stillar uni o'zgartira oladi
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./assits/styles/main.scss";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import { I18nProvider } from "./i18n";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <I18nProvider>
      <Router>
        <App />
      </Router>
    </I18nProvider>
  </React.StrictMode>
);

// Service worker: sayt ilovadek o'rnatiladi va internetsiz ham ochiladi (public/service-worker.js).
// Dev rejimda yoqilmaydi, aks holda eski fayllar keshda qolib, o'zgarishlar ko'rinmay qoladi
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL}/service-worker.js`)
      .catch((error) => console.error("Service worker error:", error));
  });
}
