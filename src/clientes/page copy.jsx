import React, { useState, useEffect } from 'react';
import './clientes.css';

export default function Clientes() {
  const [filtroCliente, setFiltroCliente] = useState('');
  const [historicoVendas, setHistoricoVendas] = useState([]);

  // 1. Carrega o histórico de vendas gerado na sua página de Vendas
  useEffect(() => {
    const vendasSalvas = localStorage.getItem('minhas_vendas_json');
    if (vendasSalvas) {
      setHistoricoVendas(JSON.parse(vendasSalvas));
    }
  }, []);

  // 2. FUNÇÃO QUE BUSCA AS MEDIDAS NOS ARQUIVOS DE ESTOQUE BASEADO NO NOME DO PRODUTO
  const buscarMedidasDoProduto = (nomeProduto) => {
    if (!nomeProduto) return { pescoco: '---', torax: '---', comprimento: '---' };

    const listasDeChaves = [
      'produtos_inverno_json',
      'produtos_meiaestacao_json',
      'produtos_verao_json',
      'produtos_artesanato_json',
      'produtos_encomendas_json'
    ];

    for (let chave of listasDeChaves) {
      const dadosBrutos = localStorage.getItem(chave);
      if (!dadosBrutos) continue;

      const produtos = JSON.parse(dadosBrutos);
      
      // Procura o produto pelo nome correspondente
      const encontrado = produtos.find(
        p => (p.modelo?.toLowerCase() === nomeProduto.toLowerCase()) || 
             (p.produto?.toLowerCase() === nomeProduto.toLowerCase())
      );

      if (encontrado) {
        return {
          pescoco: encontrado.pescoco || encontrado.Pescoço || encontrado.pescoço || '---',
          torax: encontrado.torax || encontrado.Tórax || encontrado.torax || '---',
          comprimento: encontrado.comprimento || encontrado.Comprimento || encontrado.compr || '---'
        };
      }
    }

    // Se não achar em nenhuma lista ou for item de casa (Artesanato sem medidas)
    return { pescoco: '---', torax: '---', comprimento: '---' };
  };

  // 3. Filtra a listagem pelo nome do cliente digitado no topo
  const vendasFiltradas = historicoVendas.filter(venda => {
    if (!filtroCliente.trim()) return true;
    return venda.cliente?.toLowerCase().includes(filtroCliente.toLowerCase());
  });

  return (
    <div className="clientes-container">
      
      <div className="titulo-secao-af">
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h1>Clientes e Histórico</h1>
      </div>

      <div className="painel-filtros-af">
        <div className="grupo-campo-af">
          <label>Filtrar por Cliente</label>
          <input 
            type="text" 
            placeholder="Digite o nome para pesquisar..." 
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
          />
        </div>
      </div>

      <div className="clientes-modulo-tabela-overflow">
        <div className="clientes-modulo-tabela-container">
          
          <div className="clientes-modulo-linha-head">
            <div>Data</div>
            <div>Cliente</div>
            <div>Pet</div>
            <div>Qtd</div>
            <div>Produto</div>
            <div>Tam.</div>
            {/* Novas colunas de Medidas adicionadas dinamicamente na tabela */}
            <div>Pescoço</div>
            <div>Tórax</div>
            <div>Compr.</div>
            <div>Valor Unit.</div>
            <div>Custo</div>
            <div>Pagamento</div>
            <div>Observação</div>
          </div>

          {vendasFiltradas.length === 0 ? (
            <div className="clientes-msg-vazia">
              {filtroCliente ? 'Nenhum registro encontrado para este filtro.' : 'Nenhuma venda cadastrada no sistema.'}
            </div>
          ) : (
            vendasFiltradas.map((venda) => {
              // Executa a busca automática de medidas usando o nome do produto atual da linha
              const medidas = buscarMedidasDoProduto(venda.produto);

              return (
                <div key={venda.id} className="clientes-modulo-linha-body">
                  <div>{venda.data ? venda.data.split('-').reverse().join('/') : '-'}</div>
                  <div style={{ fontWeight: '600' }}>{venda.cliente}</div>
                  <div>{venda.pet || '-'}</div>
                  <div>{venda.quantidade || 1}</div>
                  <div>{venda.produto}</div>
                  <div><span className="clientes-modulo-badge">{venda.tamanho || 'U'}</span></div>
                  
                  {/* Renderização das medidas encontradas de forma limpa */}
                  <div style={{ color: '#163357', fontWeight: '600' }}>{medidas.pescoco}</div>
                  <div style={{ color: '#163357', fontWeight: '600' }}>{medidas.torax}</div>
                  <div style={{ color: '#163357', fontWeight: '600' }}>{medidas.comprimento}</div>
                  
                  <div>R$ {parseFloat(venda.valorUnitario || 0).toFixed(2).replace('.', ',')}</div>
                  <div>R$ {parseFloat(venda.custo || 0).toFixed(2).replace('.', ',')}</div>
                  <div>{venda.formaPagamento || 'Dinheiro'}</div>
                  <div style={{ color: '#666666', fontStyle: 'italic' }}>{venda.observacao || ''}</div>
                </div>
              );
            })
          )}
          
        </div>
      </div>

    </div>
  );
}