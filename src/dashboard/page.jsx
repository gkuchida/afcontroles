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

  const [produtosEstoque, setProdutosEstoque] = useState([]);
  const [loadingEstoque, setLoadingEstoque] = useState(true);

  useEffect(() => {
    async function carregarDashboard() {
      try {
        setLoadingEstoque(true);

        // 1. BUSCA DADOS EM PARALELO NAS TABELAS
        const [resVendas, resProdutos, resModelos, resTamanhos] = await Promise.all([
          supabase.from('vendas').select('*'),
          supabase.from('produtos').select('*'),
          supabase.from('modelos').select('*'),
          supabase.from('tamanhos').select('*')
        ]);

        // Mapeamento rápido de IDs para Nomes
        const mapaModelos = {};
        (resModelos.data || []).forEach(m => { mapaModelos[m.id] = m.nome; });

        const mapaTamanhos = {};
        (resTamanhos.data || []).forEach(t => { mapaTamanhos[t.id] = t.nome; });

        const mapaProdutos = {};
        (resProdutos.data || []).forEach(p => { mapaProdutos[p.id] = p; });

        // --- 2. PROCESSA MÉTRICAS DE VENDAS ---
        const vendas = resVendas.data || [];
        if (vendas.length > 0) {
          const agrupadoPorMes = {};
          const contagemModelos = {};
          const contagemTamanhos = {};

          vendas.forEach(venda => {
            const qtd = Number(venda.quantidade) || 1;
            const dataVenda = venda.data_venda || venda.created_at;
            
            const prod = mapaProdutos[venda.produto_id];
            const nomeModelo = prod ? mapaModelos[prod.modelo_id] || 'Outros' : 'Outros';
            const nomeTamanho = prod ? mapaTamanhos[prod.tamanho_id] || '-' : '-';

            if (dataVenda) {
              const partesData = String(dataVenda).split('T')[0].split('-');
              if (partesData.length >= 2) {
                const mesAno = `${partesData[1]}/${partesData[0]}`;
                agrupadoPorMes[mesAno] = (agrupadoPorMes[mesAno] || 0) + qtd;
              }
            }

            contagemModelos[nomeModelo] = (contagemModelos[nomeModelo] || 0) + qtd;
            contagemTamanhos[nomeTamanho] = (contagemTamanhos[nomeTamanho] || 0) + qtd;
          });

          let melhorMesAno = 'Sem dados', maxVendasMes = 0;
          Object.entries(agrupadoPorMes).forEach(([mes, total]) => {
            if (total > maxVendasMes) { maxVendasMes = total; melhorMesAno = mes; }
          });

          let modeloMaisVendido = 'Sem dados', maxModelo = 0;
          Object.entries(contagemModelos).forEach(([mod, total]) => {
            if (total > maxModelo) { maxModelo = total; modeloMaisVendido = mod; }
          });

          let tamanhoMaisVendido = 'Sem dados', maxTamanho = 0;
          Object.entries(contagemTamanhos).forEach(([tam, total]) => {
            if (total > maxTamanho) { maxTamanho = total; tamanhoMaisVendido = tam; }
          });

          setMetricas({
            melhorMesAno,
            quantidadeVendas: maxVendasMes,
            modeloMaisVendido,
            tamanhoMaisVendido
          });
        } else {
          setMetricas({
            melhorMesAno: 'Nenhuma venda',
            quantidadeVendas: 0,
            modeloMaisVendido: 'Nenhum',
            tamanhoMaisVendido: 'Nenhum'
          });
        }

        // --- 3. PROCESSA PRODUTOS FILTRANDO POR ESTOQUE = "SIM" ---
        const produtos = resProdutos.data || [];
        
        const listaFormatada = produtos
          .filter(item => {
            const statusEstoque = String(item.estoque || '').trim().toLowerCase();
            return statusEstoque === 'sim'; // Verifica se a coluna estoque é igual a "sim"
          })
          .map(item => ({
            id: item.id,
            modelo: mapaModelos[item.modelo_id] || 'Sem Modelo',
            tamanho: mapaTamanhos[item.tamanho_id] || '-',
            material: item.tecido || item.observacao || '-',
            vendaSugerida: Number(item.valor_venda) || 0
          }));

        setProdutosEstoque(listaFormatada);

      } catch (err) {
        console.error("Erro geral no dashboard:", err);
        setMetricas({
          melhorMesAno: 'Erro no banco',
          quantidadeVendas: 0,
          modeloMaisVendido: 'Erro no banco',
          tamanhoMaisVendido: 'Erro no banco'
        });
      } finally {
        setLoadingEstoque(false);
      }
    }

    carregarDashboard();
  }, []);

  return (
    <div className="dashboard-container">
      
      {/* Banner Principal */}
      <div className="dashboard-welcome-box">
        <div className="welcome-text">
          <h1>Olá! Bem-vindo ao AF Sistemas</h1>
          <p>O painel de controle da sua produção está pronto para monitoramento.</p>
        </div>
        <div className="welcome-icon-wrapper">
          <LayoutDashboard size={48} color="white" strokeWidth={1.5} />
        </div>
      </div>

      {/* Cards de Métricas */}
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

      {/* Resumo de Produção em Estoque */}
      <div className="dashboard-full-card">
        <div className="full-card-header">
          <div className="card-icon bg-verde" style={{ backgroundColor: '#22c55e', color: 'white', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
            <PackageCheck size={22} />
          </div>
          <div style={{ marginLeft: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>Resumo de Peças em Estoque (Produção)</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Peças com estoque marcado como SIM</p>
          </div>
        </div>

        <div className="full-card-body">
          {loadingEstoque ? (
            <p className="loading-text">Buscando dados no Supabase...</p>
          ) : produtosEstoque.length === 0 ? (
            <p className="empty-text">Nenhuma peça com estoque marcado como "sim" no momento.</p>
          ) : (
            /* A div abaixo controla o Scroll */
            <div className="estoque-table-wrapper">
              <table className="estoque-table">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Tamanho</th>
                    <th>Material</th>
                    <th>Venda Sugerida</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosEstoque.map((item) => (
                    <tr key={item.id}>
                      <td className="font-bold">{item.modelo}</td>
                      <td><span className="badge-tamanho">{item.tamanho}</span></td>
                      <td className="text-muted">{item.material}</td>
                      <td className="valor-venda">
                        {item.vendaSugerida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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