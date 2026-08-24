import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseCliente'; // Verifique se o caminho do seu supabaseCliente está correto
import { Tag, Shirt, Ruler, Palette, Sparkles, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import './dadosE.css';

export default function DadosE() {
  const [abaAtiva, setAbaAtiva] = useState('categorias');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Listas de dados salvos
  const [categorias, setCategorias] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [cores, setCores] = useState([]);
  const [estampas, setEstampas] = useState([]);

  // Estados dos formulários
  const [nomeCategoria, setNomeCategoria] = useState('');
  const [modeloData, setModeloData] = useState({ categoria_id: '', nome: '' });
  const [tamanhoData, setTamanhoData] = useState({ nome: '', ordem: 0 });
  const [nomeCor, setNomeCor] = useState('');
  const [nomeEstampa, setNomeEstampa] = useState('');

  useEffect(() => {
    carregarTodosDados();
  }, []);

  const exibirMensagem = (tipo, texto) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem({ tipo: '', texto: '' }), 4000);
  };

  const carregarTodosDados = async () => {
    setLoading(true);
    try {
      // 1. Categorias
      const { data: catData, error: catErr } = await supabase.from('categorias').select('*').order('nome');
      if (!catErr && catData) setCategorias(catData);

      // 2. Modelos
      const { data: modData, error: modErr } = await supabase.from('modelos').select('*').order('nome');
      if (!modErr && modData) setModelos(modData);

      // 3. Tamanhos
      const { data: tamData, error: tamErr } = await supabase.from('tamanhos').select('*').order('ordem', { ascending: true });
      if (!tamErr && tamData) setTamanhos(tamData);

      // 4. Cores (Verifica se a tabela existe)
      const { data: corData, error: corErr } = await supabase.from('cores').select('*').order('nome');
      if (!corErr && corData) setCores(corData);

      // 5. Estampas (Verifica se a tabela existe)
      const { data: estData, error: estErr } = await supabase.from('estampas').select('*').order('nome');
      if (!estErr && estData) setEstampas(estData);

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS DE SALVAMENTO ---

  const handleSalvarCategoria = async (e) => {
    e.preventDefault();
    if (!nomeCategoria.trim()) return;

    const { error } = await supabase.from('categorias').insert([{ nome: nomeCategoria }]);
    if (error) {
      exibirMensagem('erro', 'Erro ao salvar categoria: ' + error.message);
    } else {
      exibirMensagem('sucesso', 'Categoria salva com sucesso!');
      setNomeCategoria('');
      carregarTodosDados();
    }
  };

  const handleSalvarModelo = async (e) => {
    e.preventDefault();
    if (!modeloData.nome.trim() || !modeloData.categoria_id) {
      exibirMensagem('erro', 'Selecione uma categoria e informe o nome do modelo.');
      return;
    }

    const { error } = await supabase.from('modelos').insert([modeloData]);
    if (error) {
      exibirMensagem('erro', 'Erro ao salvar modelo: ' + error.message);
    } else {
      exibirMensagem('sucesso', 'Modelo salvo com sucesso!');
      setModeloData({ categoria_id: '', nome: '' });
      carregarTodosDados();
    }
  };

  const handleSalvarTamanho = async (e) => {
    e.preventDefault();
    if (!tamanhoData.nome.trim()) return;

    const { error } = await supabase.from('tamanhos').insert([tamanhoData]);
    if (error) {
      exibirMensagem('erro', 'Erro ao salvar tamanho: ' + error.message);
    } else {
      exibirMensagem('sucesso', 'Tamanho salvo com sucesso!');
      setTamanhoData({ nome: '', ordem: 0 });
      carregarTodosDados();
    }
  };

  const handleSalvarCor = async (e) => {
    e.preventDefault();
    if (!nomeCor.trim()) return;

    const { error } = await supabase.from('cores').insert([{ nome: nomeCor }]);
    if (error) {
      exibirMensagem('erro', 'Erro ao salvar cor: ' + error.message);
    } else {
      exibirMensagem('sucesso', 'Cor salva com sucesso!');
      setNomeCor('');
      carregarTodosDados();
    }
  };

  const handleSalvarEstampa = async (e) => {
    e.preventDefault();
    if (!nomeEstampa.trim()) return;

    const { error } = await supabase.from('estampas').insert([{ nome: nomeEstampa }]);
    if (error) {
      exibirMensagem('erro', 'Erro ao salvar estampa: ' + error.message);
    } else {
      exibirMensagem('sucesso', 'Estampa salva com sucesso!');
      setNomeEstampa('');
      carregarTodosDados();
    }
  };

  // --- HANDLER DE EXCLUSÃO ---

  const handleExcluir = async (tabela, id) => {
    if (!window.confirm('Tem certeza que deseja excluir este item?')) return;

    const { error } = await supabase.from(tabela).delete().eq('id', id);
    if (error) {
      exibirMensagem('erro', 'Não foi possível excluir: ' + error.message);
    } else {
      exibirMensagem('sucesso', 'Item removido!');
      carregarTodosDados();
    }
  };

  // Função para pegar nome da categoria vinculada ao modelo
  const getNomeCategoria = (catId) => {
    const cat = categorias.find(c => c.id === catId);
    return cat ? cat.nome : 'Sem categoria';
  };

  return (
    <div className="cadastros-container">
      <h2 className="cadastros-title">Cadastros Auxiliares para Estoque & Produtos</h2>
      <p className="cadastros-subtitle">
        Gerencie categorias, modelos, tamanhos, cores e estampas para carregar no estoque.
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
          className={`tab-button ${abaAtiva === 'categorias' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('categorias')}
        >
          <Tag size={16} /> Categorias
        </button>
        <button
          className={`tab-button ${abaAtiva === 'modelos' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('modelos')}
        >
          <Shirt size={16} /> Modelos
        </button>
        <button
          className={`tab-button ${abaAtiva === 'tamanhos' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('tamanhos')}
        >
          <Ruler size={16} /> Tamanhos
        </button>
        <button
          className={`tab-button ${abaAtiva === 'cores' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('cores')}
        >
          <Palette size={16} /> Cores
        </button>
        <button
          className={`tab-button ${abaAtiva === 'estampas' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('estampas')}
        >
          <Sparkles size={16} /> Estampas
        </button>
      </div>

      <div className="cadastros-content">
        {/* ABA CATEGORIAS */}
        {abaAtiva === 'categorias' && (
          <div className="cadastros-grid">
            <form onSubmit={handleSalvarCategoria} className="form-card">
              <h3>Nova Categoria</h3>
              <div className="input-group">
                <label>Nome da Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Inverno, Encomenda, ..."
                  value={nomeCategoria}
                  onChange={(e) => setNomeCategoria(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-save">
                <Plus size={16} /> Salvar Categoria
              </button>
            </form>

            <div className="list-card">
              <h3>Categorias Cadastradas ({categorias.length})</h3>
              <ul className="cadastros-list">
                {categorias.map((cat) => (
                  <li key={cat.id} className="list-item">
                    <span>{cat.nome}</span>
                    <button onClick={() => handleExcluir('categorias', cat.id)} className="btn-delete">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ABA MODELOS */}
        {abaAtiva === 'modelos' && (
          <div className="cadastros-grid">
            <form onSubmit={handleSalvarModelo} className="form-card">
              <h3>Novo Modelo</h3>
              <div className="input-group">
                <label>Categoria Pertencente</label>
                <select
                  value={modeloData.categoria_id}
                  onChange={(e) => setModeloData({ ...modeloData, categoria_id: e.target.value })}
                  required
                >
                  <option value="">Selecione uma Categoria...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Nome do Modelo</label>
                <input
                  type="text"
                  placeholder="Ex: Básica, Pano de prato, ..."
                  value={modeloData.nome}
                  onChange={(e) => setModeloData({ ...modeloData, nome: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-save">
                <Plus size={16} /> Salvar Modelo
              </button>
            </form>

            <div className="list-card">
              <h3>Modelos Cadastrados ({modelos.length})</h3>
              <ul className="cadastros-list">
                {modelos.map((mod) => (
                  <li key={mod.id} className="list-item">
                    <div>
                      <strong>{mod.nome}</strong>
                      <small>Categoria: {getNomeCategoria(mod.categoria_id)}</small>
                    </div>
                    <button onClick={() => handleExcluir('modelos', mod.id)} className="btn-delete">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ABA TAMANHOS */}
        {abaAtiva === 'tamanhos' && (
          <div className="cadastros-grid">
            <form onSubmit={handleSalvarTamanho} className="form-card">
              <h3>Novo Tamanho</h3>
              <div className="input-group">
                <label>Nome / Sigla do Tamanho</label>
                <input
                  type="text"
                  placeholder="Ex: PP, P, ..."
                  value={tamanhoData.nome}
                  onChange={(e) => setTamanhoData({ ...tamanhoData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label>Ordem de Exibição</label>
                <input
                  type="number"
                  value={tamanhoData.ordem}
                  onChange={(e) => setTamanhoData({ ...tamanhoData, ordem: parseInt(e.target.value) || 0 })}
                />
              </div>
              <button type="submit" className="btn-save">
                <Plus size={16} /> Salvar Tamanho
              </button>
            </form>

            <div className="list-card">
              <h3>Tamanhos Cadastrados ({tamanhos.length})</h3>
              <ul className="cadastros-list">
                {tamanhos.map((tam) => (
                  <li key={tam.id} className="list-item">
                    <span><strong>{tam.nome}</strong> (Ordem: {tam.ordem})</span>
                    <button onClick={() => handleExcluir('tamanhos', tam.id)} className="btn-delete">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ABA CORES */}
        {abaAtiva === 'cores' && (
          <div className="cadastros-grid">
            <form onSubmit={handleSalvarCor} className="form-card">
              <h3>Nova Cor</h3>
              <div className="input-group">
                <label>Nome da Cor</label>
                <input
                  type="text"
                  placeholder="Ex: Rosa Bebê, Azul Marinho"
                  value={nomeCor}
                  onChange={(e) => setNomeCor(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-save">
                <Plus size={16} /> Salvar Cor
              </button>
            </form>

            <div className="list-card">
              <h3>Cores Cadastradas ({cores.length})</h3>
              <ul className="cadastros-list">
                {cores.map((c) => (
                  <li key={c.id} className="list-item">
                    <span>{c.nome}</span>
                    <button onClick={() => handleExcluir('cores', c.id)} className="btn-delete">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ABA ESTAMPAS */}
        {abaAtiva === 'estampas' && (
          <div className="cadastros-grid">
            <form onSubmit={handleSalvarEstampa} className="form-card">
              <h3>Nova Estampa</h3>
              <div className="input-group">
                <label>Nome da Estampa</label>
                <input
                  type="text"
                  placeholder="Ex: Xadrez, Floral, Patinhas"
                  value={nomeEstampa}
                  onChange={(e) => setNomeEstampa(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-save">
                <Plus size={16} /> Salvar Estampa
              </button>
            </form>

            <div className="list-card">
              <h3>Estampas Cadastradas ({estampas.length})</h3>
              <ul className="cadastros-list">
                {estampas.map((est) => (
                  <li key={est.id} className="list-item">
                    <span>{est.nome}</span>
                    <button onClick={() => handleExcluir('estampas', est.id)} className="btn-delete">
                      <Trash2 size={16} />
                    </button>
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