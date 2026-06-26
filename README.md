# 🐾 AF Sistemas - Registro de Vendas e Controle de Clientes

Este é um sistema interno desenvolvido em **React** para a **Artes & Focinhos**, projetado para gerenciar e automatizar o fluxo de vendas de artigos pet e itens de casa/artesanato, além de centralizar o histórico completo de evolução e medidas dos clientes.

---

## 🚀 Funcionalidades Principais

* **Registro Automatizado de Vendas:** Lançamento rápido de itens vendidos com cálculo automático de valores totais, custos e margem de lucro em tempo real.
* **Abatimento Dinâmico de Estoque:** Integração inteligente que varre múltiplos catálogos de produtos (`Inverno`, `Verão`, `Meia Estação`, `Artesanato` e `Encomendas`) para carregar variações e valores de venda.
* **Histórico de Clientes Inteligente:** Uma tela exclusiva de consulta que unifica todas as compras realizadas por um tutor, vinculando automaticamente as especificações do pet (como medidas de pescoço, tórax e comprimento) atreladas ao produto no momento do estoque.
* **Persistência Local:** Utilização do `localStorage` do navegador para manter todos os dados salvos com segurança, sem necessidade de configurações complexas de banco de dados externo.
* **Interface Limpa e Responsiva:** Design corporativo elegante em tons de azul-marinho (`#163357`), totalmente focado em produtividade e clareza de dados, evitando poluição visual.

---

## 🛠️ Tecnologias Utilizadas

* **React.js** (Componentização estruturada e Hooks como `useState` e `useEffect`)
* **JavaScript (ES6+)** (Lógica de filtragem, mapeamento de arrays e manipulação de dados)
* **CSS3** (Layout baseado em CSS Grid de alta precisão para emulação de tabelas nativas robustas)
* **Lucide React** (Pacote de ícones minimalistas e modernos)

---

## 📂 Estrutura das Páginas Desenvolvidas

### 1. Módulo de Vendas (`Vendas.jsx` / `Vendas.css`)
Formulário estilo painel que coleta dados do cliente, quantidade e se integra aos estoques ativos. Ao clicar em `+ Lançar Linha`, alimenta a grade inferior exibindo faturamento do dia, custos operacionais e lucros líquidos de forma transparente.

### 2. Módulo de Clientes (`Clientes.jsx` / `Clientes.css`)
Uma tela de auditoria e ficha de evolução limpa. Ela consome os dados gerados pelo módulo de vendas e efetua buscas em segundo plano nos arquivos JSON de estoque para resgatar e exibir na mesma linha as medidas anatômicas do pet atendido, contando ainda com filtro de pesquisa dinâmica por nome.

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### Passos para Execução
1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/af-sistemas.git](https://github.com/seu-usuario/af-sistemas.git)