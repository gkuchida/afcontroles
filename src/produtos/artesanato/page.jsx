import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Snowflake, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { supabase } from '../../supabaseCliente';
import './artesanato.css';

export default function Artesanato() {
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [itensExpandidos, setItensExpandidos] = useState({});
  const [produtosartesanato, setProdutosartesanato] = useState([]);
  const [estoque, setEstoque] = useState([]);

  // 1. CARREGAR DADOS DO SUPABASE (PRODUTOS E ESTOQUE)
  const buscarDadosSupabase = async () => {
    try {
      // Busca os produtos trazendo a lista de materiais usando o relacionamento estruturado no SQL
      const { data: artesanatoData, error: artError } = await supabase
        .from('artesanato')
        .select(`
          *,
          materiaisUsados:artesanato_materiais(*)
        `)
        .order('id', { ascending: true });

      if (artError) throw artError;

      // Busca a tabela de estoque (para alimentar o Select de materiais no Modal)
      const { data: estoqueData, error: estError } = await supabase
        .from('estoque')
        .select('*');

      if (estError) throw estError;

      setProdutosartesanato(artesanatoData || []);
      setEstoque(estoqueData || []);
    } catch (error) {
      console.error("Erro ao carregar banco do Supabase:", error);
      alert("Erro ao carregar dados do banco de dados.");
    }
  };

  useEffect(() => {
    buscarDadosSupabase();
  }, []);

  // Recarregar o estoque ao abrir o modal para garantir dados atualizados
  useEffect(() => {
    if (isModalAberto) {
      supabase.from('estoque').select('*').then(({ data }) => {
        if (data) setEstoque(data);
      });
    }
  }, [isModalAberto]);

  // Estado inicial padrão
  const [novoProduto, setNovoProduto] = useState({
    itemcodigo: '', 
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
    return materiais.reduce((acc, m) => acc + (parseFloat(m.valorgasto) || 0), 0);
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
      // Mapeado exatamente para a coluna 'valorm' identificada na imagem da sua tabela estoque
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
    if (produtosartesanato.length > 0) {
      const numerosAtuais = produtosartesanato.map(p => {
        if (!p.itemcodigo) return 0;
        return parseInt(p.itemcodigo.replace('I', ''), 10) || 0;
      });
      proximoNumero = Math.max(...numerosAtuais) + 1;
    }
    setNovoProduto({
      itemcodigo: `I${String(proximoNumero).padStart(2, '0')}`,
      modelo: '', caracteristicas: '', tamanho: '', estoqueqtd: '1', pescoco: '', torax: '', comprimento: '', venderpor: '', materiaisUsados: []
    });
    setIsModalAberto(true);
  };

  // 2. SALVAR NO SUPABASE (CORRIGIDO)
  const handleSalvarItem = async (e) => {
    e.preventDefault();
    
    const dadosProduto = {
      itemcodigo: novoProduto.itemcodigo,
      modelo: novoProduto.modelo,
      caracteristicas: novoProduto.caracteristicas,
      tamanho: novoProduto.tamanho,
      estoqueqtd: parseInt(novoProduto.estoqueqtd, 10) || 0,
      pescoco: novoProduto.pescoco,
      torax: novoProduto.torax,
      comprimento: novoProduto.comprimento,
      venderpor: novoProduto.venderpor
    };

    try {
      let idArtesanatoFinal = null;

      if (produtoEditando) {
        // MODO EDIÇÃO (UPDATE)
        const { error: artError } = await supabase
          .from('artesanato')
          .update(dadosProduto)
          .eq('id', produtoEditando.id);

        if (artError) throw artError;
        idArtesanatoFinal = produtoEditando.id;

        // Remove os materiais antigos vinculados para reinserir a lista atualizada
        const { error: delError } = await supabase
          .from('artesanato_materiais')
          .delete()
          .eq('artesanato_id', idArtesanatoFinal);

        if (delError) throw delError;
      } else {
        // MODO CADASTRO (INSERT) - Erro de comentário de sintaxe resolvido aqui
        const { data: insertData, error: artError } = await supabase
          .from('artesanato')
          .insert([dadosProduto])
          .select();

        if (artError) throw artError;
        idArtesanatoFinal = insertData[0].id;
      }

      // Salva os materiais da composição vinculando-os ao ID gerado do artesanato
      if (novoProduto.materiaisUsados && novoProduto.materiaisUsados.length > 0) {
        const payloadMateriais = novoProduto.materiaisUsados.map(m => ({
          artesanato_id: idArtesanatoFinal,
          estoque_id: m.estoque_id ? parseInt(m.estoque_id, 10) : null,
          nome: m.nome,
          largura: m.largura,
          altura: m.altura,
          qtdusada: m.qtdusada,
          valorgasto: parseFloat(m.valorgasto) || 0
        }));

        const { error: matError } = await supabase
          .from('artesanato_materiais')
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
          <Snowflake size={24} color="#1E3A8A" />
          <h1>Modelos Artesanato ({produtosartesanato.length})</h1>
        </div>        
        <button className="btn-abrir-cadastro" onClick={handleAbrirCadastro}><Plus size={20} /></button>
      </header>

      {/* Tabela Geral */}
      <div className="overflow-lista">
        <div className="lista-estoque">
          <div className="lista-header grid-tabela-artesanato">
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

          {produtosartesanato.map((prod) => {
            const custoNum = calcularCustoTotal(prod.materiaisUsados);
            const partNum = calcularVendaParticular(custoNum);
            const bingoNum = calcularVendaBingo(partNum);
            const estaExpandido = itensExpandidos[prod.id];

            return (
              <div key={prod.id} className="container-item-artesanato">
                <div className="lista-item grid-tabela-artesanato" onClick={() => toggleExpandir(prod.id)} >
                  <div className="seta-expandir">{estaExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                  <div>{prod.itemcodigo}</div>
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
                    {formatarMoedaExibicao(prod.venderpor)}
                  </div>
                  <div>{prod.estoqueqtd} un</div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setProdutoEditando(prod); setNovoProduto(prod); setIsModalAberto(true); }} className="btn-editar"><Pencil size={16} /></button>
                  </div>
                </div>

                {estaExpandido && prod.materiaisUsados && (
                  <div className="painel-materiais-composicao">
                    <div className="grade-sublista-header">
                      <div>Material</div> <div>Largura (m)</div> <div>Altura (m)</div> <div>Qtd Usada</div> <div>Valor Gasto</div>
                    </div>
                    {prod.materiaisUsados.map((mat, i) => (
                      <div className="grade-sublista-linha" key={i}>
                        <div className="nome-mat-sublista">{mat.nome || "Não especificado"}</div>
                        <div>{mat.largura || '-'}</div>
                        <div>{mat.altura || '-'}</div>
                        <div>{mat.qtdusada}</div>
                        <div className="preco-mat-sublista">R$ {parseFloat(mat.valorgasto || 0).toFixed(2).replace('.', ',')}</div>
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
              <h2>{produtoEditando ? `Editar ${produtoEditando.itemcodigo}` : "Novo Produto artesanato"}</h2>
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
                    {novoProduto.materiaisUsados.map((mat, index) => {
                      const temDimensaoCompleta = (parseFloat(String(mat.altura).replace(',', '.')) > 0 && parseFloat(String(mat.largura).replace(',', '.')) > 0);
                      
                      return (
                        <div key={index} className="material">
                          <select value={mat.estoque_id || ''} onChange={(e) => handleMaterialChange(index, 'estoque_id', e.target.value)} required>
                            <option value="">-- Selecione o Material --</option>
                            {estoque.map((item, i) => (
                              <option key={i} value={item.id}>{item.descricao || item.material}</option>
                            ))}
                          </select>
                          <input type="text" value={mat.largura || ''} onChange={(e) => handleMaterialChange(index, 'largura', e.target.value)} placeholder="Larg (m)" />
                          <input type="text" value={mat.altura || ''} onChange={(e) => handleMaterialChange(index, 'altura', e.target.value)} placeholder="Alt (m)" />
                          <input type="text" value={mat.qtdusada || ''} onChange={(e) => handleMaterialChange(index, 'qtdusada', e.target.value)} placeholder="Qtd Usada" disabled={temDimensaoCompleta} />
                          <div className="valor">R$ {parseFloat(mat.valorgasto || 0).toFixed(2).replace('.', ',')}</div>
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