// src/dashboard/page.jsx
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Shirt, Ruler } from 'lucide-react';
import { supabase } from '../supabaseCliente';
import './dashboard.css';

export default function Dashboard() {
  const [metricas, setMetricas] = useState({
    melhorMesAno: 'Carregando...',
    quantidadeVendas: 0,
    modeloMaisVendido: 'Carregando...',
    tamanhoMaisVendido: 'Carregando...'
  });

  useEffect(() => {
    async function carregarDadosDoSupabase() {
      try {
        // 1. Busca todas as vendas do banco de dados
        // Certifique-se de que os nomes das colunas (data, produto, tamanho, quantidade) estão iguais aos do seu banco
        const { data: vendas, error } = await supabase
          .from('vendas')
          .select('data, produto, tamanho, quantidade');

        if (error) throw error;

        if (!vendas || vendas.length === 0) {
          setMetricas({
            melhorMesAno: 'Sem dados',
            quantidadeVendas: 0,
            modeloMaisVendido: 'Sem dados',
            tamanhoMaisVendido: 'Sem dados'
          });
          return;
        }

        // --- LÓGICA 1: Agrupar por Mês/Ano e somar as quantidades ---
        const agrupadoPorMes = {};
        // --- LÓGICA 2: Contar ocorrências de cada Modelo (produto) ---
        const contagemModelos = {};
        // --- LÓGICA 3: Contar ocorrências de cada Tamanho ---
        const contagemTamanhos = {};

        vendas.forEach(venda => {
          const qtd = Number(venda.quantidade) || 1;

          // Processando Mês/Ano (Tratando o campo data)
          if (venda.data) {
            const dataObjeto = new Date(venda.data);
            // Formata para "MM/AAAA" (ex: "03/2026")
            const mesAno = `${String(dataObjeto.getMonth() + 1).padStart(2, '0')}/${dataObjeto.getFullYear()}`;
            agrupadoPorMes[mesAno] = (agrupadoPorMes[mesAno] || 0) + qtd;
          }

          // Processando Modelo (campo produto)
          if (venda.produto) {
            contagemModelos[venda.produto] = (contagemModelos[venda.produto] || 0) + qtd;
          }

          // Processando Tamanho
          if (venda.tamanho) {
            contagemTamanhos[venda.tamanho] = (contagemTamanhos[venda.tamanho] || 0) + qtd;
          }
        });

        // Descobrindo o melhor mês/ano
        let melhorMesAno = 'Sem dados';
        let maxVendasMes = 0;
        Object.entries(agrupadoPorMes).forEach(([mesAno, total]) => {
          if (total > maxVendasMes) {
            maxVendasMes = total;
            melhorMesAno = mesAno;
          }
        });

        // Descobrindo o modelo mais vendido
        let modeloMaisVendido = 'Sem dados';
        let maxModelo = 0;
        Object.entries(contagemModelos).forEach(([modelo, total]) => {
          if (total > maxModelo) {
            maxModelo = total;
            modeloMaisVendido = modelo;
          }
        });

        // Descobrindo o tamanho mais vendido
        let tamanhoMaisVendido = 'Sem dados';
        let maxTamanho = 0;
        Object.entries(contagemTamanhos).forEach(([tamanho, total]) => {
          if (total > maxTamanho) {
            maxTamanho = total;
            tamanhoMaisVendido = tamanho;
          }
        });

        // Atualiza a tela com os dados calculados direto do Supabase
        setMetricas({
          melhorMesAno,
          quantidadeVendas: maxVendasMes,
          modeloMaisVendido,
          tamanhoMaisVendido
        });

      } catch (erro) {
        console.error("Erro ao conectar com o Supabase:", erro);
        setMetricas({
          melhorMesAno: 'Erro',
          quantidadeVendas: 0,
          modeloMaisVendido: 'Erro ao carregar',
          tamanhoMaisVendido: 'Erro ao carregar'
        });
      }
    }

    carregarDadosDoSupabase();
  }, []);

  return (
    <div className="dashboard-container">
      
      {/* Banner Principal */}
      <div className="dashboard-welcome-box">
        <div className="welcome-text">
          <h1>Olá! Bem-vindo ao AF Sistemas</h1>
          <p>O painel de controle do seu estoque está pronto para monitoramento.</p>
        </div>
        <div className="welcome-icon-wrapper">
          <LayoutDashboard size={48} color="white" strokeWidth={1.5} />
        </div>
      </div>

      {/* Cards de Métricas vindos do Supabase */}
      <div className="dashboard-grid">
        
        {/* Card 1 - Mês e Ano recordista */}
        <div className="dashboard-card">
          <div className="card-icon bg-azul">
            <Calendar size={22} />
          </div>
          <div className="card-info">
            <h3>Melhor Mês/Ano</h3>
            <p>{metricas.melhorMesAno}</p>
            <small style={{ color: '#666', fontWeight: '500' }}>
              Qtd: {metricas.quantidadeVendas} un
            </small>
          </div>
        </div>

        {/* Card 2 - Modelo mais vendido */}
        <div className="dashboard-card">
          <div className="card-icon bg-laranja">
            <Shirt size={22} />
          </div>
          <div className="card-info">
            <h3>Modelo Mais Vendido</h3>
            <p>{metricas.modeloMaisVendido}</p>
          </div>
        </div>

        {/* Card 3 - Tamanho mais vendido */}
        <div className="dashboard-card">
          <div className="card-icon bg-rosa">
            <Ruler size={22} />
          </div>
          <div className="card-info">
            <h3>Tamanho Mais Vendido</h3>
            <p>{metricas.tamanhoMaisVendido}</p>
          </div>
        </div>

      </div>

    </div>
  );
}