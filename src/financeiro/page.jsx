import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Wallet, Percent, PlusCircle, Trash2, Edit } from 'lucide-react';
import { supabase } from '../supabaseCliente';
import './financeiro.css';

export default function Financeiro() {
  const [dadosAnuais, setDadosAnuais] = useState({});
  const [totalInvestido, setTotalInvestido] = useState(0);
  const [investimentos, setInvestimentos] = useState([]);
  
  // Estado para controlar o ID do item que está sendo editado (null = criando novo)
  const [idEditando, setIdEditando] = useState(null);

  // Estado para o formulário
  const [novoInvestimento, setNovoInvestimento] = useState({
    produto: '', loja: '', data: '', valor: '', forma_pagamento: '', observacoes: ''
  });

  useEffect(() => {
    carregarDadosFinanceiros();
  }, []);

  async function carregarDadosFinanceiros() {
    try {
      const { data: vendas } = await supabase.from('vendas').select('*');
      const { data: invest, error: errInvest } = await supabase
        .from('investimentos')
        .select('*')
        .order('id', { ascending: false });
      
      if (errInvest) console.error("Erro investimentos:", errInvest);

      setInvestimentos(invest || []);

      const somaInvestido = invest?.reduce((acc, curr) => acc + Number(curr.valor || curr.preco || 0), 0) || 0;
      setTotalInvestido(somaInvestido);

      const resumoAnos = {};
      vendas?.forEach(venda => {
        const dataRaw = venda.data || venda.data_venda || venda.created_at;
        let ano = null;

        if (dataRaw) {
          if (typeof dataRaw === 'string' && dataRaw.includes('/')) {
            const partes = dataRaw.split('/');
            ano = partes[2] ? partes[2].substring(0, 4) : null;
          } else {
            const d = new Date(dataRaw);
            if (!isNaN(d.getTime())) ano = d.getFullYear();
          }
        }

        if (ano) {
          const qtd = Number(venda.quantidade || venda.qtd || 1);
          const valorUnit = Number(venda.valor_unitario || venda.vender_por || venda.valor_venda || venda.valor || 0);
          const lucroUnit = Number(venda.lucro || venda.lucro_estimado || (valorUnit - Number(venda.custo || 0)));

          if (!resumoAnos[ano]) {
            resumoAnos[ano] = { totalVendas: 0, totalLucro: 0 };
          }
          resumoAnos[ano].totalVendas += valorUnit * qtd;
          resumoAnos[ano].totalLucro += lucroUnit * qtd;
        }
      });

      setDadosAnuais(resumoAnos);
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
    }
  }

  // Preenche o formulário com os dados do item selecionado para edição
  function handleIniciarEdicao(item) {
    setIdEditando(item.id);
    
    // Formata a data para YYYY-MM-DD para preencher o input type="date"
    let dataFormatada = '';
    if (item.data) {
      const d = new Date(item.data);
      if (!isNaN(d.getTime())) {
        dataFormatada = d.toISOString().split('T')[0];
      } else {
        dataFormatada = item.data;
      }
    }

    setNovoInvestimento({
      produto: item.produto || '',
      loja: item.loja || '',
      data: dataFormatada,
      valor: item.valor || item.preco || '',
      forma_pagamento: item.forma_pagamento || '',
      observacoes: item.observacoes || ''
    });
  }

  // Cancela a edição e limpa o formulário
  function handleCancelarEdicao() {
    setIdEditando(null);
    setNovoInvestimento({ produto: '', loja: '', data: '', valor: '', forma_pagamento: '', observacoes: '' });
  }

  // Função para salvar (INSERT ou UPDATE)
  async function handleSalvarInvestimento(e) {
    e.preventDefault();
    if (!novoInvestimento.produto || !novoInvestimento.valor || !novoInvestimento.data) {
      alert("Por favor, preencha Produto, Valor e Data!");
      return;
    }

    try {
      const dadosPayload = {
        produto: novoInvestimento.produto,
        loja: novoInvestimento.loja || null,
        data: novoInvestimento.data,
        valor: parseFloat(novoInvestimento.valor),
        forma_pagamento: novoInvestimento.forma_pagamento || null,
        observacoes: novoInvestimento.observacoes || null
      };

      if (idEditando) {
        // Atualiza lançamento existente
        const { error } = await supabase
          .from('investimentos')
          .update(dadosPayload)
          .eq('id', idEditando);

        if (error) throw error;
      } else {
        // Insere novo lançamento
        const { error } = await supabase
          .from('investimentos')
          .insert([dadosPayload]);

        if (error) throw error;
      }

      handleCancelarEdicao();
      carregarDadosFinanceiros();
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
    }
  }

  async function handleDeletarInvestimento(id) {
    if (window.confirm("Deseja realmente excluir este lançamento?")) {
      await supabase.from('investimentos').delete().eq('id', id);
      carregarDadosFinanceiros();
    }
  }

  const totalVendasGeral = Object.values(dadosAnuais).reduce((acc, curr) => acc + curr.totalVendas, 0);
  const totalLucroGeral = Object.values(dadosAnuais).reduce((acc, curr) => acc + curr.totalLucro, 0);
  const lucroRealGeral = totalLucroGeral - totalInvestido;

  return (
    <div className="financeiro-container">
      <div className="financeiro-header">
        <h1>Painel Financeiro</h1>
        <p>Gerenciamento de investimentos, balanço de vendas e lucros anuais.</p>
      </div>

      {/* COMPARATIVO ANUAL */}
      <div className="financeiro-tabela-anos-box">
        <h3>Comparativo Anual de Vendas e Lucros</h3>
        <div className="tabela-wrapper">
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
                .sort(([anoA], [anoB]) => anoB - anoA)
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

      {/* FORMULÁRIO DE LANÇAMENTO / EDIÇÃO */}
      <div className="financeiro-secao-compras">
        <div className="form-investimento-box">
          <h3>
            <PlusCircle size={18} style={{ marginRight: '8px' }} />
            {idEditando ? 'Editar Investimento' : 'Lançar Novo Investimento / Compra'}
          </h3>
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
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-salvar-financeiro">
                {idEditando ? 'Atualizar Lançamento' : 'Salvar Lançamento'}
              </button>
              {idEditando && (
                <button type="button" onClick={handleCancelarEdicao} className="btn-cancelar-edicao">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* TABELA COM AÇÕES (EDITAR + EXCLUIR) */}
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
                      {(() => {
                        const val = Number(item.valor || item.preco || item.custo || 0);
                        return (-val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                      })()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleIniciarEdicao(item)} className="btn-editar-linha" title="Editar">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeletarInvestimento(item.id)} className="btn-deletar-linha" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
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