import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseCliente';
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
        { data: estqData, error: estqError },
        { data: prodData, error: prodError },
        { data: matData, error: matError }
      ] = await Promise.all([
        supabase
          .from('categorias')
          .select('*')         
          .range(0, 99999),
        supabase
          .from('modelos')
          .select('*')
          .range(0, 99999),
        supabase
          .from('tamanhos')
          .select('*')
          .range(0, 99999),
        supabase
          .from('clientes')
          .select('*')          
          .range(0, 99999),
        supabase
          .from('pets')
          .select('*')
          .range(0, 99999),
        supabase
          .from('estoque')
          .select('*')
          .range(0, 99999),
        supabase
          .from('produtos')
          .select('*')
          .range(0, 99999),
        supabase
          .from('produto_materiais')
          .select('*')
          .range(0, 99999)
      ]);
  
      if (catError) throw catError;
      if (modError) throw modError;
      if (tamError) throw tamError;
      if (cliError) throw cliError;
      if (petsError) throw petsError;
      if (estqError) throw estqError;
      if (prodError) throw prodError;
      if (matError) throw matError;
  
      setCategorias(catData || []);
      setModelos(modData || []);
      setTamanhos(tamData || []);
      setClientes(cliData || []);
      setPets(petsData || []);
      setMateriaisEstoque(estqData || []);
  
      const produtosComMateriais = (prodData || []).map((prod) => {
  
        // Pega SOMENTE os materiais pertencentes
        // a este produto
        const materiaisDoProduto = (matData || [])
          .filter(
            (m) => String(m.produto_id) === String(prod.id)
          )
          .sort((a, b) => {
            const ordemA = Number(a.ordem) || 999999;
            const ordemB = Number(b.ordem) || 999999;
  
            return ordemA - ordemB;
          });
  
        return {
          ...prod,
          produto_materiais: materiaisDoProduto
        };
      });
  
      setProducoes(produtosComMateriais);
  
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      alert(`Erro ao carregar dados: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FUNÇÕES AUXILIARES
  // ============================================================

  const parseNum = (val) => {
    if (val === null || val === undefined || val === '') {
      return 0;
    }

    if (typeof val === 'number') {
      return val;
    }

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

    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return dataStr;
  };

  // ============================================================
  // MATERIAL
  // ============================================================

  const handleMaterialChange = (index, field, value) => {
    const novosMateriais = [...materiaisUsados];

    const item = {
      ...novosMateriais[index],
      [field]: value
    };

    // ----------------------------------------------------------
    // DESCRIÇÃO DO MATERIAL
    // ----------------------------------------------------------

    if (field === 'material_id') {
      const materialSelecionado = materiaisEstoque.find(
        (m) => String(m.id) === String(value)
      );

      item.descricao = materialSelecionado
        ? materialSelecionado.descricao
        : '';
    }

    // ----------------------------------------------------------
    // CALCULA QUANTIDADE PELA ALTURA X LARGURA
    // ----------------------------------------------------------

    if (field === 'altura' || field === 'largura') {
      const altura = parseNum(item.altura);
      const largura = parseNum(item.largura);

      if (altura > 0 && largura > 0) {
        item.quantidade = ((altura * largura) / 10000).toFixed(4);
      }
    }

    // ----------------------------------------------------------
    // CALCULA VALOR GASTO
    // ----------------------------------------------------------

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
        precoPorMetroOuUnidade =
          valorPago / areaEstoque;
      } else if (valorPago > 0) {
        precoPorMetroOuUnidade = valorPago;
      }

      item.valor_gasto = Number(
        (precoPorMetroOuUnidade * quantidadeTotal).toFixed(2)
      );
    } else {
      item.valor_gasto = 0;
    }

    novosMateriais[index] = item;

    setMateriaisUsados(novosMateriais);
  };

  // ============================================================
  // RECALCULA CUSTOS
  // ============================================================

  const recalcularTotais = () => {
    const valorMateriais = materiaisUsados.reduce(
      (acc, material) =>
        acc + (parseNum(material.valor_gasto) || 0),
      0
    );

    const maoDeObra = parseNum(
      formData.tempo_costura_valor
    );

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

  // ============================================================
  // FORMULÁRIO
  // ============================================================

  const handleChangeForm = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
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
    if (materiaisUsados.length === 1) {
      return;
    }

    setMateriaisUsados((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // ============================================================
  // SALVAR PRODUÇÃO
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // --------------------------------------------------------
      // MODELO
      // --------------------------------------------------------

      const finalModeloText =
        formData.modelo === 'Outros'
          ? outroModelo.trim()
          : formData.modelo;

      // --------------------------------------------------------
      // CLIENTE
      // --------------------------------------------------------

      let finalClienteId =
        formData.cliente_id &&
        formData.cliente_id !== 'Outros'
          ? formData.cliente_id
          : null;

      // --------------------------------------------------------
      // PET
      // --------------------------------------------------------

      let finalPetId =
        formData.pet_id &&
        formData.pet_id !== 'Outros'
          ? formData.pet_id
          : null;

      // --------------------------------------------------------
      // NOVO CLIENTE
      // --------------------------------------------------------

      if (
        formData.cliente_id === 'Outros' &&
        outroCliente.trim()
      ) {
        const {
          data: novoCliente,
          error: erroCliente
        } = await supabase
          .from('clientes')
          .insert([
            {
              nome: outroCliente.trim()
            }
          ])
          .select()
          .single();

        if (erroCliente) {
          throw erroCliente;
        }

        finalClienteId = novoCliente.id;
      }

      // --------------------------------------------------------
      // NOVO PET
      // --------------------------------------------------------

      if (
        formData.pet_id === 'Outros' &&
        outroPet.trim()
      ) {
        const {
          data: novoPet,
          error: erroPet
        } = await supabase
          .from('pets')
          .insert([
            {
              nome: outroPet.trim(),
              cliente_id: finalClienteId
            }
          ])
          .select()
          .single();

        if (erroPet) {
          throw erroPet;
        }

        finalPetId = novoPet.id;
      }

      // --------------------------------------------------------
      // PRODUTO
      // --------------------------------------------------------

      const {
        data: produtoCriado,
        error: erroProduto
      } = await supabase
        .from('produtos')
        .insert([
          {
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
          }
        ])
        .select()
        .single();

      if (erroProduto) {
        throw erroProduto;
      }

      // --------------------------------------------------------
      // MATERIAIS
      //
      // A ordem do array é exatamente a ordem em que o usuário
      // colocou os materiais no formulário.
      // --------------------------------------------------------

      const materiaisPayload = materiaisUsados
        .filter((m) => m.material_id || m.descricao)
        .map((m, index) => ({
          produto_id: produtoCriado.id, // ✅ CORRETO! Usa o ID retornado pelo insert do produto.
          material_id: m.material_id
            ? Number(m.material_id)
            : null,
          descricao: m.descricao || null,
          altura: parseNum(m.altura) || null,
          largura: parseNum(m.largura) || null,
          quantidade: parseNum(m.quantidade) || null,
          valor_gasto: parseNum(m.valor_gasto) || 0,
          observacao: m.observacao?.trim() || null,
          ordem: index + 1
        }));

      if (materiaisPayload.length > 0) {
        const {
          error: erroMateriais
        } = await supabase
          .from('produto_materiais')
          .insert(materiaisPayload);

        if (erroMateriais) {
          throw erroMateriais;
        }
      }

      // --------------------------------------------------------
      // VENDA
      // --------------------------------------------------------

      if (finalClienteId) {
        const payloadVenda = {
          data_venda:
            new Date().toISOString().split('T')[0],

          cliente_id: finalClienteId,

          pet_id: finalPetId,

          produto_id: produtoCriado.id,

          quantidade: 1,

          caracteristicas:
            formData.material || 'Encomenda',

          valor_unitario:
            parseNum(formData.vender_por),

          valor_total:
            parseNum(formData.vender_por),

          custo_venda:
            parseNum(formData.custo),

          lucro_venda:
            parseNum(formData.vender_por) -
            parseNum(formData.custo),

          forma_pagamento: 'A definir',

          canal_venda: 'WhatsApp',

          observacao: 'Gerado via Produção'
        };

        const { error: erroVenda } =
          await supabase
            .from('vendas')
            .insert([payloadVenda]);

        if (erroVenda) {
          throw erroVenda;
        }
      }

      alert('Produção salva com sucesso!');

      // --------------------------------------------------------
      // LIMPA FORMULÁRIO
      // --------------------------------------------------------

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
        data_confec:
          new Date().toISOString().split('T')[0],
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

      // Recarrega tudo diretamente do banco
      await carregarDadosIniciais();

    } catch (err) {
      console.error(
        'Erro ao cadastrar produção:',
        err
      );

      alert(
        `Erro ao salvar: ${
          err.message || 'Falha na gravação'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="estoque-container"
      style={{ paddingBottom: '60px' }}
    >
      <h2 className="estoque-title">
        Ficha de Produção
      </h2>

      {/* ======================================================
          FORMULÁRIO
      ====================================================== */}

      <form
        onSubmit={handleSubmit}
        className="estoque-card"
      >
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
              <option value="">
                Selecione...
              </option>

              {categorias.map((categoria) => (
                <option
                  key={categoria.id}
                  value={categoria.nome}
                >
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
              <option value="">
                Selecione...
              </option>

              {modelos.map((modelo) => (
                <option
                  key={modelo.id}
                  value={modelo.nome}
                >
                  {modelo.nome}
                </option>
              ))}

              <option value="Outros">
                + Outro (Digitar)
              </option>
            </select>

            {formData.modelo === 'Outros' && (
              <input
                type="text"
                placeholder="Digite o nome do modelo..."
                value={outroModelo}
                onChange={(e) =>
                  setOutroModelo(e.target.value)
                }
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
              <option value="">
                Selecione...
              </option>

              {tamanhos.map((tamanho) => (
                <option
                  key={tamanho.id}
                  value={tamanho.nome}
                >
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

        {/* ====================================================
            CLIENTE / PET
        ==================================================== */}

        <h4 style={{ marginTop: '20px' }}>
          Cliente e Pet (Encomenda)
        </h4>

        <div className="form-grid">

          {/* CLIENTE */}

          <div className="form-group">
            <label>Cliente:</label>

            <select
              name="cliente_id"
              value={formData.cliente_id}
              onChange={handleChangeForm}
              className="select-customizado"
            >
              <option value="">
                Nenhum (Pronta Entrega)
              </option>

              {clientes.map((cliente) => (
                <option
                  key={cliente.id}
                  value={cliente.id}
                >
                  {cliente.nome}
                </option>
              ))}

              <option value="Outros">
                + Cadastrar Novo Cliente
              </option>
            </select>

            {formData.cliente_id === 'Outros' && (
              <input
                type="text"
                placeholder="Digite o nome do cliente..."
                value={outroCliente}
                onChange={(e) =>
                  setOutroCliente(e.target.value)
                }
                className="input-customizado"
                style={{ marginTop: '8px' }}
                required
              />
            )}
          </div>

          {/* PET */}

          <div className="form-group">
            <label>Pet:</label>

            <select
              name="pet_id"
              value={formData.pet_id}
              onChange={handleChangeForm}
              className="select-customizado"
            >
              <option value="">
                Selecione...
              </option>

              {pets
                .filter(
                  (pet) =>
                    !formData.cliente_id ||
                    String(pet.cliente_id) ===
                      String(formData.cliente_id)
                )
                .map((pet) => (
                  <option
                    key={pet.id}
                    value={pet.id}
                  >
                    {pet.nome}
                  </option>
                ))}

              <option value="Outros">
                + Cadastrar Novo Pet
              </option>
            </select>

            {formData.pet_id === 'Outros' && (
              <input
                type="text"
                placeholder="Digite o nome do pet..."
                value={outroPet}
                onChange={(e) =>
                  setOutroPet(e.target.value)
                }
                className="input-customizado"
                style={{ marginTop: '8px' }}
                required
              />
            )}
          </div>

          {/* DATA */}

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

        {/* ====================================================
            MEDIDAS
        ==================================================== */}

        <h4 style={{ marginTop: '20px' }}>
          Medidas (cm)
        </h4>

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

        {/* ====================================================
            MATERIAIS
        ==================================================== */}

        <h4 style={{ marginTop: '20px' }}>
          Materiais Usados
        </h4>

        {materiaisUsados.map((mat, idx) => (
          <div
            key={idx}
            className="form-grid"
          >

            <div className="form-group">
              <label>Material:</label>

              <select
                value={mat.material_id}
                onChange={(e) =>
                  handleMaterialChange(
                    idx,
                    'material_id',
                    e.target.value
                  )
                }
                className="select-customizado"
              >
                <option value="">
                  Selecione...
                </option>

                {materiaisEstoque.map((material) => (
                  <option
                    key={material.id}
                    value={material.id}
                  >
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
                  handleMaterialChange(
                    idx,
                    'altura',
                    e.target.value
                  )
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
                  handleMaterialChange(
                    idx,
                    'largura',
                    e.target.value
                  )
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
                  handleMaterialChange(
                    idx,
                    'quantidade',
                    e.target.value
                  )
                }
                className="input-customizado"
                placeholder="0.03"
              />
            </div>

            <div className="form-group">
              <label>Valor Gasto (R$):</label>

              <div
                style={{
                  display: 'flex',
                  gap: '8px'
                }}
              >
                <input
                  type="text"
                  value={`R$ ${mat.valor_gasto}`}
                  className="input-customizado"
                  readOnly
                />

                {materiaisUsados.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      removerLinhaMaterial(idx)
                    }
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
        >
          + Adicionar Outro Material
        </button>

        {/* ====================================================
            TOTAIS
        ==================================================== */}

        <div
          className="form-grid"
          style={{ marginTop: '20px' }}
        >

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
            <label>
              Vender Por (Sugestão R$):
            </label>

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

        <button
          type="submit"
          disabled={loading}
          className="btn-submit"
          style={{ marginTop: '15px' }}
        >
          {loading
            ? 'Salvando...'
            : 'Cadastrar Produção'}
        </button>
      </form>

      {/* ======================================================
          HISTÓRICO
      ====================================================== */}

      <div className="historico-card">

        <h3
          className="estoque-title"
          style={{
            fontSize: '18px',
            marginBottom: '15px'
          }}
        >
          Histórico de Produção
        </h3>

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
                <th>Data Conféc.</th>
                <th>Estoque</th>
              </tr>
            </thead>

            <tbody>
              {producoes.length === 0 ? (
                <tr>
                  <td
                    colSpan="15"
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#888'
                    }}
                  >
                    Nenhuma produção registrada.
                  </td>
                </tr>
              ) : (
                producoes.map((produto) => {

                  const materiais = produto.produto_materiais || [];

                  const listaMateriais =
                    materiais.length > 0
                      ? materiais
                      : [null];

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

                        {/* DADOS DA PRODUÇÃO */}
                        {isPrimeiraLinha && (
                          <>
                            <td rowSpan={totalLinhas}>
                              {produto.categoria || '-'}
                            </td>

                            <td rowSpan={totalLinhas}>
                              {produto.modelo || '-'}
                            </td>

                            <td
                              rowSpan={totalLinhas}
                              style={{ textAlign: 'center' }}
                            >
                              {produto.tamanho || '-'}
                            </td>

                            <td rowSpan={totalLinhas}>
                              {produto.material || '-'}
                            </td>

                            <td
                              rowSpan={totalLinhas}
                              style={{ textAlign: 'center' }}
                            >
                              {produto.pescoco ?? '-'}
                            </td>

                            <td
                              rowSpan={totalLinhas}
                              style={{ textAlign: 'center' }}
                            >
                              {produto.torax ?? '-'}
                            </td>

                            <td
                              rowSpan={totalLinhas}
                              style={{ textAlign: 'center' }}
                            >
                              {produto.comprimento ?? '-'}
                            </td>
                          </>
                        )}

                        {/* MATERIAL */}
                        <td>
                          {material?.descricao || '-'}
                        </td>

                        {/* ALTURA / LARGURA */}
                        <td style={{ textAlign: 'center' }}>
                          {material
                            ? (
                                material.altura != null &&
                                material.largura != null
                                  ? `${material.altura}x${material.largura}`
                                  : '-'
                              )
                            : '-'}
                        </td>

                        {/* QUANTIDADE */}
                        <td style={{ textAlign: 'center' }}>
                          {material?.quantidade ?? '-'}
                        </td>

                        {/* VALOR GASTO */}
                        <td style={{ textAlign: 'right' }}>
                          {material
                            ? `R$ ${Number(material.valor_gasto || 0).toFixed(2)}`
                            : '-'}
                        </td>

                        {/* CUSTO */}
                        {isPrimeiraLinha && (
                          <td
                            rowSpan={totalLinhas}
                            style={{
                              color: 'red',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}
                          >
                            R$ {Number(produto.custo || 0).toFixed(2)}
                          </td>
                        )}

                        {/* VENDER POR */}
                        {isPrimeiraLinha && (
                          <td
                            rowSpan={totalLinhas}
                            style={{
                              color: 'blue',
                              fontWeight: 'bold',
                              textAlign: 'center'
                            }}
                          >
                            R$ {Number(
                              produto.vender_por || 0
                            ).toFixed(2)}
                          </td>
                        )}

                        {/* DATA */}
                        {isPrimeiraLinha && (
                          <td
                            rowSpan={totalLinhas}
                            style={{ textAlign: 'center' }}
                          >
                            {formatarDataExibicao(
                              produto.data_confec
                            )}
                          </td>
                        )}

                        {/* ESTOQUE */}
                        {isPrimeiraLinha && (
                          <td
                            rowSpan={totalLinhas}
                            style={{ textAlign: 'center' }}
                          >
                            {produto.estoque || '-'}
                          </td>
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