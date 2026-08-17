import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseCliente';
import { User, Dog, Plus, Trash2, CheckCircle, AlertCircle, Phone, Edit2, X, Users, ChevronDown, ChevronUp, Ruler, Calendar } from 'lucide-react';
import './dadosCli.css'; 

export default function ClientesPets() {
  const [abaAtiva, setAbaAtiva] = useState('clientes');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Listas de dados
  const [clientes, setClientes] = useState([]);
  const [pets, setPets] = useState([]);

  // Estado para controlar qual Tutor está expandido na lista
  const [tutorExpandidoId, setTutorExpandidoId] = useState(null);

  // Formulário - Cliente
  const [clienteEditandoId, setClienteEditandoId] = useState(null);
  const [clienteForm, setClienteForm] = useState({
    nome: '',
    telefone: '',
    observacao: ''
  });

  // Formulário - Pet
  const [petEditandoId, setPetEditandoId] = useState(null);
  const [petForm, setPetForm] = useState({
    cliente_id: '',
    nome: '',
    pescoco: '',
    torax: '',
    comprimento: '',
    nascimento: '',
    sexo: '',
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
      const { data: cliData } = await supabase.from('clientes').select('*').order('nome');
      if (cliData) setClientes(cliData);

      const { data: petData } = await supabase.from('pets').select('*').order('nome');
      if (petData) setPets(petData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS CLIENTE ---
  const handleSalvarCliente = async (e) => {
    e.preventDefault();
    if (!clienteForm.nome.trim()) return;

    if (clienteEditandoId) {
      const { error } = await supabase.from('clientes').update(clienteForm).eq('id', clienteEditandoId);
      if (error) {
        exibirMensagem('erro', 'Erro ao atualizar cliente: ' + error.message);
      } else {
        exibirMensagem('sucesso', 'Cliente atualizado!');
        resetClienteForm();
        carregarDados();
      }
    } else {
      const { error } = await supabase.from('clientes').insert([clienteForm]);
      if (error) {
        exibirMensagem('erro', 'Erro ao salvar cliente: ' + error.message);
      } else {
        exibirMensagem('sucesso', 'Cliente salvo!');
        resetClienteForm();
        carregarDados();
      }
    }
  };

  const resetClienteForm = () => {
    setClienteForm({ nome: '', telefone: '', observacao: '' });
    setClienteEditandoId(null);
  };

  const handleEditarCliente = (cliente, e) => {
    if (e) e.stopPropagation();
    setClienteEditandoId(cliente.id);
    setClienteForm({
      nome: cliente.nome || '',
      telefone: cliente.telefone || '',
      observacao: cliente.observacao || ''
    });
    setAbaAtiva('clientes');
  };

  // --- HANDLERS PET ---
  const handleSalvarPet = async (e) => {
    e.preventDefault();
    if (!petForm.nome.trim() || !petForm.cliente_id) {
      exibirMensagem('erro', 'Selecione um cliente e informe o nome do pet.');
      return;
    }

    const payloadPet = {
      ...petForm,
      nascimento: petForm.nascimento || null
    };

    if (petEditandoId) {
      const { error } = await supabase.from('pets').update(payloadPet).eq('id', petEditandoId);
      if (error) {
        exibirMensagem('erro', 'Erro ao atualizar pet: ' + error.message);
      } else {
        exibirMensagem('sucesso', 'Pet atualizado!');
        resetPetForm();
        carregarDados();
      }
    } else {
      const { error } = await supabase.from('pets').insert([payloadPet]);
      if (error) {
        exibirMensagem('erro', 'Erro ao salvar pet: ' + error.message);
      } else {
        exibirMensagem('sucesso', 'Pet salvo!');
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
      sexo: '',
      observacao: ''
    });
    setPetEditandoId(null);
  };

  const handleEditarPet = (pet, e) => {
    if (e) e.stopPropagation();
    setPetEditandoId(pet.id);
    setPetForm({
      cliente_id: pet.cliente_id || '',
      nome: pet.nome || '',
      pescoco: pet.pescoco || '',
      torax: pet.torax || '',
      comprimento: pet.comprimento || '',
      nascimento: pet.nascimento || '',
      sexo: pet.sexo || '',
      observacao: pet.observacao || ''
    });
    setAbaAtiva('pets');
  };

  const handleExcluir = async (tabela, id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;

    const { error } = await supabase.from(tabela).delete().eq('id', id);
    if (error) {
      exibirMensagem('erro', 'Não foi possível excluir: ' + error.message);
    } else {
      exibirMensagem('sucesso', 'Registro removido!');
      carregarDados();
    }
  };

  const toggleExpansaoTutor = (id) => {
    setTutorExpandidoId(tutorExpandidoId === id ? null : id);
  };

  return (
    <div className="cadastros-container">
      <h2 className="cadastros-title">Clientes e Pets</h2>

      {mensagem.texto && (
        <div className={`cadastros-alert ${mensagem.tipo}`}>
          {mensagem.tipo === 'sucesso' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{mensagem.texto}</span>
        </div>
      )}

      {/* Navegação por Abas */}
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
        <button
          className={`tab-button ${abaAtiva === 'relacao' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('relacao')}
        >
          <Users size={16} /> Relação
        </button>
      </div>

      <div className="cadastros-content">
        {/* ABA CLIENTES */}
        {abaAtiva === 'clientes' && (
          <div className="cadastros-single-column">
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
                  placeholder="Ex: (41) 99999-9999"
                  value={clienteForm.telefone}
                  onChange={(e) => setClienteForm({ ...clienteForm, telefone: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Observação</label>
                <textarea
                  rows="3"
                  placeholder="Anotações..."
                  value={clienteForm.observacao}
                  onChange={(e) => setClienteForm({ ...clienteForm, observacao: e.target.value })}
                />
              </div>

              <div className="button-group">
                <button type="submit" className="btn-save">
                    <Plus size={16} /> {clienteEditandoId ? 'Atualizar' : 'Salvar'} Cliente
                </button>
                {clienteEditandoId && (
                    <button type="button" onClick={resetClienteForm} className="btn-delete">
                    <X size={16} />
                    </button>
                )}
                </div>
            </form>
          </div>
        )}

        {/* ABA PETS */}
        {abaAtiva === 'pets' && (
          <div className="cadastros-single-column">
            <form onSubmit={handleSalvarPet} className="form-card">
              <h3>{petEditandoId ? 'Editar Pet' : 'Novo Pet'}</h3>

              <div className="input-group">
                <label>Cliente / Tutor *</label>
                <select
                  value={petForm.cliente_id}
                  onChange={(e) => setPetForm({ ...petForm, cliente_id: e.target.value })}
                  required
                >
                  <option value="">Selecione o Tutor...</option>
                  {clientes.map((cli) => (
                    <option key={cli.id} value={cli.id}>{cli.nome}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Nome do Pet *</label>
                <input
                  type="text"
                  placeholder="Ex: Thor, Mel"
                  value={petForm.nome}
                  onChange={(e) => setPetForm({ ...petForm, nome: e.target.value })}
                  required
                />
              </div>

              <div class="medidas">
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
                  <label>Comprimento (cm)</label>
                  <input
                    type="text"
                    placeholder="30"
                    value={petForm.comprimento}
                    onChange={(e) => setPetForm({ ...petForm, comprimento: e.target.value })}
                  />
                </div>
              </div>

              <div class="dados">
                <div className="input-group">
                  <label>Nascimento</label>
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
                  placeholder="Raça, observações..."
                  value={petForm.observacao}
                  onChange={(e) => setPetForm({ ...petForm, observacao: e.target.value })}
                />
              </div>

              <div className="button-group">
                <button type="submit" className="btn-save">
                    <Plus size={16} /> {petEditandoId ? 'Atualizar' : 'Salvar'} Pet
                </button>
                {petEditandoId && (
                    <button type="button" onClick={resetPetForm} className="btn-delete">
                    <X size={16} />
                    </button>
                )}
                </div>
            </form>
          </div>
        )}

        {/* ABA RELAÇÃO (AGRUPADO POR TUTOR) */}
        {abaAtiva === 'relacao' && (
          <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#444' }}>
              Relação de Tutores e Pets ({clientes.length})
            </h3>

            {clientes.length === 0 ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Nenhum tutor cadastrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {clientes.map((tutor) => {
                  const estaAberto = tutorExpandidoId === tutor.id;
                  const petsDoTutor = pets.filter(p => p.cliente_id === tutor.id);

                  return (
                    <div
                      key={tutor.id}
                      onClick={() => toggleExpansaoTutor(tutor.id)}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease-in-out',
                        boxShadow: estaAberto ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >
                      {/* Linha Principal do Tutor */}
                      <div class="relacao">
                        <div class="relacao-user">
                          <User size={18} class="user" />
                          <span class="sp-user">
                            {tutor.nome}
                          </span>
                          <span class="sp-pet">
                            {petsDoTutor.length} {petsDoTutor.length === 1 ? 'pet' : 'pets'}
                          </span>
                        </div>

                        {tutor.telefone ? (
                          <div class="relacao-tutor">
                            <Phone size={13} class="fone"/>
                            <span>{tutor.telefone}</span>
                          </div>
                        ) : (
                          <span class="semtel">Sem tel</span>
                        )}

                        <div class="aberto">
                          {estaAberto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {/* Conteúdo Expandido (Pets do Tutor) */}
                      {estaAberto && (
                        <div class="ab-tutor">
                          {/* Ações do Tutor */}
                          <div class="ab-tutor-obs">
                            <span>
                              {tutor.observacao ? `Obs Tutor: ${tutor.observacao}` : 'Sem observações do tutor'}
                            </span>
                            <div class="edit-tutor">
                              <button
                                onClick={(e) => handleEditarCliente(tutor, e)}
                                className="btn-save"                                
                              >
                                <Edit2 size={12} /> Editar Tutor
                              </button>
                              <button
                                onClick={(e) => handleExcluir('clientes', tutor.id, e)}
                                className="btn-delete"                                
                              >
                                <Trash2 size={12} /> 
                              </button>
                            </div>
                          </div>

                          {/* Lista dos Pets */}
                          {petsDoTutor.length === 0 ? (
                            <p class="ab-tutor-p">Nenhum pet cadastrado para este tutor.</p>
                          ) : (
                            petsDoTutor.map((pet) => (
                              <div
                                key={pet.id}
                                class="pets-tutor"
                              >
                                <div class="pets-tutor-edit">
                                  <div class="card-pet">
                                    <Dog size={15} class="card-dog"/>
                                    <strong >{pet.nome}</strong>
                                    <span>({pet.sexo || 'N/I'})</span>
                                  </div>

                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                      onClick={(e) => handleEditarPet(pet, e)}
                                      className="btn-save"                                      
                                      title="Editar Pet"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={(e) => handleExcluir('pets', pet.id, e)}
                                      className="btn-delete"                                                                            
                                      title="Excluir Pet"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>

                                {/* Medidas e Nascimento */}
                                <div class="medidas-pet">
                                  <div class="medidas-pet2">
                                    <Ruler size={13} class="regua" />
                                    <span><strong>Pesc:</strong> {pet.pescoco ? `${pet.pescoco} cm` : '-'}</span>
                                    <span>|</span>
                                    <span><strong>Tórax:</strong> {pet.torax ? `${pet.torax} cm` : '-'}</span>
                                    <span>|</span>
                                    <span><strong>Compr:</strong> {pet.comprimento ? `${pet.comprimento} cm` : '-'}</span>
                                  </div>

                                  {pet.nascimento && (
                                    <div class="pets-nasc">
                                      <Calendar size={12} class="pets-calendar" />
                                      <span>{new Date(pet.nascimento).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                  )}
                                </div>

                                {pet.observacao && (
                                  <div class="pets-obs">
                                    <strong>Obs Pet:</strong> {pet.observacao}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}