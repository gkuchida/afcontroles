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
        .order('id', { ascending: false }); // Vendas mais recentes primeiro

      if (error) throw error;
      if (data) setVendas(data);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error.message);
      alert('Erro ao carregar dados do banco de dados.');
    }
  }

  // Carrega os produtos varrendo todos os JSONs do localStorage (Mantido original)
  useEffect(() => {
    const listasDeChaves = [
      'produtos_inverno_json',
      'produtos_meiaestacao_json',
      'produtos_verao_json',
      'produtos_artesanato_json',
      'produtos_encomendas_json'
    ];

    let todosProdutosComEstoque = [];

    listasDeChaves.forEach(chave => {
      const dadosBrutos = localStorage.getItem(chave);
      if (!dadosBrutos) return;

      const produtosDaLista = JSON.parse(dadosBrutos);
      
      produtosDaLista.forEach(p => {
        const estoqueBruto = p.estoqueQtd || p.Qtd || p.qtd || p.quantidade;
        
        if (estoqueBruto && estoqueBruto !== "0" && estoqueBruto !== 0) {
          todosProdutosComEstoque.push({
            itemCodigo: p.itemCodigo || '', 
            nome: p.modelo || p.produto || 'Sem nome',
            tamanho: p.tamanho || p.Tam || p.tam || 'U',
            caracteristicas: p.caracteristicas || p.Características || '',            
            valorVenda: p.venderPor || p.particular || p.Particular || '' 
          });
        }
      });
    });

    setProdutosDisponiveis(todosProdutosComEstoque);
  }, []); 

  // Busca e calcula o custo (Mantido original)
  const buscarCustoDoProduto = (nomeProduto) => {
    if (!nomeProduto) return 0;
    const listasDeProdutos = [
      'produtos_inverno_json',
      'produtos_meiaestacao_json',
      'produtos_verao_json',
      'produtos_artesanato_json',
      'produtos_encomendas_json'
    ];

    for (let chave of listasDeProdutos) {
      const produtos = JSON.parse(localStorage.getItem(chave) || '[]');
      const produtoEncontrado = produtos.find(
        p => p.modelo?.toLowerCase() === nomeProduto.toLowerCase() || 
             p.produto?.toLowerCase() === nomeProduto.toLowerCase()
      );

      if (produtoEncontrado) {
        if (produtoEncontrado.materiaisUsados && produtoEncontrado.materiaisUsados.length > 0) {
          return produtoEncontrado.materiaisUsados.reduce((acc, m) => acc + (parseFloat(m.valorGasto) || 0), 0);
        }
        const custoBruto = produtoEncontrado.custo || produtoEncontrado.Custo || "0";
        const custoLimpo = String(custoBruto).replace('R$', '').replace('.', '').replace(',', '.').trim();
        return parseFloat(custoLimpo) || 0;
      }
    }
    return 0;
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

  // 2. Salva a nova venda diretamente no Supabase
  const handleSalvarVenda = async (e) => {
    e.preventDefault();
    if (!novaVenda.produto) {
      alert("Por favor, selecione um produto válido em estoque.");
      return;
    }

    const qtd = parseInt(novaVenda.quantidade) || 1;
    const vUnitario = parseFloat(novaVenda.valorUnitario) || 0;
    
    const custoUnitario = buscarCustoDoProduto(novaVenda.produto);
    const custoTotalItem = custoUnitario * qtd;
    const valorFinalItem = vUnitario * qtd;
    const lucroItem = valorFinalItem - custoTotalItem;

    // Objeto formatado de acordo com as colunas do seu banco
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
        .select(); // Retorna o item inserido com o ID real gerado pelo banco

      if (error) throw error;

      if (data) {
        // Atualiza o estado local adicionando o item salvo no topo/fim
        setVendas([data[0], ...vendas]);
        
        // Reseta o formulário
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
    return vendas
      .filter(v => v.cliente.toLowerCase() === cliente.toLowerCase() && v.data === data)
      .reduce((acc, v) => acc + (parseFloat(v.valor_final) || v.valorFinal || 0), 0);
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
            <select name="produto" onChange={handleProdutoChange} value={produtosDisponiveis.find(p => p.nome === novaVenda.produto)?.itemCodigo || ""} required>
              <option value="">-- Selecione o Produto --</option>
              {produtosDisponiveis.map((prod, idx) => (
                <option key={idx} value={prod.itemCodigo}>
                  {prod.itemCodigo} - {prod.nome} {prod.caracteristicas} ({prod.tamanho})
                </option>
              ))}
            </select>
          </div>

          <div className="vendas-modulo-campo" style={{ width: '70px' }}><label>Qtd</label><input type="number" name="quantidade" value={novaVenda.quantidade} onChange={handleInputChange} min="1" required /></div>
          <div className="vendas-modulo-campo" style={{ width: '70px' }}><label>Tam.</label><input type="text" name="tamanho" value={novaVenda.tamanho} onChange={handleInputChange} /></div>
          
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
            // Adaptando o mapeamento para aceitar snake_case (banco) ou camelCase (antigo)
            const vData = venda.data;
            const vCliente = venda.cliente;
            const vPet = venda.pet;
            const vQuantidade = venda.quantidade;
            const vProduto = venda.produto;
            const vTamanho = venda.tamanho;
            const vValorUnitario = venda.valor_unitario ?? venda.valorUnitario;
            const vValorFinal = venda.valor_final ?? venda.valorFinal;
            const vCusto = venda.custo;
            const vLucro = venda.lucro;
            const vFormaPagamento = venda.forma_pagamento ?? venda.formaPagamento;
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
                <div>R$ {parseFloat(vValorUnitario || 0).toFixed(2).replace('.', ',')}</div>
                <div>R$ {parseFloat(vValorFinal || 0).toFixed(2).replace('.', ',')}</div>
                <div style={{ color: '#10B981', fontWeight: 'bold' }}>R$ {totalAgrupadoCliente.toFixed(2).replace('.', ',')}</div>
                <div style={{ color: '#DC2626' }}>R$ {parseFloat(vCusto || 0).toFixed(2).replace('.', ',')}</div>
                <div style={{ color: '#2563EB', fontWeight: '600' }}>R$ {parseFloat(vLucro || 0).toFixed(2).replace('.', ',')}</div>
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