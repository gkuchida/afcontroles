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
        supabase.from('vendas').select('*').order('created_at', { ascending: false })
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

  const handleEditar = (v) => {
    setEditandoId(v.id);
    setFormData({
      data_venda: v.data_venda || new Date().toISOString().split('T')[0],
      cliente_id: v.cliente_id || '',
      pet_id: v.pet_id || '',
      produto_id: v.produto_id || '',
      quantidade: v.quantidade || 1,
      caracteristicas: v.caracteristicas || v.produto || '',
      valor_unitario: v.valor_unitario || '',
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
      const clienteObj = clientes.find((c) => String(c.id) === String(formData.cliente_id));
      const petObj = todosPets.find((p) => String(p.id) === String(formData.pet_id));
      const prodObj = produtos.find((p) => String(p.id) === String(formData.produto_id));

      const payloadVenda = {
        data_venda: formData.data_venda,
        cliente: clienteObj ? clienteObj.nome : null,
        pet: petObj ? petObj.nome : null,
        produto: prodObj ? prodObj.modelos?.nome : formData.caracteristicas?.trim() || 'Encomenda',
        tamanho: prodObj?.tamanhos?.nome || null,
        quantidade: parseFloat(formData.quantidade) || 1,
        caracteristicas: formData.caracteristicas?.trim() || null,
        valor_unitario: parseFloat(formData.valor_unitario) || 0,
        custo_venda: parseFloat(formData.custo_venda) || 0,
        lucro_venda: parseFloat(formData.lucro_venda) || 0,
        forma_pagamento: formData.forma_pagamento,
        canal_venda: formData.canal_venda,
        observacao: formData.observacao?.trim() || null
      };

      if (editandoId) {
        const { error: errUpdate } = await supabase
          .from('vendas')
          .update(payloadVenda)
          .eq('id', editandoId);
        if (errUpdate) throw errUpdate;
      } else {
        const { error: errInsert } = await supabase.from('vendas').insert([payloadVenda]);
        if (errInsert) throw errInsert;

        const isEncomenda = prodObj?.categorias?.nome?.toLowerCase().includes('encomenda');
        
        if (formData.produto_id && !isEncomenda) {
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

      alert(editandoId ? 'Venda atualizada!' : 'Venda registrada com sucesso!');
      resetForm();
      await carregarDados();
    } catch (err) {
      console.error('Erro ao salvar venda:', err);
      alert(`Erro ao salvar: ${err.message}`);
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
            <label>Produto de Origem (Estoque):</label>
            <select
              name="produto_id"
              value={formData.produto_id}
              onChange={handleProdutoChange}
              className="select-customizado"
            >
              <option value="">Selecione (ou deixe em branco p/ Encomenda)...</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.categorias?.nome || 'Geral'}] {p.modelos?.nome} - Tam: {p.tamanhos?.nome} - {p.tecido || 'S/ Tecido'}
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
            <label>Características / Detalhes / Encomenda:</label>
            <input
              type="text"
              name="caracteristicas"
              value={formData.caracteristicas}
              onChange={handleChange}
              className="input-customizado"
              placeholder="Ex: Vestido Fleece Rosa Tamanho G"
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

      {/* TABELA DE HISTÓRICO */}      
      <div className="historico-card" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
        <h3>Histórico de Vendas</h3>
        <div className="historico-table-container" style={{ overflowX: 'auto' }}>
          <table className="historico-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '10px 8px', textAlign: 'center', width: '60px' }}>Ação</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', width: '90px' }}>Data</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', width: '120px' }}>Cliente</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', width: '100px' }}>Pet</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', width: '180px' }}>Produto</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', width: '70px' }}>Tamanho</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', width: '50px' }}>Qtd</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', width: '100px' }}>Val. Unitário</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', width: '90px' }}>Custo</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', width: '90px' }}>Lucro</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', width: '100px' }}>Pagamento</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', width: '90px' }}>Canal</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', width: '120px' }}>Obs.</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((v, index) => {
                const bgCor = index % 2 === 0 ? '#ffffff' : '#f4f6f8';
                return (
                  <tr key={v.id} style={{ backgroundColor: bgCor, borderBottom: '1px solid #e9ecef' }}>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleEditar(v)}
                        className="btn-icon-editar"
                        title="Editar Venda"
                      >
                        ✏️
                      </button>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'left' }}>
                      {v.data_venda ? new Date(v.data_venda).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'left' }}>{v.cliente || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'left' }}>{v.pet || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'left' }}>{v.produto || v.caracteristicas || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{v.tamanho || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{v.quantidade || 1}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>R$ {Number(v.valor_unitario || 0).toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#dc3545' }}>R$ {Number(v.custo_venda || 0).toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#28a745', fontWeight: 'bold' }}>R$ {Number(v.lucro_venda || 0).toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'left' }}>{v.forma_pagamento || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'left' }}>{v.canal_venda || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'left' }}>{v.observacao || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}