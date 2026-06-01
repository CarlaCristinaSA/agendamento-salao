# 🏪 Salão de Beleza — Backend de Agendamento

**Universidade Federal do Ceará · Campus Quixadá · Engenharia de Software · 2026**

Backend REST API para o sistema de agendamento de salão de beleza, desenvolvido com **Node.js + Express + PostgreSQL**, implementando os requisitos do **Documento de Requisitos V4 (v2.3)**.

> ### ⚠️ Mudança estrutural em relação à V3
> Na V4 o **Cliente (AT-002) passa a ser um usuário autenticado** com conta própria, deixando de operar por rotas públicas anônimas. As principais consequências no backend:
> - A tabela `admins` foi substituída por uma tabela **`users` unificada**, que diferencia Administrador e Cliente pela coluna `role` (`admin` / `client`). Isso garante login unificado (HU-009) e e-mail único entre todos os perfis (HU-013).
> - As antigas rotas `/api/public/*` foram **removidas**. O fluxo do cliente agora vive sob `/api/client/*` e exige JWT com papel `client`.
> - `appointments` ganhou a coluna `client_id` (FK para `users`, nula em agendamentos administrativos de clientes presenciais — HU-008).
>
> **Por ser uma alteração de schema (breaking change), bancos criados na V3 precisam recriar o schema e rodar o seed novamente** (veja a seção de instalação).

---

## 🗂️ Estrutura do Projeto

```
salon-backend/
├── src/
│   ├── app.js                        # Entry point — configura e sobe o servidor
│   ├── config/
│   │   ├── database.js               # Pool de conexões PostgreSQL
│   │   └── email.js                  # Transporter Nodemailer (SMTP)
│   ├── controllers/
│   │   ├── authController.js         # Login, logout, cadastro de cliente, perfil (EP-004)
│   │   ├── serviceController.js      # CRUD de serviços (EP-001)
│   │   ├── availabilityController.js # Horários de funcionamento e slots (EP-002)
│   │   ├── appointmentController.js  # Agendamentos cliente + admin (EP-003, EP-005)
│   │   └── reportController.js       # Relatórios e indicadores (EP-006)
│   ├── middlewares/
│   │   ├── authenticate.js           # Verificação JWT + blacklist (papel vem do banco)
│   │   ├── authorize.js              # Controle de papel (RBAC: admin / client)
│   │   └── errorHandler.js           # Handler centralizado de erros
│   ├── routes/
│   │   ├── authRoutes.js             # /api/auth — login, register, recuperação, logout, conta
│   │   ├── clientRoutes.js           # /api/client — área do cliente autenticado
│   │   ├── serviceRoutes.js          # /api/admin/services
│   │   ├── availabilityRoutes.js     # /api/admin/availability
│   │   ├── appointmentRoutes.js      # /api/admin/appointments
│   │   └── reportRoutes.js           # /api/admin/reports
│   ├── services/
│   │   ├── emailService.js           # Envio assíncrono de e-mails (RNF-010)
│   │   └── availabilityService.js    # Cálculo de slots + regra RN-009
│   └── validations/
│       ├── authValidation.js
│       ├── serviceValidation.js
│       ├── availabilityValidation.js
│       └── appointmentValidation.js
├── database/
│   ├── schema.sql                    # DDL completo (users, password_reset_codes, etc.)
│   └── seed.js                       # Dados iniciais (admin + cliente de exemplo)
├── .env.example                      # Modelo de variáveis de ambiente
├── package.json
└── README.md
```

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js ≥ 18
- PostgreSQL ≥ 14
- NPM

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

| Variável                   | Obrigatória | Descrição                                                        |
|----------------------------|:-----------:|------------------------------------------------------------------|
| `DATABASE_URL`             |     sim     | URL de conexão PostgreSQL                                        |
| `JWT_SECRET`               |     sim     | Chave secreta para assinar tokens JWT                            |
| `JWT_EXPIRES_IN`           |     não     | Validade do token (default `8h`)                                 |
| `SMTP_HOST` / `SMTP_PORT`  |     sim     | Servidor SMTP para envio de e-mails                              |
| `SMTP_USER` / `SMTP_PASS`  |     sim     | Credenciais SMTP                                                 |
| `EMAIL_FROM`               |     sim     | Endereço remetente padrão (ex: `nao-responda@salao.com`)         |
| `SALON_NAME`               |     não     | Nome do salão (usado no assunto/corpo dos e-mails)               |
| `SALON_TIMEZONE`           |     não     | Fuso para histórico e regra das 24h (default `America/Fortaleza`)|
| `ADMIN_NOTIFICATION_EMAIL` |     não     | Destino do aviso quando o cliente cancela (HU-007). Se ausente, usa todos os `users` com papel `admin` |
| `PASSWORD_RESET_CODE_TTL_MINUTES` | não | Validade do código de recuperação de senha (default `15`) |
| `PASSWORD_RESET_MAX_ATTEMPTS`     | não | Tentativas máximas de código antes de invalidá-lo (default `5`) |

### 3. Criar banco de dados e aplicar schema

```bash
# Crie o banco no PostgreSQL (se ainda não existir)
psql -U postgres -c "CREATE DATABASE salon_agendamento;"

# Aplique o schema + dados iniciais
npm run db:seed
```

> Para apenas (re)aplicar o schema sem semear dados: `npm run db:schema`.

O seed cria:
- **Admin padrão**: `admin@salao.com` / `Admin@123` (role `admin`)
- **Cliente de exemplo**: `cliente@exemplo.com` / `Cliente@123` (role `client`)
- Serviços de exemplo (Corte Feminino, Masculino, Coloração, Escova, Manicure)
- Horários de funcionamento Seg–Sex 9h–18h, Sáb 9h–13h

### 4. Iniciar o servidor

```bash
npm start      # Produção
npm run dev    # Desenvolvimento (hot reload)
```

Acesse: `http://localhost:3000/health`

---

## 📡 API — Referência de Endpoints

Todas as respostas seguem o padrão:
```json
{ "success": true, "data": {...}, "message": "..." }
{ "success": false, "error": "Mensagem de erro." }
```

Mapa de acesso por área:

| Prefixo            | Acesso                                  |
|--------------------|-----------------------------------------|
| `/api/auth`        | Público (login/register/recuperação) + autenticado |
| `/api/client/*`    | Autenticado, papel **client**           |
| `/api/admin/*`     | Autenticado, papel **admin**            |

---

### 🔐 Autenticação e Conta (EP-004)

#### `POST /api/auth/login` — HU-009 (login unificado admin/cliente)
```json
// Body
{ "email": "admin@salao.com", "password": "Admin@123" }

// Resposta 200 — mensagem de erro é genérica ("E-mail ou senha incorretos")
{
  "success": true,
  "data": {
    "token": "<JWT>",
    "redirect_to": "/admin/dashboard",   // ou "/agendamento" para cliente
    "user": { "id": 1, "name": "Administrador", "email": "admin@salao.com", "role": "admin" }
  }
}
```

#### `POST /api/auth/register` — HU-013 (cadastro de conta de cliente, público)
```json
{
  "name": "Maria Silva",
  "email": "maria@email.com",
  "phone": "(85) 99999-0000",
  "password": "secreta",
  "confirmPassword": "secreta"
}
```
- Senha mínima de 6 caracteres; `confirmPassword` deve ser idêntico.
- E-mail validado como único entre **todos** os usuários ativos (cliente ou admin).
- Conta criada sempre com papel `client`.

#### `POST /api/auth/forgot-password` — recuperação de senha (público)
Inicia o fluxo "Esqueci minha senha" (HU-009/HU-011). Gera um código numérico de 6 dígitos, armazena seu hash com expiração e o envia ao e-mail do usuário.
```json
{ "email": "maria@email.com" }
```
- Resposta **sempre** 200 com mensagem genérica, exista ou não a conta, para não revelar quais e-mails estão cadastrados (proteção contra enumeração de usuários).
- O código expira em `PASSWORD_RESET_CODE_TTL_MINUTES` minutos (padrão 15) e uma nova solicitação invalida o código anterior.

#### `POST /api/auth/reset-password` — redefinir senha com o código (público)
Valida o código recebido por e-mail e define a nova senha.
```json
{
  "email": "maria@email.com",
  "code": "123456",
  "newPassword": "NovaSenha1!",
  "confirmNewPassword": "NovaSenha1!"
}
```
- `code`: exatamente 6 dígitos.
- A nova senha segue as mesmas regras fortes da HU-012 (mínimo 8 caracteres com maiúscula, minúscula, número e caractere especial).
- O código é de **uso único** e fica indisponível após o sucesso. Códigos inválidos/expirados retornam 422 com mensagem genérica; após `PASSWORD_RESET_MAX_ATTEMPTS` tentativas erradas (padrão 5) o código é invalidado.

#### `POST /api/auth/logout` — HU-010
- Header `Authorization: Bearer <token>`; invalida o token via blacklist (JTI).

#### `GET /api/auth/me` — HU-012
- Retorna os dados do usuário autenticado (admin ou cliente).

#### `PUT /api/auth/me` — HU-012
```json
{ "name": "Novo Nome", "phone": "(85) 99999-9999", "email": "novo@email.com" }
```

#### `PUT /api/auth/me/password` — HU-012
```json
{ "currentPassword": "Admin@123", "newPassword": "NovaSenha1!", "confirmNewPassword": "NovaSenha1!" }
```
- Nova senha: mínimo 8 caracteres com maiúscula, minúscula, número e caractere especial; deve diferir da atual.

---

### 🙍 Área do Cliente (EP-003 / EP-005) — `papel client`

> Todas exigem `Authorization: Bearer <token>` de um usuário com papel `client`.

| Método  | Rota | Descrição | HU |
|---------|------|-----------|-----|
| `GET`   | `/api/client/services` | Lista apenas serviços ativos (RN-004) | HU-006 |
| `GET`   | `/api/client/availability?date=&service_id=` | Slots disponíveis (RN-002/003/009) | HU-006 |
| `POST`  | `/api/client/appointments` | Realizar agendamento próprio | HU-006 |
| `GET`   | `/api/client/appointments` | Histórico pessoal (em breve / histórico) | HU-017 |
| `PATCH` | `/api/client/appointments/:id/cancel` | Cancelar agendamento próprio (RN-010) | HU-018 |

**Body POST (cliente autenticado — HU-006):**
```json
{
  "service_id": 1,
  "appointment_date": "2026-05-10",
  "appointment_time": "09:00"
}
```
- Nome, e-mail e telefone são recuperados automaticamente do usuário logado (RN-005).
- Para o fluxo "Alterar Dados", os campos podem ser enviados e sobrescrevem os do perfil apenas naquela reserva:
```json
{
  "service_id": 1, "appointment_date": "2026-05-10", "appointment_time": "09:00",
  "client_name": "Maria S.", "client_email": "outro@email.com", "client_phone": "(85) 98888-0000"
}
```

**Histórico (HU-017):** a resposta separa `upcoming` (futuros) de `history` (passados) e deriva o `display_status` em tempo de execução (`Cancelado`, `Pendente` para futuros confirmados, `Concluído` para passados). Cada item futuro confirmado traz `can_cancel` conforme a regra das 24h.

**Cancelamento pelo cliente (HU-018 / RN-010):** se faltarem **menos de 24h** para o início, a ação é bloqueada com HTTP 422 e a mensagem exata:
> *"Cancelamentos com menos de 24h de antecedência devem ser feitos exclusivamente por telefone/WhatsApp do salão."*
>
> Em um cancelamento bem-sucedido, o horário é liberado e são enviados e-mails ao cliente **e** ao administrador.

---

### 🛠️ Serviços — Admin (EP-001) — `papel admin`

| Método  | Rota | Descrição | HU |
|---------|------|-----------|-----|
| `GET`   | `/api/admin/services` | Listar todos (ativos + inativos) | HU-002 |
| `GET`   | `/api/admin/services/:id` | Detalhe | — |
| `POST`  | `/api/admin/services` | Cadastrar | HU-001 |
| `PUT`   | `/api/admin/services/:id` | Editar | HU-003 |
| `PATCH` | `/api/admin/services/:id/toggle-status` | Ativar/Desativar | HU-004 |

**Body POST/PUT:**
```json
{ "name": "Corte Feminino", "duration_minutes": 60, "price": 80.00 }
```
**Query (GET lista):** `status=active|inactive`, `sort=asc|desc`.

---

### ⏰ Disponibilidade — Admin (EP-002) — `papel admin`

| Método   | Rota | Descrição | HU |
|----------|------|-----------|-----|
| `GET`    | `/api/admin/availability` | Listar horários | — |
| `POST`   | `/api/admin/availability` | Cadastrar horário | HU-005 |
| `DELETE` | `/api/admin/availability/:id` | Remover horário | — |
| `GET`    | `/api/admin/availability/slots?date=&service_id=` | Ver slots disponíveis | — |

**Body POST (dia da semana):**
```json
{ "type": "day_of_week", "day_of_week": 1, "start_time": "09:00", "end_time": "18:00" }
```
`day_of_week`: 0=Dom … 6=Sáb. Datas específicas têm prioridade sobre o dia da semana.

**Body POST (data específica):**
```json
{ "type": "specific_date", "specific_date": "2026-12-31", "start_time": "09:00", "end_time": "13:00" }
```

---

### 📅 Agendamentos — Admin (EP-005) — `papel admin`

| Método  | Rota | Descrição | HU |
|---------|------|-----------|-----|
| `GET`   | `/api/admin/appointments` | Listar agendamentos | HU-014 |
| `GET`   | `/api/admin/appointments/:id` | Detalhe | HU-015 |
| `POST`  | `/api/admin/appointments` | Agendamento administrativo | HU-008 |
| `PATCH` | `/api/admin/appointments/:id/cancel` | Cancelar (notifica o cliente) | HU-016 |

**Query (GET lista):** `date=YYYY-MM-DD`, `date_start`/`date_end`, `service_id`, `status=confirmed|cancelled`, `sort=asc|desc`, `page`/`limit`.

**Body POST (admin — e-mail OPCIONAL, HU-008):**
```json
{
  "service_id": 1,
  "appointment_date": "2026-05-10",
  "appointment_time": "09:00",
  "client_name": "Maria Silva",
  "client_phone": "(85) 99999-0000",
  "client_email": "maria@email.com"
}
```
Agendamentos administrativos são gravados com `client_id = NULL` (cliente presencial/telefone).

---

### 📊 Relatórios — Admin (EP-006) — `papel admin`

#### `GET /api/admin/reports/appointments` — HU-019
```
?date_start=2026-01-01&date_end=2026-12-31&service_id=1 (opcional)
```
Retorna total de agendamentos, receita estimada e lista detalhada.

#### `GET /api/admin/reports/services` — HU-020
```
?date_start=2026-01-01&date_end=2026-12-31
```
Retorna o ranking de serviços mais solicitados em ordem decrescente.

---

## 📋 Rastreabilidade Requisitos × Implementação (V4)

| Código | Requisito | Onde implementado |
|--------|-----------|-------------------|
| RN-001 | Catálogo de Serviços | `serviceController.js` + `serviceValidation.js` |
| RN-002 | Exclusividade de Atendimento | `availabilityService.js::hasConflict()` + transação |
| RN-003 | Horário de Funcionamento | `availabilityService.js::fitsInBusinessHours()` |
| RN-004 | Oferta Vigente (apenas ativos) | `serviceController.js::listActiveServices()` |
| RN-005 | Identificação Obrigatória | `appointmentController.js` (dados do user logado) + schemas |
| RN-006 | Formalização + E-mail | `emailService.js` (confirmação e cancelamento) |
| RN-007 | Pagamento Pós-Serviço | Sem coleta de pagamento na API |
| RN-008 | Segregação de Papéis | `authenticate.js` (papel do banco) + `authorize.js` |
| RN-009 | Otimização de Encaixe | `availabilityService.js::buildGridStartTimes()` |
| RN-010 | Prazo de 24h p/ cancelamento | `appointmentController.js::cancelMyAppointment()` |
| HU-009 | Login unificado | `authController.js::login()` + tabela `users` |
| HU-009/HU-011 | Recuperação de senha (código por e-mail) | `authController.js::requestPasswordReset()` / `resetPassword()` + tabela `password_reset_codes` |
| HU-013 | Cadastro de Cliente | `authController.js::registerClient()` |
| HU-017 | Histórico Pessoal | `appointmentController.js::listMyAppointments()` |
| HU-018 | Cancelamento (Cliente) | `appointmentController.js::cancelMyAppointment()` |
| RNF-001 | Tempo de Resposta | Pool de conexões + índices no banco |
| RNF-002 | Consistência de Dados | Transações ACID + retorno imediato |
| RNF-007 | Segurança | `helmet` + HTTPS + JWT + bcrypt (12 rounds) |
| RNF-009 | Integridade Transacional | Advisory lock por data (`pg_advisory_xact_lock`) + transação |
| RNF-010 | Processamento Assíncrono | `setImmediate()` em `emailService.js` |

---

## 🔒 Segurança

- **Senhas**: hash `bcrypt` com 12 rounds
- **JWT**: assinado com `JWT_SECRET`; papel (`role`) sempre revalidado no banco; JTI em blacklist no logout
- **Permissões**: `authorize('admin')` nas rotas administrativas e `authorize('client')` na área do cliente
- **Helmet**: headers HTTP de segurança
- **SQL Injection**: queries parametrizadas com `pg` (sem concatenação)
- **HTTPS**: configure via proxy reverso (Nginx/Caddy) em produção

---

## ⚙️ Notas de Implementação

- **RN-009 (encaixe nos extremos):** quando a duração do serviço equivale a exatamente metade de um turno contínuo, apenas os horários nos extremos são ofertados. Ex.: turno 08h–12h + serviço de 2h ⇒ apenas 08:00 e 10:00. A regra é avaliada por turno individual.
- **RNF-009 (corrida):** o controle de concorrência usa `pg_advisory_xact_lock` por data dentro da transação, cobrindo inclusive datas ainda sem agendamentos (cenário que um `FOR UPDATE` não protegeria).
- **Fuso horário:** a classificação passado/futuro do histórico e a regra das 24h usam `SALON_TIMEZONE` (default `America/Fortaleza`).
- **Recuperação de senha:** o código de 6 dígitos é gerado com gerador criptográfico e gravado **apenas como hash** (`bcrypt`) na tabela `password_reset_codes`, com expiração, contador de tentativas e uso único. A solicitação não revela se o e-mail existe (proteção contra enumeração) e reemitir invalida o código anterior.

---

## 📦 Dependências Principais

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `express` | ^4.19 | Framework web |
| `pg` | ^8.11 | Driver PostgreSQL |
| `bcryptjs` | ^2.4 | Hash de senhas |
| `jsonwebtoken` | ^9.0 | Autenticação JWT |
| `nodemailer` | ^6.9 | Envio de e-mails |
| `joi` | ^17.13 | Validação de entrada |
| `helmet` | ^7.1 | Headers de segurança |
| `cors` | ^2.8 | CORS |
| `dotenv` | ^16.4 | Variáveis de ambiente |
| `express-async-errors` | ^3.1 | Captura erros assíncronos |
