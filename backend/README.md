# 🏪 Salão de Beleza — Backend de Agendamento

**Universidade Federal do Ceará · Campus Quixadá · Engenharia de Software · 2026**

Backend REST API para o sistema de agendamento de salão de beleza, desenvolvido com **Node.js + Express + PostgreSQL**, implementando todos os requisitos do Documento de Requisitos V3.

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
│   │   ├── authController.js         # Login, logout, perfil (EP-004)
│   │   ├── serviceController.js      # CRUD de serviços (EP-001)
│   │   ├── availabilityController.js # Horários de funcionamento (EP-002)
│   │   ├── appointmentController.js  # Agendamentos (EP-003, EP-005)
│   │   └── reportController.js       # Relatórios e indicadores (EP-006)
│   ├── middlewares/
│   │   ├── authenticate.js           # Verificação JWT + blacklist
│   │   ├── authorize.js              # Controle de papel (RBAC)
│   │   └── errorHandler.js           # Handler centralizado de erros
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── availabilityRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── reportRoutes.js
│   │   └── publicRoutes.js           # Rotas abertas (sem auth) para clientes
│   ├── services/
│   │   ├── emailService.js           # Envio assíncrono de e-mails (RNF-010)
│   │   └── availabilityService.js    # Cálculo de slots disponíveis
│   └── validations/
│       ├── authValidation.js
│       ├── serviceValidation.js
│       ├── availabilityValidation.js
│       └── appointmentValidation.js
├── database/
│   ├── schema.sql                    # DDL completo do banco
│   └── seed.js                       # Dados iniciais (admin + exemplos)
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

Variáveis obrigatórias:

| Variável        | Descrição                                |
|-----------------|------------------------------------------|
| `DATABASE_URL`  | URL de conexão PostgreSQL                |
| `JWT_SECRET`    | Chave secreta para assinar tokens JWT    |
| `SMTP_HOST`     | Servidor SMTP para envio de e-mails      |
| `SMTP_PORT`     | Porta SMTP (ex: 587)                     |
| `SMTP_USER`     | Usuário SMTP                             |
| `SMTP_PASS`     | Senha SMTP                               |
| `EMAIL_FROM`    | Endereço remetente dos e-mails           |
| `SALON_NAME`    | Nome do salão (aparece nos e-mails)      |

### 3. Criar banco de dados e aplicar schema

```bash
# Crie o banco no PostgreSQL (se ainda não existir)
psql -U postgres -c "CREATE DATABASE salon_agendamento;"

# Aplique o schema + dados iniciais
npm run db:seed
```

O seed cria:
- **Admin padrão**: `admin@salao.com` / `Admin@123`
- Serviços de exemplo (Corte Feminino, Masculino, Coloração, Escova, Manicure)
- Horários de funcionamento Seg–Sex 9h–18h, Sáb 9h–13h

### 4. Iniciar o servidor

```bash
# Produção
npm start

# Desenvolvimento (com hot reload)
npm run dev
```

Acesse: `http://localhost:3000/health`

---

## 📡 API — Referência de Endpoints

Todas as respostas seguem o padrão:
```json
{ "success": true, "data": {...}, "message": "..." }
{ "success": false, "error": "Mensagem de erro." }
```

---

### 🔐 Autenticação (EP-004)

#### `POST /api/auth/login` — HU-009
```json
// Body
{ "email": "admin@salao.com", "password": "Admin@123" }

// Resposta 200
{
  "success": true,
  "data": {
    "token": "<JWT>",
    "admin": { "id": 1, "name": "Administrador", "email": "admin@salao.com" }
  }
}
```

#### `POST /api/auth/logout` — HU-010
- Header: `Authorization: Bearer <token>`
- Invalida o token via blacklist.

#### `GET /api/auth/me` — HU-012
- Retorna dados do admin autenticado.

#### `PUT /api/auth/me` — HU-012
```json
{ "name": "Novo Nome", "email": "novo@email.com", "phone": "(85) 99999-9999" }
```

#### `PUT /api/auth/me/password` — HU-012
```json
{ "currentPassword": "Admin@123", "newPassword": "NovaSenha1!", "confirmNewPassword": "NovaSenha1!" }
```

---

### 🛠️ Serviços — Admin (EP-001)

> Todos requerem `Authorization: Bearer <token>`

| Método | Rota | Descrição | HU |
|--------|------|-----------|-----|
| `GET`  | `/api/admin/services` | Listar todos (ativos + inativos) | HU-002 |
| `GET`  | `/api/admin/services/:id` | Detalhe | — |
| `POST` | `/api/admin/services` | Cadastrar | HU-001 |
| `PUT`  | `/api/admin/services/:id` | Editar | HU-003 |
| `PATCH`| `/api/admin/services/:id/toggle-status` | Ativar/Desativar | HU-004 |

**Body POST/PUT:**
```json
{ "name": "Corte Feminino", "duration_minutes": 60, "price": 80.00 }
```

**Query params GET lista:**
- `status=active|inactive` — filtra por status
- `sort=asc|desc` — ordena por nome

---

### ⏰ Disponibilidade — Admin (EP-002)

| Método   | Rota | Descrição | HU |
|----------|------|-----------|-----|
| `GET`    | `/api/admin/availability` | Listar horários | — |
| `POST`   | `/api/admin/availability` | Cadastrar horário | HU-005 |
| `DELETE` | `/api/admin/availability/:id` | Remover horário | — |
| `GET`    | `/api/admin/availability/slots?date=&service_id=` | Ver slots disponíveis | — |

**Body POST (dia da semana):**
```json
{
  "type": "day_of_week",
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "18:00"
}
```
`day_of_week`: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb

**Body POST (data específica):**
```json
{
  "type": "specific_date",
  "specific_date": "2026-12-31",
  "start_time": "09:00",
  "end_time": "13:00"
}
```

---

### 📅 Agendamentos — Admin (EP-003, EP-005)

| Método  | Rota | Descrição | HU |
|---------|------|-----------|-----|
| `GET`   | `/api/admin/appointments` | Listar agendamentos | HU-013 |
| `GET`   | `/api/admin/appointments/:id` | Detalhe | HU-014 |
| `POST`  | `/api/admin/appointments` | Agendamento administrativo | HU-008 |
| `PATCH` | `/api/admin/appointments/:id/cancel` | Cancelar | HU-015 |

**Query params GET lista:**
- `date=YYYY-MM-DD` — filtra por data específica
- `date_start=YYYY-MM-DD&date_end=YYYY-MM-DD` — filtra por intervalo
- `service_id=N` — filtra por serviço
- `status=confirmed|cancelled`
- `sort=asc|desc`
- `page=1&limit=50`

**Body POST (admin — e-mail opcional):**
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

---

### 📊 Relatórios — Admin (EP-006)

#### `GET /api/admin/reports/appointments` — HU-016
```
?date_start=2026-01-01&date_end=2026-12-31&service_id=1 (opcional)
```
Retorna: total de agendamentos, receita estimada, lista detalhada.

#### `GET /api/admin/reports/services` — HU-017
```
?date_start=2026-01-01&date_end=2026-12-31
```
Retorna: ranking de serviços mais solicitados em ordem decrescente.

---

### 🌐 Rotas Públicas — Cliente (sem autenticação)

| Método | Rota | Descrição | HU |
|--------|------|-----------|-----|
| `GET`  | `/api/public/services` | Serviços ativos | HU-006 |
| `GET`  | `/api/public/availability?date=&service_id=` | Slots disponíveis | HU-006 |
| `POST` | `/api/public/appointments` | Realizar agendamento | HU-006 |

**Body POST cliente (e-mail obrigatório):**
```json
{
  "service_id": 1,
  "appointment_date": "2026-05-10",
  "appointment_time": "09:00",
  "client_name": "Maria Silva",
  "client_email": "maria@email.com",
  "client_phone": "(85) 99999-0000"
}
```

---

## 📋 Rastreabilidade Requisitos × Implementação

| Código | Requisito | Onde implementado |
|--------|-----------|-------------------|
| RN-001 | Catálogo de Serviços | `serviceController.js` + `serviceValidation.js` |
| RN-002 | Exclusividade de Atendimento | `availabilityService.js::hasConflict()` + transação |
| RN-003 | Horário de Funcionamento | `availabilityService.js::fitsInBusinessHours()` |
| RN-004 | Oferta Vigente (apenas ativos) | `serviceController.js::listActiveServices()` |
| RN-005 | Identificação Obrigatória | `appointmentValidation.js` (client vs admin schema) |
| RN-006 | Formalização + E-mail | `emailService.js` |
| RN-007 | Pagamento Pós-Serviço | Sem coleta de pagamento na API |
| RN-008 | Segregação de Papéis | `authenticate.js` + `authorize.js` |
| RNF-001 | Tempo de Resposta | Pool de conexões + índices no banco |
| RNF-002 | Consistência de Dados | Transações ACID + retorno imediato |
| RNF-007 | Segurança | `helmet` + HTTPS + JWT + bcrypt (12 rounds) |
| RNF-009 | Integridade Transacional | `FOR UPDATE` lock + transação em `appointmentController.js` |
| RNF-010 | Processamento Assíncrono | `setImmediate()` em `emailService.js` |

---

## 🔒 Segurança

- **Senhas**: hash `bcrypt` com 12 rounds
- **JWT**: assinado com `JWT_SECRET`; JTI registrado em blacklist no logout
- **Permissões**: middleware `authorize('admin')` em todas as rotas administrativas
- **Helmet**: headers HTTP de segurança
- **SQL Injection**: queries parametrizadas com `pg` (sem concatenação)
- **HTTPS**: configure via proxy reverso (Nginx/Caddy) em produção

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
