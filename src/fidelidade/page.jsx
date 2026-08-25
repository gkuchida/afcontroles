import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../supabaseCliente';
import './fidelidade.css';

export default function Fidelidade() {
  const [historicoGeral, setHistoricoGeral] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Formulário
  const [cliente, setCliente] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  // Filtros da tabela de Saldos
  const [buscaSaldo, setBuscaSaldo] = useState('');
  const [ordemSaldo, setOrdemSaldo] = useState('az'); // 'az' ou 'za'

  // Filtro da tabela de Histórico
  const [pesquisa, setPesquisa] = useState('');

  const carregarHistorico = async () => {
    try {
      setCarregando(true);
      const { data: dados, error } = await supabase
        .from('fidelidade')
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

  const normalizarNome = (nome) => {
    if (!nome) return '';
    return nome
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, ' ');
  };

  const handleAdicionarCompra = async (e) => {
    e.preventDefault();
    if (!cliente || !valor) return;

    const novaCompra = {
      data,
      cliente: cliente.trim(),
      valor_compra: parseFloat(valor),
      retirou: 'NÃO'
    };

    try {
      const { data: inserido, error } = await supabase
        .from('fidelidade')
        .insert([novaCompra])
        .select();

      if (error) throw error;

      if (inserido && inserido.length > 0) {
        setHistoricoGeral(prev => [inserido[0], ...prev]);
      } else {
        await carregarHistorico();
      }
      
      setCliente('');
      setValor('');
    } catch (error) {
      alert("Erro ao salvar compra: " + error.message);
    }
  };

  const handleRetirarBrinde = async (nomeOriginal) => {
    const dataAtual = new Date().toISOString().split('T')[0];
    
    const novaRetirada = {
      data: dataAtual,
      cliente: nomeOriginal.trim(),
      valor_compra: 0,
      retirou: 'SIM'
    };

    try {
      const { data: inserido, error } = await supabase
        .from('fidelidade')
        .insert([novaRetirada])
        .select();

      if (error) throw error;

      if (inserido && inserido.length > 0) {
        setHistoricoGeral(prev => [inserido[0], ...prev]);
      } else {
        await carregarHistorico();
      }
    } catch (error) {
      alert("Erro ao registrar entrega de brinde: " + error.message);
    }
  };

  // 1. Resumo + Busca + Ordenação da tabela de Saldos
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

      const valorItem = Number(item.valor_compra || 0);
      resumo[chave].totalCompradoBruto += valorItem;

      if (item.retirou === 'SIM' || (valorItem === 0 && item.retirou !== 'NÃO')) {
        resumo[chave].totalRetiradas += 1;
      }
    });

    let lista = Object.keys(resumo).map(chave => {
      const dados = resumo[chave];
      const totalBruto = dados.totalCompradoBruto;
      
      const totalBrindesGanho = Math.floor(totalBruto / 150);
      const brindesDisponiveis = Math.max(0, totalBrindesGanho - dados.totalRetiradas);
      
      const saldoSobraCiclo = totalBruto % 150;
      const faltamParaProximo = 150 - saldoSobraCiclo;

      return {
        nome: dados.nomeExibicao,
        totalCompradoBruto: totalBruto,
        saldoSobraCiclo,
        brindesDisponiveis,
        faltamParaProximo
      };
    });

    // Filtro de busca na tabela de saldos
    const termoBusca = normalizarNome(buscaSaldo);
    if (termoBusca) {
      lista = lista.filter(item => normalizarNome(item.nome).includes(termoBusca));
    }

    // Ordenação A-Z / Z-A
    lista.sort((a, b) => {
      const nomeA = normalizarNome(a.nome);
      const nomeB = normalizarNome(b.nome);

      if (ordemSaldo === 'az') {
        return nomeA.localeCompare(nomeB);
      } else {
        return nomeB.localeCompare(nomeA);
      }
    });

    return lista;
  }, [historicoGeral, buscaSaldo, ordemSaldo]);

  // Filtro da tabela de histórico
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
        <p>A cada R$ 150,00 acumulados em compras, o cliente ganha um brinde!</p>
      </header>

      <div className="fidelidade-conteudo">
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

        <section className="secao-saldos">
          <div className="saldos-header-acoes">
            <h2>Saldos e Premiações Ativas</h2>
            <div className="controles-saldos">
              <input 
                type="text"
                placeholder="🔍 Pesquisar cliente..."
                value={buscaSaldo}
                onChange={(e) => setBuscaSaldo(e.target.value)}
                className="input-busca-saldos"
              />
              <select 
                value={ordemSaldo} 
                onChange={(e) => setOrdemSaldo(e.target.value)}
                className="select-ordem-saldos"
              >
                <option value="az">Nome (A - Z)</option>
                <option value="za">Nome (Z - A)</option>
              </select>
            </div>
          </div>

          <div className="tabela-wrapper">
            <table className="tabela-fidelidade">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Total Acumulado</th>
                  <th>Saldo no Ciclo</th>
                  <th>Faltam para Brinde</th>
                  <th>Brindes Disponíveis</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan="6" className="sem-dados">Buscando dados no Supabase...</td>
                  </tr>
                ) : resumoClientes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="sem-dados">
                      {buscaSaldo ? 'Nenhum cliente encontrado.' : 'Nenhum cliente registrado.'}
                    </td>
                  </tr>
                ) : (
                  resumoClientes.map((item) => (
                    <tr 
                      key={item.nome}
                      className={item.brindesDisponiveis > 0 ? 'linha-destaque-premio' : ''}
                    >
                      <td className="col-nome">{item.nome}</td>
                      <td>R$ {item.totalCompradoBruto.toFixed(2)}</td>
                      <td>R$ {item.saldoSobraCiclo.toFixed(2)}</td>
                      <td>
                        {item.brindesDisponiveis > 0 ? (
                          <span className="badge-meta">Meta Atingida!</span>
                        ) : (
                          `R$ ${item.faltamParaProximo.toFixed(2)}`
                        )}
                      </td>
                      <td>
                        {item.brindesDisponiveis > 0 ? (
                          <span className="badge-premio">{item.brindesDisponiveis} brinde(s) 🎁</span>
                        ) : (
                          <span className="sem-premio">Nenhum</span>
                        )}
                      </td>
                      <td>
                        <button
                          disabled={item.brindesDisponiveis === 0}
                          onClick={() => handleRetirarBrinde(item.nome)}
                          className="btn-entregar"
                        >
                          Entregar Brinde
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

      <footer className="secao-historico">
        <div className="historico-header-acoes">
          <h2>Histórico de Movimentações</h2>
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
                <th>Evento</th>
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
                    {pesquisa ? 'Nenhum resultado encontrado.' : 'Nenhuma movimentação registrada.'}
                  </td>
                </tr>
              ) : (
                historicoFiltrado.map(mov => {
                  const ehRetirada = mov.retirou === 'SIM' || (Number(mov.valor_compra) === 0);
                  return (
                    <tr key={mov.id} className={ehRetirada ? 'linha-retirada' : ''}>
                      <td>{mov.data ? mov.data.split('-').reverse().join('/') : ''}</td>
                      <td>{mov.cliente}</td>
                      <td>
                        {!ehRetirada ? (
                          <span style={{ color: '#2563eb', fontWeight: 500 }}>🛒 Compra</span>
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>🎁 Brinde Entregue</span>
                        )}
                      </td>
                      <td>
                        {!ehRetirada ? (
                          `R$ ${Number(mov.valor_compra || 0).toFixed(2)}`
                        ) : (
                          <strong style={{ color: '#16a34a' }}>Brinde Entregue</strong>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </footer>
    </div>
  );
}