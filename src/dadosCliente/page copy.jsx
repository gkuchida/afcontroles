import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseCliente';
import { User, Dog, Plus, Trash2, CheckCircle, AlertCircle, Phone, Edit2, X } from 'lucide-react';
import './dadosCli.css'; 

export default function ClientesPets() {
  const [abaAtiva, setAbaAtiva] = useState('clientes');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Listas de dados salvos
  const [clientes, setClientes] = useState([]);
  const [pets, setPets] = useState([]);

  // Estados dos formulários - Cliente
  const [clienteEditandoId, setClienteEditandoId] = useState(null);
  const [clienteForm, setClienteForm] = useState({
    nome: '',
    telefone: '',
    observacao: ''
  });

  // Estados dos formulários - Pet
  const [petEditandoId, setPetEditandoId] = useState(null);
  const [petForm, setPetForm] = useState({
    cliente_id: '',
    nome: '',
    pescoco: '',
    torax: '',
    comprimento: '',
    nascimento: '',
    sexo: 'Macho',
    observacao: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const exibirMensagem = (tipo, texto) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem({ tipo: '', texto: '' }), 4000);
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Carregar Clientes
      const { data: cliData, error: cliErr } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');
      if (!cliErr && cliData) setClientes(cliData);

      // 2. Carregar Pets com dados dos Clientes vinculados
      const { data: petData, error: petErr } = await supabase
        .from('pets')
        .select('*')
        .order('nome');
      if (!petErr && petData) setPets(petData);

    } catch (err) {
      console.error("Erro ao carregar clientes e pets:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS CLIENTES ---

  const handleSalvarCliente = async (e) => {
    e.preventDefault();
    if (!clienteForm.nome.trim()) return;

    if (clienteEditandoId) {
      const { error } = await supabase
        .from('clientes')
        .update(clienteForm)
        .eq('id', clienteEditandoId);

      if (error) {
        exibirMensagem('erro', 'Erro ao atualizar cliente: ' + error.message);
      } else {
        exibirMensagem('sucesso', 'Cliente atualizado com sucesso!');
        resetClienteForm();
        carregarDados();
      }
    } else {
      const { error } = await supabase.from('clientes').insert([clienteForm]);
      if (error) {
        exibirMensagem('erro', 'Erro ao salvar cliente: ' + error.message);
      } else {
        exibirMensagem('sucesso', 'Cliente salvo com sucesso!');
        resetClienteForm();
        carregarDados();
      }
    }
  };

  const resetClienteForm = () => {
    setClienteForm({ nome: '', telefone: '', observacao: '' });
    setClienteEditandoId(null);
  };

  const handleEditarCliente = (cliente) => {
    setClienteEditandoId(cliente.id);
    setClienteForm({
      nome: cliente.nome || '',
      telefone: cliente.telefone || '',
      observacao: cliente.observacao || ''
    });
    setAbaAtiva('clientes');
  };

  // --- HANDLERS PETS ---

  const handleSalvarPet = async (e) => {
    e.preventDefault();
    if (!petForm.nome.trim() || !petForm.cliente_id) {
      exibirMensagem('erro', 'Selecione um cliente e informe o nome do pet.');
      return;
    }

    // Tratamento básico para dados de formulário
    const payloadPet = {
      ...petForm,
      nascimento: petForm.nascimento || null
    };

    if (petEditandoId) {
      const { error } = await supabase
        .from('pets')
        .update(payloadPet)
        .eq('id', petEditandoId);

      if (error) {
        exibirMensagem('erro', 'Erro ao atualizar pet: ' + error.message);
      } else {
        exibirMensagem('sucesso', 'Pet atualizado com sucesso!');
        resetPetForm();
        carregarDados();
      }
    } else {
      const { error } = await supabase.from('pets').insert([payloadPet]);
      if (error) {
        exibirMensagem('erro', 'Erro ao salvar pet: ' + error.message);
      } else {
        exibirMensagem('sucesso', 'Pet salvo com sucesso!');
        resetPetForm();
        carregarDados();
      }
    }
  };

  const resetPetForm = () => {
    setPetForm({
      cliente_id: '',
      nome: '',
      pescoco: '',
      torax: '',
      comprimento: '',
      nascimento: '',
      sexo: 'Macho',
      observacao: ''
    });
    setPetEditandoId(null);
  };

  const handleEditarPet = (pet) => {
    setPetEditandoId(pet.id);
    setPetForm({
      cliente_id: pet.cliente_id || '',
      nome: pet.nome || '',
      pescoco: pet.pescoco || '',
      torax: pet.torax || '',
      comprimento: pet.comprimento || '',
      nascimento: pet.nascimento || '',
      sexo: pet.sexo || 'Macho',
      observacao: pet.observacao || ''
    });
    setAbaAtiva('pets');
  };

  // --- DELETAR ---

  const handleExcluir = async (tabela, id) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;

    const { error } = await supabase.from(tabela).delete().eq('id', id);
    if (error) {
      exibirMensagem('erro', 'Não foi possível excluir: ' + error.message);
    } else {
      exibirMensagem('sucesso', 'Registro removido!');
      carregarDados();
    }
  };

  const getNomeCliente = (clienteId) => {
    const cli = clientes.find(c => c.id === clienteId);
    return cli ? cli.nome : 'Cliente não encontrado';
  };

  return (
    <div className="cadastros-container">
      <h2 className="cadastros-title">Cadastro/Manutenção de Clientes e Pets</h2>
      <p className="cadastros-subtitle">
        Cadastre tutores e seus respectivos pets para vinculá-los às ordens de produção e vendas.
      </p>

      {/* Alerta de Feedback */}
      {mensagem.texto && (
        <div className={`cadastros-alert ${mensagem.tipo}`}>
          {mensagem.tipo === 'sucesso' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{mensagem.texto}</span>
        </div>
      )}

      {/* Abas */}
      <div className="cadastros-tabs">
        <button
          className={`tab-button ${abaAtiva === 'clientes' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('clientes')}
        >
          <User size={16} /> Clientes / Tutores
        </button>
        <button
          className={`tab-button ${abaAtiva === 'pets' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('pets')}
        >
          <Dog size={16} /> Pets
        </button>
      </div>

      <div className="cadastros-content">
        {/* ABA CLIENTES */}
        {abaAtiva === 'clientes' && (
          <div className="cadastros-grid">
            <form onSubmit={handleSalvarCliente} className="form-card">
              <h3>{clienteEditandoId ? 'Editar Cliente' : 'Novo Cliente'}</h3>

              <div className="input-group">
                <label>Nome do Cliente *</label>
                <input
                  type="text"
                  placeholder="Ex: Maria Silva"
                  value={clienteForm.nome}
                  onChange={(e) => setClienteForm({ ...clienteForm, nome: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label>Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="Ex: (11) 99999-9999"
                  value={clienteForm.telefone}
                  onChange={(e) => setClienteForm({ ...clienteForm, telefone: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Observação</label>
                <textarea
                  rows="3"
                  placeholder="Anotações gerais..."
                  value={clienteForm.observacao}
                  onChange={(e) => setClienteForm({ ...clienteForm, observacao: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn-save" style={{ flex: 1 }}>
                  <Plus size={16} /> {clienteEditandoId ? 'Atualizar' : 'Salvar'} Cliente
                </button>
                {clienteEditandoId && (
                  <button type="button" onClick={resetClienteForm} className="btn-delete">
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>

            <div className="list-card">
              <h3>Clientes Cadastrados ({clientes.length})</h3>
              <ul className="cadastros-list">
                {clientes.map((cli) => {
                  const qtdPets = pets.filter(p => p.cliente_id === cli.id).length;
                  return (
                    <li key={cli.id} className="list-item">
                      <div>
                        <strong>{cli.nome}</strong>
                        {cli.telefone && <small><Phone size={12} /> {cli.telefone}</small>}
                        <small>Pets cadastrados: {qtdPets}</small>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleEditarCliente(cli)} className="btn-save" style={{ padding: '6px' }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleExcluir('clientes', cli.id)} className="btn-delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {/* ABA PETS */}
        {abaAtiva === 'pets' && (
          <div className="cadastros-grid">
            <form onSubmit={handleSalvarPet} className="form-card">
              <h3>{petEditandoId ? 'Editar Pet' : 'Novo Pet'}</h3>

              <div className="input-group">
                <label>Cliente / Tutor *</label>
                <select
                  value={petForm.cliente_id}
                  onChange={(e) => setPetForm({ ...petForm, cliente_id: e.target.value })}
                  required
                >
                  <option value="">Selecione o Dono...</option>
                  {clientes.map((cli) => (
                    <option key={cli.id} value={cli.id}>{cli.nome}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Nome do Pet *</label>
                <input
                  type="text"
                  placeholder="Ex: Thor, Mel, Belinha"
                  value={petForm.nome}
                  onChange={(e) => setPetForm({ ...petForm, nome: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div className="input-group">
                  <label>Pescoço (cm)</label>
                  <input
                    type="text"
                    placeholder="25"
                    value={petForm.pescoco}
                    onChange={(e) => setPetForm({ ...petForm, pescoco: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Tórax (cm)</label>
                  <input
                    type="text"
                    placeholder="40"
                    value={petForm.torax}
                    onChange={(e) => setPetForm({ ...petForm, torax: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Compr. (cm)</label>
                  <input
                    type="text"
                    placeholder="30"
                    value={petForm.comprimento}
                    onChange={(e) => setPetForm({ ...petForm, comprimento: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="input-group">
                  <label>Data Nascimento</label>
                  <input
                    type="date"
                    value={petForm.nascimento}
                    onChange={(e) => setPetForm({ ...petForm, nascimento: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>Sexo</label>
                  <select
                    value={petForm.sexo}
                    onChange={(e) => setPetForm({ ...petForm, sexo: e.target.value })}
                  >
                    <option value="Macho">Macho</option>
                    <option value="Fêmea">Fêmea</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Observação</label>
                <textarea
                  rows="2"
                  placeholder="Raça, temperamento, preferências..."
                  value={petForm.observacao}
                  onChange={(e) => setPetForm({ ...petForm, observacao: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn-save" style={{ flex: 1 }}>
                  <Plus size={16} /> {petEditandoId ? 'Atualizar' : 'Salvar'} Pet
                </button>
                {petEditandoId && (
                  <button type="button" onClick={resetPetForm} className="btn-delete">
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>

            <div className="list-card">
              <h3>Pets Cadastrados ({pets.length})</h3>
              <ul className="cadastros-list">
                {pets.map((pet) => (
                  <li key={pet.id} className="list-item">
                    <div>
                      <strong>{pet.nome}</strong> <small>({pet.sexo || 'N/I'})</small>
                      <small>Dono: {getNomeCliente(pet.cliente_id)}</small>
                      <small style={{ fontSize: '11px', color: '#666' }}>
                        Pesc: {pet.pescoco || '-'}cm | Tórax: {pet.torax || '-'}cm | Comp: {pet.comprimento || '-'}cm
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleEditarPet(pet)} className="btn-save" style={{ padding: '6px' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleExcluir('pets', pet.id)} className="btn-delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}