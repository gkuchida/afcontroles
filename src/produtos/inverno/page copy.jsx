import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Snowflake, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import './inverno.css';

export default function Inverno() {
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [itensExpandidos, setItensExpandidos] = useState({});
  
  const [produtosInverno, setProdutosInverno] = useState(() => {
    const salvo = localStorage.getItem('produtos_inverno_json');
    return salvo ? JSON.parse(salvo) : [];
  });

  const [estoque, setEstoque] = useState([]);

  useEffect(() => {
    const salvoEstoque = localStorage.getItem('meu_estoque_json');
    if (salvoEstoque) {
      setEstoque(JSON.parse(salvoEstoque));
    }
  }, [isModalAberto]);

  useEffect(() => {
    localStorage.setItem('produtos_inverno_json', JSON.stringify(produtosInverno));
  }, [produtosInverno]);
  
  // Estado inicial padrão com o campo venderPor pronto
  const [novoProduto, setNovoProduto] = useState({
    itemCodigo: '', 
    modelo: '', 
    caracteristicas: '', 
    tamanho: '', 
    estoqueQtd: '1', 
    pescoco: '', 
    torax: '', 
    comprimento: '', 
    venderPor: '', // Campo que será preenchido no modal
    materiaisUsados: []
  });

  // --- FUNÇÕES DE CÁLCULO ---
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

  // --- COMPONENTES DA FICHA TÉCNICA ---
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

      if (campo === 'estoqueId') {
        const selecionado = estoque.find(e => 
          String(e.id) === String(valor) || 
          String(e.idItem) === String(valor) || 
          String(e.codigo) === String(valor)
        );
        itemAlterado.nome = selecionado ? (selecionado.descricao || selecionado.nome || selecionado.material) : '';
      }

      const alt = parseFloat(String(itemAlterado.altura).replace(',', '.')) || 0;
      const larg = parseFloat(String(itemAlterado.largura).replace(',', '.')) || 0;

      if (alt > 0 && larg > 0) {
        itemAlterado.qtdUsada = String((alt * larg).toFixed(4)).replace('.', ',');
      }

      const itemEstoque = estoque.find(e => String(e.id) === String(itemAlterado.estoqueId));
      const precoM2 = itemEstoque ? parseFloat(String(itemEstoque.valorUnitario || itemEstoque.preco).replace(',', '.')) || 0 : 0;
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

  const handleAbrirCadastro = () => {
    let proximoNumero = 1;
    if (produtosInverno.length > 0) {
      const numerosAtuais = produtosInverno.map(p => parseInt(p.itemCodigo.replace('I', ''), 10) || 0);
      proximoNumero = Math.max(...numerosAtuais) + 1;
    }
    setNovoProduto({
      itemCodigo: `I${String(proximoNumero).padStart(2, '0')}`,
      modelo: '', caracteristicas: '', tamanho: '', estoqueQtd: '1', pescoco: '', torax: '', comprimento: '', venderPor: '', materiaisUsados: []
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

  // Formata o valor digitado para exibir bonito "R$ X,XX" na tabela
  const formatarMoedaExibicao = (valor) => {
    if (!valor) return 'R$ 0,00';
    const numeroLimpo = parseFloat(String(valor).replace('R$', '').replace(',', '.').trim());
    return isNaN(numeroLimpo) ? `R$ ${valor}` : `R$ ${numeroLimpo.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="estoque-container">
      <header className="estoque-header">
        <div className="header-titulo">
          <Snowflake size={24} color="#1E3A8A" />
          <h1>Modelos Inverno ({produtosInverno.length})</h1>
        </div>        
        <button className="btn-abrir-cadastro" onClick={handleAbrirCadastro}><Plus size={20} /></button>
      </header>

      {/* Tabela Geral */}
      <div className="overflow-lista">
        <div className="lista-estoque">
          
          <div className="lista-header grid-tabela-inverno">
            <div></div>
            <div>Item</div>
            <div>Modelo</div>
            <div>Características</div>
            <div>Tam.</div>
            <div>Pescoço</div>
            <div>Tórax</div>
            <div>Comprimento</div>
            <div>Custo</div>
            <div>Particular</div>
            <div>Bingo</div>
            <div style={{ fontWeight: '600' }}>Vender Por</div> {/* Coluna de Leitura */}
            <div>Qtd</div>
            <div style={{ textAlign: 'center' }}>Ações</div>
          </div>

          {produtosInverno.map((prod) => {
            const custoNum = calcularCustoTotal(prod.materiaisUsados);
            const partNum = calcularVendaParticular(custoNum);
            const bingoNum = calcularVendaBingo(partNum);
            const estaExpandido = itensExpandidos[prod.id];

            return (
              <div key={prod.id} className="container-item-inverno">
                
                <div className="lista-item grid-tabela-inverno" onClick={() => toggleExpandir(prod.id)} >
                  <div className="seta-expandir">{estaExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                  <div>{prod.itemCodigo}</div>
                  <div>{prod.modelo}</div>
                  
                  <div title={prod.caracteristicas}>
                    {prod.caracteristicas}
                  </div>
                  
                  <div><span className="badge-tamanho">{prod.tamanho || '-'}</span></div>
                  <div>{prod.pescoco || '-'}</div>
                  <div>{prod.torax || '-'}</div>
                  <div>{prod.comprimento || '-'}</div>
                  
                  <div className="valor-custo-dinamico">R$ {custoNum.toFixed(2).replace('.', ',')}</div>
                  <div className="particular">R$ {partNum.toFixed(2).replace('.', ',')}</div>
                  <div className="bingo">R$ {bingoNum.toFixed(2).replace('.', ',')}</div>
                  
                  {/* TEXTO FIXO NA TABELA (NÃO EDITÁVEL AQUI) */}
                  <div style={{ fontWeight: '600', color: '#1E3A8A' }}>
                    {formatarMoedaExibicao(prod.venderPor)}
                  </div>

                  <div>{prod.estoqueQtd} un</div>
                  
                  <div onClick={(e) => e.stopPropagation()}>
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
          <div className="modal-content">
            <div className="modal-header">
              <h2>{produtoEditando ? `Editar ${produtoEditando.itemCodigo}` : "Novo Produto Inverno"}</h2>
              <button type="button" className="btn-fechar-modal" onClick={() => setIsModalAberto(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSalvarItem}>
              <div className="grid-formulario">
                
                <div className="subsecao-form">
                  <div className="campo-input"><label>Modelo</label><input type="text" name="modelo" value={novoProduto.modelo} onChange={handleInputChange} required /></div>
                  <div className="campo-input"><label>Características</label><input type="text" name="caracteristicas" value={novoProduto.caracteristicas} onChange={handleInputChange} required /></div>
                  
                  <div className="linha-dupla">
                    <div className="campo-input"><label>Pescoço</label><input type="text" name="pescoco" value={novoProduto.pescoco} onChange={handleInputChange} /></div>
                    <div className="campo-input"><label>Tórax</label><input type="text" name="torax" value={novoProduto.torax} onChange={handleInputChange} /></div>
                  </div>

                  <div className="linha-dupla">
                    <div className="campo-input"><label>Comprimento</label><input type="text" name="comprimento" value={novoProduto.comprimento} onChange={handleInputChange} /></div>
                    <div className="campo-input"><label>Tam.</label><input type="text" name="tamanho" value={novoProduto.tamanho} onChange={handleInputChange} /></div>
                  </div>
                  
                  <div className="linha-dupla">
                    <div className="campo-input"><label>Qtd Est.</label><input type="text" name="estoqueQtd" value={novoProduto.estoqueQtd} onChange={handleInputChange} /></div>
                    
                    {/* EDITÁVEL APENAS AQUI DENTRO DO MODAL */}
                    <div className="campo-input">
                      <label style={{ color: '#1E3A8A', fontWeight: 'bold' }}>Vender Por (Valor Livre)</label>
                      <input 
                        type="text" 
                        name="venderPor" 
                        value={novoProduto.venderPor || ''} 
                        onChange={handleInputChange} 
                        placeholder="Ex: 25,00" 
                      />
                    </div>
                  </div>
                </div>

                <div className="subsecao-form">
                  <div className="subsecaoAdd">
                    <span>Ficha Técnica de Componentes</span>
                    <button type="button" onClick={handleAdicionarMaterialLinha}>
                      <Plus size={14} /> Adicionar Material
                    </button>
                  </div>

                  <div className="subsecaoMaterial">
                    {novoProduto.materiaisUsados.map((mat, index) => {
                      const temDimensaoCompleta = (parseFloat(String(mat.altura).replace(',', '.')) > 0 && parseFloat(String(mat.largura).replace(',', '.')) > 0);
                      
                      return (
                        <div key={index} className="material">
                          <select value={mat.estoqueId} onChange={(e) => handleMaterialChange(index, 'estoqueId', e.target.value)}  required>
                            <option value="">-- Selecione o Material --</option>
                            {estoque.map((item, i) => (
                              <option key={i} value={item.id || item.idItem || item.codigo}>{item.descricao || item.nome}</option>
                            ))}
                          </select>
                          <input type="text" value={mat.largura} onChange={(e) => handleMaterialChange(index, 'largura', e.target.value)} placeholder="Larg (m)" />
                          <input type="text" value={mat.altura} onChange={(e) => handleMaterialChange(index, 'altura', e.target.value)} placeholder="Alt (m)" />
                          <input type="text" value={mat.qtdUsada} onChange={(e) => handleMaterialChange(index, 'qtdUsada', e.target.value)} placeholder="Qtd Usada" disabled={temDimensaoCompleta} />
                          <div className="valor">R$ {parseFloat(mat.valorGasto || 0).toFixed(2).replace('.', ',')}</div>
                          <button type="button" onClick={() => handleRemoverMaterialLinha(index)} style={{ background: 'none', border: 'none', color: '#EF4444' }}><Trash2 size={15} /></button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="calculos">
                    <div className="calculosvalor"><span>Custo Total:</span><strong style={{ color: '#DC2626' }}>R$ {custoModal.toFixed(2).replace('.', ',')}</strong></div>
                    <div className="calculosvalor"><span>Venda Particular:</span><strong style={{ color: '#10B981' }}>R$ {particularModal.toFixed(2).replace('.', ',')}</strong></div>
                    <div className="calculosvalorbingo"><span>Venda Bingo:</span><strong>R$ {bingoModal.toFixed(2).replace('.', ',')}</strong></div>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancelar" onClick={() => setIsModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn-salvar">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}