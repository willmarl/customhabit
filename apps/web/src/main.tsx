import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Providers from "./components/providers/Providers.tsx";
import Layout from "./components/layout/Layout.tsx";
import App from "./App.tsx";
import TodosPage from "./pages/TodosPage.tsx";
import TestPage from "./pages/Test.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<App />} />
            <Route path="/todos" element={<TodosPage />} />
            <Route path="/test" element={<TestPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Providers>
  </StrictMode>,
);
