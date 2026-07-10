// src/financeiro/page.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Wallet, Percent, PlusCircle, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseCliente';
import './financeiro.css';

export default function Financeiro() {
  // Estados para os cards comparativos (Vendas e Lucro por Ano)
  const [dadosAnuais, setDadosAnuais] = useState({});
  const [totalInvestido, setTotalInvestido] = useState(0);

  // Estados para a tabela de investimentos lançados
  const [investimentos, setInvestimentos] = useState([]);
  
  // Estado para o formulário de novo investimento
  const [novoInvestimento, setNovoInvestimento] = useState({
    produto: '', loja: '', data: '', valor: '', forma_pagamento: '', observacoes: ''
  });

  useEffect(() => {
    carregarDadosFinanceiros();
  }, []);

  async function carregarDadosFinanceiros() {
    try {
      // 1. Busca dados da tabela 'vendas' para calcular os anos
      const { data: vendas, error: errVendas } = await supabase
        .from('vendas')
        .select('data, valor_unitario, lucro, quantidade');
      if (errVendas) throw errVendas;

      // 2. Busca dados da tabela 'investimentos'
      const { data: invest, error: errInvest } = await supabase
        .from('investimentos')
        .select('*')
        .order('data', { ascending: false });
      if (errInvest) throw errInvest;

      setInvestimentos(invest || []);

      // Calcular o total acumulado de investimentos
      const somaInvestido = invest?.reduce((acc, curr) => acc + Number(curr.valor || 0), 0) || 0;
      setTotalInvestido(somaInvestido);

      // Processar vendas e lucros por ano
      const resumoAnos = {};
      vendas?.forEach(venda => {
        if (venda.data) {
          const ano = new Date(venda.data).getFullYear();
          const qtd = Number(venda.quantidade || 1);
          const totalVendaItem = Number(venda.valor_unitario || 0) * qtd;
          const totalLucroItem = Number(venda.lucro || 0) * qtd;

          if (!resumoAnos[ano]) {
            resumoAnos[ano] = { totalVendas: 0, totalLucro: 0 };
          }
          resumoAnos[ano].totalVendas += totalVendaItem;
          resumoAnos[ano].totalLucro += totalLucroItem;
        }
      });

      setDadosAnuais(resumoAnos);

    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
    }
  }

  // Função para salvar uma nova compra no Supabase
  async function handleSalvarInvestimento(e) {
    e.preventDefault();
    if (!novoInvestimento.produto || !novoInvestimento.valor || !novoInvestimento.data) {
      alert("Por favor, preencha Produto, Valor e Data!");
      return;
    }

    try {
      const { error } = await supabase
        .from('investimentos')
        .insert([{
          produto: novoInvestimento.produto,
          loja: novoInvestimento.loja || null,
          data: novoInvestimento.data,
          valor: parseFloat(novoInvestimento.valor),
          forma_pagamento: novoInvestimento.forma_pagamento || null,
          observacoes: novoInvestimento.observacoes || null
        }]);

      if (error) throw error;

      // Limpa formulário e recarrega a tela
      setNovoInvestimento({ produto: '', loja: '', data: '', valor: '', forma_pagamento: '', observacoes: '' });
      carregarDadosFinanceiros();
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
    }
  }

  // Função opcional para deletar um registro
  async function handleDeletarInvestimento(id) {
    if (window.confirm("Deseja realmente excluir este lançamento?")) {
      await supabase.from('investimentos').delete().eq('id', id);
      carregarDadosFinanceiros();
    }
  }

  // Cálculo das métricas gerais (Soma de todas as vendas históricas)
  const totalVendasGeral = Object.values(dadosAnuais).reduce((acc, curr) => acc + curr.totalVendas, 0);
  const totalLucroGeral = Object.values(dadosAnuais).reduce((acc, curr) => acc + curr.totalLucro, 0);
  const lucroRealGeral = totalLucroGeral - totalInvestido;

  return (
    <div className="financeiro-container">
      <div className="financeiro-header">
        <h1>Painel Financeiro</h1>
        <p>Gerenciamento de investimentos, balanço de vendas e lucros anuais.</p>
      </div>

      {/* COMPARATIVO DE VENDAS POR ANO */}
      <div className="financeiro-tabela-anos-box">
        <h3>Comparativo Anual de Vendas e Lucros</h3>
        <table className="tabela-financeira-anos">
          <thead>
            <tr>
              <th>Ano</th>
              <th>Vendas Totais</th>
              <th>Lucro Estimado</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(dadosAnuais)
              .sort(([anoA], [anoB]) => anoB - anoA) // Mostra o ano mais recente primeiro
              .map(([ano, valores]) => (
                <tr key={ano}>
                  <td className="ano-coluna">{ano}</td>
                  <td className="cor-vendas font-bold">
                    {valores.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="cor-lucro font-bold">
                    {valores.totalLucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            {Object.keys(dadosAnuais).length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: '#666' }}>
                  Nenhum dado de venda encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TOTAIS CONSOLIDADOS */}
      <div className="dashboard-grid" style={{ marginTop: '20px' }}>
        <div className="dashboard-card">
          <div className="card-icon bg-laranja"><Wallet size={22} /></div>
          <div className="card-info">
            <h3>Total Investido</h3>
            <p style={{ color: '#dc2626' }}>{totalInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-icon bg-azul"><TrendingUp size={22} /></div>
          <div className="card-info">
            <h3>Total de Vendas</h3>
            <p>{totalVendasGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="card-icon bg-rosa"><Percent size={22} /></div>
          <div className="card-info">
            <h3>Lucro Real (Lucro - Investimento)</h3>
            <p style={{ color: lucroRealGeral >= 0 ? '#16a34a' : '#dc2626' }}>
              {lucroRealGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO DE LANÇAMENTO */}
      <div className="financeiro-secao-compras">
        <div className="form-investimento-box">
          <h3><PlusCircle size={18} style={{ marginRight: '8px' }} /> Lançar Novo Investimento / Compra</h3>
          <form onSubmit={handleSalvarInvestimento} className="form-financeiro">
            <div className="form-group">
              <label>Nome do Produto/Item *</label>
              <input type="text" value={novoInvestimento.produto} onChange={e => setNovoInvestimento({...novoInvestimento, produto: e.target.value})} placeholder="Ex: Overloque S0105" required />
            </div>
            <div className="form-group">
              <label>Loja/Fornecedor</label>
              <input type="text" value={novoInvestimento.loja} onChange={e => setNovoInvestimento({...novoInvestimento, loja: e.target.value})} placeholder="Ex: Mercado Livre" />
            </div>
            <div className="form-row-duplo">
              <div className="form-group">
                <label>Data da Compra *</label>
                <input type="date" value={novoInvestimento.data} onChange={e => setNovoInvestimento({...novoInvestimento, data: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Valor (R$) *</label>
                <input type="number" step="0.01" value={novoInvestimento.valor} onChange={e => setNovoInvestimento({...novoInvestimento, valor: e.target.value})} placeholder="0.00" required />
              </div>
            </div>
            <div className="form-group">
              <label>Forma de Pagamento</label>
              <select value={novoInvestimento.forma_pagamento} onChange={e => setNovoInvestimento({...novoInvestimento, forma_pagamento: e.target.value})}>
                <option value="">Selecione...</option>
                <option value="Pix">Pix</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Boleto">Boleto</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Observações</label>
              <textarea value={novoInvestimento.observacoes} onChange={e => setNovoInvestimento({...novoInvestimento, observacoes: e.target.value})} placeholder="Detalhes adicionais..." rows="2" />
            </div>
            <button type="submit" className="btn-salvar-financeiro">Salvar Lançamento</button>
          </form>
        </div>

        {/* TABELA DE INVESTIMENTOS REALIZADOS */}
        <div className="tabela-investimentos-box">
          <h3>Histórico de Compras e Investimentos</h3>
          <div className="estoque-table-wrapper">
            <table className="estoque-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Produto</th>
                  <th>Loja</th>
                  <th>Data</th>
                  <th>Forma Pgto</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {investimentos.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td className="font-bold">{item.produto}</td>
                    <td>{item.loja || '-'}</td>
                    <td>{new Date(item.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td><span className="badge-tamanho">{item.forma_pagamento || '-'}</span></td>
                    <td style={{ color: '#dc2626', fontWeight: 600 }}>
                      {-Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td>
                      <button onClick={() => handleDeletarInvestimento(item.id)} className="btn-deletar-linha" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}