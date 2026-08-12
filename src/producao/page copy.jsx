import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseCliente';
import './producao.css';

export default function Producao() {
  const [loading, setLoading] = useState(false);
  const [materiais, setMateriais] = useState([]);
  const [producoes, setProducoes] = useState([]);

  const [outroModelo, setOutroModelo] = useState('');
  const [todosModelos, setTodosModelos] = useState([]);
  const [modelosFiltrados, setModelosFiltrados] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // Estados para Clientes e Pets do Banco de Dados
  const [clientes, setClientes] = useState([]);
  const [todosPets, setTodosPets] = useState([]);
  const [petsFiltrados, setPetsFiltrados] = useState([]);

  // Estados para digitação manual ("Outro")
  const [outroCliente, setOutroCliente] = useState('');
  const [outroPet, setOutroPet] = useState('');

  const [materiaisUsados, setMateriaisUsados] = useState([
    { material_id: '', altura: '', largura: '', quantidade: '', valor_gasto: 0, observacao: '' }
  ]);

  const [formData, setFormData] = useState({
    categoria_id: '',
    modelo_id: '',
    tamanho_id: '',
    tecido: '',
    cliente_id: '',
    pet_id: '',
    pescoco: '',
    torax: '',
    comprimento: '',
    tempo_costura_valor: '',
    custo: 0,
    venda: 0,
    vender_por: 0,
    estoque: 'Sim',
    observacao: ''
  });

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    recalcularTotais();
  }, [materiaisUsados, formData.tempo_costura_valor]);

  // Filtra modelos sempre que a categoria selecionada mudar
  useEffect(() => {
    if (formData.categoria_id && formData.categoria_id !== 'Outros') {
      const filtrados = todosModelos.filter(
        (m) => String(m.categoria_id) === String(formData.categoria_id)
      );
      setModelosFiltrados(filtrados);
    } else {
      setModelosFiltrados(todosModelos);
    }
  }, [formData.categoria_id, todosModelos]);

  // Filtra pets conforme o cliente selecionado no Select
  useEffect(() => {
    if (formData.cliente_id && formData.cliente_id !== 'Outros') {
      const filtrados = todosPets.filter(
        (p) => String(p.cliente_id) === String(formData.cliente_id)
      );
      setPetsFiltrados(filtrados);
    } else {
      setPetsFiltrados(todosPets);
    }
    // Reseta a seleção do pet se trocar o cliente
    setFormData((prev) => ({ ...prev, pet_id: '' }));
  }, [formData.cliente_id, todosPets]);

  const isUUID = (str) => {
    if (typeof str !== 'string') return false;
    const regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regexUUID.test(str.trim());
  };

  // 1. CARREGAR DADOS INICIAIS
  async function carregarDadosIniciais() {
    try {
      setLoading(true);

      const [
        { data: catData },
        { data: modData },
        { data: tamData },
        { data: cliData },
        { data: petsData },
        { data: estqData },
        { data: prodData }
      ] = await Promise.all([
        supabase.from('categorias').select('*').order('nome'),
        supabase.from('modelos').select('*').order('nome'),
        supabase.from('tamanhos').select('*').order('nome'),
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('pets').select('*').order('nome'),
        supabase.from('estoque').select('*').order('descricao'),
        supabase
          .from('produtos')
          .select(`
            *,
            categorias ( nome ),
            modelos ( nome ),
            tamanhos ( nome ),
            clientes ( nome ),
            pets ( nome ),
            produto_materiais (
              id,
              material_id,
              altura,
              largura,
              quantidade,
              valor_gasto,
              estoque ( descricao )
            )
          `)
          .order('created_at', { ascending: false })
      ]);      

      if (catData) setCategorias(catData);
      if (modData) {
        setTodosModelos(modData);
        setModelosFiltrados(modData);
      }
      if (tamData) setTamanhos(tamData);
      if (cliData) setClientes(cliData);
      if (petsData) {
        setTodosPets(petsData);
        setPetsFiltrados(petsData);
      }
      if (estqData) setMateriais(estqData);
      if (prodData) setProducoes(prodData);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }

  const parseNum = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(String(val).replace(',', '.')) || 0;
  };

  const handleMaterialChange = (index, field, value) => {
    const novosMateriais = [...materiaisUsados];
    novosMateriais[index][field] = value;

    const item = novosMateriais[index];

    if (field === 'altura' || field === 'largura') {
      const alt = parseNum(item.altura);
      const larg = parseNum(item.largura);
      if (alt > 0 && larg > 0) {
        item.quantidade = ((alt * larg) / 10000).toFixed(4);
      }
    }

    const qtdTotal = parseNum(item.quantidade);
    const materialCadastrado = materiais.find(
      (m) => String(m.id) === String(item.material_id)
    );

    if (materialCadastrado && qtdTotal > 0) {
      const valorm = parseNum(materialCadastrado.valorm);
      const valorPagoTotal = parseNum(materialCadastrado.pago);
      const areaTotalEstoque = parseNum(materialCadastrado.area);

      let precoPorMetroOuUnidade = 0;

      if (valorm > 0) {
        precoPorMetroOuUnidade = valorm;
      } else if (valorPagoTotal > 0 && areaTotalEstoque > 0) {
        precoPorMetroOuUnidade = valorPagoTotal / areaTotalEstoque;
      } else if (valorPagoTotal > 0) {
        precoPorMetroOuUnidade = valorPagoTotal;
      }

      item.valor_gasto = Number((precoPorMetroOuUnidade * qtdTotal).toFixed(2));
    } else {
      item.valor_gasto = 0;
    }

    setMateriaisUsados(novosMateriais);
  };

  const recalcularTotais = () => {
    const mat = materiaisUsados.reduce((acc, curr) => {
      return acc + (parseNum(curr.valor_gasto) || 0);
    }, 0);

    const mob = parseNum(formData.tempo_costura_valor);

    const custoTotal = mat + mob;
    const valorVenda = custoTotal * 2;
    const valorSugerido = Math.ceil(valorVenda);

    setFormData((prev) => ({
      ...prev,
      custo: custoTotal.toFixed(2),
      venda: valorVenda.toFixed(2),
      vender_por: valorSugerido.toFixed(2)
    }));
  };

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    if (name === 'categoria_id') {
      setFormData((prev) => ({ ...prev, categoria_id: value, modelo_id: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const adicionarLinhaMaterial = () => {
    setMateriaisUsados([
      ...materiaisUsados,
      { material_id: '', altura: '', largura: '', quantidade: '', valor_gasto: 0, observacao: '' }
    ]);
  };

  const removerLinhaMaterial = (index) => {
    if (materiaisUsados.length === 1) return;
    const novos = materiaisUsados.filter((_, i) => i !== index);
    setMateriaisUsados(novos);
  };

  // 2. SALVAR PRODUÇÃO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalModeloId = formData.modelo_id && formData.modelo_id !== 'Outros' ? formData.modelo_id : null;
      let finalClienteId = formData.cliente_id && formData.cliente_id !== 'Outros' ? formData.cliente_id : null;
      let finalPetId = formData.pet_id && formData.pet_id !== 'Outros' ? formData.pet_id : null;
      let nomePetTexto = '';

      // --- 1. SE DIGITOU CLIENTE NOVO ---
      if (formData.cliente_id === 'Outros' && outroCliente.trim()) {
        const { data: novoCli, error: errCli } = await supabase
          .from('clientes')
          .insert([{ nome: outroCliente.trim() }])
          .select()
          .single();

        if (errCli) throw new Error(`Erro ao cadastrar novo cliente: ${errCli.message}`);
        finalClienteId = novoCli.id;
      }

      // --- 2. SE DIGITOU PET NOVO ---
      if (formData.pet_id === 'Outros' && outroPet.trim()) {
        nomePetTexto = outroPet.trim();
        const { data: novoPetObj, error: errPet } = await supabase
          .from('pets')
          .insert([{ nome: outroPet.trim(), cliente_id: finalClienteId }])
          .select()
          .single();

        if (errPet) throw new Error(`Erro ao cadastrar novo pet: ${errPet.message}`);
        finalPetId = novoPetObj.id;
      } else if (finalPetId) {
        const petSelecionado = todosPets.find((p) => String(p.id) === String(finalPetId));
        nomePetTexto = petSelecionado ? petSelecionado.nome : '';
      }

      // --- 3. SE DIGITOU MODELO NOVO ---
      if (formData.modelo_id === 'Outros' && outroModelo.trim()) {
        const { data: novoMod, error: errMod } = await supabase
          .from('modelos')
          .insert([{ nome: outroModelo.trim(), categoria_id: isUUID(formData.categoria_id) ? formData.categoria_id : null }])
          .select()
          .single();

        if (errMod) throw new Error(`Erro ao cadastrar modelo: ${errMod.message}`);
        finalModeloId = novoMod.id;
      }

      // --- 4. GRAVA PRODUTO ---
      const produtoPayload = {
        categoria_id: isUUID(formData.categoria_id) ? formData.categoria_id : null,
        modelo_id: isUUID(finalModeloId) ? finalModeloId : null,
        tamanho_id: isUUID(formData.tamanho_id) ? formData.tamanho_id : null,
        tecido: formData.tecido?.trim() || null,
        cliente_id: isUUID(finalClienteId) ? finalClienteId : null,
        pet_id: isUUID(finalPetId) ? finalPetId : null,
        nome_pet: nomePetTexto || null,
        pescoco: parseNum(formData.pescoco) || null,
        torax: parseNum(formData.torax) || null,
        comprimento: parseNum(formData.comprimento) || null,
        custo: parseNum(formData.custo),
        valor_venda: parseNum(formData.vender_por),
        estoque: formData.estoque || 'Sim',
        observacao: formData.observacao?.trim() || null
      };

      const { data: prodData, error: prodError } = await supabase
        .from('produtos')
        .insert([produtoPayload])
        .select()
        .single();

      if (prodError) throw prodError;      

      // --- 5. GRAVA MATERIAIS ---      
        const materiaisPayload = materiaisUsados
        .filter((m) => m.material_id && String(m.material_id).trim() !== '' && m.material_id !== 'Outros')
        .map((m) => ({
        produto_id: prodData.id,
        material_id: m.material_id,
        altura: parseNum(m.altura) || null,
        largura: parseNum(m.largura) || null,
        quantidade: parseNum(m.quantidade) || null,
        valor_gasto: parseNum(m.valor_gasto) || 0,
        observacao: m.observacao?.trim() || null
        }));

      if (materiaisPayload.length > 0) {
        const { error: matError } = await supabase
          .from('produto_materiais')
          .insert(materiaisPayload);

        if (matError) throw matError;
      }

      alert('Produção registrada com sucesso!');

      // Reset
      setFormData({
        categoria_id: '',
        modelo_id: '',
        tamanho_id: '',
        tecido: '',
        cliente_id: '',
        pet_id: '',
        pescoco: '',
        torax: '',
        comprimento: '',
        tempo_costura_valor: '',
        custo: 0,
        venda: 0,
        vender_por: 0,
        estoque: 'Sim',
        observacao: ''
      });
      setOutroModelo('');
      setOutroCliente('');
      setOutroPet('');
      setMateriaisUsados([
        { material_id: '', altura: '', largura: '', quantidade: '', valor_gasto: 0, observacao: '' }
      ]);

      await carregarDadosIniciais();

    } catch (err) {
      console.error('Erro no cadastro:', err);
      alert(`Erro ao salvar: ${err.message || 'Falha na gravação'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="estoque-container" style={{ paddingBottom: '60px' }}>
      <h2 className="estoque-title">Ficha de Produção</h2>

      <form onSubmit={handleSubmit} className="estoque-card">
        {/* DADOS BÁSICOS DA PEÇA */}
        <div className="form-grid">
          <div className="form-group">
            <label>Categoria:</label>
            <select
              name="categoria_id"
              value={formData.categoria_id}
              onChange={handleChangeForm}
              className="select-customizado"
            >
              <option value="">Selecione...</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Modelo:</label>
            <select
              name="modelo_id"
              value={formData.modelo_id}
              onChange={handleChangeForm}
              className="select-customizado"
              disabled={!formData.categoria_id}
              required
            >
              <option value="">Selecione...</option>
              {modelosFiltrados.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
              <option value="Outros">+ Outro (Digitar)</option>
            </select>
            {formData.modelo_id === 'Outros' && (
              <input
                type="text"
                placeholder="Digite o nome do modelo..."
                value={outroModelo}
                onChange={(e) => setOutroModelo(e.target.value)}
                className="input-customizado"
                style={{ marginTop: '8px' }}
                required
              />
            )}
          </div>

          <div className="form-group">
            <label>Tamanho:</label>
            <select
              name="tamanho_id"
              value={formData.tamanho_id}
              onChange={handleChangeForm}
              className="select-customizado"
              required
            >
              <option value="">Selecione...</option>
              {tamanhos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tecido:</label>
            <input
              type="text"
              name="tecido"
              value={formData.tecido}
              onChange={handleChangeForm}
              className="input-customizado"
              placeholder="Ex: Soft, Tricoline"
            />
          </div>
        </div>

        {/* SELECTS DE CLIENTE E PET */}
        <h4 style={{ marginTop: '20px' }}>Cliente e Pet</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Cliente:</label>
            <select
              name="cliente_id"
              value={formData.cliente_id}
              onChange={handleChangeForm}
              className="select-customizado"
            >
              <option value="">Selecione o Cliente...</option>
              {clientes.map((cli) => (
                <option key={cli.id} value={cli.id}>
                  {cli.nome}
                </option>
              ))}
              <option value="Outros">+ Cadastrar Novo Cliente</option>
            </select>
            {formData.cliente_id === 'Outros' && (
              <input
                type="text"
                placeholder="Digite o nome do novo cliente..."
                value={outroCliente}
                onChange={(e) => setOutroCliente(e.target.value)}
                className="input-customizado"
                style={{ marginTop: '8px' }}
                required
              />
            )}
          </div>

          <div className="form-group">
            <label>Pet:</label>
            <select
              name="pet_id"
              value={formData.pet_id}
              onChange={handleChangeForm}
              className="select-customizado"
            >
              <option value="">Selecione o Pet...</option>
              {petsFiltrados.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
              <option value="Outros">+ Cadastrar Novo Pet</option>
            </select>
            {formData.pet_id === 'Outros' && (
              <input
                type="text"
                placeholder="Digite o nome do novo pet..."
                value={outroPet}
                onChange={(e) => setOutroPet(e.target.value)}
                className="input-customizado"
                style={{ marginTop: '8px' }}
                required
              />
            )}
          </div>
        </div>

        {/* MEDIDAS (CM) */}
        <h4 style={{ marginTop: '20px' }}>Medidas Específicas (cm)</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Pescoço (cm):</label>
            <input
              type="text"
              name="pescoco"
              value={formData.pescoco}
              onChange={handleChangeForm}
              className="input-customizado"
              placeholder="Ex: 28"
            />
          </div>

          <div className="form-group">
            <label>Tórax (cm):</label>
            <input
              type="text"
              name="torax"
              value={formData.torax}
              onChange={handleChangeForm}
              className="input-customizado"
              placeholder="Ex: 42"
            />
          </div>

          <div className="form-group">
            <label>Comprimento (cm):</label>
            <input
              type="text"
              name="comprimento"
              value={formData.comprimento}
              onChange={handleChangeForm}
              className="input-customizado"
              placeholder="Ex: 35"
            />
          </div>
        </div>

        {/* MATERIAIS */}
        <h4 style={{ marginTop: '20px' }}>Materiais Gastos na Peça</h4>

        {materiaisUsados.map((mat, idx) => (
          <div key={idx} className="form-grid" style={{ background: '#fdf6f3', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
            <div className="form-group">
              <label>Material:</label>
              <select
                value={mat.material_id}
                onChange={(e) => handleMaterialChange(idx, 'material_id', e.target.value)}
                className="select-customizado"
              >
                <option value="">Selecione o Material...</option>
                {materiais.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.descricao}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Alt (cm):</label>
              <input
                type="text"
                value={mat.altura}
                onChange={(e) => handleMaterialChange(idx, 'altura', e.target.value)}
                className="input-customizado"
                placeholder="15"
              />
            </div>

            <div className="form-group">
              <label>Larg (cm):</label>
              <input
                type="text"
                value={mat.largura}
                onChange={(e) => handleMaterialChange(idx, 'largura', e.target.value)}
                className="input-customizado"
                placeholder="20"
              />
            </div>

            <div className="form-group">
              <label>Qtd Total (m²):</label>
              <input
                type="text"
                value={mat.quantidade}
                onChange={(e) => handleMaterialChange(idx, 'quantidade', e.target.value)}
                className="input-customizado"
                placeholder="0.03"
              />
            </div>

            <div className="form-group">
              <label>Valor Gasto (R$):</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={`R$ ${mat.valor_gasto}`}
                  className="input-customizado"
                  readOnly
                />
                {materiaisUsados.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerLinhaMaterial(idx)}
                    style={{
                      background: '#ff4d4f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0 10px',
                      cursor: 'pointer'
                    }}
                  >
                    X
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        <button type="button" onClick={adicionarLinhaMaterial} className="btn-submit" style={{ backgroundColor: '#786f6c', marginBottom: '20px' }}>
          + Adicionar Outro Material
        </button>

        {/* TOTALIZADORES */}
        <div className="form-grid">
          <div className="form-group">
            <label>Mão de Obra / Costura (R$):</label>
            <input
              type="text"
              name="tempo_costura_valor"
              value={formData.tempo_costura_valor}
              onChange={handleChangeForm}
              className="input-customizado"
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label>Custo Total (R$):</label>
            <input type="text" value={`R$ ${formData.custo}`} className="input-customizado" readOnly />
          </div>

          <div className="form-group">
            <label>Vender Por (Sugestão R$):</label>
            <input type="text" value={`R$ ${formData.vender_por}`} className="input-customizado" readOnly />
          </div>

          <div className="form-group">
            <label>Observação:</label>
            <input
              type="text"
              name="observacao"
              value={formData.observacao}
              onChange={handleChangeForm}
              className="input-customizado"
              placeholder="Anotações gerais..."
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-submit" style={{ marginTop: '15px' }}>
          {loading ? 'Salvando...' : 'Cadastrar Produção'}
        </button>
      </form>

      {/* HISTÓRICO DE PRODUÇÃO */}
      <div className="historico-card" style={{
        marginTop: '30px',
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <h3 className="estoque-title" style={{ fontSize: '18px', marginBottom: '15px', color: '#333' }}>
          Histórico de Produção
        </h3>

        <div className="historico-table-container">
          <table className="historico-table" style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            minWidth: '1300px', 
            textAlign: 'left', 
            fontSize: '13px' 
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th>Categoria</th>
                <th>Modelo</th>
                <th>Tamanho</th>
                <th>Tecido</th>
                <th>Cliente</th>
                <th>Pet</th>
                <th>Pescoço</th>
                <th>Tórax</th>
                <th>Comprimento</th>
                <th>Material</th>
                <th>Altura</th>
                <th>Largura</th>
                <th>Qtd. Usada</th>
                <th>Valor Gasto</th>
                <th>Custo</th>
                <th>Venda Sugerida</th>
                <th>Data</th>
                <th>Estoque</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {producoes.length === 0 ? (
                <tr>
                  <td colSpan="19" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    Nenhuma produção registrada.
                  </td>
                </tr>
              ) : (
                producoes.map((p) => {
                  const listaMats = p.produto_materiais || [];

                  return (
                    <tr key={p.id} style={{ borderBottom: '2px solid #ccc', verticalAlign: 'middle' }}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {p.categorias?.nome || '-'}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {p.modelos?.nome || '-'}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {p.tamanhos?.nome || '-'}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {p.tecido || '-'}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {p.clientes?.nome || '-'}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {p.pets?.nome || p.nome_pet || '-'}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{p.pescoco ?? '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{p.torax ?? '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{p.comprimento ?? '-'}</td>

                      <td style={{ padding: '0', border: '1px solid #ddd', minWidth: '150px' }}>
                        {listaMats.length > 0 ? (
                          listaMats.map((m, idx) => {
                            const matEstoque = materiais.find(item => String(item.id) === String(m.material_id));
                            return (
                                <td style={{ padding: '0', border: '1px solid #ddd', minWidth: '150px' }}>
                                {listaMats.length > 0 ? (
                                  listaMats.map((m, idx) => (
                                    <div key={m.id || idx} style={{ padding: '4px 8px', borderBottom: idx < listaMats.length - 1 ? '1px solid #eee' : 'none' }}>
                                      {m.estoque?.descricao || m.material_id || '-'}
                                    </div>
                                  ))
                                ) : '-'}
                              </td>
                            );
                          })
                        ) : '-'}
                      </td>

                      <td style={{ padding: '0', border: '1px solid #ddd', textAlign: 'center' }}>
                        {listaMats.length > 0 ? (
                          listaMats.map((m, idx) => (
                            <div key={m.id || idx} style={{ padding: '4px 8px', borderBottom: idx < listaMats.length - 1 ? '1px solid #eee' : 'none' }}>
                              {m.altura ?? '-'}
                            </div>
                          ))
                        ) : '-'}
                      </td>

                      <td style={{ padding: '0', border: '1px solid #ddd', textAlign: 'center' }}>
                        {listaMats.length > 0 ? (
                          listaMats.map((m, idx) => (
                            <div key={m.id || idx} style={{ padding: '4px 8px', borderBottom: idx < listaMats.length - 1 ? '1px solid #eee' : 'none' }}>
                              {m.largura ?? '-'}
                            </div>
                          ))
                        ) : '-'}
                      </td>

                      <td style={{ padding: '0', border: '1px solid #ddd', textAlign: 'center' }}>
                        {listaMats.length > 0 ? (
                          listaMats.map((m, idx) => (
                            <div key={m.id || idx} style={{ padding: '4px 8px', borderBottom: idx < listaMats.length - 1 ? '1px solid #eee' : 'none' }}>
                              {m.quantidade ?? '-'}
                            </div>
                          ))
                        ) : '-'}
                      </td>

                      <td style={{ padding: '0', border: '1px solid #ddd', textAlign: 'right' }}>
                        {listaMats.length > 0 ? (
                          listaMats.map((m, idx) => (
                            <div key={m.id || idx} style={{ padding: '4px 8px', borderBottom: idx < listaMats.length - 1 ? '1px solid #eee' : 'none' }}>
                              {m.valor_gasto ? `R$ ${Number(m.valor_gasto).toFixed(2)}` : '-'}
                            </div>
                          ))
                        ) : '-'}
                      </td>

                      <td style={{ padding: '8px', border: '1px solid #ddd', color: 'red', fontWeight: 'bold' }}>
                        {p.custo ? `R$ ${Number(p.custo).toFixed(2)}` : 'R$ 0.00'}
                      </td>

                      <td style={{ padding: '8px', border: '1px solid #ddd', color: '#0056b3', fontWeight: 'bold' }}>
                        {p.valor_venda ? `R$ ${Number(p.valor_venda).toFixed(2)}` : 'R$ 0.00'}
                      </td>

                      <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '-'}
                      </td>

                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {p.estoque ?? '0'}
                      </td>

                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {p.observacao || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}