import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Sidebar from './sidebar/page.jsx';
import Dashboard from './dashboard/page.jsx';
import Estoque from './estoque/page.jsx';
import Inverno from './produtos/inverno/page.jsx';
import Verao from './produtos/verao/page.jsx';
import MeiaEstacao from './produtos/meiaestacao/page.jsx';
import Artesanato from './produtos/artesanato/page.jsx';
import Encomendas from './produtos/encomendas/page.jsx';
import Vendas from './vendas/page.jsx';
import Clientes from './clientes/page.jsx';
import Fidelidade from './fidelidade/page.jsx';
import Financeiro from './financeiro/page.jsx';

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
            
            {/* 3) Passa a MESMA lista real para a página de Inverno ler no seu select */}
            <Route 
              path="/produtos/inverno" 
              element={<Inverno estoque={produtosEstoque} />} 
            />         
          {/* 4) Passa a MESMA lista real para a página de Verão ler no seu select */}
            <Route 
              path="/produtos/verao" 
              element={<Verao estoque={produtosEstoque} />} 
            />

          {/* 5) Passa a MESMA lista real para a página de Meia Estação ler no seu select */}
            <Route 
              path="/produtos/meiaestacao" 
              element={<MeiaEstacao estoque={produtosEstoque} />} 
            />

          {/* 6) Passa a MESMA lista real para a página de Artesanato ler no seu select */}
            <Route 
              path="/produtos/artesanato" 
              element={<Artesanato estoque={produtosEstoque} />} 
            />

          {/* 7) Passa a MESMA lista real para a página de Encomendas ler no seu select */}
            <Route 
              path="/produtos/encomendas" 
              element={<Encomendas estoque={produtosEstoque} />} 
            />         
          {/* 8) Passa a MESMA lista real para a página de Vendas ler no seu select */}
            <Route 
              path="/vendas" 
              element={<Vendas produtosEstoque={produtosEstoque} setProdutosEstoque={setProdutosEstoque} />} 
            />            
            
            {/* 9) Passa a MESMA lista real para a página de Clientes ler no seu select */}
            <Route 
              path="/clientes" 
              element={<Clientes produtosEstoque={produtosEstoque} setProdutosEstoque={setProdutosEstoque} />} 
            />     

            {/* 10) Passa a MESMA lista real para a página de Fidelidade ler no seu select */}
            <Route 
              path="/fidelidade" 
              element={<Fidelidade produtosEstoque={produtosEstoque} setProdutosEstoque={setProdutosEstoque} />} 
            />                     

            {/* 11) Passa a MESMA lista real para a página de Financeiro ler no seu select */}
            <Route path="/financeiro" element={<Financeiro />} />   
            </Routes>

        </main>
      </div>
    </Router>
  );
}

export default App;