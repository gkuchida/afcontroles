import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseCliente';
import './estoque.css';

// Ícones Inline
const IconeSalvar = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconeLimpar = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
    <line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);

const IconeCancelar = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconeEditar = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconeExcluir = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const itensAgrupados = itens.reduce((acc, item) => {
  (acc[item.categoria] = acc[item.categoria] || []).push(item);
  return acc;
}, {});

export default function CadastroEstoque() {
  const navigate = useNavigate();
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [outroMaterial, setOutroMaterial] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [categorias, setCategorias] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [cores, setCores] = useState([]);
  const [estampas, setEstampas] = useState([]);

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

  useEffect(() => {
    fetchEstoque();
    fetchOpcoes();
  }, []);

  useEffect(() => {
    const valorMaterial = formData.material === 'Outros' ? outroMaterial : formData.material;
    const partesDescricao = [valorMaterial, formData.cor, formData.estampa]
      .filter(Boolean)
      .join(' - ');

    const altStr = String(formData.altura || '').replace(',', '.').trim();
    const largStr = String(formData.largura || '').replace(',', '.').trim();
    const pagoStr = String(formData.pago || '').replace(',', '.').trim();
    const areaStr = String(formData.area || '').replace(',', '.').trim();

    const alt = parseFloat(altStr);
    const larg = parseFloat(largStr);
    const pagoVal = parseFloat(pagoStr);

    const ambosPreenchidos = !isNaN(alt) && !isNaN(larg) && altStr !== '' && largStr !== '';
    let areaFinal = parseFloat(areaStr);
    if (ambosPreenchidos) {
      areaFinal = alt * larg;
    }

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

  async function fetchOpcoes() {
    try {
      const [resCat, resMat, resCor, resEst] = await Promise.all([
        supabase.from('categorias').select('id, nome').order('nome'),
        supabase.from('materiais').select('id, nome').order('nome'),
        supabase.from('cores').select('id, nome').order('nome'),
        supabase.from('estampas').select('id, nome').order('nome')
      ]);

      if (resCat.data) setCategorias(resCat.data);
      if (resMat.data) setMateriais(resMat.data);
      if (resCor.data) setCores(resCor.data);
      if (resEst.data) setEstampas(resEst.data);
    } catch (error) {
      console.error('Erro ao buscar dados para os selects:', error);
    }
  }

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLimpar = () => {
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
    setEditingId(null);
  };

  const handleCancelar = (e) => {
    e.preventDefault();
    if (editingId) {
      handleLimpar();
    } else {
      navigate('/');
    }
  };

  const handleEditar = (item) => {
    setEditingId(item.id);
    const materialExiste = materiais.some((m) => m.nome === item.material);
    
    setFormData({
      categoria: item.categoria || '',
      material: materialExiste ? item.material : (item.material ? 'Outros' : ''),
      cor: item.cor || '',
      estampa: item.estampa || '',
      descricao: item.descricao || '',
      altura: item.altura ?? '',
      largura: item.largura ?? '',
      area: item.area ?? '',
      valorm: item.valorm ?? '',
      pago: item.pago ?? '',
      data_compra: item.data_compra || '',
      loja: item.loja || '',
      observacao: item.observacao || ''
    });

    if (!materialExiste && item.material) {
      setOutroMaterial(item.material);
    } else {
      setOutroMaterial('');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este item do estoque?')) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('estoque').delete().eq('id', id);
      if (error) throw error;

      alert('Item excluído com sucesso!');
      fetchEstoque();
      if (editingId === id) handleLimpar();
    } catch (error) {
      alert('Erro ao excluir item: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const pagoNum = formData.pago !== '' ? parseFloat(String(formData.pago).replace(',', '.')) : null;
    const areaNum = formData.area !== '' ? parseFloat(String(formData.area).replace(',', '.')) : null;
    const valormNum = formData.valorm !== '' ? parseFloat(String(formData.valorm).replace(',', '.')) : null;

    const itemParaSalvar = {
      ...formData,
      altura: formData.altura !== '' ? parseFloat(String(formData.altura).replace(',', '.')) : null,
      largura: formData.largura !== '' ? parseFloat(String(formData.largura).replace(',', '.')) : null,
      area: areaNum,
      pago: pagoNum,
      valorm: valormNum,
      material: formData.material === 'Outros' ? outroMaterial : formData.material,
      data_compra: formData.data_compra || null
    };

    let error;
    if (editingId) {
      const res = await supabase.from('estoque').update(itemParaSalvar).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('estoque').insert([itemParaSalvar]);
      error = res.error;
    }

    if (error) {
      alert('Erro ao salvar item: ' + error.message);
    } else {
      alert(editingId ? 'Item atualizado com sucesso!' : 'Item cadastrado com sucesso!');
      handleLimpar();
      fetchEstoque();
      fetchOpcoes();
    }
    setLoading(false);
  };

  function formatarData(dataString) {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  const altNum = parseFloat(String(formData.altura).replace(',', '.'));
  const largNum = parseFloat(String(formData.largura).replace(',', '.'));

  const temDimensoesCalculaveis = 
    formData.altura !== '' && 
    formData.largura !== '' && 
    !isNaN(altNum) && 
    !isNaN(largNum);

  return (
    <div className="estoque-container">
      <h2 className="estoque-title">Controle de Estoque</h2>

      <form onSubmit={handleSubmit} className="estoque-card">
        
        <div className="estoque-card-header">
          <h3 className="estoque-card-title">
            {editingId ? 'Editar Item do Estoque' : 'Adicionar Novo Item'}
          </h3>
          
          <div className="acoes-menu">
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-icon btn-salvar" 
              title={editingId ? "Atualizar Item" : "Salvar no Estoque"}
            >
              <IconeSalvar size={20} />
            </button>

            <button 
              type="button" 
              onClick={handleLimpar} 
              className="btn-icon btn-limpar" 
              title="Limpar Campos"
            >
              <IconeLimpar size={20} />
            </button>

            <button 
              type="button" 
              onClick={handleCancelar} 
              className="btn-icon btn-cancelar" 
              title={editingId ? "Cancelar Edição" : "Cancelar e Voltar"}
            >
              <IconeCancelar size={20} />
            </button>
          </div>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Categoria:</label>
            <select 
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className="select-customizado"
            >
              <option value="">Selecione uma categoria...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.nome}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Material:</label>
            <select 
              name="material" 
              value={formData.material} 
              onChange={handleChange}
              className="select-customizado"
            >
              <option value="">Selecione o material...</option>
              {materiais.map((mat) => (
                <option key={mat.id} value={mat.nome}>
                  {mat.nome}
                </option>
              ))}
              <option value="Outros">Outros</option>
            </select>

            {formData.material === 'Outros' && (
              <input
                type="text"
                placeholder="Digite o nome do material..."
                value={outroMaterial}
                onChange={(e) => setOutroMaterial(e.target.value)}
                className="input-customizado" 
                style={{ marginTop: '8px' }}
                required
              />
            )}
          </div>

          <div className="form-group">
            <label>Cor:</label>
            <select 
              name="cor" 
              value={formData.cor} 
              onChange={handleChange}
              className="select-customizado"
            >
              <option value="">Selecione a cor...</option>
              {cores.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Estampa:</label>
            <select 
              name="estampa" 
              value={formData.estampa} 
              onChange={handleChange}
              className="select-customizado"
            >
              <option value="">Selecione a estampa...</option>
              {estampas.map((e) => (
                <option key={e.id} value={e.nome}>
                  {e.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Descrição:</label>
            <input type="text" name="descricao" value={formData.descricao} className="input-customizado soleitura" readOnly />
          </div>

          <div className="form-group">
            <label>Altura (m):</label>
            <input type="text" name="altura" value={formData.altura} onChange={handleChange} className="input-customizado" />
          </div>

          <div className="form-group">
            <label>Largura (m):</label>
            <input type="text" name="largura" value={formData.largura} onChange={handleChange} className="input-customizado" />
          </div>

          <div className="form-group">
            <label>Área / Qtd:</label>
            <input 
              type="text" 
              name="area" 
              value={formData.area} 
              onChange={handleChange} 
              className="input-customizado"
              readOnly={temDimensoesCalculaveis}
            />
          </div>

          <div className="form-group">
            <label>Valor Pago (R$):</label>
            <input type="text" name="pago" value={formData.pago} onChange={handleChange} className="input-customizado" />
          </div>

          <div className="form-group">
            <label>Valor / m (R$):</label>
            <input 
              type="text" 
              name="valorm" 
              value={formData.valorm} 
              className="input-customizado soleitura" 
              readOnly 
              placeholder="Calculado autom."
            />
          </div>

          <div className="form-group">
            <label>Data da Compra:</label>
            <input type="date" name="data_compra" value={formData.data_compra} onChange={handleChange} className="input-customizado" />
          </div>

          <div className="form-group">
            <label>Loja:</label>
            <input type="text" name="loja" value={formData.loja} onChange={handleChange} className="input-customizado" />
          </div>

          <div className="form-group form-group-full">
            <label>Observações:</label>
            <input type="text" name="observacao" value={formData.observacao} onChange={handleChange} className="input-customizado" style={{backgroundColor:'white', border:'1px solid var(--border-color)'}}/>
          </div>
        </div>
      </form>

      <h3 className="estoque-card-title" style={{ border: 'none', marginBottom: '12px' }}>Itens no Estoque</h3>

      <div className="tabela-div-container">
        <div className="tabela-div">
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
            <div className="col-val">Valor / m</div>
            <div className="col-data">Data Compra</div>
            <div className="col-loja">Loja</div>
            <div className="col-obs">Obs</div>
            <div className="col-acoes">Ações</div>
          </div>

          {itens.length === 0 ? (
            <div className="tabela-vazia">
              {loading ? 'Carregando itens...' : 'Nenhum item cadastrado.'}
            </div>
          ) : (
            estoque.map((item) => (
              <div key={item.id} className={`tabela-linha ${editingId === item.id ? 'linha-em-edicao' : ''}`}>
                <div className="col-cat" data-label="Categoria">{item.categoria || '-'}</div>
                <div className="col-mat" data-label="Material">{item.material || '-'}</div>
                <div className="col-cor" data-label="Cor">{item.cor || '-'}</div>
                <div className="col-est" data-label="Estampa">{item.estampa || '-'}</div>
                <div className="col-desc" data-label="Descrição"><strong>{item.descricao || '-'}</strong></div>
                <div className="col-dim" data-label="Altura">{item.altura ?? '-'}</div>
                <div className="col-dim" data-label="Largura">{item.largura ?? '-'}</div>
                <div className="col-qtd" data-label="Área/Qtd">{item.area ?? '-'}</div>
                <div className="col-val" data-label="Valor Pago">{item.pago ? `R$ ${item.pago}` : '-'}</div>
                <div className="col-val" data-label="Valor / m">{item.valorm ? `R$ ${item.valorm}` : '-'}</div>
                <div className="col-data" data-label="Data Compra">{formatarData(item.data_compra)}</div>
                <div className="col-loja" data-label="Loja">{item.loja || '-'}</div>
                <div className="col-obs" data-label="Obs">{item.observacao || '-'}</div>
                <div className="col-acoes" data-label="Ações">
                  <button 
                    type="button" 
                    className="btn-tabela-acao btn-editar" 
                    onClick={() => handleEditar(item)}
                    title="Editar Item"
                  >
                    <IconeEditar size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="btn-tabela-acao btn-excluir" 
                    onClick={() => handleExcluir(item.id)}
                    title="Excluir Item"
                  >
                    <IconeExcluir size={16} />
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