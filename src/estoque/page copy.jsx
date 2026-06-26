// src/estoque/page.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Package, X } from 'lucide-react';
import './estoque.css';

export default function Estoque({produtosEstoque, setProdutosEstoque}) {
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [itemSendoEditado, setItemSendoEditado] = useState(null);

  const [estoque, setEstoque] = useState([
    {
      id: 1,
      num: 1,
      categoria: "Tecido",
      descricao: "S01 - Soft Rosa Ursinhos Daiza",
      material: "Soft",
      altura: "1,00",
      largura: "1,60",
      areaQuantidade: "1,6",
      valorPago: "11,90",
      valorUnitario: "7,44",
      quantidadeEstoque: "1,60",
      observacoes: ""
    }
  ]);

  const [novoItem, setNovoItem] = useState({
    categoria: '', descricao: '', material: '', altura: '',
    largura: '', areaQuantidade: '', valorPago: '', valorUnitario: '',
    quantidadeEstoque: '', observacoes: ''
  });

  // --- AUTOMATIZAÇÃO INTELIGENTE (Área e Valor/m²) ---
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
    setNovoItem(item);
    setIsModalAberto(true);
  };

  // --- NOVA FUNÇÃO: CALCULA O ID E INICIA O CAMPO DESCRIÇÃO ---
  const handleAbrirCadastro = () => {
    const proximoNumero = estoque.length > 0 
      ? Math.max(...estoque.map(item => Number(item.num) || 0)) + 1 
      : 1;

    // Formata o número para ter 2 dígitos (ex: 1 vira "01", 2 vira "02")
    const numeroFormatado = String(proximoNumero).padStart(2, '0');

    setNovoItem({
      categoria: '', 
      descricao: `${numeroFormatado} - `, // Já inicia com o número automático
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
      categoria: '', descricao: '', material: '', altura: '',
      largura: '', areaQuantidade: '', valorPago: '', valorUnitario: '',
      quantidadeEstoque: '', observacoes: ''
    });
  };

  const handleSalvarItem = (e) => {
    e.preventDefault();
    if (!novoItem.descricao || novoItem.descricao.trim() === "") return alert("Por favor, preencha a descrição!");
    
    const qtdEstoqueFinal = novoItem.quantidadeEstoque || novoItem.areaQuantidade;

    if (itemSendoEditado) {
      setEstoque(estoque.map(item => 
        item.id === itemSendoEditado.id 
          ? { ...novoItem, quantidadeEstoque: qtdEstoqueFinal } 
          : item
      ));
    } else {
      const proximoNumero = estoque.length > 0 
        ? Math.max(...estoque.map(item => Number(item.num) || 0)) + 1 
        : 1;

      const itemProntoComPK = {
        ...novoItem,
        id: Date.now(),
        num: proximoNumero,
        quantidadeEstoque: qtdEstoqueFinal
      };

      setEstoque([...estoque, itemProntoComPK]);
    }
    
    handleFecharModal();
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

      {/* --- POP-UP REESTRUTURADO --- */}
      {isModalAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            
            <div className="modal-header">
              <h2>{itemSendoEditado ? `Atualizar Item Nº ${itemSendoEditado.num}` : "Cadastrar Novo Item"}</h2>
              <button type="button" className="btn-fechar-modal" onClick={handleFecharModal}>
                <X size={20} color="#64748B" />
              </button>
            </div>

            <form onSubmit={handleSalvarItem}>
              <div className="grid-formulario">
                
                {/* Coluna 1: Identificação do Produto */}
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
                        value={novoItem.categoria} 
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

                {/* Coluna 2: Métricas e Dimensões */}
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
                      <label>Estoque <span style={{fontSize: '11px', color: '#64748B'}}></span></label>
                      <input type="text" name="quantidadeEstoque" value={novoItem.quantidadeEstoque} onChange={handleInputChange} placeholder="Vazio usa a Área" />
                    </div>
                  </div>

                  <div className="campo-input">
                    <label>Observações</label>
                    <input type="text" name="observacoes" value={novoItem.observacoes} onChange={handleInputChange} placeholder="Notas adicionais..." />
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

      {/* --- EXIBIÇÃO DA LISTA REFINADA --- */}
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

          {estoque.map((item) => (
            <div className="lista-item" key={item.id}>
              <div style={{ fontWeight: 'bold', color: '#1E293B' }}>{item.num}</div>
              <div><span className="item-categoria">{item.categoria || 'Geral'}</span></div>
              <div className="item-descricao">{item.descricao}</div>
              <div>{item.material || '-'}</div>
              <div>{item.altura || '-'}</div>
              <div>{item.largura || '-'}</div>
              <div>{item.areaQuantidade || '-'}</div>
              <div>{item.valorPago ? `R$ ${item.valorPago}` : '-'}</div>
              <div>{item.valorUnitario ? `R$ ${item.valorUnitario}` : '-'}</div>
              <div>{item.quantidadeEstoque || '-'}</div>
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
          ))}
        </div>
      </div>
    </div>
  );
}