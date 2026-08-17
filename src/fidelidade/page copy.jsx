import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../supabaseCliente';
import './fidelidade.css';

export default function Fidelidade() {
  const [historicoGeral, setHistoricoGeral] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Estados do formulário de entrada manual
  const [cliente, setCliente] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  // Estado para a barra de pesquisa do histórico
  const [pesquisa, setPesquisa] = useState('');

  // 1. Carregar dados do Supabase
  const carregarHistorico = async () => {
    try {
      setCarregando(true);
      const { data: dados, error } = await supabase
        .from('fidelidade_materiais')
        .select('*')
        .order('data', { ascending: false })
        .order('id', { ascending: false });

      if (error) throw error;
      setHistoricoGeral(dados || []);
    } catch (error) {
      console.error("Erro ao buscar histórico do Supabase:", error.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  // Normalização de nomes (remove acentos, caixa alta e espaços duplicados)
  const normalizarNome = (nome) => {
    if (!nome) return '';
    return nome
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ' ');
  };

  // 2. Salvar uma nova compra
  const handleAdicionarCompra = async (e) => {
    e.preventDefault();
    if (!cliente || !valor) return;

    const novaCompra = {
      tipo: 'COMPRA',
      data,
      cliente: cliente.trim(),
      valor: parseFloat(valor),
    };

    try {
      const { data: inserido, error } = await supabase
        .from('fidelidade_materiais')
        .insert([novaCompra])
        .select();

      if (error) throw error;

      if (inserido) {
        setHistoricoGeral([inserido[0], ...historicoGeral]);
      }
      
      setCliente('');
      setValor('');
    } catch (error) {
      alert("Erro ao salvar compra: " + error.message);
    }
  };

  // 3. Registrar retirada do brinde
  const handleRetirarBandana = async (nomeOriginal) => {
    const dataAtual = new Date().toISOString().split('T')[0];
    
    const novaRetirada = {
      tipo: 'RETIRADA',
      data: dataAtual,
      cliente: nomeOriginal.trim(),
      valor: 0
    };

    try {
      const { data: inserido, error } = await supabase
        .from('fidelidade_materiais')
        .insert([novaRetirada])
        .select();

      if (error) throw error;

      if (inserido) {
        setHistoricoGeral([inserido[0], ...historicoGeral]);
      }
    } catch (error) {
      alert("Erro ao registrar entrega de brinde: " + error.message);
    }
  };

  // Processa o histórico para calcular saldos e prêmios de forma precisa
  const resumoClientes = useMemo(() => {
    const resumo = {};

    historicoGeral.forEach(item => {
      const chave = normalizarNome(item.cliente);
      
      if (!resumo[chave]) {
        resumo[chave] = { 
          nomeExibicao: item.cliente,
          totalCompradoBruto: 0,
          totalRetiradas: 0
        };
      }

      if (item.tipo === 'COMPRA') {
        resumo[chave].totalCompradoBruto += Number(item.valor || 0);
      } else if (item.tipo === 'RETIRADA') {
        resumo[chave].totalRetiradas += 1;
      }
    });

    return Object.keys(resumo).map(chave => {
      const dados = resumo[chave];
      const totalBruto = dados.totalCompradoBruto;
      
      // Total de brindes que o valor bruto já concedeu
      const totalBandanasGanhasBruto = Math.floor(totalBruto / 150);
      
      // Brindes ainda não resgatados
      const bandanasDisponiveis = Math.max(0, totalBandanasGanhasBruto - dados.totalRetiradas);
      
      // Sobra do ciclo atual rumo ao PRÓXIMO brinde (ex: R$ 200 => R$ 50 de sobra)
      const saldoSobraCiclo = totalBruto % 150;
      
      // Quanto falta para o próximo ciclo de R$ 150
      const faltamParaProximo = saldoSobraCiclo === 0 && totalBruto > 0 ? 0 : 150 - saldoSobraCiclo;

      return {
        nome: dados.nomeExibicao,
        totalCompradoBruto: totalBruto,
        saldoSobraCiclo,
        bandanasDisponiveis,
        faltamParaProximo
      };
    });
  }, [historicoGeral]);

  // Filtra o histórico linha a linha
  const historicoFiltrado = useMemo(() => {
    const termoNormalizado = normalizarNome(pesquisa);
    if (!termoNormalizado) return historicoGeral;

    return historicoGeral.filter(mov => 
      normalizarNome(mov.cliente).includes(termoNormalizado)
    );
  }, [historicoGeral, pesquisa]);

  return (
    <div className="fidelidade-container">
      
      <header className="fidelidade-header">
        <h1>Painel de Fidelidade</h1>
        <p>A cada R$ 150,00 em compras, o cliente ganha um brinde!</p>
      </header>

      <div className="fidelidade-conteudo">
        
        {/* Formulário de Lançamento */}
        <section className="secao-cadastro">
          <h2>Lançar Nova Compra</h2>
          <form onSubmit={handleAdicionarCompra} className="form-compra">
            <div className="form-grupo">
              <label>Data da Compra</label>
              <input 
                type="date" 
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </div>

            <div className="form-grupo">
              <label>Nome do Cliente</label>
              <input 
                type="text" 
                placeholder="Ex: Ana Silva"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                required
              />
            </div>

            <div className="form-grupo">
              <label>Valor da Compra (R$)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-registrar">Registrar Compra</button>
          </form>
        </section>

        {/* Tabela de Saldos Operacionais */}
        <section className="secao-saldos">
          <h2>Saldos e Premiações Ativas</h2>
          <div className="tabela-wrapper">
            <table className="tabela-fidelidade">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Sobra p/ Próximo Brinde</th>
                  <th>Faltam para Prêmio</th>
                  <th>Prêmios Disponíveis</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan="5" className="sem-dados">Buscando dados no Supabase...</td>
                  </tr>
                ) : resumoClientes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="sem-dados">Nenhum cliente com compras registradas.</td>
                  </tr>
                ) : (
                  resumoClientes.map((item) => (
                    <tr 
                      key={item.nome}
                      className={item.bandanasDisponiveis > 0 ? 'linha-destaque-premio' : ''}
                    >
                      <td className="col-nome">{item.nome}</td>
                      <td>R$ {item.saldoSobraCiclo.toFixed(2)}</td>
                      <td>
                        {item.bandanasDisponiveis > 0 ? (
                          <span className="badge-meta">Prêmio Liberado!</span>
                        ) : (
                          `R$ ${item.faltamParaProximo.toFixed(2)}`
                        )}
                      </td>
                      <td>
                        {item.bandanasDisponiveis > 0 ? (
                          <span className="badge-premio">{item.bandanasDisponiveis} brinde(s) 🎁</span>
                        ) : (
                          <span className="sem-premio">Nenhum</span>
                        )}
                      </td>
                      <td>
                        <button
                          disabled={item.bandanasDisponiveis === 0}
                          onClick={() => handleRetirarBandana(item.nome)}
                          className="btn-entregar"
                        >
                          Marcar como Entregue
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Histórico Geral Unificado com Barra de Pesquisa */}
      <footer className="secao-historico">
        <div className="historico-header-acoes">
          <h2>Histórico de Movimentações (Linha a Linha)</h2>
          
          <div className="busca-wrapper">
            <input 
              type="text"
              placeholder="🔍 Buscar histórico por cliente..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="input-busca-historico"
            />
          </div>
        </div>

        <div className="historico-wrapper">
          <table className="tabela-historico">
            <thead>
              <tr>
                <th>Data Movimento</th>
                <th>Cliente</th>
                <th>Tipo de Evento</th>
                <th>Valor / Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan="4" className="sem-dados">Carregando histórico...</td>
                </tr>
              ) : historicoFiltrado.length === 0 ? (
                <tr>
                  <td colSpan="4" className="sem-dados">
                    {pesquisa ? 'Nenhum resultado encontrado para esta busca.' : 'Nenhuma movimentação registrada.'}
                  </td>
                </tr>
              ) : (
                historicoFiltrado.map(mov => (
                  <tr key={mov.id} className={mov.tipo === 'RETIRADA' ? 'linha-retirada' : ''}>
                    <td>{mov.data ? mov.data.split('-').reverse().join('/') : ''}</td>
                    <td>{mov.cliente}</td>
                    <td>
                      {mov.tipo === 'COMPRA' ? (
                        <span style={{ color: '#2563eb', fontWeight: 500 }}>🛒 Compra</span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>🎁 Entrega de Brinde</span>
                      )}
                    </td>
                    <td>
                      {mov.tipo === 'COMPRA' ? (
                        `R$ ${Number(mov.valor).toFixed(2)}`
                      ) : (
                        <strong style={{ color: '#16a34a' }}>Brinde Entregue</strong>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </footer>

    </div>
  );
}