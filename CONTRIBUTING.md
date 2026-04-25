# Guia de Contribuição - Projeto Integrado II

Este documento estabelece as normas obrigatórias para o desenvolvimento do sistema de agendamento de salão. O cumprimento destas regras é essencial para manter a organização das sprints e a qualidade das entregas.

## 1. Padronização de Mensagens (Conventional Commits)

Adotamos o padrão de commits técnicos para facilitar o rastreio de mudanças. Os commits devem ser frequentes e nunca acumular alterações de arquivos diferentes em uma única mensagem.

**Estrutura:** `tipo(escopo): descrição curta`

* **feat:** Implementação de uma nova funcionalidade.
* **fix:** Correção de um erro ou bug técnico.
* **refactor:** Melhoria na estrutura do código sem alterar sua função.
* **chore:** Atualização de dependências, configurações ou ferramentas de build.
* **docs:** Alterações exclusivas em documentações (README, CONTRIBUTING).

**Exemplo de commit ideal:** `feat(database): configurar tabelas de agendamento no postgresql`

---

## 2. Fluxo de Branches e Segurança

* **Proibição de Push Force:** É terminantemente proibido o uso de `git push --force`. Esta ação apaga o histórico do servidor e compromete o trabalho dos colegas. Resolva conflitos localmente usando `git merge` ou `git pull`.
* **Isolamento de Tarefas:** Nunca trabalhe diretamente nas branches `main` ou `develop`. Crie uma ramificação específica para sua tarefa a partir da `develop`:  
  `git checkout -b feature/nome-da-tarefa`

---

## 3. Uso Obrigatório de Templates

O repositório possui três modelos automatizados para garantir que nenhuma informação essencial seja esquecida.

### Pull Request (PR)
Ao abrir um PR para a branch `develop`, o GitHub carregará automaticamente um formulário. Ele será a base para a revisão.
* **O que preencher:** Descrição técnica da mudança, checklist de qualidade e critérios de aceitação.
* **Como aparece:** Aparece automaticamente na área de descrição assim que o PR é iniciado.

### Relato de Erro (Bug Report)
Destinado ao registro de falhas encontradas pelo Kawan (QA) ou outros membros.
* **Como aparece:** Ao clicar em **New Issue**, selecione "Relato de Erro". O formulário pedirá passos para reproduzir o erro e o comportamento esperado.

### Nova Funcionalidade / HU (Feature Request)
Destinado a sugestões de melhorias ou novas demandas.
* **Como aparece:** Ao clicar em **New Issue**, selecione "Nova Funcionalidade / HU". Deve-se informar o ID da HU no ClickUp ou marcar como "Nova Proposta".

---

## 4. Definição de Pronto (DoD)

Uma tarefa só é considerada concluída se atender aos seguintes requisitos técnicos:

* **Responsividade:** No front-end, a interface deve funcionar corretamente em telas móveis e desktop.
* **Limpeza de Código:** Remoção de logs de teste, comentários desnecessários e código morto.
* **Validação:** O back-end deve ter suas rotas testadas manualmente antes do envio.
* **Documentação:** Se a mudança alterar o modo como o sistema funciona, o README deve ser atualizado.

---

## Comandos Rápidos

### 1. Fluxo de Trabalho Diário
Estes comandos serão utilizados em cada nova tarefa iniciada.

* **Atualizar repositório local:** `git pull origin develop`
* **Criar branch de funcionalidade:** `git checkout -b feature/nome-da-tarefa`
* **Preparar arquivos:** `git add .`
* **Registrar alterações (Conventional Commits):** `git commit -m "tipo(escopo): descrição"`
* **Enviar para o GitHub:** `git push origin nome-da-branch`

### 2. Gestão de Branches e Sincronização
* **Voltar para a develop:** `git checkout develop`
* **Alternar para branch existente:** `git checkout nome-da-branch`
* **Sincronizar develop na sua branch:** `git merge develop`
* **Atualizar lista de ramos remotos:** `git fetch origin`

### 3. Verificação de Estado
* **Verificar modificações:** `git status`
* **Ver histórico simplificado:** `git log --oneline`
* **Ver detalhes das alterações:** `git diff`

### 4. Correção de Problemas e Limpeza
* **Descartar mudanças em um arquivo:** `git checkout -- nome-do-arquivo`
* **Desfazer último commit (mantendo arquivos):** `git reset --soft HEAD~1`
* **Guardar alterações temporariamente:** `git stash`
* **Recuperar alterações do stash:** `git stash pop`

---

### Lembretes Importantes para a Equipe:

1. **Frequência:** Commits pequenos e frequentes facilitam a revisão do Rafael e evitam grandes conflitos de merge.
2. **Segurança:** Nunca utilize o parâmetro `--force` no push. Se o servidor recusar, use o `pull` ou `merge` para resolver os conflitos.
3. **Qualidade:** Antes de cada push, execute o projeto localmente para garantir que não quebrou funcionalidades existentes.