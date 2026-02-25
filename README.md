# Controle Financeiro

Aplicação full stack para gestão financeira mensal, com foco em clareza de dados, organização por categorias e acompanhamento de metas de economia.

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Principais funcionalidades](#principais-funcionalidades)
- [Stack e tecnologias](#stack-e-tecnologias)
- [Arquitetura do backend](#arquitetura-do-backend)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como executar o projeto](#como-executar-o-projeto)
- [Destaques técnicos](#destaques-técnicos)
- [Próximos passos](#próximos-passos)

## Sobre o projeto

O **Controle Financeiro** foi desenvolvido para centralizar o controle do mês em uma única aplicação: lançamentos, categorias, orçamento e meta de economia.

A ideia principal é oferecer uma experiência simples no frontend, com um backend robusto e organizado em camadas, aplicando boas práticas de arquitetura para facilitar manutenção e evolução.

## Principais funcionalidades

- Dashboard mensal com **receita**, **despesas**, **saldo** e leitura rápida de desempenho.
- CRUD de lançamentos (receitas e despesas) com filtros por tipo, categoria e busca textual.
- Gestão de categorias de receita e despesa.
- Cadastro de **renda mensal fixa** por competência (ano/mês).
- Controle de **orçamento por categoria** (planejado vs. realizado).
- Gestão de **meta de economia mensal**, com:
  - definição de valor alvo;
  - inclusão de entradas de valor guardado;
  - edição e exclusão dessas entradas.
- Resumo consolidado com despesas agrupadas por categoria.

## Stack e tecnologias

### Frontend

- **React 19** + **TypeScript**
- **Vite**
- **React Router DOM**
- **Bootstrap 5** + CSS customizado
- `fetch` com camada centralizada para consumo de API

### Backend

- **ASP.NET Core 8 (Web API)**
- **Entity Framework Core 8**
- **SQL Server**
- **Swagger / OpenAPI**
- **CORS** para integração com o frontend em desenvolvimento

## Arquitetura do backend

O backend segue uma organização em camadas para separar responsabilidades:

- **Domain**: entidades e regras de negócio (validações e invariantes).
- **Application**: casos de uso com handlers (estilo CQRS simplificado).
- **Infrastructure**: persistência com EF Core, mapeamentos, repositórios e migrations.
- **API**: controllers, configuração de DI, pipeline HTTP e exposição de endpoints.

Esse modelo melhora legibilidade, manutenção e escalabilidade do projeto.

## Estrutura do projeto

```text
ControleFinanceiro/
├─ BackEnd/
│  ├─ ControleFinanceiro.Api
│  ├─ ControleFinanceiro.Application
│  ├─ ControleFinanceiro.Domain
│  └─ ControleFinanceiro.Infrastructure
└─ FrontEnd/
   └─ controle-financeiro-web
```

## Como executar o projeto

### Pré-requisitos

- .NET 8 SDK
- Node.js (LTS recomendado)
- SQL Server local

### 1) Backend

```bash
cd BackEnd
 dotnet restore
 dotnet ef database update --project ControleFinanceiro.Infrastructure --startup-project ControleFinanceiro.Api
 dotnet run --project ControleFinanceiro.Api
```

API disponível em `http://localhost:5284` (Swagger em `/swagger`).

### 2) Frontend

```bash
cd FrontEnd/controle-financeiro-web
npm install
npm run dev
```

Frontend disponível em `http://localhost:5173` (porta padrão do Vite).

## Destaques técnicos

- Modelagem de domínio com regras explícitas de validação.
- Consultas consolidadas no backend para reduzir lógica acoplada no frontend.
- Fluxo mensal orientado por competência (`year`/`month`) em todas as telas.
- UI responsiva com foco em leitura rápida de indicadores financeiros.
- Projeto ideal para demonstrar competência **full stack** em portfólio.

## Próximos passos

- Adicionar autenticação e contas por usuário.
- Implementar testes automatizados (unitários e integração).
- Criar importação de extrato (CSV/OFX).
- Publicar frontend e backend em ambiente cloud.

---

Desenvolvido por **Gustavo Soares**  
LinkedIn: <https://www.linkedin.com/in/gustavoslv/>
