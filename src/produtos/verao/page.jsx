import React, { useState, useEffect } from 'react';
import { Plus, Pencil, X, ChevronDown, ChevronUp, Trash2, Sun } from 'lucide-react';
import { supabase } from '../../supabaseCliente'; 
import './verao.css';

export default function Verao() {
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [itensExpandidos, setItensExpandidos] = useState({});
  const [produtosverao, setProdutosverao] = useState([]);
  const [estoque, setEstoque] = useState([]);

  // 1. CARREGAR DADOS DO SUPABASE
  const buscarDadosSupabase = async () => {
    try {
      const { data: veraoData, error: vError } = await supabase
        .from('verao')
        .select(`
          *,
          materiaisUsados:verao_materiais(*)
        `)
        .order('id', { ascending: true });

      if (vError) throw vError;

      const { data: estoqueData, error: estError } = await supabase
        .from('estoque')
        .select('*');

      if (estError) throw estError;

      setProdutosverao(veraoData || []);
      setEstoque(estoqueData || []);
    } catch (error) {
      console.error("Erro ao carregar banco do Supabase:", error);
      alert("Erro ao carregar dados do banco de dados.");
    }
  };

  useEffect(() => {
    buscarDadosSupabase();
  }, []);

  useEffect(() => {
    if (isModalAberto) {
      supabase.from('estoque').select('*').then(({ data }) => {
        if (data) setEstoque(data);
      });
    }
  }, [isModalAberto]);

  // Estado inicial padrão do componente React
  const [novoProduto, setNovoProduto] = useState({
    item_codigo: '', 
    modelo: '', 
    caracteristicas: '', 
    tamanho: '', 
    estoqueqtd: '1', 
    pescoco: '', 
    torax: '', 
    comprimento: '', 
    venderpor: '', 
    materiaisUsados: []
  });

  // --- FUNÇÕES DE CÁLCULO ---
  const calcularCustoTotal = (materiais) => {
    if (!materiais) return 0;
    return materiais.reduce((acc, m) => {
      const valor = m.valor_gasto !== undefined ? m.valor_gasto : m.valorgasto;
      return acc + (parseFloat(valor) || 0);
    }, 0);
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
        { estoque_id: '', nome: '', largura: '', altura: '', qtdusada: '', valorgasto: '0.00' }
      ]
    });
  };

  const handleMaterialChange = (index, campo, valor) => {
    const listaAtualizada = novoProduto.materiaisUsados.map((mat, i) => {
      if (i !== index) return mat;
      let itemAlterado = { ...mat, [campo]: valor };

      if (campo === 'estoque_id') {
        const selecionado = estoque.find(e => String(e.id) === String(valor));
        itemAlterado.nome = selecionado ? (selecionado.descricao || selecionado.material) : '';
      }

      const alt = parseFloat(String(itemAlterado.altura).replace(',', '.')) || 0;
      const larg = parseFloat(String(itemAlterado.largura).replace(',', '.')) || 0;

      if (alt > 0 && larg > 0) {
        itemAlterado.qtdusada = String((alt * larg).toFixed(4)).replace('.', ',');
      }

      const itemEstoque = estoque.find(e => String(e.id) === String(itemAlterado.estoque_id));
      const precoM2 = itemEstoque ? parseFloat(String(itemEstoque.valorm).replace(',', '.')) || 0 : 0;
      const qtdFinal = parseFloat(String(itemAlterado.qtdusada).replace(',', '.')) || 0;
      
      itemAlterado.valorgasto = (qtdFinal * precoM2).toFixed(2);
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
    if (produtosverao.length > 0) {
      const numerosAtuais = produtosverao.map(p => {
        if (!p.item_codigo) return 0;
        return parseInt(p.item_codigo.replace('V', ''), 10) || 0;
      });
      proximoNumero = Math.max(...numerosAtuais) + 1;
    }
    setNovoProduto({
      item_codigo: `V${String(proximoNumero).padStart(2, '0')}`,
      modelo: '', caracteristicas: '', tamanho: '', estoqueqtd: '1', pescoco: '', torax: '', comprimento: '', venderpor: '', materiaisUsados: []
    });
    setIsModalAberto(true);
  };

  // 2. SALVAR NO SUPABASE
  const handleSalvarItem = async (e) => {
    e.preventDefault();
    
    const dadosProduto = {
      item_codigo: novoProduto.item_codigo,
      modelo: novoProduto.modelo,
      caracteristicas: novoProduto.caracteristicas,
      tamanho: novoProduto.tamanho,
      estoque_qtd: parseInt(novoProduto.estoqueqtd, 10) || 0, 
      pescoco: novoProduto.pescoco,
      torax: novoProduto.torax,
      comprimento: novoProduto.comprimento,
      vender_por: novoProduto.venderpor 
    };

    try {
      let idVeraoFinal = null;

      if (produtoEditando) {
        // MODO EDIÇÃO (UPDATE)
        const { error: vError } = await supabase
          .from('verao')
          .update(dadosProduto)
          .eq('id', produtoEditando.id);

        if (vError) throw vError;
        idVeraoFinal = produtoEditando.id;

        const { error: delError } = await supabase
          .from('verao_materiais')
          .delete()
          .eq('verao_id', idVeraoFinal);

        if (delError) throw delError;
      } else {
        // MODO CADASTRO (INSERT)
        const { data: insertData, error: vError } = await supabase
          .from('verao')
          .insert([dadosProduto])
          .select();

        if (vError) throw vError;
        idVeraoFinal = insertData[0].id;
      }

      if (novoProduto.materiaisUsados && novoProduto.materiaisUsados.length > 0) {
        const payloadMateriais = novoProduto.materiaisUsados.map(m => ({
          verao_id: idVeraoFinal,
          estoque_id: m.estoque_id ? parseInt(m.estoque_id, 10) : null,
          nome: m.nome,
          largura: m.largura,
          altura: m.altura,
          qtd_usada: m.qtdusada || m.qtd_usada, 
          valor_gasto: parseFloat(m.valorgasto || m.valor_gasto) || 0 
        }));

        const { error: matError } = await supabase
          .from('verao_materiais')
          .insert(payloadMateriais);

        if (matError) throw matError;
      }

      alert("Produto salvo com sucesso!");
      setIsModalAberto(false);
      setProdutoEditando(null);
      buscarDadosSupabase(); 
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert(`Erro ao salvar no banco: ${error.message}`);
    }
  };

  const custoModal = calcularCustoTotal(novoProduto.materiaisUsados);
  const particularModal = calcularVendaParticular(custoModal);
  const bingoModal = calcularVendaBingo(particularModal);

  const formatarMoedaExibicao = (valor) => {
    if (!valor) return 'R$ 0,00';
    const numeroLimpo = parseFloat(String(valor).replace('R$', '').replace(',', '.').trim());
    return isNaN(numeroLimpo) ? `R$ ${valor}` : `R$ ${numeroLimpo.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="estoque-container">
      <header className="estoque-header">
        <div className="header-titulo">
          <Sun size={24} color="#1E3A8A" />
          <h1>Modelos Verão ({produtosverao.length})</h1>
        </div>        
        <button className="btn-abrir-cadastro" onClick={handleAbrirCadastro}><Plus size={20} /></button>
      </header>

      {/* Tabela Geral */}
      <div className="overflow-lista">
        <div className="lista-estoque">
          <div className="lista-header grid-tabela-verao">
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
            <div style={{ fontWeight: '600' }}>Vender Por</div>
            <div>Qtd</div>
            <div style={{ textAlign: 'center' }}>Ações</div>
          </div>

          {produtosverao.map((prod) => {
            const custoNum = calcularCustoTotal(prod.materiaisUsados);
            const partNum = calcularVendaParticular(custoNum);
            const bingoNum = calcularVendaBingo(partNum);
            const estaExpandido = itensExpandidos[prod.id];
            
            const quantidadeExibida = prod.estoque_qtd !== undefined ? prod.estoque_qtd : prod.estoqueqtd;
            const valorVendaExibido = prod.vender_por !== undefined ? prod.vender_por : prod.venderpor;

            return (
              <div key={prod.id} className="container-item-verao">
                <div className="lista-item grid-tabela-verao" onClick={() => toggleExpandir(prod.id)} >
                  <div className="seta-expandir">{estaExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                  <div>{prod.item_codigo}</div>
                  <div>{prod.modelo}</div>
                  <div title={prod.caracteristicas}>{prod.caracteristicas}</div>
                  <div><span className="badge-tamanho">{prod.tamanho || '-'}</span></div>
                  <div>{prod.pescoco || '-'}</div>
                  <div>{prod.torax || '-'}</div>
                  <div>{prod.comprimento || '-'}</div>
                  <div className="valor-custo-dinamico">R$ {custoNum.toFixed(2).replace('.', ',')}</div>
                  <div className="particular">R$ {partNum.toFixed(2).replace('.', ',')}</div>
                  <div className="bingo">R$ {bingoNum.toFixed(2).replace('.', ',')}</div>
                  <div style={{ fontWeight: '600', color: '#1E3A8A' }}>
                    {formatarMoedaExibicao(valorVendaExibido)}
                  </div>
                  <div>{quantidadeExibida || 0} un</div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { 
                      setProdutoEditando(prod); 
                      const materiaisTratados = (prod.materiaisUsados || []).map(m => ({
                        ...m,
                        qtdusada: m.qtd_usada !== undefined ? m.qtd_usada : m.qtdusada,
                        valorgasto: m.valor_gasto !== undefined ? m.valor_gasto : m.valorgasto,
                        estoque_id: m.estoque_id !== undefined ? m.estoque_id : m.estoqueId
                      }));

                      setNovoProduto({
                        ...prod,
                        estoqueqtd: String(quantidadeExibida || 0),
                        venderpor: String(valorVendaExibido || ''),
                        materiaisUsados: materiaisTratados
                      }); 
                      setIsModalAberto(true); 
                    }} className="btn-editar"><Pencil size={16} /></button>
                  </div>
                </div>

                {estaExpandido && prod.materiaisUsados && (
                  <div className="painel-materiais-composicao">
                    <div className="grade-sublista-header">
                      <div>Material</div> <div>Largura (m)</div> <div>Altura (m)</div> <div>Qtd Usada</div> <div>Valor Gasto</div>
                    </div>
                    {prod.materiaisUsados.map((mat, i) => {
                      const qtd_linha = mat.qtd_usada !== undefined ? mat.qtd_usada : mat.qtdusada;
                      const gasto_linha = mat.valor_gasto !== undefined ? mat.valor_gasto : mat.valorgasto;
                      return (
                        <div className="grade-sublista-linha" key={i}>
                          <div className="nome-mat-sublista">{mat.nome || "Não especificado"}</div>
                          <div>{mat.largura || '-'}</div>
                          <div>{mat.altura || '-'}</div>
                          <div>{qtd_linha}</div>
                          <div className="preco-mat-sublista">R$ {parseFloat(gasto_linha || 0).toFixed(2).replace('.', ',')}</div>
                        </div>
                      );
                    })}
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
              <h2>{produtoEditando ? `Editar ${produtoEditando.item_codigo}` : "Novo Produto Verão"}</h2>
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
                    <div className="campo-input"><label>Qtd Est.</label><input type="text" name="estoqueqtd" value={novoProduto.estoqueqtd} onChange={handleInputChange} /></div>
                    <div className="campo-input">
                      <label style={{ color: '#1E3A8A', fontWeight: 'bold' }}>Vender Por (Valor Livre)</label>
                      <input type="text" name="venderpor" value={novoProduto.venderpor || ''} onChange={handleInputChange} placeholder="Ex: 25,00" />
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
                    {novoProduto.materiaisUsados && novoProduto.materiaisUsados.map((mat, index) => {
                      const temDimensaoCompleta = (parseFloat(String(mat.altura).replace(',', '.')) > 0 && parseFloat(String(mat.largura).replace(',', '.')) > 0);
                      const valorExibidoGasto = mat.valorgasto !== undefined ? mat.valorgasto : mat.valor_gasto;
                      const qtdExibidaLinha = mat.qtdusada !== undefined ? mat.qtdusada : mat.qtd_usada;

                      return (
                        <div key={index} className="material">
                          <select value={mat.estoque_id || mat.estoqueId || ''} onChange={(e) => handleMaterialChange(index, 'estoque_id', e.target.value)} required>
                            <option value="">-- Selecione o Material --</option>
                            {estoque.map((item, i) => (
                              <option key={i} value={item.id}>{item.descricao || item.material}</option>
                            ))}
                          </select>
                          <input type="text" value={mat.largura || ''} onChange={(e) => handleMaterialChange(index, 'largura', e.target.value)} placeholder="Larg (m)" />
                          <input type="text" value={mat.altura || ''} onChange={(e) => handleMaterialChange(index, 'altura', e.target.value)} placeholder="Alt (m)" />
                          <input type="text" value={qtdExibidaLinha || ''} onChange={(e) => handleMaterialChange(index, 'qtdusada', e.target.value)} placeholder="Qtd Usada" disabled={temDimensaoCompleta} />
                          <div className="valor">R$ {parseFloat(valorExibidoGasto || 0).toFixed(2).replace('.', ',')}</div>
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