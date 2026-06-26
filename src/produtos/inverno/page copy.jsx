import React, { useState } from 'react';
import { Plus, Pencil, Snowflake, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import './inverno.css';

export default function Inverno({ estoque = [] }) {
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  
  // Estado inicial vazio - os dados virão exclusivamente dos cadastros reais
  const [produtosInverno, setProdutosInverno] = useState([]);
  const [itensExpandidos, setItensExpandidos] = useState({});
  
  const [novoProduto, setNovoProduto] = useState({
    itemCodigo: '', 
    modelo: '', 
    caracteristicas: '', 
    tamanho: '', 
    estoqueQtd: '1', 
    materiaisUsados: []
  });

  // --- FUNÇÕES DE CÁLCULO DINÂMICAS (SEM DADOS TRAVADOS) ---
  const calcularCustoTotal = (materiais) => {
    if (!materiais) return 0;
    return materiais.reduce((acc, m) => acc + (parseFloat(m.valorGasto) || 0), 0);
  };

  const calcularVendaParticular = (custo) => {
    const custoNum = parseFloat(custo) || 0;
    return (custoNum * 2) + 10;
  };

  const calcularVendaBingo = (vendaParticular) => {
    const particularNum = parseFloat(vendaParticular) || 0;
    return particularNum / 0.8;
  };

  const toggleExpandir = (id) => {
    setItensExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovoProduto({ ...novoProduto, [name]: value });
  };

  // --- GERENCIAMENTO DE LINHAS DE MATERIAIS ---
  const handleAdicionarMaterialLinha = () => {
    setNovoProduto({
      ...novoProduto,
      materiaisUsados: [
        ...novoProduto.materiaisUsados,
        { estoqueId: '', nome: '', largura: '', altura: '', qtdUsada: '', valorGasto: '0.00' }
      ]
    });
  };

  const handleMaterialChange = (index, campo, valor) => {
    const listaAtualizada = novoProduto.materiaisUsados.map((mat, i) => {
      if (i !== index) return mat;

      let itemAlterado = { ...mat, [campo]: valor };

      // Se alterou o item selecionado no select, mapeia o nome correto vindo do estoque
      if (campo === 'estoqueId') {
        const selecionado = estoque.find(e => 
          String(e.id) === String(valor) || 
          String(e.idItem) === String(valor) || 
          String(e.codigo) === String(valor)
        );
        itemAlterado.nome = selecionado ? (selecionado.descricao || selecionado.nome || selecionado.material) : '';
      }

      // Normaliza strings substituindo vírgula por ponto para cálculo matemático correto
      const alt = parseFloat(String(itemAlterado.altura).replace(',', '.')) || 0;
      const larg = parseFloat(String(itemAlterado.largura).replace(',', '.')) || 0;

      // REGRAS 2.2 e 2.3: Se tiver Altura E Largura, calcula automaticamente. Se não, aceita digitação livre.
      if (alt > 0 && larg > 0) {
        itemAlterado.qtdUsada = String((alt * larg).toFixed(4)).replace('.', ',');
      } else if (campo === 'altura' || campo === 'largura') {
        if (campo === 'altura' && valor === '') itemAlterado.qtdUsada = '';
        if (campo === 'largura' && valor === '') itemAlterado.qtdUsada = '';
      }

      // REGRA 3: Busca o valor real por metro quadrado cadastrado no seu estoque
      const itemEstoque = estoque.find(e => 
        String(e.id) === String(itemAlterado.estoqueId) || 
        String(e.idItem) === String(itemAlterado.estoqueId) || 
        String(e.codigo) === String(itemAlterado.estoqueId)
      );

      // Mapeia os possíveis nomes do campo de preço do seu estoque (valorUnitario, preco, precoM2)
      const precoM2 = itemEstoque ? parseFloat(String(itemEstoque.valorUnitario || itemEstoque.preco || itemEstoque.precoM2).replace(',', '.')) || 0 : 0;
      const qtdFinal = parseFloat(String(itemAlterado.qtdUsada).replace(',', '.')) || 0;
      
      itemAlterado.valorGasto = (qtdFinal * precoM2).toFixed(2);

      return itemAlterado;
    });

    setNovoProduto({ ...novoProduto, materiaisUsados: listaAtualizada });
  };

  const handleRemoverMaterialLinha = (index) => {
    setNovoProduto({
      ...novoProduto,
      materiaisUsados: novoProduto.materiaisUsados.filter((_, i) => i !== index)
    });
  };

  // --- FLUXO DE MODAL ---
  const handleAbrirCadastro = () => {
    let proximoNumero = 1;
    if (produtosInverno.length > 0) {
      const numerosAtuais = produtosInverno.map(p => parseInt(p.itemCodigo.replace('I', ''), 10) || 0);
      proximoNumero = Math.max(...numerosAtuais) + 1;
    }
    setNovoProduto({
      itemCodigo: `I${String(proximoNumero).padStart(2, '0')}`,
      modelo: '', caracteristicas: '', tamanho: '', estoqueQtd: '1', materiaisUsados: []
    });
    setIsModalAberto(true);
  };

  const handleSalvarItem = (e) => {
    e.preventDefault();
    if (produtoEditando) {
      setProdutosInverno(produtosInverno.map(p => p.id === produtoEditando.id ? novoProduto : p));
    } else {
      setProdutosInverno([...produtosInverno, { ...novoProduto, id: Date.now() }]);
    }
    setIsModalAberto(false);
    setProdutoEditando(null);
  };

  const custoModal = calcularCustoTotal(novoProduto.materiaisUsados);
  const particularModal = calcularVendaParticular(custoModal);
  const bingoModal = calcularVendaBingo(particularModal);

  return (
    <div className="estoque-container">
      <header className="estoque-header">
        <div className="header-titulo">
          <Snowflake size={24} color="#1E3A8A" />
          <h1>Modelos Inverno ({produtosInverno.length})</h1>
        </div>        
        <button className="btn-abrir-cadastro" onClick={handleAbrirCadastro}><Plus size={20} /></button>
      </header>

      {/* Tabela de Produtos Geral */}
      <div className="overflow-lista">
        <div className="lista-estoque">
          <div className="lista-header">
            <div></div> <div>Item</div> <div>Modelo</div> <div>Características</div> <div>Tam.</div>
            <div>Custo</div> <div>Particular</div> <div>Bingo</div> <div>Qtd</div> <div style={{ textAlign: 'center' }}>Ações</div>
          </div>

          {produtosInverno.map((prod) => {
            const custoNum = calcularCustoTotal(prod.materiaisUsados);
            const partNum = calcularVendaParticular(custoNum);
            const bingoNum = calcularVendaBingo(partNum);
            const estaExpandido = itensExpandidos[prod.id];

            return (
              <div key={prod.id} className="container-item-inverno">
                <div className="lista-item" onClick={() => toggleExpandir(prod.id)}>
                  <div className="seta-expandir">{estaExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                  <div style={{ fontWeight: 'bold' }}>{prod.itemCodigo}</div>
                  <div>{prod.modelo}</div>
                  <div>{prod.caracteristicas}</div>
                  <div><span className="badge-tamanho">{prod.tamanho}</span></div>
                  <div className="valor-custo-dinamico">R$ {custoNum.toFixed(2).replace('.', ',')}</div>
                  <div style={{ color: '#10B981', fontWeight: '600' }}>R$ {partNum.toFixed(2).replace('.', ',')}</div>
                  <div style={{ color: '#2563EB', fontWeight: '600' }}>R$ {bingoNum.toFixed(2).replace('.', ',')}</div>
                  <div>{prod.estoqueQtd} un</div>
                  <div style={{ display: 'flex', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setProdutoEditando(prod); setNovoProduto(prod); setIsModalAberto(true); }} className="btn-editar"><Pencil size={16} /></button>
                  </div>
                </div>

                {estaExpandido && (
                  <div className="painel-materiais-composicao">
                    <div className="grade-sublista-header">
                      <div>Material</div> <div>Largura (m)</div> <div>Altura (m)</div> <div>Qtd Usada</div> <div>Valor Gasto</div>
                    </div>
                    {prod.materiaisUsados.map((mat, i) => (
                      <div className="grade-sublista-linha" key={i}>
                        <div className="nome-mat-sublista">{mat.nome || "Não especificado"}</div>
                        <div>{mat.largura || '-'}</div>
                        <div>{mat.altura || '-'}</div>
                        <div>{mat.qtdUsada}</div>
                        <div className="preco-mat-sublista">R$ {parseFloat(mat.valorGasto || 0).toFixed(2).replace('.', ',')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Dinâmico */}
      {isModalAberto && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1050px', width: '95%' }}>
            <div className="modal-header">
              <h2>{produtoEditando ? `Editar ${produtoEditando.itemCodigo}` : "Novo Produto Inverno"}</h2>
              <button type="button" className="btn-fechar-modal" onClick={() => setIsModalAberto(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSalvarItem}>
              <div className="grid-formulario" style={{ gridTemplateColumns: '1fr 2fr' }}>
                
                <div className="subsecao-form">
                  <div className="campo-input"><label>Modelo</label><input type="text" name="modelo" value={novoProduto.modelo} onChange={handleInputChange} required /></div>
                  <div className="campo-input"><label>Características</label><input type="text" name="caracteristicas" value={novoProduto.caracteristicas} onChange={handleInputChange} required /></div>
                  <div className="linha-dupla">
                    <div className="campo-input"><label>Tam.</label><input type="text" name="tamanho" value={novoProduto.tamanho} onChange={handleInputChange} /></div>
                    <div className="campo-input"><label>Qtd Est.</label><input type="text" name="estoqueQtd" value={novoProduto.estoqueQtd} onChange={handleInputChange} /></div>
                  </div>
                </div>

                <div className="subsecao-form" style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1E3A8A' }}>Ficha Técnica de Componentes</span>
                    <button type="button" onClick={handleAdicionarMaterialLinha} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px 12px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '4px', color: '#1E40AF', cursor: 'pointer' }}>
                      <Plus size={14} /> Adicionar Material
                    </button>
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '16px' }}>
                    {novoProduto.materiaisUsados.map((mat, index) => {
                      const temDimensaoCompleta = (parseFloat(String(mat.altura).replace(',', '.')) > 0 && parseFloat(String(mat.largura).replace(',', '.')) > 0);
                      
                      return (
                        <div key={index} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', backgroundColor: '#F8FAFC', padding: '6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                          
                          <select 
                            value={mat.estoqueId} 
                            onChange={(e) => handleMaterialChange(index, 'estoqueId', e.target.value)}
                            style={{ flex: 2, padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                            required
                          >
                            <option value="">-- Selecione o Material (Estoque) --</option>
                            {estoque && estoque.map((item, i) => (
                              <option key={i} value={item.id || item.idItem || item.codigo}>
                                {item.descricao || item.nome || item.material}
                              </option>
                            ))}
                          </select>

                          <input type="text" value={mat.largura} onChange={(e) => handleMaterialChange(index, 'largura', e.target.value)} placeholder="Larg (m)" style={{ width: '65px', padding: '6px', fontSize: '12px', textAlign: 'center' }} />
                          <input type="text" value={mat.altura} onChange={(e) => handleMaterialChange(index, 'altura', e.target.value)} placeholder="Alt (m)" style={{ width: '65px', padding: '6px', fontSize: '12px', textAlign: 'center' }} />

                          <input 
                            type="text" 
                            value={mat.qtdUsada} 
                            onChange={(e) => handleMaterialChange(index, 'qtdUsada', e.target.value)} 
                            placeholder="Qtd Usada" 
                            disabled={temDimensaoCompleta}
                            style={{ 
                              width: '80px', padding: '6px', fontSize: '12px', textAlign: 'center',
                              backgroundColor: temDimensaoCompleta ? '#E2E8F0' : '#FFFFFF',
                              color: temDimensaoCompleta ? '#475569' : '#000000',
                              fontWeight: temDimensaoCompleta ? 'bold' : 'normal'
                            }} 
                          />

                          <div style={{ width: '85px', fontSize: '12px', fontWeight: 'bold', color: '#1E293B', textAlign: 'right', paddingRight: '4px' }}>
                            R$ {parseFloat(mat.valorGasto || 0).toFixed(2).replace('.', ',')}
                          </div>

                          <button type="button" onClick={() => handleRemoverMaterialLinha(index)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ backgroundColor: '#F0F9FF', border: '1px solid #B9E6FE', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Custo Total:</span><strong style={{ color: '#DC2626' }}>R$ {custoModal.toFixed(2).replace('.', ',')}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Venda Particular (Dobro + 10):</span><strong style={{ color: '#10B981' }}>R$ {particularModal.toFixed(2).replace('.', ',')}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Venda Bingo:</span><strong style={{ color: '#2563EB' }}>R$ {bingoModal.toFixed(2).replace('.', ',')}</strong></div>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancelar" onClick={() => setIsModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn-salvar" style={{ backgroundColor: '#1E3A8A' }}>Salvar Peça</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}