import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Sidebar from './sidebar/page.jsx';
import Dashboard from './dashboard/page.jsx';
import Estoque from './estoque/page.jsx';
import Inverno from './produtos/inverno/page.jsx';
import Verao from './produtos/verao/page.jsx';
import Artesanato from './produtos/artesanato/page.jsx';
import Encomendas from './produtos/encomendas/page.jsx';
import Vendas from './vendas/page.jsx';
import Clientes from './clientes/page.jsx';
import Fidelidade from './fidelidade/page.jsx';
import Financeiro from './financeiro/page.jsx';
import Producao from './producao/page.jsx';
import DadosE from './dadosEstoque/page.jsx';
import ClientesPets from './dadosCliente/page.jsx';

function App() {
  // 1) O ESTADO REAL E CRU DO SEU ESTOQUE FICA AQUI AGORA:
  const [produtosEstoque, setProdutosEstoque] = useState([]); 

  return (
    <Router>
      <div className="app-layout">
        <Sidebar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* 2) Passa a lista e a função de alterar para a página de Estoque cadastrar e deletar */}
            <Route 
              path="/estoque" 
              element={<Estoque produtosEstoque={produtosEstoque} setProdutosEstoque={setProdutosEstoque} />} 
            />         
            

             {/* 12) Passa a lista e a função de alterar para a página de Produção cadastrar e deletar */}
            <Route path="/producao" element={<Producao />}/>
            <Route path="/dadosEstoque" element={<DadosE />} />
            <Route path="/dadosCliente" element={<ClientesPets />} />
            <Route path="/vendas" element={<Vendas />} />  
          </Routes>
            
        </main>
      </div>
    </Router>
  );
}

export default App;