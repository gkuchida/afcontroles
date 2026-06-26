import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus } from 'lucide-react';
import './vendas.css'; 

export default function Vendas() {
  const [vendas, setVendas] = useState(() => {
    const salvo = localStorage.getItem('minhas_vendas_json');
    return salvo ? JSON.parse(salvo) : [];
  });

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

  // Carrega os produtos varrendo todos os JSONs do localStorage
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
        
        // Só exibe o produto se houver estoque ativo
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

  // Busca e calcula o custo com base no nome do produto selecionado
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
        // Se houver arranjo de materiais usados, soma os valores gastos
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

  useEffect(() => {
    localStorage.setItem('minhas_vendas_json', JSON.stringify(vendas));
  }, [vendas]);

  // Executado ao selecionar um produto no dropdown
  const handleProdutoChange = (e) => {
    const codigoSelecionado = e.target.value;
    const prodInfo = produtosDisponiveis.find(p => p.itemCodigo === codigoSelecionado);

    if (prodInfo) {
      // Limpa formatações para garantir que seja inserido apenas um número válido e editável
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
        valorUnitario: valorUnitarioLimpo || '' // Auto-preenche com a sua coluna "Vender Por"
      });
    } else {
      setNovaVenda({ ...novaVenda, produto: '', valorUnitario: '' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaVenda({ ...novaVenda, [name]: value });
  };

  const handleSalvarVenda = (e) => {
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

    const itemVenda = {
      ...novaVenda,
      id: Date.now(),
      custo: custoTotalItem,
      valorFinal: valorFinalItem,
      lucro: lucroItem
    };

    setVendas([...vendas, itemVenda]);
    
    // Reseta o formulário mantendo as definições bases limpas
    setNovaVenda({
      ...novaVenda,
      pet: '',
      quantidade: 1,
      produto: '',
      tamanho: 'U',
      caracteristicas: '',
      valorUnitario: ''
    });
  };

  // Soma acumulada para mesmo cliente na mesma data
  const calcularSomaAgrupada = (cliente, data) => {
    return vendas
      .filter(v => v.cliente.toLowerCase() === cliente.toLowerCase() && v.data === data)
      .reduce((acc, v) => acc + v.valorFinal, 0);
  };

  return (
    <div className="vendas-modulo-wrapper">
      <header className="vendas-modulo-header">
        <div className="vendas-modulo-titulo">
          <ShoppingBag size={24} color="#1D3567" />
          <h1>Registro de Vendas</h1>
        </div>
      </header>

      {/* Formulário estilo Modal */}
      <form onSubmit={handleSalvarVenda} className="vendas-modulo-form">
        <div className="vendas-modulo-grid-campos">
          <div className="vendas-modulo-campo"><label>Data</label><input type="date" name="data" value={novaVenda.data} onChange={handleInputChange} required /></div>
          <div className="vendas-modulo-campo"><label>Cliente</label><input type="text" name="cliente" value={novaVenda.cliente} onChange={handleInputChange} required /></div>
          <div className="vendas-modulo-campo"><label>Pet</label><input type="text" name="pet" value={novaVenda.pet} onChange={handleInputChange} /></div>
          
          <div className="vendas-modulo-campo">
            <label>Produto em Estoque</label>
            <select name="produto" onChange={handleProdutoChange} required>
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
          
          {/* O CAMPO TRAZ O VALOR AUTOMÁTICO DO ESTOQUE, MAS PERMANECE EDITÁVEL */}
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
                step="0.01" 
                name="observacao"                                
                placeholder="Anote" 
            />
          </div>
        </div>
        <button type="submit" className="vendas-modulo-btn-submeter"><Plus size={16} /> Lançar Linha</button>
      </form>

      {/* Grid Listagem Azul Marinho Corporativo */}
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
            const totalAgrupadoCliente = calcularSomaAgrupada(venda.cliente, venda.data);

            return (
              <div key={venda.id} className="vendas-modulo-linha-body">
                <div>{venda.data.split('-').reverse().join('/')}</div>
                <div style={{ fontWeight: '600' }}>{venda.cliente}</div>
                <div>{venda.pet || '-'}</div>
                <div>{venda.quantidade}</div>
                <div>{venda.produto}</div>
                <div><span className="vendas-modulo-badge">{venda.tamanho}</span></div>
                <div>R$ {parseFloat(venda.valorUnitario || 0).toFixed(2).replace('.', ',')}</div>
                <div>R$ {venda.valorFinal.toFixed(2).replace('.', ',')}</div>
                <div style={{ color: '#10B981', fontWeight: 'bold' }}>R$ {totalAgrupadoCliente.toFixed(2).replace('.', ',')}</div>
                <div style={{ color: '#DC2626' }}>R$ {venda.custo.toFixed(2).replace('.', ',')}</div>
                <div style={{ color: '#2563EB', fontWeight: '600' }}>R$ {venda.lucro.toFixed(2).replace('.', ',')}</div>
                <div>{venda.formaPagamento}</div>
                <div>{venda.observacao}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}