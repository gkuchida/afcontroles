import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus } from 'lucide-react';
import { supabase } from '../supabaseCliente';
import './vendas.css'; 

export default function Vendas() {
  const [vendas, setVendas] = useState([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);

  const [novaVenda, setNovaVenda] = useState({
    data: new Date().toISOString().split('T')[0], 
    cliente: '',
    pet: '',
    quantidade: 1,
    produto: '', 
    tamanho: 'U',
    caracteristicas: '',
    valorUnitario: '',
    formaPagamento: 'Dinheiro',
    observacao: ''
  });

  // 1. Carrega as vendas vindas do Supabase ao montar o componente
  useEffect(() => {
    fetchVendas();
  }, []);

  async function fetchVendas() {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      if (data) setVendas(data);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error.message);
      alert('Erro ao carregar dados do banco de dados.');
    }
  }

  // 2. Carrega os produtos varrendo as tabelas reais do Supabase
  useEffect(() => {
    async function carregarProdutosDoSupabase() {
      try {
        // Suas 5 tabelas do banco de dados
        const tabelas = ['inverno', 'verao', 'meia_estacao', 'encomendas', 'artesanato'];
        let todosProdutosComEstoque = [];

        // Buscando tabela por tabela para garantir controle individual de erros
        for (const tabela of tabelas) {
          const { data, error } = await supabase
            .from(tabela)
            .select('*'); // Seleciona tudo de forma genérica para evitar quebra por coluna inexistente

          if (error) {
            console.error(`Erro na tabela [${tabela}]:`, error.message);
            continue; // Se uma tabela falhar, pula para a próxima sem travar o select
          }

          if (data && data.length > 0) {
            console.log(`Dados carregados da tabela [${tabela}]:`, data);
            
            data.forEach((p, index) => {
              // Verifica a quantidade em estoque independente da nomenclatura usada na tabela
              const estoqueReal = Number(p.qtd ?? p.quantidade ?? p.estoque_qtd ?? 0);

              // Traz apenas quem tem estoque
              if (estoqueReal >= 1) {
                const nomeProduto = p.modelo || p.produto || p.nome || `Item ${index}`;
                
                // Trata tamanhos baseados em medidas ou formato padrão (U, P, M, G)
                const tamanhoMedidas = p.pescoço || p.torax || p.comprimento
                  ? `P:${p.pescoço || '-'} T:${p.torax || '-'} C:${p.comprimento || '-'}`
                  : (p.tamanho || p.Tam || p.tam || 'U');

                todosProdutosComEstoque.push({
                  itemCodigo: `${tabela}-${p.id}`, 
                  nome: nomeProduto,
                  tamanho: tamanhoMedidas,
                  caracteristicas: p.caracteristicas || p.caracteristica || p.Características || '',            
                  valorVenda: p.vender_por ?? p.venderPor ?? p.particular ?? p.Particular ?? p.valor ?? 0,
                  custo: p.custo || p.Custo || 0
                });
              }
            });
          }
        }

        console.log("Todos os produtos processados com estoque:", todosProdutosComEstoque);
        setProdutosDisponiveis(todosProdutosComEstoque);
      } catch (error) {
        console.error('Erro geral ao carregar produtos do estoque:', error);
      }
    }

    carregarProdutosDoSupabase();
  }, []);

  // Busca o custo direto do produto mapeado em memória
  const buscarCustoDoProduto = (codigoSelecionado) => {
    const produto = produtosDisponiveis.find(p => p.itemCodigo === codigoSelecionado);
    return produto ? Number(produto.custo) : 0;
  };

  const handleProdutoChange = (e) => {
    const codigoSelecionado = e.target.value;
    const prodInfo = produtosDisponiveis.find(p => p.itemCodigo === codigoSelecionado);

    if (prodInfo) {
      const valorUnitarioLimpo = String(prodInfo.valorVenda)
        .replace('R$', '')
        .replace('.', '')
        .replace(',', '.')
        .trim();

      setNovaVenda({
        ...novaVenda,
        produto: prodInfo.nome, 
        tamanho: prodInfo.tamanho,
        caracteristicas: prodInfo.caracteristicas,
        valorUnitario: valorUnitarioLimpo || '' 
      });
    } else {
      setNovaVenda({ ...novaVenda, produto: '', valorUnitario: '' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaVenda({ ...novaVenda, [name]: value });
  };

  // 3. Salva a nova venda no Supabase
  const handleSalvarVenda = async (e) => {
    e.preventDefault();
    if (!novaVenda.produto) {
      alert("Por favor, selecione um produto válido em estoque.");
      return;
    }

    const qtd = parseInt(novaVenda.quantidade) || 1;
    const vUnitario = parseFloat(novaVenda.valorUnitario) || 0;
    
    // Acha o código correto do item selecionado para capturar o custo
    const codigoAtual = produtosDisponiveis.find(p => p.nome === novaVenda.produto)?.itemCodigo;
    const custoUnitario = buscarCustoDoProduto(codigoAtual);
    
    const custoTotalItem = custoUnitario * qtd;
    const valorFinalItem = vUnitario * qtd;
    const lucroItem = valorFinalItem - custoTotalItem;

    const novaVendaDb = {
      data: novaVenda.data,
      cliente: novaVenda.cliente,
      pet: novaVenda.pet,
      quantidade: qtd,
      produto: novaVenda.produto,
      tamanho: novaVenda.tamanho,
      caracteristicas: novaVenda.caracteristicas,
      valor_unitario: vUnitario,
      valor_final: valorFinalItem,
      custo: custoTotalItem,
      lucro: lucroItem,
      forma_pagamento: novaVenda.formaPagamento,
      observacao: novaVenda.observacao
    };

    try {
      const { data, error } = await supabase
        .from('vendas')
        .insert([novaVendaDb])
        .select();

      if (error) throw error;

      if (data) {
        setVendas([data[0], ...vendas]);
        
        setNovaVenda({
          ...novaVenda,
          pet: '',
          quantidade: 1,
          produto: '',
          tamanho: 'U',
          caracteristicas: '',
          valorUnitario: '',
          observacao: ''
        });
      }
    } catch (error) {
      console.error('Erro ao salvar venda:', error.message);
      alert('Não foi possível salvar a venda.');
    }
  };

  const calcularSomaAgrupada = (cliente, data) => {
    if (!cliente || !data) return 0;
    return vendas
      .filter(v => v.cliente && v.cliente.toLowerCase() === cliente.toLowerCase() && v.data === data)
      .reduce((acc, v) => acc + (parseFloat(v.valor_final ?? v.valorFinal ?? 0)), 0);
  };

  return (
    <div className="vendas-modulo-wrapper">
      <header className="vendas-modulo-header">
        <div className="vendas-modulo-titulo">
          <ShoppingBag size={24} color="#1D3567" />
          <h1>Registro de Vendas</h1>
        </div>
      </header>

      <form onSubmit={handleSalvarVenda} className="vendas-modulo-form">
        <div className="vendas-modulo-grid-campos">
          <div className="vendas-modulo-campo"><label>Data</label><input type="date" name="data" value={novaVenda.data} onChange={handleInputChange} required /></div>
          <div className="vendas-modulo-campo"><label>Cliente</label><input type="text" name="cliente" value={novaVenda.cliente} onChange={handleInputChange} required /></div>
          <div className="vendas-modulo-campo"><label>Pet</label><input type="text" name="pet" value={novaVenda.pet} onChange={handleInputChange} /></div>
          
          <div className="vendas-modulo-campo">
            <label>Produto em Estoque</label>
            <select 
              name="produto" 
              onChange={handleProdutoChange} 
              value={produtosDisponiveis.find(p => p.nome === novaVenda.produto)?.itemCodigo || ""} 
              required
            >
              <option value="">-- Selecione o Produto --</option>
              {produtosDisponiveis.map((prod) => (
                <option key={prod.itemCodigo} value={prod.itemCodigo}>
                  {prod.nome} {prod.caracteristicas}
                </option>
              ))}
            </select>
          </div>

          <div className="vendas-modulo-campo" style={{ width: '70px' }}><label>Qtd</label><input type="number" name="quantidade" value={novaVenda.quantidade} onChange={handleInputChange} min="1" required /></div>
          <div className="vendas-modulo-campo" style={{ width: '120px' }}><label>Tam.</label><input type="text" name="tamanho" value={novaVenda.tamanho} onChange={handleInputChange} /></div>
          
          <div className="vendas-modulo-campo">
            <label>Valor Unit.</label>
            <input 
              type="number" 
              step="0.01" 
              name="valorUnitario" 
              value={novaVenda.valorUnitario} 
              onChange={handleInputChange} 
              required 
              placeholder="0,00" 
            />
          </div>

          <div className="vendas-modulo-campo"><label>Forma Pagamento</label>
            <select name="formaPagamento" value={novaVenda.formaPagamento} onChange={handleInputChange}>
              <option value="Dinheiro">Dinheiro</option>              
              <option value="Pix">Pix</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
            </select>
          </div>

          <div className="vendas-modulo-campo">
            <label>Observação</label>
            <input
                type="text" 
                name="observacao"                                
                placeholder="Anote" 
                value={novaVenda.observacao}
                onChange={handleInputChange}
            />
          </div>
        </div>
        <button type="submit" className="vendas-modulo-btn-submeter"><Plus size={16} /> Lançar Linha</button>
      </form>

      <div className="vendas-modulo-tabela-overflow">
        <div className="vendas-modulo-tabela-container">
          <div className="vendas-modulo-linha-head">
            <div>Data</div>
            <div>Cliente</div>
            <div>Pet</div>
            <div>Qtd</div>
            <div>Produto</div>
            <div>Tam.</div>
            <div>Valor Unit.</div>
            <div>Valor Final (Linha)</div>
            <div>Total do Dia Cliente</div>
            <div>Custo</div>
            <div>Lucro</div>
            <div>Pagamento</div>
            <div>Observação</div>
          </div>

          {vendas.map((venda) => {
            const vData = venda.data;
            const vCliente = venda.cliente || '-';
            const vPet = venda.pet;
            const vQuantidade = venda.quantidade ?? 1;
            const vProduto = venda.produto || '-';
            const vTamanho = venda.tamanho || 'U';
            const vValorUnitario = venda.valor_unitario ?? venda.valorUnitario ?? 0;
            const vValorFinal = venda.valor_final ?? venda.valorFinal ?? 0;
            const vCusto = venda.custo ?? 0;
            const vLucro = venda.lucro ?? 0;
            const vFormaPagamento = venda.forma_pagamento ?? venda.formaPagamento ?? '-';
            const vObservacao = venda.observacao;

            const totalAgrupadoCliente = calcularSomaAgrupada(vCliente, vData);

            return (
              <div key={venda.id} className="vendas-modulo-linha-body">
                <div>{vData ? vData.split('-').reverse().join('/') : '-'}</div>
                <div style={{ fontWeight: '600' }}>{vCliente}</div>
                <div>{vPet || '-'}</div>
                <div>{vQuantidade}</div>
                <div>{vProduto}</div>
                <div><span className="vendas-modulo-badge">{vTamanho}</span></div>
                <div>R$ {parseFloat(vValorUnitario).toFixed(2).replace('.', ',')}</div>
                <div>R$ {parseFloat(vValorFinal).toFixed(2).replace('.', ',')}</div>
                <div style={{ color: '#10B981', fontWeight: 'bold' }}>R$ {totalAgrupadoCliente.toFixed(2).replace('.', ',')}</div>
                <div style={{ color: '#DC2626' }}>R$ {parseFloat(vCusto).toFixed(2).replace('.', ',')}</div>
                <div style={{ color: '#2563EB', fontWeight: '600' }}>R$ {parseFloat(vLucro).toFixed(2).replace('.', ',')}</div>
                <div>{vFormaPagamento}</div>
                <div>{vObservacao || '-'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}