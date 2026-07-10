// src/dashboard/page.jsx
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Shirt, Ruler, PackageCheck } from 'lucide-react';
import { supabase } from '../supabaseCliente';
import './dashboard.css';

export default function Dashboard() {
  const [metricas, setMetricas] = useState({
    melhorMesAno: 'Carregando...',
    quantidadeVendas: 0,
    modeloMaisVendido: 'Carregando...',
    tamanhoMaisVendido: 'Carregando...'
  });

  // Novo estado para guardar a lista de produtos em estoque
  const [produtosEstoque, setProdutosEstoque] = useState([]);
  const [loadingEstoque, setLoadingEstoque] = useState(true);

  useEffect(() => {
    async function carregarDadosDoSupabase() {
      try {
        // --- 1. BUSCA DADOS DE VENDAS PARA OS CARDS MENORES ---
        const { data: vendas, error: errorVendas } = await supabase
          .from('vendas')
          .select('data, produto, tamanho, quantidade');

        if (errorVendas) throw errorVendas;

        if (vendas && vendas.length > 0) {
          const agrupadoPorMes = {};
          const contagemModelos = {};
          const contagemTamanhos = {};

          vendas.forEach(venda => {
            const qtd = Number(venda.quantidade) || 1;

            if (venda.data) {
              const dataObjeto = new Date(venda.data);
              const mesAno = `${String(dataObjeto.getMonth() + 1).padStart(2, '0')}/${dataObjeto.getFullYear()}`;
              agrupadoPorMes[mesAno] = (agrupadoPorMes[mesAno] || 0) + qtd;
            }
            if (venda.produto) {
              contagemModelos[venda.produto] = (contagemModelos[venda.produto] || 0) + qtd;
            }
            if (venda.tamanho) {
              contagemTamanhos[venda.tamanho] = (contagemTamanhos[venda.tamanho] || 0) + qtd;
            }
          });

          let melhorMesAno = 'Sem dados';
          let maxVendasMes = 0;
          Object.entries(agrupadoPorMes).forEach(([mesAno, total]) => {
            if (total > maxVendasMes) { maxVendasMes = total; melhorMesAno = mesAno; }
          });

          let modeloMaisVendido = 'Sem dados';
          let maxModelo = 0;
          Object.entries(contagemModelos).forEach(([modelo, total]) => {
            if (total > maxModelo) { maxModelo = total; modeloMaisVendido = modelo; }
          });

          let tamanhoMaisVendido = 'Sem dados';
          let maxTamanho = 0;
          Object.entries(contagemTamanhos).forEach(([tamanho, total]) => {
            if (total > maxTamanho) { maxTamanho = total; tamanhoMaisVendido = tamanho; }
          });

          setMetricas({
            melhorMesAno,
            quantidadeVendas: maxVendasMes,
            modeloMaisVendido,
            tamanhoMaisVendido
          });
        }
      } catch (erro) {
        console.error("Erro ao carregar métricas de vendas:", erro);
      }
    }

    async function carregarEstoqueTabelas() {
      try {
        setLoadingEstoque(true);
        // Lista das tabelas que contêm produtos
        const tabelas = ['inverno', 'verao', 'meiaestacao', 'artesanato'];

        // Faz o fetch em todas as tabelas em paralelo para melhor performance
        const promises = tabelas.map(tabela =>
          supabase
            .from(tabela)
            .select('estoque_qtd, tamanho, modelo, caracteristicas, vender_por')
            .gte('estoque_qtd', 1) // Filtra direto no Supabase quem tem estoque >= 1
        );

        const resultados = await Promise.all(promises);
        
        let todosProdutos = [];
        resultados.forEach((res, index) => {
          if (res.error) {
            console.error(`Erro ao buscar da tabela ${tabelas[index]}:`, res.error);
          } else if (res.data) {
            // Adiciona a categoria/tabela de origem apenas para fins informativos se precisar
            const produtosFormatados = res.data.map(p => ({ ...p, categoria: tabelas[index] }));
            todosProdutos = [...todosProdutos, ...produtosFormatados];
          }
        });

        // Ordena por maior quantidade em estoque
        todosProdutos.sort((a, b) => b.estoque_qtd - a.estoque_qtd);

        setProdutosEstoque(todosProdutos);
      } catch (error) {
        console.error("Erro geral ao carregar estoque:", error);
      } finally {
        setLoadingEstoque(false);
      }
    }

    carregarDadosDoSupabase();
    carregarEstoqueTabelas();
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

      {/* Cards de Métricas Menores */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-icon bg-azul"><Calendar size={22} /></div>
          <div className="card-info">
            <h3>Melhor Mês/Ano</h3>
            <p>{metricas.melhorMesAno}</p>
            <small style={{ color: '#666', fontWeight: '500' }}>Qtd: {metricas.quantidadeVendas} un</small>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon bg-laranja"><Shirt size={22} /></div>
          <div className="card-info">
            <h3>Modelo Mais Vendido</h3>
            <p>{metricas.modeloMaisVendido}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon bg-rosa"><Ruler size={22} /></div>
          <div className="card-info">
            <h3>Tamanho Mais Vendido</h3>
            <p>{metricas.tamanhoMaisVendido}</p>
          </div>
        </div>
      </div>

      {/* NOVO CARD: Resumo de Produtos em Estoque (Largura Toda) */}
      <div className="dashboard-full-card">
        <div className="full-card-header">
          <div className="card-icon bg-verde" style={{ backgroundColor: '#22c55e', color: 'white', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
            <PackageCheck size={22} />
          </div>
          <div style={{ marginLeft: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>Resumo de Produtos em Estoque</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Produtos disponíveis com quantidade igual ou maior que 1</p>
          </div>
        </div>

        <div className="full-card-body">
          {loadingEstoque ? (
            <p className="loading-text">Buscando estoque nas tabelas...</p>
          ) : produtosEstoque.length === 0 ? (
            <p className="empty-text">Nenhum produto com estoque disponível no momento.</p>
          ) : (
            <div className="estoque-table-wrapper">
              <table className="estoque-table">
                <thead>
                  <tr>
                    <th>Modelo</th>                    
                    <th>Características</th>
                    <th>Tamanho</th>
                    <th>Qtd Estoque</th>
                    <th>Valor de Venda</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosEstoque.map((produto, index) => (
                    <tr key={index}>
                      <td className="font-bold">{produto.modelo || '-'}</td>                      
                      <td className="text-muted">{produto.caracteristicas || '-'}</td>
                      <td><span className="badge-tamanho">{produto.tamanho || '-'}</span></td>
                      <td className="font-bold estoque-qtd">{produto.estoque_qtd} un</td>
                      <td className="valor-venda">
                        {produto.vender_por 
                          ? Number(produto.vender_por).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : 'R$ 0,00'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}