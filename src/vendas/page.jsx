import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseCliente';
import './vendas.css';

export default function Vendas() {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [todosPets, setTodosPets] = useState([]);
  const [petsFiltrados, setPetsFiltrados] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [vendas, setVendas] = useState([]);
  
  const [editandoId, setEditandoId] = useState(null);

  const [formData, setFormData] = useState({
    data_venda: new Date().toISOString().split('T')[0],
    cliente_id: '',
    pet_id: '',
    produto_id: '',
    quantidade: 1,
    caracteristicas: '',
    valor_unitario: '',
    valor_total: 0,
    custo_venda: 0,
    lucro_venda: 0,
    forma_pagamento: 'Pix',
    canal_venda: 'WhatsApp',
    observacao: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const qtd = parseFloat(formData.quantidade) || 0;
    const valUnit = parseFloat(formData.valor_unitario) || 0;
    const custoProd = parseFloat(formData.custo_venda) || 0;

    const total = qtd * valUnit;
    const lucro = total - (qtd * custoProd);

    setFormData((prev) => ({
      ...prev,
      valor_total: total.toFixed(2),
      lucro_venda: lucro.toFixed(2)
    }));
  }, [formData.quantidade, formData.valor_unitario, formData.custo_venda]);

  useEffect(() => {
    if (formData.cliente_id) {
      setPetsFiltrados(todosPets.filter((p) => String(p.cliente_id) === String(formData.cliente_id)));
    } else {
      setPetsFiltrados(todosPets);
    }
  }, [formData.cliente_id, todosPets]);

  async function carregarDados() {
    try {
      setLoading(true);
      const [
        { data: cliData },
        { data: petsData },
        { data: prodData },
        { data: vendasData }
      ] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('pets').select('*').order('nome'),
        supabase.from('produtos').select('*, categorias(nome), modelos(nome), tamanhos(nome)').order('created_at', { ascending: false }),
        supabase.from('vendas').select('*, clientes(nome), pets(nome), produtos(modelos(nome), tamanhos(nome))').order('data_venda', { ascending: false })
      ]);

      if (cliData) setClientes(cliData);
      if (petsData) setTodosPets(petsData);
      if (prodData) setProdutos(prodData);
      if (vendasData) setVendas(vendasData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProdutoChange = (e) => {
    const prodId = e.target.value;
    const prod = produtos.find((p) => String(p.id) === String(prodId));

    if (prod) {
      setFormData((prev) => ({
        ...prev,
        produto_id: prodId,
        caracteristicas: `${prod.categorias?.nome || ''} - ${prod.modelos?.nome || ''} (${prod.tecido || 'S/ Tecido'})`,
        valor_unitario: prod.valor_venda || 0,
        custo_venda: prod.custo || 0,
        cliente_id: prev.cliente_id || prod.cliente_id || '',
        pet_id: prev.pet_id || prod.pet_id || ''
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        produto_id: '',
        caracteristicas: '',
        valor_unitario: '',
        custo_venda: 0
      }));
    }
  };

  // Prepara formulário para edição de venda (ex: encomenda vinda da tela de produção)
  const handleEditar = (v) => {
    setEditandoId(v.id);
    setFormData({
      data_venda: v.data_venda || new Date().toISOString().split('T')[0],
      cliente_id: v.cliente_id || '',
      pet_id: v.pet_id || '',
      produto_id: v.produto_id || '',
      quantidade: v.quantidade || 1,
      caracteristicas: v.caracteristicas || '',
      valor_unitario: v.valor_unitario || '',
      valor_total: v.valor_total || 0,
      custo_venda: v.custo_venda || 0,
      lucro_venda: v.lucro_venda || 0,
      forma_pagamento: v.forma_pagamento || 'Pix',
      canal_venda: v.canal_venda || 'WhatsApp',
      observacao: v.observacao || ''
    });
  };

  const resetForm = () => {
    setEditandoId(null);
    setFormData({
      data_venda: new Date().toISOString().split('T')[0],
      cliente_id: '',
      pet_id: '',
      produto_id: '',
      quantidade: 1,
      caracteristicas: '',
      valor_unitario: '',
      valor_total: 0,
      custo_venda: 0,
      lucro_venda: 0,
      forma_pagamento: 'Pix',
      canal_venda: 'WhatsApp',
      observacao: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payloadVenda = {
        data_venda: formData.data_venda,
        cliente_id: formData.cliente_id || null,
        pet_id: formData.pet_id || null,
        produto_id: formData.produto_id || null,
        quantidade: parseInt(formData.quantidade, 10) || 1,
        caracteristicas: formData.caracteristicas?.trim() || null,
        valor_unitario: parseFloat(formData.valor_unitario) || 0,
        valor_total: parseFloat(formData.valor_total) || 0,
        custo_venda: parseFloat(formData.custo_venda) || 0,
        lucro_venda: parseFloat(formData.lucro_venda) || 0,
        forma_pagamento: formData.forma_pagamento,
        canal_venda: formData.canal_venda,
        observacao: formData.observacao?.trim() || null
      };

      if (editandoId) {
        // Atualiza venda existente (ex: ajuste de encomenda)
        const { error: errUpdate } = await supabase
          .from('vendas')
          .update(payloadVenda)
          .eq('id', editandoId);
        if (errUpdate) throw errUpdate;
      } else {
        // Cria nova venda
        const { error: errInsert } = await supabase.from('vendas').insert([payloadVenda]);
        if (errInsert) throw errInsert;

        // Se for venda de produto em estoque (não-encomenda), atualiza o item em Produção com Cliente, Pet e Status 'Vendido'
        if (formData.produto_id) {
          await supabase
            .from('produtos')
            .update({
              cliente_id: formData.cliente_id || null,
              pet_id: formData.pet_id || null,
              status: 'Vendido'
            })
            .eq('id', formData.produto_id);
        }
      }

      alert(editandoId ? 'Venda atualizada!' : 'Venda registrada e produção atualizada!');
      resetForm();
      await carregarDados();
    } catch (err) {
      console.error('Erro ao salvar venda:', err);
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="estoque-container" style={{ paddingBottom: '60px' }}>
      <h2 className="estoque-title">
        {editandoId ? 'Editar Venda / Encomenda' : 'Registro de Vendas'}
      </h2>

      <form onSubmit={handleSubmit} className="estoque-card">
        {/* CAMPOS DE FORMULÁRIO */}
        <div className="form-grid">
          <div className="form-group">
            <label>Data da Venda:</label>
            <input
              type="date"
              name="data_venda"
              value={formData.data_venda}
              onChange={handleChange}
              className="input-customizado"
              required
            />
          </div>

          <div className="form-group">
            <label>Cliente:</label>
            <select
              name="cliente_id"
              value={formData.cliente_id}
              onChange={handleChange}
              className="select-customizado"
            >
              <option value="">Selecione o Cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Pet:</label>
            <select
              name="pet_id"
              value={formData.pet_id}
              onChange={handleChange}
              className="select-customizado"
            >
              <option value="">Selecione o Pet...</option>
              {petsFiltrados.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <h4 style={{ marginTop: '20px' }}>Detalhes do Produto</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Produto de Origem:</label>
            <select
              name="produto_id"
              value={formData.produto_id}
              onChange={handleProdutoChange}
              className="select-customizado"
            >
              <option value="">Selecione o produto...</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.modelos?.nome} - Tam: {p.tamanhos?.nome} - {p.tecido || 'S/ Tecido'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantidade:</label>
            <input
              type="number"
              name="quantidade"
              min="1"
              value={formData.quantidade}
              onChange={handleChange}
              className="input-customizado"
              required
            />
          </div>

          <div className="form-group">
            <label>Características / Detalhes:</label>
            <input
              type="text"
              name="caracteristicas"
              value={formData.caracteristicas}
              onChange={handleChange}
              className="input-customizado"
            />
          </div>
        </div>

        <h4 style={{ marginTop: '20px' }}>Valores e Lucro</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Valor Unitário (R$):</label>
            <input
              type="text"
              name="valor_unitario"
              value={formData.valor_unitario}
              onChange={handleChange}
              className="input-customizado"
              required
            />
          </div>

          <div className="form-group">
            <label>Valor Total (R$):</label>
            <input type="text" value={`R$ ${formData.valor_total}`} className="input-customizado" readOnly />
          </div>

          <div className="form-group">
            <label>Custo Unitário (R$):</label>
            <input type="text" value={`R$ ${formData.custo_venda}`} className="input-customizado" readOnly />
          </div>

          <div className="form-group">
            <label>Lucro (R$):</label>
            <input
              type="text"
              value={`R$ ${formData.lucro_venda}`}
              className="input-customizado"
              style={{ fontWeight: 'bold', color: formData.lucro_venda >= 0 ? '#28a745' : '#dc3545' }}
              readOnly
            />
          </div>
        </div>

        <h4 style={{ marginTop: '20px' }}>Fechamento</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>Forma de Pagamento:</label>
            <select name="forma_pagamento" value={formData.forma_pagamento} onChange={handleChange} className="select-customizado">
              <option value="Pix">Pix</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div className="form-group">
            <label>Canal de Venda:</label>
            <select name="canal_venda" value={formData.canal_venda} onChange={handleChange} className="select-customizado">
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="Elo7">Elo7</option>
              <option value="Feira/Evento">Feira / Evento</option>
              <option value="Loja Física">Loja Física</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div className="form-group">
            <label>Observações:</label>
            <input type="text" name="observacao" value={formData.observacao} onChange={handleChange} className="input-customizado" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Salvando...' : editandoId ? 'Atualizar Venda' : 'Confirmar Venda'}
          </button>
          {editandoId && (
            <button type="button" onClick={resetForm} className="btn-submit">
              Cancelar Edição
            </button>
          )}
        </div>
      </form>

      {/* TABELA COM BOTAO DE EDITAR */}
      <div className="historico-card" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
        <h3>Histórico de Vendas</h3>
        <div className="historico-table-container">
          <table className="historico-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                <th>Ação</th>
                <th>Data</th>
                <th>Cliente</th>
                <th>Pet</th>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Val. Unitário</th>
                <th>Val. Total</th>
                <th>Custo</th>
                <th>Lucro</th>
                <th>Pagamento</th>
                <th>Canal</th>
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEditar(v)}
                      style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Editar
                    </button>
                  </td>
                  <td style={{ padding: '8px' }}>{v.data_venda ? new Date(v.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
                  <td style={{ padding: '8px' }}>{v.clientes?.nome || '-'}</td>
                  <td style={{ padding: '8px' }}>{v.pets?.nome || '-'}</td>
                  <td style={{ padding: '8px' }}>{v.produtos?.modelos?.nome ? `${v.produtos.modelos.nome} (${v.produtos.tamanhos?.nome || '-'})` : v.caracteristicas || '-'}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{v.quantidade}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>R$ {Number(v.valor_unitario).toFixed(2)}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>R$ {Number(v.valor_total).toFixed(2)}</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: '#dc3545' }}>R$ {Number(v.custo_venda).toFixed(2)}</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: '#28a745', fontWeight: 'bold' }}>R$ {Number(v.lucro_venda).toFixed(2)}</td>
                  <td style={{ padding: '8px' }}>{v.forma_pagamento}</td>
                  <td style={{ padding: '8px' }}>{v.canal_venda}</td>
                  <td style={{ padding: '8px' }}>{v.observacao || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}