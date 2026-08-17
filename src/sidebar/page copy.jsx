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
  ChevronDown, 
  ChevronUp,
  CloudSun,  
  ClipboardList,
  Cpu,
  Gift,
  DollarSign,
  Dog
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

        {/* Produção */}
        <NavLink to="/producao" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Package size={20} />
          Produção
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
              <ClipboardList size={20} />
              Cadastros
            </div>
            {isProducaoAberto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Submenu com recuo e links de rotas */}
          {isProducaoAberto && (
            <div className="sidebar-submenu">

              <NavLink to="/dadosCliente" className={({ isActive }) => isActive ? "nav-subitem active-sub" : "nav-subitem"}>
                <Dog size={16} />
                Cliente/Pet
              </NavLink>            
          

              <NavLink to="/dadosEstoque" className={({ isActive }) => isActive ? "nav-subitem active-sub" : "nav-subitem"}>
                <Package size={16} />
                Dados para Tabelas
              </NavLink>

            {/*
              <NavLink to="/produtos/meiaestacao" className={({ isActive }) => isActive ? "nav-subitem active-sub" : "nav-subitem"}>
                <Package size={16} />
                Dados para Produção
              </NavLink>
              {/*--Guardar
              <NavLink to="/produtos/verao" className={({ isActive }) => isActive ? "nav-subitem active-sub" : "nav-subitem"}>
                <Sun size={16} />
                Tamanhos
              </NavLink> */}
            
            </div>
          )}
        </div>

        {/* Fidelidade */}
        <NavLink to="/fidelidade" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Gift size={20} />
          Fidelidade
        </NavLink> 

        {/* Clientes 
        <NavLink to="/clientes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Users size={20} />
          Clientes
        </NavLink> */}

        {/* Vendas */}
        <NavLink to="/vendas" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <ShoppingCart size={20} />
          Vendas
        </NavLink>        
      </nav>

      <footer className="sidebar-footer">
        <NavLink to="/financeiro" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <DollarSign size={20} />
          Financeiro
        </NavLink>

        <NavLink to="/configuracoes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Settings size={20} />
          Configurações
        </NavLink>
      </footer>
    </aside>
  );
}