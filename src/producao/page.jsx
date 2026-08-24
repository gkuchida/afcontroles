import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseCliente';
import { Edit, Trash2, Plus, X } from 'lucide-react';
import './producao.css';

export default function Producao() {
  const [loading, setLoading] = useState(false);

  const [materiaisEstoque, setMateriaisEstoque] = useState([]);
  const [producoes, setProducoes] = useState([]);

  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [pets, setPets] = useState([]);

  // MODO EDIÇÃO
  const [modoEdicao, setModoEdicao] = useState(false);
  const [produtoEditandoId, setProdutoEditandoId] = useState(null);

  // ESTADOS DOS FILTROS
  const [filtroEstoque, setFiltroEstoque] = useState('');
  const [filtroModelo, setFiltroModelo] = useState('');
  const [filtroTamanho, setFiltroTamanho] = useState('');

  const [outroModelo, setOutroModelo] = useState('');
  const [outroCliente, setOutroCliente] = useState('');
  const [outroPet, setOutroPet] = useState('');

  const [materiaisUsados, setMateriaisUsados] = useState([
    {
      material_id: '',
      descricao: '',
      altura: '',
      largura: '',
      quantidade: '',
      valor_gasto: 0,
      observacao: ''
    }
  ]);

  const [formData, setFormData] = useState({
    categoria: '',
    modelo: '',
    tamanho: '',
    material: '',
    cliente_id: '',
    pet_id: '',
    pescoco: '',
    torax: '',
    comprimento: '',
    tempo_costura_valor: '',
    custo: '0.00',
    venda: '0.00',
    vender_por: '0.00',
    data_confec: new Date().toISOString().split('T')[0],
    estoque: 'Sim',
    observacao: ''
  });

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    recalcularTotais();
  }, [materiaisUsados, formData.tempo_costura_valor]);

  // ============================================================
  // CARREGAR DADOS
  // ============================================================

  const carregarDadosIniciais = async () => {
    try {
      setLoading(true);

      const [
        { data: catData, error: catError },
        { data: modData, error: modError },
        { data: tamData, error: tamError },
        { data: cliData, error: cliError },
        { data: petsData, error: petsError },
        { data: estqData, error: estqError }
      ] = await Promise.all([
        supabase.from('categorias').select('*').range(0, 99999),
        supabase.from('modelos').select('*').range(0, 99999),
        supabase.from('tamanhos').select('*').range(0, 99999),
        supabase.from('clientes').select('*').range(0, 99999),
        supabase.from('pets').select('*').range(0, 99999),
        supabase.from('estoque').select('*').range(0, 99999)
      ]);

      if (catError) throw catError;
      if (modError) throw modError;
      if (tamError) throw tamError;
      if (cliError) throw cliError;
      if (petsError) throw petsError;
      if (estqError) throw estqError;

      setCategorias(catData || []);
      setModelos(modData || []);
      setTamanhos(tamData || []);
      setClientes(cliData || []);
      setPets(petsData || []);
      setMateriaisEstoque(estqData || []);

      const { data: prodData, error: prodError } = await supabase
        .from('produtos')
        .select(`
          *,
          produto_materiais (*)
        `)
        .order('id', { ascending: false })
        .range(0, 99999);

      if (prodError) throw prodError;

      const produtosTratados = (prodData || []).map((prod) => {
        const materiaisOrdenados = (prod.produto_materiais || []).sort((a, b) => {
          const ordemA = Number(a.ordem) || 999999;
          const ordemB = Number(b.ordem) || 999999;
          return ordemA - ordemB;
        });

        return {
          ...prod,
          produto_materiais: materiaisOrdenados
        };
      });

      setProducoes(produtosTratados);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      alert(`Erro ao carregar dados: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LÓGICA DE FILTRAGEM
  // ============================================================

  const producoesFiltradas = useMemo(() => {
    return producoes.filter((item) => {
      if (filtroEstoque && String(item.estoque).toLowerCase() !== filtroEstoque.toLowerCase()) {
        return false;
      }
      if (filtroTamanho && String(item.tamanho) !== filtroTamanho) {
        return false;
      }
      if (filtroModelo && String(item.modelo) !== filtroModelo) {
        return false;
      }
      return true;
    });
  }, [producoes, filtroEstoque, filtroTamanho, filtroModelo]);

  // ============================================================
  // FUNÇÕES AUXILIARES E HANDLERS
  // ============================================================

  const parseNum = (val) => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    return (
      parseFloat(
        String(val)
          .replace('R$', '')
          .replace(/\s/g, '')
          .replace(',', '.')
      ) || 0
    );
  };

  const formatarDataExibicao = (dataStr) => {
    if (!dataStr) return '-';
    const apenasData = String(dataStr).split('T')[0];
    const partes = apenasData.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return dataStr;
  };

  const resetFormulario = () => {
    setFormData({
      categoria: '',
      modelo: '',
      tamanho: '',
      material: '',
      cliente_id: '',
      pet_id: '',
      pescoco: '',
      torax: '',
      comprimento: '',
      tempo_costura_valor: '',
      custo: '0.00',
      venda: '0.00',
      vender_por: '0.00',
      data_confec: new Date().toISOString().split('T')[0],
      estoque: 'Sim',
      observacao: ''
    });

    setOutroModelo('');
    setOutroCliente('');
    setOutroPet('');

    setMateriaisUsados([
      {
        material_id: '',
        descricao: '',
        altura: '',
        largura: '',
        quantidade: '',
        valor_gasto: 0,
        observacao: ''
      }
    ]);

    setModoEdicao(false);
    setProdutoEditandoId(null);
  };

  const handleMaterialChange = (index, field, value) => {
    const novosMateriais = [...materiaisUsados];
    const item = { ...novosMateriais[index], [field]: value };

    if (field === 'material_id') {
      const materialSelecionado = materiaisEstoque.find(
        (m) => String(m.id) === String(value)
      );
      item.descricao = materialSelecionado ? materialSelecionado.descricao : '';
    }

    if (field === 'altura' || field === 'largura') {
      const altura = parseNum(item.altura);
      const largura = parseNum(item.largura);
      if (altura > 0 && largura > 0) {
        item.quantidade = ((altura * largura) / 10000).toFixed(4);
      }
    }

    const quantidadeTotal = parseNum(item.quantidade);
    const materialCadastrado = materiaisEstoque.find(
      (m) => String(m.id) === String(item.material_id)
    );

    if (materialCadastrado && quantidadeTotal > 0) {
      const valorMetro = parseNum(materialCadastrado.valorm);
      const valorPago = parseNum(materialCadastrado.pago);
      const areaEstoque = parseNum(materialCadastrado.area);

      let precoPorMetroOuUnidade = 0;
      if (valorMetro > 0) {
        precoPorMetroOuUnidade = valorMetro;
      } else if (valorPago > 0 && areaEstoque > 0) {
        precoPorMetroOuUnidade = valorPago / areaEstoque;
      } else if (valorPago > 0) {
        precoPorMetroOuUnidade = valorPago;
      }

      item.valor_gasto = Number(
        (precoPorMetroOuUnidade * quantidadeTotal).toFixed(2)
      );
    } else {
      item.valor_gasto = parseNum(item.valor_gasto) || 0;
    }

    novosMateriais[index] = item;
    setMateriaisUsados(novosMateriais);
  };

  const recalcularTotais = () => {
    const valorMateriais = materiaisUsados.reduce(
      (acc, material) => acc + (parseNum(material.valor_gasto) || 0),
      0
    );
    const maoDeObra = parseNum(formData.tempo_costura_valor);
    const custoTotal = valorMateriais + maoDeObra;
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const adicionarLinhaMaterial = () => {
    setMateriaisUsados((prev) => [
      ...prev,
      {
        material_id: '',
        descricao: '',
        altura: '',
        largura: '',
        quantidade: '',
        valor_gasto: 0,
        observacao: ''
      }
    ]);
  };

  const removerLinhaMaterial = (index) => {
    if (materiaisUsados.length === 1) return;
    setMateriaisUsados((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // EDIÇÃO E EXCLUSÃO
  // ============================================================

  const handleEditar = (produto) => {
    setModoEdicao(true);
    setProdutoEditandoId(produto.id);

    // Verifica se modelo faz parte da lista salva
    const modeloExistente = modelos.some((m) => m.nome === produto.modelo);
    
    setFormData({
      categoria: produto.categoria || '',
      modelo: modeloExistente ? produto.modelo : (produto.modelo ? 'Outros' : ''),
      tamanho: produto.tamanho || '',
      material: produto.material || '',
      cliente_id: '',
      pet_id: '',
      pescoco: produto.pescoco ?? '',
      torax: produto.torax ?? '',
      comprimento: produto.comprimento ?? '',
      tempo_costura_valor: '',
      custo: Number(produto.custo || 0).toFixed(2),
      venda: Number(produto.valor_venda || 0).toFixed(2),
      vender_por: Number(produto.vender_por || 0).toFixed(2),
      data_confec: produto.data_confec ? produto.data_confec.split('T')[0] : new Date().toISOString().split('T')[0],
      estoque: produto.estoque || 'Sim',
      observacao: produto.observacao || ''
    });

    if (!modeloExistente && produto.modelo) {
      setOutroModelo(produto.modelo);
    } else {
      setOutroModelo('');
    }

    if (produto.produto_materiais && produto.produto_materiais.length > 0) {
      setMateriaisUsados(
        produto.produto_materiais.map((m) => ({
          material_id: m.material_id || '',
          descricao: m.descricao || '',
          altura: m.altura ?? '',
          largura: m.largura ?? '',
          quantidade: m.quantidade ?? '',
          valor_gasto: m.valor_gasto || 0,
          observacao: m.observacao || ''
        }))
      );
    } else {
      setMateriaisUsados([
        {
          material_id: '',
          descricao: '',
          altura: '',
          largura: '',
          quantidade: '',
          valor_gasto: 0,
          observacao: ''
        }
      ]);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluirProducao = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta produção?')) return;

    setLoading(true);
    try {
      // Exclui materiais associados primeiro
      await supabase.from('produto_materiais').delete().eq('produto_id', id);

      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;

      alert('Produção excluída com sucesso!');
      await carregarDadosIniciais();
    } catch (err) {
      console.error('Erro ao excluir produção:', err);
      alert(`Erro ao excluir: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SUBMIT DO FORMULÁRIO (SALVAR / ATUALIZAR)
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalModeloText =
        formData.modelo === 'Outros' ? outroModelo.trim() : formData.modelo;

      let finalClienteId =
        formData.cliente_id && formData.cliente_id !== 'Outros'
          ? formData.cliente_id
          : null;

      let finalPetId =
        formData.pet_id && formData.pet_id !== 'Outros'
          ? formData.pet_id
          : null;

      if (formData.cliente_id === 'Outros' && outroCliente.trim()) {
        const { data: novoCliente, error: erroCliente } = await supabase
          .from('clientes')
          .insert([{ nome: outroCliente.trim() }])
          .select()
          .single();

        if (erroCliente) throw erroCliente;
        finalClienteId = novoCliente.id;
      }

      if (formData.pet_id === 'Outros' && outroPet.trim()) {
        const { data: novoPet, error: erroPet } = await supabase
          .from('pets')
          .insert([{ nome: outroPet.trim(), cliente_id: finalClienteId }])
          .select()
          .single();

        if (erroPet) throw erroPet;
        finalPetId = novoPet.id;
      }

      const payloadProduto = {
        categoria: formData.categoria || null,
        modelo: finalModeloText || null,
        tamanho: formData.tamanho || null,
        material: formData.material || null,
        pescoco: parseNum(formData.pescoco),
        torax: parseNum(formData.torax),
        comprimento: parseNum(formData.comprimento),
        custo: parseNum(formData.custo),
        valor_venda: parseNum(formData.venda),
        vender_por: parseNum(formData.vender_por),
        data_confec: formData.data_confec,
        estoque: formData.estoque
      };

      let produtoId = produtoEditandoId;

      if (modoEdicao) {
        const { error: erroUpdate } = await supabase
          .from('produtos')
          .update(payloadProduto)
          .eq('id', produtoEditandoId);

        if (erroUpdate) throw erroUpdate;

        // Limpa materiais antigos para reinserir os atualizados
        await supabase
          .from('produto_materiais')
          .delete()
          .eq('produto_id', produtoEditandoId);
      } else {
        const { data: produtoCriado, error: erroProduto } = await supabase
          .from('produtos')
          .insert([payloadProduto])
          .select()
          .single();

        if (erroProduto) throw erroProduto;
        produtoId = produtoCriado.id;
      }

      const materiaisPayload = materiaisUsados
        .filter((m) => m.material_id || m.descricao)
        .map((m, index) => ({
          produto_id: produtoId,
          material_id: m.material_id ? Number(m.material_id) : null,
          descricao: m.descricao || null,
          altura: parseNum(m.altura) || null,
          largura: parseNum(m.largura) || null,
          quantidade: parseNum(m.quantidade) || null,
          valor_gasto: parseNum(m.valor_gasto) || 0,
          observacao: m.observacao?.trim() || null,
          ordem: index + 1
        }));

      if (materiaisPayload.length > 0) {
        const { error: erroMateriais } = await supabase
          .from('produto_materiais')
          .insert(materiaisPayload);

        if (erroMateriais) throw erroMateriais;
      }

      if (!modoEdicao && finalClienteId) {
        const payloadVenda = {
          data_venda: new Date().toISOString().split('T')[0],
          cliente_id: finalClienteId,
          pet_id: finalPetId,
          produto_id: produtoId,
          quantidade: 1,
          caracteristicas: formData.material || 'Encomenda',
          valor_unitario: parseNum(formData.vender_por),
          valor_total: parseNum(formData.vender_por),
          custo_venda: parseNum(formData.custo),
          lucro_venda: parseNum(formData.vender_por) - parseNum(formData.custo),
          forma_pagamento: 'A definir',
          canal_venda: 'WhatsApp',
          observacao: 'Gerado via Produção'
        };

        const { error: erroVenda } = await supabase
          .from('vendas')
          .insert([payloadVenda]);

        if (erroVenda) throw erroVenda;
      }

      alert(modoEdicao ? 'Produção atualizada com sucesso!' : 'Produção salva com sucesso!');
      resetFormulario();
      await carregarDadosIniciais();
    } catch (err) {
      console.error('Erro ao cadastrar/atualizar produção:', err);
      alert(`Erro ao salvar: ${err.message || 'Falha na gravação'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="estoque-container" style={{ paddingBottom: '60px' }}>
      <h2 className="estoque-title">
        {modoEdicao ? 'Editar Ficha de Produção' : 'Ficha de Produção'}
      </h2>

      {/* FORMULÁRIO */}
      <form onSubmit={handleSubmit} className="estoque-card">
        <div className="form-grid">
          {/* CATEGORIA */}
          <div className="form-group">
            <label>Categoria:</label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChangeForm}
              className="select-customizado"
            >
              <option value="">Selecione...</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.nome}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>

          {/* MODELO */}
          <div className="form-group">
            <label>Modelo:</label>
            <select
              name="modelo"
              value={formData.modelo}
              onChange={handleChangeForm}
              className="select-customizado"
              required
            >
              <option value="">Selecione...</option>
              {modelos.map((modelo) => (
                <option key={modelo.id} value={modelo.nome}>
                  {modelo.nome}
                </option>
              ))}
              <option value="Outros">+ Outro (Digitar)</option>
            </select>

            {formData.modelo === 'Outros' && (
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

          {/* TAMANHO */}
          <div className="form-group">
            <label>Tamanho:</label>
            <select
              name="tamanho"
              value={formData.tamanho}
              onChange={handleChangeForm}
              className="select-customizado"
              required
            >
              <option value="">Selecione...</option>
              {tamanhos.map((tamanho) => (
                <option key={tamanho.id} value={tamanho.nome}>
                  {tamanho.nome}
                </option>
              ))}
            </select>
          </div>

          {/* TECIDO */}
          <div className="form-group">
            <label>Tecido / Material:</label>
            <input
              type="text"
              name="material"
              value={formData.material}
              onChange={handleChangeForm}
              className="input-customizado"
              placeholder="Ex: Soft, Tricoline, Fleece"
            />
          </div>
        </div>

        {/* CLIENTE / PET */}
        {!modoEdicao && (
          <>
            <h4 style={{ marginTop: '20px' }}>Cliente e Pet (Encomenda)</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Cliente:</label>
                <select
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleChangeForm}
                  className="select-customizado"
                >
                  <option value="">Nenhum (Pronta Entrega)</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                  <option value="Outros">+ Cadastrar Novo Cliente</option>
                </select>

                {formData.cliente_id === 'Outros' && (
                  <input
                    type="text"
                    placeholder="Digite o nome do cliente..."
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
                  <option value="">Selecione...</option>
                  {pets
                    .filter(
                      (pet) =>
                        !formData.cliente_id ||
                        String(pet.cliente_id) === String(formData.cliente_id)
                    )
                    .map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.nome}
                      </option>
                    ))}
                  <option value="Outros">+ Cadastrar Novo Pet</option>
                </select>

                {formData.pet_id === 'Outros' && (
                  <input
                    type="text"
                    placeholder="Digite o nome do pet..."
                    value={outroPet}
                    onChange={(e) => setOutroPet(e.target.value)}
                    className="input-customizado"
                    style={{ marginTop: '8px' }}
                    required
                  />
                )}
              </div>

              <div className="form-group">
                <label>Data Confecção:</label>
                <input
                  type="date"
                  name="data_confec"
                  value={formData.data_confec}
                  onChange={handleChangeForm}
                  className="input-customizado"
                />
              </div>
            </div>
          </>
        )}

        {modoEdicao && (
          <div className="form-grid" style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label>Data Confecção:</label>
              <input
                type="date"
                name="data_confec"
                value={formData.data_confec}
                onChange={handleChangeForm}
                className="input-customizado"
              />
            </div>
          </div>
        )}

        {/* MEDIDAS */}
        <h4 style={{ marginTop: '20px' }}>Medidas (cm)</h4>
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
        <h4 style={{ marginTop: '20px' }}>Materiais Usados</h4>
        {materiaisUsados.map((mat, idx) => (
          <div key={idx} className="form-grid">
            <div className="form-group">
              <label>Material:</label>
              <select
                value={mat.material_id}
                onChange={(e) =>
                  handleMaterialChange(idx, 'material_id', e.target.value)
                }
                className="select-customizado"
              >
                <option value="">Selecione...</option>
                {materiaisEstoque.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.descricao}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Alt (cm):</label>
              <input
                type="text"
                value={mat.altura}
                onChange={(e) =>
                  handleMaterialChange(idx, 'altura', e.target.value)
                }
                className="input-customizado"
                placeholder="15"
              />
            </div>

            <div className="form-group">
              <label>Larg (cm):</label>
              <input
                type="text"
                value={mat.largura}
                onChange={(e) =>
                  handleMaterialChange(idx, 'largura', e.target.value)
                }
                className="input-customizado"
                placeholder="20"
              />
            </div>

            <div className="form-group">
              <label>Qtd Total (m²):</label>
              <input
                type="text"
                value={mat.quantidade}
                onChange={(e) =>
                  handleMaterialChange(idx, 'quantidade', e.target.value)
                }
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

        <button
          type="button"
          onClick={adicionarLinhaMaterial}
          className="btn-submit"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Adicionar Outro Material
        </button>

        {/* TOTAIS */}
        <div className="form-grid" style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label>Mão de Obra (R$):</label>
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
            <input
              type="text"
              value={`R$ ${formData.custo}`}
              className="input-customizado"
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Vender Por (Sugestão R$):</label>
            <input
              type="text"
              value={`R$ ${formData.vender_por}`}
              className="input-customizado"
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Vai pro Estoque?</label>
            <select
              name="estoque"
              value={formData.estoque}
              onChange={handleChangeForm}
              className="select-customizado"
            >
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button
            type="submit"
            disabled={loading}
            className="btn-submit"
            style={{ flex: 1 }}
          >
            {loading
              ? 'Salvando...'
              : modoEdicao
              ? 'Atualizar Produção'
              : 'Cadastrar Produção'}
          </button>

          {modoEdicao && (
            <button
              type="button"
              onClick={resetFormulario}
              style={{
                background: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancelar Edição
            </button>
          )}
        </div>
      </form>

      {/* HISTÓRICO DE PRODUÇÃO */}
      <div className="historico-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '15px',
            padding: '10px 14px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}
        >
          <h3 className="estoque-title" style={{ fontSize: '16px', margin: 0, whiteSpace: 'nowrap' }}>
            Histórico de Produção
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            {/* FILTRO ESTOQUE */}
            <select
              value={filtroEstoque}
              onChange={(e) => setFiltroEstoque(e.target.value)}
              className="select-customizado"
              style={{ width: 'auto', minWidth: '130px', padding: '6px 10px', fontSize: '13px' }}
            >
              <option value="">Estoque: Todos</option>
              <option value="Sim">Em Estoque (Sim)</option>
              <option value="Não">Encomenda/Vendido (Não)</option>
            </select>

            {/* FILTRO MODELO */}
            <select
              value={filtroModelo}
              onChange={(e) => setFiltroModelo(e.target.value)}
              className="select-customizado"
              style={{ width: 'auto', minWidth: '150px', padding: '6px 10px', fontSize: '13px' }}
            >
              <option value="">Modelo: Todos</option>
              {modelos.map((m) => (
                <option key={m.id} value={m.nome}>
                  {m.nome}
                </option>
              ))}
            </select>

            {/* FILTRO TAMANHO */}
            <select
              value={filtroTamanho}
              onChange={(e) => setFiltroTamanho(e.target.value)}
              className="select-customizado"
              style={{ width: 'auto', minWidth: '130px', padding: '6px 10px', fontSize: '13px' }}
            >
              <option value="">Tamanho: Todos</option>
              {tamanhos.map((t) => (
                <option key={t.id} value={t.nome}>
                  {t.nome}
                </option>
              ))}
            </select>

            {/* BOTÃO LIMPAR */}
            {(filtroEstoque || filtroModelo || filtroTamanho) && (
              <button
                type="button"
                onClick={() => {
                  setFiltroEstoque('');
                  setFiltroModelo('');
                  setFiltroTamanho('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff4d4f',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* CONTAINER DO SCROLL HORIZONTAL */}
        <div className="tabela-scroll-container">
          <table className="tabela-historico">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Modelo</th>
                <th>Tamanho</th>
                <th>Tecido</th>
                <th>Pescoço</th>
                <th>Tórax</th>
                <th>Comprimento</th>
                <th>Material</th>
                <th>Alt/Larg</th>
                <th>Qtd Usada</th>
                <th>Valor Gasto</th>
                <th>Custo</th>
                <th>Vender Por</th>
                <th>Data Confec.</th>
                <th>Estoque</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {producoesFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan="16"
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#888'
                    }}
                  >
                    Nenhuma produção encontrada.
                  </td>
                </tr>
              ) : (
                producoesFiltradas.map((produto) => {
                  const materiais = produto.produto_materiais || [];
                  const listaMateriais = materiais.length > 0 ? materiais : [null];
                  const totalLinhas = listaMateriais.length;

                  return listaMateriais.map((material, index) => {
                    const isPrimeiraLinha = index === 0;

                    return (
                      <tr
                        key={`${produto.id}-${material?.id || index}`}
                        style={{
                          borderBottom:
                            index === totalLinhas - 1
                              ? '2px solid #aaa'
                              : '1px solid #eee'
                        }}
                      >
                        {isPrimeiraLinha && (
                          <>
                            <td rowSpan={totalLinhas}>{produto.categoria || '-'}</td>
                            <td rowSpan={totalLinhas}>{produto.modelo || '-'}</td>
                            <td rowSpan={totalLinhas} style={{ textAlign: 'center' }}>
                              {produto.tamanho || '-'}
                            </td>
                            <td rowSpan={totalLinhas}>{produto.material || '-'}</td>
                            <td rowSpan={totalLinhas} style={{ textAlign: 'center' }}>
                              {produto.pescoco ?? '-'}
                            </td>
                            <td rowSpan={totalLinhas} style={{ textAlign: 'center' }}>
                              {produto.torax ?? '-'}
                            </td>
                            <td rowSpan={totalLinhas} style={{ textAlign: 'center' }}>
                              {produto.comprimento ?? '-'}
                            </td>
                          </>
                        )}

                        <td>{material?.descricao || '-'}</td>
                        <td style={{ textAlign: 'center' }}>
                          {material
                            ? material.altura != null && material.largura != null
                              ? `${material.altura}x${material.largura}`
                              : '-'
                            : '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {material?.quantidade ?? '-'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {material
                            ? `R$ ${Number(material.valor_gasto || 0).toFixed(2)}`
                            : '-'}
                        </td>

                        {isPrimeiraLinha && (
                          <>
                            <td
                              rowSpan={totalLinhas}
                              style={{
                                color: 'red',
                                fontWeight: 'bold',
                                textAlign: 'center'
                              }}
                            >
                              {Number(produto.custo || 0).toFixed(2)}
                            </td>
                            <td
                              rowSpan={totalLinhas}
                              style={{
                                color: 'blue',
                                fontWeight: 'bold',
                                textAlign: 'center'
                              }}
                            >
                              {Number(produto.vender_por || 0).toFixed(2)}
                            </td>
                            <td rowSpan={totalLinhas} style={{ textAlign: 'center' }}>
                              {formatarDataExibicao(produto.data_confec)}
                            </td>
                            <td rowSpan={totalLinhas} style={{ textAlign: 'center' }}>
                              {produto.estoque || '-'}
                            </td>
                            <td rowSpan={totalLinhas} style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleEditar(produto)}
                                  title="Editar"
                                  style={{
                                    border: 'none',
                                    background: '#e6f0ff',
                                    color: '#0066cc',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExcluirProducao(produto.id)}
                                  title="Excluir"
                                  style={{
                                    border: 'none',
                                    background: '#ffe6e6',
                                    color: '#cc0000',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}