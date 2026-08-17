import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';

import Sidebar from './sidebar/page.jsx';

import Dashboard from './dashboard/page.jsx';
import Estoque from './estoque/page.jsx';
import Vendas from './vendas/page.jsx';
import Fidelidade from './fidelidade/page.jsx';
import Financeiro from './financeiro/page.jsx';
import Producao from './producao/page.jsx';
import DadosE from './dadosEstoque/page.jsx';
import ClientesPets from './dadosCliente/page.jsx';

function App() {

  const [produtosEstoque, setProdutosEstoque] = useState([]);

  return (
    <Router>

      <div className="app-layout">

        {/* SIDEBAR */}
        <Sidebar />

        {/* CONTEÚDO */}
        <main className="main-content">

          <Routes>

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/estoque"
              element={
                <Estoque
                  produtosEstoque={produtosEstoque}
                  setProdutosEstoque={setProdutosEstoque}
                />
              }
            />

            <Route
              path="/producao"
              element={<Producao />}
            />

            <Route
              path="/dadosEstoque"
              element={<DadosE />}
            />

            <Route
              path="/dadosCliente"
              element={<ClientesPets />}
            />

            <Route
              path="/vendas"
              element={<Vendas />}
            />

            <Route
              path="/fidelidade"
              element={<Fidelidade />}
            />

            <Route
              path="/financeiro"
              element={<Financeiro />}
            />

          </Routes>

        </main>

      </div>

    </Router>
  );
}

export default App;