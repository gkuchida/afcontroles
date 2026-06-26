// src/dashboard/page.jsx
import React from 'react';
import { LayoutDashboard, Package, TrendingUp, Users } from 'lucide-react';
import './dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      
      {/* Banner Principal com a paleta solicitada */}
      <div className="dashboard-welcome-box">
        <div className="welcome-text">
          <h1>Olá! Bem-vindo ao AF Sistemas</h1>
          <p>O painel de controle do seu estoque está pronto para monitoramento.</p>
        </div>
        <div className="welcome-icon-wrapper">
          <LayoutDashboard size={48} color="white" strokeWidth={1.5} />
        </div>
      </div>

      {/* Cards de Métricas para Teste de Tela Cheia */}
      <div className="dashboard-grid">
        
        <div className="dashboard-card">
          <div className="card-icon bg-azul">
            <Package size={22} />
          </div>
          <div className="card-info">
            <h3>Itens Cadastrados</h3>
            <p>203</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon bg-laranja">
            <TrendingUp size={22} />
          </div>
          <div className="card-info">
            <h3>Movimentações</h3>
            <p>Em breve</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon bg-rosa">
            <Users size={22} />
          </div>
          <div className="card-info">
            <h3>Clientes Ativos</h3>
            <p>Em breve</p>
          </div>
        </div>

      </div>

    </div>
  );
}