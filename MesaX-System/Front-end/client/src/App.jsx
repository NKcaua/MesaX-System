import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages/Index.jsx";
import MesaPage from "./pages/Mesa.jsx";
import {
  Caixa,
  Cozinha,
  EquipeLogin,
  Garcom,
  Gerente,
} from "./pages/Equipe.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/mesa" element={<MesaPage />} />
        <Route path="/mesa/:numero" element={<MesaPage />} />
        <Route path="/equipe" element={<EquipeLogin />} />
        <Route path="/cozinha" element={<Cozinha />} />
        <Route path="/garcom" element={<Garcom />} />
        <Route path="/caixa" element={<Caixa />} />
        <Route path="/gerente" element={<Gerente />} />
      </Routes>
    </BrowserRouter>
  );
}
