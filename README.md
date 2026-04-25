# Sistema de Agendamento de Salão

## Visão Geral do Produto

O Sistema de Agendamento de Salão é uma plataforma web desenvolvida para otimizar a gestão de horários e serviços em estabelecimentos de beleza e barbearias. O objetivo principal é digitalizar o processo de marcação, reduzindo conflitos de agenda e proporcionando uma experiência fluida para clientes e administradores.

Este projeto é desenvolvido como requisito para a disciplina de Projeto Integrado II do curso de Engenharia de Software da Universidade Federal do Ceará (UFC) - Campus Quixadá.

## Funcionalidades Principais (Épicos do Sistema)

As funcionalidades estão estruturadas em seis grandes épicos, conforme o planejamento de requisitos:

* **Gestão de Serviços:** Manutenção do catálogo do salão, permitindo ao administrador cadastrar, listar, editar e alterar o status (ativar/desativar) dos serviços ofertados.
* **Gestão de Disponibilidade:** Definição e controle dos horários de funcionamento do salão, organizando os períodos válidos em que os clientes podem realizar os agendamentos.
* **Fluxo de Agendamento:** Processo de reserva onde o cliente seleciona o serviço, a data e o horário, recebendo confirmação automática por e-mail. Suporta agendamentos administrativos manuais para atendimentos presenciais.
* **Gestão de Agendamentos:** Painel administrativo para consulta de reservas, visualização de detalhes e cancelamentos para liberação de horários na agenda.
* **Autenticação e Controle de Acesso:** Gerenciamento de login, sessões e restrição de funcionalidades com base no perfil do usuário (Administrador ou Cliente).
* **Relatórios Gerenciais:** Geração de relatórios com filtros por período e análise de indicadores, como o ranking dos serviços mais solicitados.

## Equipe do Projeto

* **Carla Cristina Sousa Araújo:** Product Owner (PO)
* **Kaylanne de Jesus Sousa Sátiro:** UX Designer
* **Emily Wictoria Pinheiro:** Desenvolvedora Front-end
* **Bruno da Silva Lustosa Pinheiro:** Desenvolvedor Back-end
* **Rafael Sousa Cabral:** Desenvolvedor Full Stack e Revisor Técnico
* **Kawan Torres Lopes:** Quality Assurance (QA)

## Stack Tecnológica

O sistema utiliza uma arquitetura que separa a interface do cliente da lógica do servidor:

* **Front-end:** HTML5, CSS3 e JavaScript (Vanilla).
* **Back-end:** Node.js.
* **Banco de Dados:** PostgreSQL.

## Padrões de Qualidade e Contribuição

Para garantir a integridade do código e a organização das sprints, a equipe segue diretrizes rígidas de versionamento:

1. **Branching Model:** O desenvolvimento ocorre em branches isoladas a partir da `develop` (ex: `feature/HU-001-nome`).
2. **Pull Requests (PR):** A integração de código nas branches principais (`main` e `develop`) exige abertura de PR, preenchimento de checklist de qualidade e aprovação técnica.
3. **Conventional Commits:** O histórico do projeto utiliza mensagens padronizadas (ex: `feat:`, `fix:`, `chore:`).

Para mais detalhes sobre as regras de fluxo de trabalho, uso de templates e normas de conduta, consulte o nosso [Guia de Contribuição](CONTRIBUTING.md).

## Organização do Planejamento

O gerenciamento ágil e a documentação do projeto são realizados através das seguintes ferramentas:

* **Gestão de Tarefas e Sprints:** ClickUp.
* **Prototipagem de Interface:** Figma.
* **Documentação Geral:** Google Drive.

*(O acesso a estas ferramentas é restrito aos membros da equipe e avaliadores).*

## Como Executar o Projeto Localmente

### Pré-requisitos
* Node.js instalado.
* PostgreSQL configurado localmente.
* Git.
* Extensão Live Server (recomendado no VS Code para o front-end).

### Passos para Instalação e Execução

Siga as instruções abaixo para configurar e executar o projeto em ambiente local de forma organizada.

#### 1. Download do Projeto

Realize o clone do repositório e acesse o diretório principal:

```bash
git clone [https://github.com/CarlaCristinaSA/agendamento-salao.git](https://github.com/CarlaCristinaSA/agendamento-salao.git)
cd agendamento-salao
```

#### 2. Configuração do Back-end (Servidor)

O back-end é responsável pelo processamento das regras de negócio e integração com o banco de dados. Deve ser iniciado antes do front-end.

* **Acessar o diretório da API:**
  ```bash
  cd backend
  ```

* **Instalar as dependências:**
  ```bash
  npm install
  ```

* **Configurar variáveis de ambiente:**
  Crie um arquivo `.env` na raiz da pasta `backend` e defina as credenciais do banco de dados PostgreSQL local. Exemplo:

  ```env
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=seu_usuario
  DB_PASSWORD=sua_senha
  DB_NAME=nome_do_banco
  ```

* **Iniciar o servidor:**
  ```bash
  npm run dev
  ```
  Alternativamente: `npm start`

#### 3. Configuração do Front-end (Interface)

O front-end foi desenvolvido utilizando HTML, CSS e JavaScript puro, não sendo necessária a instalação de dependências adicionais.

* Abra a pasta `frontend` em um editor de código (ex.: VS Code).
* Localize o arquivo `index.html`.
* Execute o arquivo utilizando a extensão **Live Server**.

#### 4. Verificação

Após a execução:
* O servidor back-end deverá estar disponível localmente (ex.: `http://localhost:3000`).
* A interface será exibida automaticamente no navegador.

Com isso, o ambiente estará configurado e pronto para uso.