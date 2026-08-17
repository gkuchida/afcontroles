import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  ChevronDown, 
  ChevronUp,
  ClipboardList,
  Gift,
  DollarSign,
  Dog,
  Menu,
  X
} from 'lucide-react';
import './sidebar.css';

export default function Sidebar() {
  const [isProducaoAberto, setIsProducaoAberto] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  // Conteúdo completo da Sidebar
  const sidebarContent = (
    <>
      {/* Botão Hambúrguer / X Fixo no Topo */}
      <button 
        type="button"
        className="mobile-toggle-btn" 
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Fundo escuro semitransparente */}
      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      {/* Menu Drawer */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-pack">
            <Package size={24} color="white" />
          </div>
          <span>AF SISTEMAS</span>
          
          <button type="button" className="mobile-close-btn" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            onClick={closeSidebar}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>

          <NavLink 
            to="/estoque" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            onClick={closeSidebar}
          >
            <Package size={20} />
            Estoque
          </NavLink>

          <NavLink 
            to="/producao" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            onClick={closeSidebar}
          >
            <Package size={20} />
            Produção
          </NavLink>        

          {/* Submenu Cadastros */}
          <div className="sidebar-grupo">
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

            {isProducaoAberto && (
              <div className="sidebar-submenu">
                <NavLink 
                  to="/dadosCliente" 
                  className={({ isActive }) => isActive ? "nav-subitem active-sub" : "nav-subitem"}
                  onClick={closeSidebar}
                >
                  <Dog size={16} />
                  Cliente/Pet
                </NavLink>            
            
                <NavLink 
                  to="/dadosEstoque" 
                  className={({ isActive }) => isActive ? "nav-subitem active-sub" : "nav-subitem"}
                  onClick={closeSidebar}
                >
                  <Package size={16} />
                  Dados para Tabelas
                </NavLink>
              </div>
            )}
          </div>

          <NavLink 
            to="/fidelidade" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            onClick={closeSidebar}
          >
            <Gift size={20} />
            Fidelidade
          </NavLink> 

          <NavLink 
            to="/vendas" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            onClick={closeSidebar}
          >
            <ShoppingCart size={20} />
            Vendas
          </NavLink>        
        </nav>

        <footer className="sidebar-footer">
          <NavLink 
            to="/financeiro" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            onClick={closeSidebar}
          >
            <DollarSign size={20} />
            Financeiro
          </NavLink>

          <NavLink 
            to="/configuracoes" 
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            onClick={closeSidebar}
          >
            <Settings size={20} />
            Configurações
          </NavLink>
        </footer>
      </aside>
    </>
  );

  // Renderiza diretamente no document.body para furar qualquer restrição do DOM pai
  return createPortal(sidebarContent, document.body);
}