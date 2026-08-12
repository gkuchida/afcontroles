import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseCliente';
import './estoque.css';

export default function CadastroEstoque() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [outroMaterial, setOutroMaterial] = useState('');

  // Estado do formulário refletindo todas as colunas da planilha
  const [formData, setFormData] = useState({
    categoria: '',
    material: '',
    cor: '',
    estampa: '',
    descricao: '',
    altura: '',
    largura: '',
    area: '',
    valorm: '',
    pago: '',
    data_compra: '',
    loja: '',
    observacao: ''
  });

  // Busca os dados do estoque ao carregar a página
  useEffect(() => {
    fetchEstoque();
  }, []);

  // 2. useEffect para automatizar Descrição e Área/Quantidade  
  useEffect(() => {
    const valorMaterial = formData.material === 'Outros' ? outroMaterial : formData.material;
  
    const partesDescricao = [valorMaterial, formData.cor, formData.estampa]
      .filter(Boolean)
      .join(' - ');
  
    // Tratamento de vírgulas e espaços
    const altStr = String(formData.altura).replace(',', '.').trim();
    const largStr = String(formData.largura).replace(',', '.').trim();
    const pagoStr = String(formData.pago).replace(',', '.').trim();
    const areaStr = String(formData.area).replace(',', '.').trim();
  
    const alt = parseFloat(altStr);
    const larg = parseFloat(largStr);
    const pagoVal = parseFloat(pagoStr);
  
    const ambosPreenchidos = !isNaN(alt) && !isNaN(larg) && altStr !== '' && largStr !== '';
  
    // Determina a área final para o cálculo de valorm
    let areaFinal = parseFloat(areaStr);
    if (ambosPreenchidos) {
      areaFinal = alt * larg;
    }
  
    // Calcula o valor por metro/unidade se houver pago e area válidos
    let valorMetroCalculado = '';
    if (!isNaN(pagoVal) && !isNaN(areaFinal) && areaFinal > 0) {
      valorMetroCalculado = (pagoVal / areaFinal).toFixed(2);
    }
  
    setFormData((prev) => {
      if (ambosPreenchidos) {
        const areaCalculada = areaFinal.toFixed(2);
        return {
          ...prev,
          descricao: partesDescricao,
          area: areaCalculada,
          valorm: valorMetroCalculado
        };
      }
  
      return {
        ...prev,
        descricao: partesDescricao,
        valorm: valorMetroCalculado
      };
    });
  
  }, [
    formData.material, 
    outroMaterial, 
    formData.cor, 
    formData.estampa, 
    formData.altura, 
    formData.largura,
    formData.area,
    formData.pago
  ]);

  async function fetchEstoque() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('estoque')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setItens(data || []);
    } catch (error) {
      alert('Erro ao carregar o estoque: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Atualiza os valores do formulário conforme digita
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Salva no banco de dados Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    const pagoNum = formData.pago ? parseFloat(String(formData.pago).replace(',', '.')) : null;
    const areaNum = formData.area ? parseFloat(String(formData.area).replace(',', '.')) : null;
    const valormNum = formData.valorm ? parseFloat(String(formData.valorm).replace(',', '.')) : null;
  
    const itemParaSalvar = {
      ...formData,
      altura: formData.altura ? parseFloat(String(formData.altura).replace(',', '.')) : null,
      largura: formData.largura ? parseFloat(String(formData.largura).replace(',', '.')) : null,
      area: areaNum,
      pago: pagoNum,
      valorm: valormNum, // <--- Enviando a coluna valorm já calculada
      material: formData.material === 'Outros' ? outroMaterial : formData.material,
      data_compra: formData.data_compra || null
    };
  
    const { data, error } = await supabase
      .from('estoque')
      .insert([itemParaSalvar]);
  
    if (error) {
      alert('Erro ao salvar item: ' + error.message);
    } else {
      alert('Item cadastrado com sucesso!');
      setFormData({
        categoria: '',
        material: '',
        cor: '',
        estampa: '',
        descricao: '',
        altura: '',
        largura: '',
        area: '',
        valorm: '',
        pago: '',
        data_compra: '',
        loja: '',
        observacao: ''
      });
      setOutroMaterial('');
      fetchEstoque();
    }
    setLoading(false);
  };

  // Função para converter "YYYY-MM-DD" para "DD/MM/YYYY"
  function formatarData(dataString) {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  // Verifica se o campo de área deve ficar bloqueado (readOnly)
  const altNum = parseFloat(String(formData.altura).replace(',', '.'));
  const largNum = parseFloat(String(formData.largura).replace(',', '.'));

  const temDimensoesCalculaveis = 
    formData.altura !== '' && 
    formData.largura !== '' && 
    !isNaN(altNum) && 
    !isNaN(largNum);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Controle de Estoque</h2>
      <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
        <h3>Adicionar Novo Item</h3>
      </div>
      
      {/* --- FORMULÁRIO DE CADASTRO --- */}
      <form onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          
          <div>
            <label>Categoria:</label>
            <select 
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="select-customizado"
            >
              <option value="">Selecione uma categoria...</option>
              <option value="Aviamento">Aviamentos</option>
              <option value="Custos Fixos">Custos Fixos</option>
              <option value="Embalagem">Embalagem</option>
              <option value="Tecido">Tecido</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label>Material:</label>            
            <select name="material"                      
              value={formData.material} 
              onChange={handleChange}
              className="select-customizado"
            >
              <option value="">Selecione o material...</option>                      
              <option value="Fleece">Fleece</option>
              <option value="Gorgurinho">Gorgurinho</option>
              <option value="Jeans">Jeans</option>          
              <option value="Malha">Malha</option>                                    
              <option value="Matelasse">Matelassê</option> 
              <option value="Microsoft">Microsoft</option>  
              <option value="Moletom">Moletom</option>
              <option value="NylonE">Nylon Emborrachado</option> 
              <option value="Nylon7">Nylon 70</option>   
              <option value="Pele">Pele</option>                                                                                                                                                                                                                                                                                
              <option value="Pipoquinha">Pipoquinha</option>     
              <option value="Poliviscose">Poliviscose</option>  
              <option value="Ribana">Ribana</option>                      
              <option value="Soft">Soft</option>                                                                                                                                                                                                                                                                                
              <option value="TricolineE">Tricoline Estampado</option>                      
              <option value="TricolineF">Tricoline Festivo</option>             
              <option value="TricolineL">Tricoline Liso</option>                                                                                                                                                                                                                                                                                
              <option value="Outros">Outros</option>  
            </select>    

            {formData.material === 'Outros' && (
              <input
                type="text"
                placeholder="Digite o nome do material..."
                value={outroMaterial}
                onChange={(e) => setOutroMaterial(e.target.value)}
                className="input-customizado" 
                style={inputStyle} 
                required
              />
            )}        
          </div>

          <div>
            <label>Cor:</label>
            <select name="cor"                      
              value={formData.cor} 
              onChange={handleChange}
              className="select-customizado"
            >
              <option value="">Selecione a cor ...</option>                      
              <option value="Azul">Azul</option>
              <option value="AzulB">Azul bebê</option>
              <option value="AzulM">Azul Marinho</option>
              <option value="AzulR">Azul Royal</option>
              <option value="Amarelo">Amarelo</option>
              <option value="Bege">Bege</option>          
              <option value="Branco">Branco</option>                                    
              <option value="Caramelo">Caramelo</option> 
              <option value="Cinza">Cinza</option>  
              <option value="Laranja">Laranja</option>  
              <option value="Pink">Pink</option>     
              <option value="Preto">Preto</option>
              <option value="Rosa">Rosa</option>  
              <option value="RosaC">Rosa Claro</option>                                                                                                                                                                                                                                                                                
              <option value="Verde">Verde</option>
              <option value="VerdeA">Verde Água</option> 
              <option value="VerdeM">Verde Musgo</option>   
              <option value="Vermelho">Vermelho</option>                                                                                                                                                                                                                                                                                
              <option value="Vinho">Vinho</option>             
            </select>                        
          </div>

          <div>
            <label>Estampa:</label>
            <input type="text" name="estampa" value={formData.estampa} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label>Descrição:</label>
            <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} style={inputStyle} readOnly/>
          </div>

          <div>
            <label>Altura:</label>
            <input type="text" name="altura" value={formData.altura} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label>Largura:</label>
            <input type="text" name="largura" value={formData.largura} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label>Área / Quantidade:</label>
            <input 
              type="text" 
              name="area" 
              value={formData.area} 
              onChange={handleChange} 
              style={inputStyle}
              readOnly={temDimensoesCalculaveis}
            />
          </div>

          <div>
            <label>Valor Pago (R$):</label>
            <input type="text" name="pago" value={formData.pago} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label>Valor / $m^2$ (R$):</label>
            <input 
              type="text" 
              name="valorm" 
              value={formData.valorm} 
              style={inputStyle} 
              readOnly 
              placeholder="Calculado autom."
            />
          </div>

          <div>
            <label>Data da Compra:</label>
            <input type="date" name="data_compra" value={formData.data_compra} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label>Loja:</label>
            <input type="text" name="loja" value={formData.loja} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label>Observações:</label>
            <input type="text" name="observacao" value={formData.observacao} onChange={handleChange} style={inputStyle} />
          </div>

        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Salvação em andamento...' : 'Salvar no Estoque'}
        </button>
      </form>

      {/* --- TABELA DE EXIBIÇÃO DO ESTOQUE --- */}            
      <h3 className="estoque-title" style={{ fontSize: '20px' }}>Itens no Estoque</h3>

      <div className="tabela-div">
        {/* CABEÇALHO */}
        <div className="tabela-linha tabela-header">
          <div className="col-cat">Categoria</div>
          <div className="col-mat">Material</div>
          <div className="col-cor">Cor</div>
          <div className="col-est">Estampa</div>
          <div className="col-desc">Descrição</div>
          <div className="col-dim">Altura</div>
          <div className="col-dim">Largura</div>
          <div className="col-qtd">Área/Qtd</div>
          <div className="col-val">Valor Pago</div>
          <div className="col-data">Data Compra</div>
          <div className="col-loja">Loja</div>
          <div className="col-obs">Obs</div>
        </div>

        {/* CORPO DOS DADOS */}
        {itens.length === 0 ? (
          <div className="tabela-vazia">
            {loading ? 'Carregando itens...' : 'Nenhum item cadastrado.'}
          </div>
        ) : (
          itens.map((item) => (
            <div key={item.id} className="tabela-linha">
              <div className="col-cat">{item.categoria || '-'}</div>
              <div className="col-mat">{item.material || '-'}</div>
              <div className="col-cor">{item.cor || '-'}</div>
              <div className="col-est">{item.estampa || '-'}</div>
              <div className="col-desc"><strong>{item.descricao || '-'}</strong></div>
              <div className="col-dim">{item.altura || '-'}</div>
              <div className="col-dim">{item.largura || '-'}</div>
              <div className="col-qtd">{item.area || '-'}</div>
              <div className="col-val">{item.pago ? `R$ ${item.pago}` : '-'}</div>
              <div className="col-val">{item.valorm ? `R$ ${item.valorm}` : '-'}</div>
              <div className="col-data">{formatarData(item.data_compra)}</div>
              <div className="col-loja">{item.loja || '-'}</div>
              <div className="col-obs">{item.observacao || '-'}</div>
            </div>
          ))
        )}
      </div>
            
    </div>
  );
}

// Estilos básicos inline para visualização rápida
const inputStyle = {
  width: '100%',
  padding: '8px',
  marginTop: '4px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  boxSizing: 'border-box'
};