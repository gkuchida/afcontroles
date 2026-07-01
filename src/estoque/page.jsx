import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Package, X } from 'lucide-react';
// CORREÇÃO 1: Importe a instância do 'supabase' exportada pelo seu arquivo de configuração
import { supabase } from './supabaseCliente'; 
import './estoque.css';

export default function Estoque() {
  const [estoque, setEstoque] = useState([]);
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [itemSendoEditado, setItemSendoEditado] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [novoItem, setNovoItem] = useState({
    categoria: '', descricao: '', material: '', cor: '', altura: '',
    largura: '', areaQuantidade: '', valorPago: '', valorUnitario: '',
    quantidadeEstoque: '', observacoes: ''
  });

  // 1. CARREGAR DADOS DO SUPABASE AO ABRIR A PÁGINA
  const buscarEstoque = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setEstoque(data || []);
    } catch (error) {
      console.error('Erro ao buscar dados do Supabase:', error.message);
      alert('Erro ao carregar dados do banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarEstoque();
  }, []);

  // 2. CÁLCULOS AUTOMÁTICOS DE ÁREA E VALOR POR M²
  useEffect(() => {
    const alt = parseFloat(novoItem.altura.replace(',', '.'));
    const larg = parseFloat(novoItem.largura.replace(',', '.'));
    
    let areaCalculada = novoItem.areaQuantidade;

    if (!isNaN(alt) && !isNaN(larg) && alt > 0 && larg > 0) {
      const contaArea = alt * larg;
      areaCalculada = contaArea.toFixed(2).replace('.', ',');
    }

    const pago = parseFloat(novoItem.valorPago.replace(',', '.'));
    const areaParaConta = parseFloat(areaCalculada.replace(',', '.'));
    let valorUnitCalculado = novoItem.valorUnitario;

    if (!isNaN(pago) && !isNaN(areaParaConta) && areaParaConta > 0) {
      const contaUnitario = pago / areaParaConta;
      valorUnitCalculado = contaUnitario.toFixed(2).replace('.', ',');
    }

    if (areaCalculada !== novoItem.areaQuantidade || valorUnitCalculado !== novoItem.valorUnitario) {
      setNovoItem(prev => ({
        ...prev,
        areaQuantidade: areaCalculada,
        valorUnitario: valorUnitCalculado
      }));
    }
  }, [novoItem.altura, novoItem.largura, novoItem.valorPago, novoItem.areaQuantidade, novoItem.valorUnitario]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovoItem({ ...novoItem, [name]: value });
  };

  const handlePrepararEdicao = (item) => {
    setItemSendoEditado(item);
    setNovoItem({
      ...item,
      altura: item.altura ? String(item.altura).replace('.', ',') : '',
      largura: item.largura ? String(item.largura).replace('.', ',') : '',
      areaQuantidade: item.area ? String(item.area).replace('.', ',') : '',
      valorPago: item.pago ? String(item.pago).replace('.', ',') : '',
      valorUnitario: item.valorm ? String(item.valorm).replace('.', ',') : '',
      quantidadeEstoque: item.qtdestoque ? String(item.qtdestoque).replace('.', ',') : '',
      descricao: item.descricao || '',
      observacoes: item.observacoes || ''
    });
    setIsModalAberto(true);
  };

  const handleAbrirCadastro = () => {
    const proximoNumero = estoque.length > 0 
      ? Math.max(...estoque.map(item => Number(item.id) || 0)) + 1 
      : 1;

    const numeroFormatado = String(proximoNumero).padStart(2, '0');

    setNovoItem({
      categoria: '', 
      descricao: `${numeroFormatado} - `, 
      material: '', 
      cor: '',
      altura: '',
      largura: '', 
      areaQuantidade: '', 
      valorPago: '', 
      valorUnitario: '',
      quantidadeEstoque: '', 
      observacoes: ''
    });
    setIsModalAberto(true);
  };

  const handleFecharModal = () => {
    setIsModalAberto(false);
    setItemSendoEditado(null);
    setNovoItem({
      categoria: '', descricao: '', material: '', cor: '', altura: '',
      largura: '', areaQuantidade: '', valorPago: '', valorUnitario: '',
      quantidadeEstoque: '', observacoes: ''
    });
  };

  const tratarNumero = (valor) => {
    if (!valor) return null;
    const formatado = parseFloat(String(valor).replace(',', '.'));
    return isNaN(formatado) ? null : formatado;
  };

  // 3. SALVAR / ATUALIZAR DIRETAMENTE NO SUPABASE
  const handleSalvarItem = async (e) => {
    e.preventDefault();
    if (!novoItem.descricao || novoItem.descricao.trim() === "") {
      return alert("Por favor, preencha a descrição!");
    }
    
    const qtdEstoqueFinal = novoItem.quantidadeEstoque || novoItem.areaQuantidade;

    // Criando o mapeamento exato com as colunas da sua imagem no Supabase
    const dadosParaO_Banco = {
      categoria: novoItem.categoria || 'Outros',
      descricao: novoItem.descricao,
      material: novoItem.material || null,
      altura: tratarNumero(novoItem.altura) || 0,
      largura: tratarNumero(novoItem.largura) || 0,
      area: tratarNumero(novoItem.areaQuantidade) || 0,
      pago: tratarNumero(novoItem.valorPago) || 0,
      valorm: tratarNumero(novoItem.valorUnitario) || 0,
      qtdestoque: tratarNumero(qtdEstoqueFinal) || 0,
      observacao: novoItem.observacoes || '' // CORREÇÃO: Enviando como 'observacao' (singular) conforme a tabela
    };

    try {
      if (itemSendoEditado) {
        // Modo Edição (UPDATE)
        const { error } = await supabase
          .from('estoque')
          .update(dadosParaO_Banco)
          .eq('id', itemSendoEditado.id);

        if (error) throw error;
      } else {
        // Modo Cadastro (INSERT)
        const { error } = await supabase
          .from('estoque')
          .insert([dadosParaO_Banco]);

        if (error) throw error;
      }

      // Recarrega a lista e fecha o modal
      buscarEstoque();
      handleFecharModal();
      alert('Item salvo com sucesso!');
    } catch (error) {
      console.error('Erro detalhado do Supabase:', error);
      alert(`Erro ao salvar no banco: ${error.message || error.details}`);
    }
  };

  const temMedidas = novoItem.altura && novoItem.largura;
  const temPrecoEArea = novoItem.valorPago && novoItem.areaQuantidade;

  return (
    <div className="estoque-container">
      <header className="estoque-header">
        <div className="header-titulo">
          <Package size={24} color="#1E293B" />
          <h1>Estoque ({estoque.length} itens)</h1>
        </div>        
        <button className="btn-abrir-cadastro" onClick={handleAbrirCadastro} title="Novo Item">
          <Plus size={20} />
        </button>
      </header>

      {isModalAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{itemSendoEditado ? `Atualizar Item Nº ${itemSendoEditado.id}` : "Cadastrar Novo Item"}</h2>
              <button type="button" className="btn-fechar-modal" onClick={handleFecharModal}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSalvarItem}>
              <div className="grid-formulario">
                <div className="subsecao-form col-2">
                  <div className="campo-input">
                    <label>Categoria</label>
                    <select name="categoria"                      
                      value={novoItem.categoria} 
                      onChange={handleInputChange}
                      className="select-customizado"
                    >
                      <option value="">Selecione uma categoria...</option>                      
                      <option value="Aviamento">Aviamentos</option>
                      <option value="CustoF">Custos Fixos</option>
                      <option value="Embalagem">Embalagem</option>
                      <option value="Tecido">Tecido</option>
                      <option value="Outros">Outros</option>                      
                    </select>
                  </div>
                 
                  <div className="linha-dupla">
                    <div className="campo-input">
                      <label>Material</label>
                      <select name="material"                      
                        value={novoItem.material} 
                        onChange={handleInputChange}
                        className="select-customizado"
                      >
                        <option value="">Selecione o material...</option>                      
                        <option value="Fleece">Fleece</option>
                        <option value="Jeans">Jeans</option>                      
                        <option value="Matelasse">Matelassê</option> 
                        <option value="Microsoft">Microsoft</option>  
                        <option value="Moletom">Moletom</option>
                        <option value="NylonE">Nylon Emborrachado</option> 
                        <option value="Nylon7">Nylon 70</option>   
                        <option value="Pele">Pele</option>                                                                                                                                                                                
                        <option value="Ribana">Ribana</option>                      
                        <option value="Soft">Soft</option>                                                                                                                                                                                
                        <option value="TricolineE">Tricoline Estampado</option>                      
                        <option value="TricolineF">Tricoline Festivo</option>           
                        <option value="TricolineL">Tricoline Liso</option>                                                                                                                                                                                                                                                                                                                        
                      </select>
                    </div>
                    <div className="campo-input">
                      <label>Cor</label>
                      <input type="text" name="cor" value={novoItem.cor} onChange={handleInputChange} placeholder="Ex: Azul bebê" />                    
                    </div>
                  </div>
                  
                  <div className="campo-input">
                    <label>Descrição</label>
                    <input type="text" name="descricao" value={novoItem.descricao} onChange={handleInputChange} placeholder="Ex: S01 - Soft Rosa" />
                  </div>
                </div>

                <div className="subsecao-form col-2">
                  <div className="linha-dupla">
                    <div className="campo-input">
                      <label>Altura (m)</label>
                      <input type="text" name="altura" value={novoItem.altura} onChange={handleInputChange} placeholder="1,00" />
                    </div>
                    <div className="campo-input">
                      <label>Largura (m)</label>
                      <input type="text" name="largura" value={novoItem.largura} onChange={handleInputChange} placeholder="1,60" />
                    </div>
                  </div>

                  <div className="linha-dupla">
                    <div className="campo-input">
                      <label>Área / Quantidade {temMedidas && <span style={{color: '#2563EB', fontWeight: 'bold'}}>(Auto)</span>}</label>
                      <input 
                        type="text" 
                        name="areaQuantidade" 
                        value={novoItem.areaQuantidade} 
                        onChange={handleInputChange} 
                        disabled={!!temMedidas}
                        style={temMedidas ? { backgroundColor: '#EFF6FF', color: '#1E40AF', borderColor: '#DBEAFE', cursor: 'not-allowed' } : {}}
                      />
                    </div>
                    <div className="campo-input">
                      <label>Valor Pago (R$)</label>
                      <input type="text" name="valorPago" value={novoItem.valorPago} onChange={handleInputChange} placeholder="11,90" />
                    </div>
                  </div>

                  <div className="linha-dupla">
                    <div className="campo-input">
                      <label>Valor/m² {temPrecoEArea && <span style={{color: '#2563EB', fontWeight: 'bold'}}>(Auto)</span>}</label>
                      <input 
                        type="text" 
                        name="valorUnitario" 
                        value={novoItem.valorUnitario} 
                        onChange={handleInputChange} 
                        disabled={!!temPrecoEArea}
                        style={temPrecoEArea ? { backgroundColor: '#EFF6FF', color: '#1E40AF', borderColor: '#DBEAFE', cursor: 'not-allowed' } : {}}
                      />
                    </div>
                    <div className="campo-input">
                      <label>Estoque</label>
                      <input type="text" name="quantidadeEstoque" value={novoItem.quantidadeEstoque} onChange={handleInputChange} placeholder="Vazio usa a Área" />
                    </div>
                  </div>

                  <div className="campo-input">
                    <label>Observações</label>
                    <input type="text" name="observacoes" value={novoItem.observacoes} onChange={handleInputChange} placeholder="Notes..." />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancelar" onClick={handleFecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-salvar">
                  {itemSendoEditado ? "Atualizar" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-lista">
        <div className="lista-estoque">
          <div className="lista-header">
            <div>ID</div>
            <div>Categoria</div>
            <div>Descrição</div>
            <div>Material</div>
            <div>Altura</div>
            <div>Largura</div>
            <div>Área/Qtd</div>
            <div>Valor Pago</div>
            <div>Valor/m²</div>
            <div>Qtd Estoque</div>
            <div>Observações</div>
            <div style={{ textAlign: 'center' }}>Ações</div>
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>Carregando dados da nuvem...</div>
          ) : estoque.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>Nenhum item cadastrado no estoque.</div>
          ) : (
            estoque.map((item) => (
              <div className="lista-item" key={item.id}>
                <div style={{ fontWeight: 'bold', color: '#1E293B' }}>{item.id}</div>
                <div><span className="item-categoria">{item.categoria || 'Geral'}</span></div>
                <div className="item-descricao">{item.descricao}</div>
                <div>{item.material || '-'}</div>
                <div>{item.altura !== null ? String(item.altura).replace('.', ',') : '-'}</div>
                <div>{item.largura !== null ? String(item.largura).replace('.', ',') : '-'}</div>
                <div>{item.area !== null ? String(item.area).replace('.', ',') : '-'}</div>
                <div>{item.pago !== null ? `R$ ${String(item.pago).replace('.', ',')}` : '-'}</div>
                <div>{item.valorm !== null ? `R$ ${String(item.valorm).replace('.', ',')}` : '-'}</div>
                <div>{item.qtdestoque !== null ? String(item.qtdestoque).replace('.', ',') : '-'}</div>
                <div style={{ color: '#64748b', fontSize: '13px' }}>{item.observacoes || ''}</div>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button 
                    onClick={() => handlePrepararEdicao(item)} 
                    className="btn-editar" 
                    title="Editar Item" 
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}