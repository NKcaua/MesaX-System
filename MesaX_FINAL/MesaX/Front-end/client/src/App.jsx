import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CookieNotice } from "./components.jsx";
import Index from "./pages/Index.jsx";
import MesaPage from "./pages/Mesa.jsx";
import { Privacidade, Reembolso, Termos } from "./pages/Legal.jsx";
import { Caixa, Cozinha, EquipeLogin, Garcom } from "./pages/Equipe.jsx";
import Gerente from "./pages/Gerente.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <a href="#conteudo" className="skip-link">
        Ir para o conteúdo
      </a>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/mesa" element={<MesaPage />} />
        <Route path="/mesa/:numero" element={<MesaPage />} />
        <Route path="/equipe" element={<EquipeLogin />} />
        <Route path="/cozinha" element={<Cozinha />} />
        <Route path="/garcom" element={<Garcom />} />
        <Route path="/caixa" element={<Caixa />} />
        <Route path="/gerente" element={<Gerente />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/reembolso" element={<Reembolso />} />
      </Routes>
      <CookieNotice />
    </BrowserRouter>
  );
}
