# Feature Specification: Correções de UI e Permissões

**Feature Branch**: `007-fix-ui-permissions`  
**Created**: 2026-05-07  
**Status**: Draft  
**Input**: User description: "vamos corrigir algumas coisas em relação ao usuario admin e usuario, que na tela de chat com o agente na aba de história em baixo de \"Conversas Anteriores\" as abas ficarão invisíveis para o usuário e usuário admin onde somente o conteúdo da abata tudo ficará a mostra, e ao clicar em \"gerenciar conversas\" fica disponível para marcar as conversas, porém ao selecionar as conversãs o usuário admin só terá a opção de excluir as conversas marcadas, o botão de gerar perguntas ficará invisível para ele, para o usuário o botão \"gerenciar conversas\" ficará invisível assim como as abas também, além disso uma correção visual para a conta de usuário admin no card do agente na tela de agentes, o botão \"chat\" deve preencher todo o espaço horizontal do card assim como já esta no card da conta de usuário, além disso a conta de usuário também deve ter acesso a tela de \"inbox de dúvidas\" pelo menu lateral"

## Clarifications

### Session 2026-05-07

- Q: O que deve acontecer quando o histórico de conversas estiver vazio? → A: O botão "gerenciar conversas" deve ficar visível porém desabilitado (disabled).
- Q: A segurança para "gerar perguntas" deve ser apenas no frontend ou também no backend? → A: Ocultar no frontend e adicionar bloqueio no backend (API).
- Q: Como formatar palavras entre asteriscos nas mensagens? → A: Palavras entre um asterisco simples (ex: *texto*) ficarão em negrito.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ajustes de Visibilidade na Tela de Chat (Priority: P1)

Como um usuário (admin ou normal), eu quero ver apenas o conteúdo unificado do histórico de conversas e ter ações limitadas de acordo com o meu perfil.

**Why this priority**: Modifica diretamente a interação de usuários com o histórico de conversas, que é uma funcionalidade central, prevenindo o uso indevido de ações (como geração de perguntas para admins e gerenciamento para usuários comuns).

**Independent Test**: Pode ser testado acessando a tela de chat com os dois perfis (admin e usuário) e verificando a ausência das abas, além de checar a visibilidade dos botões "gerenciar conversas", "excluir" e "gerar perguntas".

**Acceptance Scenarios**:

1. **Given** que sou um usuário (comum ou admin) na tela de chat, **When** visualizo o histórico "Conversas Anteriores", **Then** as abas de filtragem são invisíveis e apenas o conteúdo da aba "Tudo" é exibido.
2. **Given** que sou um usuário comum na tela de chat, **When** visualizo o histórico, **Then** o botão "gerenciar conversas" é invisível.
3. **Given** que sou um usuário admin na tela de chat e cliquei em "gerenciar conversas", **When** seleciono uma ou mais conversas, **Then** apenas a opção de "excluir" fica disponível e o botão de "gerar perguntas" fica invisível.

---

### User Story 2 - Correção Visual do Card do Agente para Admin (Priority: P2)

Como um usuário admin, eu quero que o botão "Chat" no card de agentes ocupe todo o espaço horizontal disponível, para garantir consistência visual com o layout do usuário comum.

**Why this priority**: É uma correção estética importante para manter a padronização e o layout limpo, mas não bloqueia fluxos críticos do sistema.

**Independent Test**: Pode ser testado fazendo login como admin, acessando a tela de agentes e observando a largura do botão "Chat" nos cards.

**Acceptance Scenarios**:

1. **Given** que sou um usuário admin logado, **When** acesso a tela de agentes, **Then** o botão "Chat" em cada card de agente deve preencher 100% do espaço horizontal (largura total) do card.

---

### User Story 3 - Acesso ao Inbox de Dúvidas para Usuário Comum (Priority: P2)

Como um usuário comum, eu quero poder acessar a tela de "inbox de dúvidas" através do menu lateral.

**Why this priority**: Expande a navegação e funcionalidades disponíveis para o usuário comum, permitindo que ele gerencie ou veja suas dúvidas.

**Independent Test**: Pode ser testado acessando o sistema como usuário comum e verificando a presença do item no menu lateral e se o link redireciona corretamente.

**Acceptance Scenarios**:

1. **Given** que sou um usuário comum logado no sistema, **When** abro o menu lateral (sidebar), **Then** o item "inbox de dúvidas" deve estar visível e clicável, levando à tela correspondente.

---

### User Story 4 - Formatação de Mensagens com Negrito (Priority: P3)

Como um usuário lendo ou enviando mensagens, eu quero que as palavras envolvidas por um único asterisco (*texto*) sejam exibidas em negrito, para destacar termos importantes.

**Why this priority**: Melhora a legibilidade das mensagens e a experiência do usuário (UX), mas é uma funcionalidade secundária em relação a permissões e fluxos principais.

**Independent Test**: Pode ser testado enviando ou recebendo uma mensagem que contenha *texto de teste* e verificando visualmente se a renderização aplica a fonte em negrito (ex: tag `<b>` ou `<strong>`).

**Acceptance Scenarios**:

1. **Given** que há uma mensagem no chat contendo texto delimitado por um asterisco simples, **When** a mensagem é renderizada na interface, **Then** o texto delimitado deve ser exibido em negrito.

### Edge Cases

- O que acontece se um admin tentar acessar a API direta para gerar perguntas: A chamada deve ser bloqueada e retornar erro, garantindo que a ação seja restrita também na API.
- O que acontece se não houver conversas no histórico: O botão "gerenciar conversas" (para admins) deve ficar visível, porém desabilitado (disabled).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST esconder as abas de filtro dentro do painel de histórico de conversas ("Conversas Anteriores") para perfis Admin e Usuário, exibindo apenas o conteúdo padrão ("Tudo").
- **FR-002**: O sistema MUST ocultar o botão "gerenciar conversas" no painel de histórico para usuários comuns.
- **FR-003**: O sistema MUST permitir que usuários do tipo Admin cliquem em "gerenciar conversas" e selecionem conversas do histórico.
- **FR-004**: O sistema MUST ocultar o botão de ação "gerar perguntas" para usuários do tipo Admin quando houver conversas selecionadas.
- **FR-005**: O sistema MUST exibir o botão de ação "excluir" para usuários do tipo Admin quando houver conversas selecionadas no gerenciamento de conversas.
- **FR-006**: O sistema MUST aplicar estilos de layout ao botão "Chat" no card do agente (tela de agentes) para preencher a largura total (`width: 100%` ou similar) quando o usuário logado for Admin.
- **FR-007**: O sistema MUST exibir o item de navegação "inbox de dúvidas" no menu lateral para usuários do perfil comum, e permitir o acesso à rota dessa tela.
- **FR-008**: O sistema MUST bloquear e retornar erro caso o usuário logado como Admin tente acessar diretamente o endpoint da API para a geração de perguntas.
- **FR-009**: O sistema MUST renderizar em negrito qualquer texto que estiver envolvido por um único asterisco (ex: `*texto*`) nas mensagens exibidas na interface de chat.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O layout e os controles de histórico de conversas estão consistentes com a especificação (100% de precisão nos perfis de acesso nas verificações de interface).
- **SC-002**: Usuários não conseguem clicar ou acessar o botão "gerar perguntas" acidentalmente no perfil de Admin, garantindo a restrição de ações.
- **SC-003**: 100% dos cartões de agentes visualizados pelo Admin apresentam o botão "Chat" ocupando todo o comprimento horizontal do cartão.
- **SC-004**: O usuário comum consegue navegar até o "inbox de dúvidas" com no máximo 1 clique a partir do menu lateral de qualquer página.

## Assumptions

- Presume-se que o sistema já distingue apropriadamente os papéis (roles) de usuário (`admin`, `user` ou equivalente) no frontend (e no backend para a persistência das regras).
- Presume-se que o componente de histórico de conversas seja o mesmo ou compartilhe estrutura suficiente para gerenciar as abas via CSS ou renderização condicional em React.
- Presume-se que a tela "inbox de dúvidas" já existe e é funcional, faltando apenas o link de acesso para o usuário comum no menu.
