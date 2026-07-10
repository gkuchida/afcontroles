import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseCliente';
import './clientes.css';

export default function Clientes() {
  const [filtroCliente, setFiltroCliente] = useState('');
  const [historicoVendas, setHistoricoVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // 1. Carrega o histórico de vendas diretamente do Supabase
  useEffect(() => {
    fetchHistoricoVendas();
  }, []);

  async function fetchHistoricoVendas() {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .order('data', { ascending: false }); // Lista as vendas mais recentes no topo

      if (error) throw error;
      if (data) setHistoricoVendas(data);
    } catch (error) {
      console.error('Erro ao buscar histórico de vendas:', error.message);
      alert('Não foi possível carregar o histórico de vendas do banco de dados.');
    } finally {
      setCarregando(false);
    }
  }

  // 2. FUNÇÃO QUE BUSCA AS MEDIDAS NOS ARQUIVOS DE ESTOQUE (Mantido original via localStorage)
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
            <div>Pescoço</div>
            <div>Tórax</div>
            <div>Compr.</div>
            <div>Valor Unit.</div>
            <div>Custo</div>
            <div>Pagamento</div>
            <div>Observação</div>
          </div>

          {carregando ? (
            <div className="clientes-msg-vazia">Carregando dados do servidor...</div>
          ) : vendasFiltradas.length === 0 ? (
            <div className="clientes-msg-vazia">
              {filtroCliente ? 'Nenhum registro encontrado para este filtro.' : 'Nenhuma venda cadastrada no sistema.'}
            </div>
          ) : (
            vendasFiltradas.map((venda) => {
              // Mapeamento seguro das chaves vindas do Supabase (snake_case)
              const vData = venda.data;
              const vCliente = venda.cliente;
              const vPet = venda.pet;
              const vQuantidade = venda.quantidade;
              const vProduto = `${venda.carregando} ${venda.produto}`
              const vTamanho = venda.tamanho;
              const vValorUnitario = venda.valor_unitario ?? venda.valorUnitario;
              const vCusto = venda.custo;
              const vFormaPagamento = venda.forma_pagamento ?? venda.formaPagamento;
              const vObservacao = venda.observacao;

              // Executa a busca automática de medidas locais usando o nome do produto
              const medidas = buscarMedidasDoProduto(vProduto);

              return (
                <div key={venda.id} className="clientes-modulo-linha-body">
                  <div>{vData ? vData.split('-').reverse().join('/') : '-'}</div>
                  <div style={{ fontWeight: '600' }}>{vCliente}</div>
                  <div>{vPet || '-'}</div>
                  <div>{vQuantidade || 1}</div>
                  <div>{vProduto}</div>
                  <div><span className="clientes-modulo-badge">{vTamanho || 'U'}</span></div>
                  
                  {/* Medidas locais */}
                  <div style={{ color: '#163357', fontWeight: '600' }}>{medidas.pescoco}</div>
                  <div style={{ color: '#163357', fontWeight: '600' }}>{medidas.torax}</div>
                  <div style={{ color: '#163357', fontWeight: '600' }}>{medidas.comprimento}</div>
                  
                  <div>R$ {parseFloat(vValorUnitario || 0).toFixed(2).replace('.', ',')}</div>
                  <div>R$ {parseFloat(vCusto || 0).toFixed(2).replace('.', ',')}</div>
                  <div>{vFormaPagamento || 'Dinheiro'}</div>
                  <div style={{ color: '#666666', fontStyle: 'italic' }}>{vObservacao || ''}</div>
                </div>
              );
            })
          )}
          
        </div>
      </div>

    </div>
  );
}