import React, { useState, useEffect } from 'react';
import './Clientes.css';

export default function Clientes() {
  const [filtroCliente, setFiltroCliente] = useState('');
  const [historicoVendas, setHistoricoVendas] = useState([]);

  // Puxa automaticamente as vendas que foram lançadas pela outra página
  useEffect(() => {
    // IMPORTANTE: use aqui exatamente a mesma chave que sua página de vendas usa no localStorage
    const vendasSalvas = localStorage.getItem('af_sistema_vendas'); 
    if (vendasSalvas) {
      setHistoricoVendas(JSON.parse(vendasSalvas));
    }
  }, []);

  // Filtra as linhas dinamicamente caso você digite o nome de algum cliente específico
  const vendasFiltradas = historicoVendas.filter(venda => 
    venda.cliente?.toLowerCase().includes(filtroCliente.toLowerCase())
  );

  return (
    <div className="clientes-container">
      
      {/* Título da Página */}
      <div className="titulo-secao-af">
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Histórico Geral de Clientes
      </div>

      {/* Barra de pesquisa simples para achar o histórico de alguém rápido */}
      <div className="painel-filtros-af">
        <div className="grupo-campo-af">
          <label>Filtrar por Cliente</label>
          <input 
            type="text" 
            placeholder="Digite o nome para filtrar..." 
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
          />
        </div>
      </div>

      {/* Estrutura da Tabela - Idêntica à tela de Vendas */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
        <table className="tabela-af">
          <thead>
            <tr>
              <th>Data</th>
              <th>Cliente</th>
              <th>Pet</th>
              <th>Qtd</th>
              <th>Produto</th>
              <th>Tam.</th>
              <th>Valor Unit.</th>
              <th>Valor Final (Linha)</th>
              <th>Total do Dia Cliente</th>
              <th>Custo</th>
              <th>Lucro</th>
              <th>Pagamento</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {vendasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="13" className="msg-vazia-af">
                  {filtroCliente ? 'Nenhuma venda encontrada para este filtro.' : 'Nenhuma venda lançada no sistema até o momento.'}
                </td>
              </tr>
            ) : (
              vendasFiltradas.map((venda, index) => (
                <tr key={venda.id || index}>
                  <td>{venda.data}</td>
                  <td className="txt-bold">{venda.cliente}</td>
                  <td>{venda.pet || '---'}</td>
                  <td>{venda.qtd || venda.quantidade || 1}</td>
                  <td>{venda.produto || venda.modelo}</td>
                  <td>
                    <span className="badge-tam-af">{venda.tam || venda.tamanho || 'U'}</span>
                  </td>
                  <td>{venda.valorUnit || venda.valor}</td>
                  <td>{venda.valorFinalLinha || venda.valor}</td>
                  <td className="txt-verde-af">{venda.totalDiaCliente || venda.valor}</td>
                  <td className="txt-vermelho-af">{venda.custo || '---'}</td>
                  <td className="txt-azul-af">{venda.lucro || '---'}</td>
                  <td>{venda.formaPagamento || venda.pagamento || 'Dinheiro'}</td>
                  <td style={{ color: '#666666', fontStyle: 'italic' }}>{venda.observacao}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}