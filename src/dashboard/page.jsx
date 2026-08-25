import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseCliente';
import './dashboard.css';

export default function Dashboard() {
  const [produtosEstoque, setProdutosEstoque] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    melhorMesAno: { mesAno: '-', qtd: 0 },
    modeloMaisVendido: { modelo: '-', qtd: 0 },
    tamanhoMaisVendido: { tamanho: '-', qtd: 0 }
  });

  // Estados dos Filtros
  const [busca, setBusca] = useState('');
  const [filtroModelo, setFiltroModelo] = useState('');
  const [filtroTamanho, setFiltroTamanho] = useState('');

  useEffect(() => {
    async function carregarDashboard() {
      try {
        setLoading(true);

        const { data: produtos, error: errProdutos } = await supabase
          .from('produtos')
          .select('*');

        if (errProdutos) throw errProdutos;

        const produtosEmEstoque = (produtos || [])
          .filter(item => {
            if (item.estoque === null || item.estoque === undefined) return false;
            const valorEstoque = String(item.estoque).trim().toUpperCase();
            return valorEstoque === 'SIM' || item.estoque === true || item.estoque === 1;
          })
          .map(item => ({
            id: item.id || Math.random(),
            modelo: item.modelo || item.descricao || item.produto || item.nome || 'Peça Pronta',
            tamanho: item.tamanho || '-',
            material: item.material || item.tecido || item.observacao || '-',
            vendaSugerida: Number(item.vender_por || item.venda || item.valor_venda || item.preco || 0)
          }));

        setProdutosEstoque(produtosEmEstoque);

        // 2. Cálculo dos Cards do Topo (Com fallbacks para nome de colunas)
      const { data: vendas } = await supabase.from('vendas').select('*');
      const fonteDados = (vendas && vendas.length > 0) ? vendas : (produtos || []);

      if (fonteDados.length > 0) {
        const contagemModelos = {};
        const contagemTamanhos = {};
        const contagemMeses = {};

        fonteDados.forEach(item => {
          // Busca o modelo tentando todos os nomes de colunas possíveis
          const mod = item.modelo || item.Modelo || item.descricao || item.Descricao || item.produto || item.nome;
          if (mod && String(mod).trim() !== '' && String(mod).trim() !== '-') {
            const modeloFormatado = String(mod).trim();
            contagemModelos[modeloFormatado] = (contagemModelos[modeloFormatado] || 0) + 1;
          }

          // Busca o tamanho
          const tam = item.tamanho || item.Tamanho;
          if (tam && String(tam).trim() !== '' && String(tam).trim() !== '-') {
            const tamanhoFormatado = String(tam).trim();
            contagemTamanhos[tamanhoFormatado] = (contagemTamanhos[tamanhoFormatado] || 0) + 1;
          }

          // Busca a data
          const dataItem = item.data_venda || item.created_at || item.data;
          if (dataItem) {
            const d = new Date(dataItem);
            if (!isNaN(d.getTime())) {
              const mesAno = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
              contagemMeses[mesAno] = (contagemMeses[mesAno] || 0) + 1;
            }
          }
        });

        const getMaior = (obj) => {
          const entries = Object.entries(obj);
          if (entries.length === 0) return ['-', 0];
          return entries.reduce((max, curr) => curr[1] > max[1] ? curr : max, ['-', 0]);
        };

        const [topModelo, qtdModelo] = getMaior(contagemModelos);
        const [topTamanho, qtdTamanho] = getMaior(contagemTamanhos);
        const [topMes, qtdMes] = getMaior(contagemMeses);

        setKpis({
          melhorMesAno: { mesAno: topMes, qtd: qtdMes },
          modeloMaisVendido: { modelo: topModelo, qtd: qtdModelo },
          tamanhoMaisVendido: { tamanho: topTamanho, qtd: qtdTamanho }
        });
      }

      } catch (err) {
        console.error("Erro ao carregar Dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    carregarDashboard();
  }, []);

  // Listas de opções dinâmicas para os Selects
  const listaModelos = useMemo(() => {
    const modelos = produtosEstoque.map(p => p.modelo).filter(Boolean);
    return Array.from(new Set(modelos)).sort();
  }, [produtosEstoque]);

  const listaTamanhos = useMemo(() => {
    const tamanhos = produtosEstoque.map(p => p.tamanho).filter(t => t && t !== '-');
    return Array.from(new Set(tamanhos)).sort();
  }, [produtosEstoque]);

  // Aplicação dos Filtros em tempo real
  const produtosFiltrados = useMemo(() => {
    return produtosEstoque.filter(item => {
      const termoBusca = busca.toLowerCase();
      const bateuBusca = 
        item.modelo.toLowerCase().includes(termoBusca) ||
        item.material.toLowerCase().includes(termoBusca) ||
        item.tamanho.toLowerCase().includes(termoBusca);

      const bateuModelo = filtroModelo === '' || item.modelo === filtroModelo;
      const bateuTamanho = filtroTamanho === '' || item.tamanho === filtroTamanho;

      return bateuBusca && bateuModelo && bateuTamanho;
    });
  }, [produtosEstoque, busca, filtroModelo, filtroTamanho]);

  return (
    <div className="dashboard-page">
      
      {/* CARDS KPI */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper blue">📅</div>
          <span className="kpi-title">Melhor Mês/Ano</span>
          <h3 className="kpi-value">{loading ? "Carregando..." : kpis.melhorMesAno.mesAno}</h3>
          <span className="kpi-sub">Qtd: {kpis.melhorMesAno.qtd} un</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper red">🎽</div>
          <span className="kpi-title">Modelo Mais Vendido</span>
          <h3 className="kpi-value">{loading ? "Carregando..." : kpis.modeloMaisVendido.modelo}</h3>
          <span className="kpi-sub">Qtd: {kpis.modeloMaisVendido.qtd} un</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper green">📐</div>
          <span className="kpi-title">Tamanho Mais Vendido</span>
          <h3 className="kpi-value">{loading ? "Carregando..." : kpis.tamanhoMaisVendido.tamanho}</h3>
          <span className="kpi-sub">Qtd: {kpis.tamanhoMaisVendido.qtd} un</span>
        </div>
      </div>

      {/* TABELA DE ESTOQUE + FILTROS */}
      <div className="table-card">
        <div className="table-header">
          <div className="table-header-icon">📦</div>
          <div>
            <h2 className="table-header-title">Resumo de Peças em Estoque (Produção)</h2>
            <p className="table-header-subtitle">Peças com estoque marcado como SIM</p>
          </div>
        </div>

        {/* BARRA DE FILTROS E PESQUISA */}
        <div className="filters-bar">
          <input
            type="text"
            className="filter-input"
            placeholder="🔍 Pesquisar por modelo ou tecido..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="filter-select"
            value={filtroModelo}
            onChange={(e) => setFiltroModelo(e.target.value)}
          >
            <option value="">Todos os Modelos</option>
            {listaModelos.map(mod => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filtroTamanho}
            onChange={(e) => setFiltroTamanho(e.target.value)}
          >
            <option value="">Todos os Tamanhos</option>
            {listaTamanhos.map(tam => (
              <option key={tam} value={tam}>{tam}</option>
            ))}
          </select>

          {(busca || filtroModelo || filtroTamanho) && (
            <button
              className="clear-filters-btn"
              onClick={() => { setBusca(''); setFiltroModelo(''); setFiltroTamanho(''); }}
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {loading ? (
          <p className="empty-state">Buscando dados no Supabase...</p>
        ) : produtosFiltrados.length === 0 ? (
          <p className="empty-state">Nenhum produto encontrado com os filtros selecionados.</p>
        ) : (
          <div className="custom-table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Tamanho</th>
                  <th>Material / Tecido</th>
                  <th>Venda Sugerida</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((item) => (
                  <tr key={item.id}>
                    <td className="text-bold">{item.modelo}</td>
                    <td>{item.tamanho}</td>
                    <td>{item.material}</td>
                    <td className="text-bold">
                      R$ {item.vendaSugerida.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}