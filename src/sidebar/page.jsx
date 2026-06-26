import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings, 
  Scissors, 
  Snowflake, 
  Sun, 
  ChevronDown, 
  ChevronUp,
  CloudSun,  
  ClipboardList,
  Cpu
} from 'lucide-react';
import './sidebar.css';

export default function Sidebar() {
  // Mantém o menu "Produção" aberto por padrão para facilitar o uso
  const [isProducaoAberto, setIsProducaoAberto] = useState(true);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-pack">
          <Package size={24} color="white" />
        </div>
        <span>AF SISTEMAS</span>
      </div>

      <nav className="sidebar-nav">
        {/* Dashboard */}
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>

        {/* Estoque */}
        <NavLink to="/estoque" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Package size={20} />
          Estoque
        </NavLink>

        {/* --- CATEGORIA MULTI-NÍVEL: PRODUÇÃO --- */}
        <div className="sidebar-grupo">
          {/* Botão que apenas abre/fecha a sanfona */}
          <button 
            type="button"
            className="nav-item btn-grupo-pai" 
            onClick={() => setIsProducaoAberto(!isProducaoAberto)}
          >
            <div className="grupo-pai-conteudo">
              <Cpu size={20} />
              Produção
            </div>
            {isProducaoAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Submenu com recuo e links de rotas */}
          {isProducaoAberto && (
            <div className="sidebar-submenu">

              <NavLink to="/produtos/artesanato" className={({ isActive }) => isActive ? "nav-subitem active-sub" : "nav-subitem"}>
                <Scissors size={16} />
                Artesanato
              </NavLink>
              
              <NavLink to="/produtos/encomendas" className={({ isActive }) => isActive ? "nav-subitem active-sub" : "nav-subitem"}>
                <ClipboardList size={16} />
                Encomendas
              </NavLink>

              <NavLink to="/produtos/inverno" className={({ isActive }) => isActive ? "nav-subitem active-sub" : "nav-subitem"}>
                <Snowflake size={16} />
                Inverno
              </NavLink>

              <NavLink to="/produtos/meiaestacao" className={({ isActive }) => isActive ? "nav-subitem active-sub" : "nav-subitem"}>
                <CloudSun size={16} />
                Meia Estação
              </NavLink>

              <NavLink to="/produtos/verao" className={({ isActive }) => isActive ? "nav-subitem active-sub" : "nav-subitem"}>
                <Sun size={16} />
                Verão
              </NavLink>

            </div>
          )}
        </div>
        {/* Vendas */}
        <NavLink to="/vendas" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <ShoppingCart size={20} />
          Vendas
        </NavLink>

        {/* Clientes */}
        <NavLink to="/clientes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Users size={20} />
          Clientes
        </NavLink>
        
      </nav>

      <div className="nav-item" style={{ marginTop: 'auto', borderTop: '1px solid #1e293b', paddingTop: '20px' }}>
        <Settings size={20} /> Configurações
      </div>
    </aside>
  );
}