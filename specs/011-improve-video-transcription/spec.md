# Feature Specification: Melhorias na Transcrição de Vídeo no Banco de Conhecimento

**Feature Branch**: `011-improve-video-transcription`  
**Created**: 2026-08-22  
**Status**: Draft  
**Input**: User description: "Melhorar a opção de transcrição de vídeo no banco de dados. Corrigir erro de speech_model deprecated, logs detalhados do processamento em background e seleção de linguagem na transcrição."

## Clarifications

### Session 2026-08-22

- Q: O sistema deve tentar novamente automaticamente em caso de falha de transcrição? → A: Retry automático limitado — O sistema tenta novamente até 3 vezes com intervalo progressivo antes de marcar como falha definitiva.
- Q: Qual mecanismo deve ser usado para atualizar o log em tempo real? → A: WebSocket / Server-Sent Events — o servidor empurra novas linhas de log ao cliente assim que são registradas.
- Q: O log deve ser truncado caso seja muito extenso? → A: Truncamento com aviso — limitado a 5.000 linhas; se exceder, as primeiras e últimas linhas são preservadas e uma mensagem de aviso indica o truncamento no meio do log.
- Q: Após falha definitiva, o administrador pode reprocessar o vídeo pela interface? → A: Sim — existe botão "Reprocessar" na interface que inicia novamente o processamento do vídeo em falha.
- Q: O sistema de log detalhado deve se aplicar apenas a vídeos ou a todos os tipos de tarefa em background? → A: Escopo expandido — o log detalhado é aplicado a todos os tipos de processamento em background existentes (vídeo, documentos, FAQ, etc.).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Correção do Processamento em Background de Vídeos (Priority: P1)

Um administrador adiciona um vídeo ao banco de conhecimento. O sistema inicia o processamento em background para transcrição do vídeo. Atualmente, o processamento falha com um erro de parâmetro descontinuado (`speech_model` deprecated) no serviço de transcrição, impedindo que qualquer vídeo seja transcrito com sucesso.

**Why this priority**: Esta é a falha bloqueante mais crítica. Sem a correção, o fluxo de adição de vídeos é completamente inutilizável.

**Independent Test**: Pode ser testado adicionando qualquer vídeo ao banco de conhecimento e verificando que o processamento em background completa com status "Concluído" sem erros de parâmetro descontinuado.

**Acceptance Scenarios**:

1. **Given** o administrador seleciona um vídeo para adicionar ao banco de conhecimento, **When** o processamento em background é iniciado, **Then** o sistema utiliza o modelo de transcrição correto (não descontinuado) e o processamento completa sem erros relacionados ao parâmetro `speech_model`.
2. **Given** o processamento em background de transcrição atingiu falha definitiva (após 3 tentativas), **When** o administrador clica em "Reprocessar" na interface, **Then** um novo ciclo de processamento (com até 3 tentativas automáticas) é iniciado para aquele vídeo, e um novo log de detalhes é gerado para esse reprocessamento.
3. **Given** o serviço de transcrição atualiza sua API, **When** o sistema usa o modelo correto, **Then** a transcrição do conteúdo de vídeo é gerada corretamente e salva no banco de conhecimento.

---

### User Story 2 - Log Detalhado de Todos os Processamentos em Background (Priority: P2)

Um administrador quer acompanhar e auditar em detalhes o que aconteceu durante qualquer processamento em background — seja de vídeos, documentos, FAQs ou qualquer outro tipo de tarefa. Ao clicar em "Ver Detalhes" de qualquer tarefa, ele vê um log completo e sequencial do processo, similar ao output de um terminal, com timestamps e cada etapa executada registrada.

**Why this priority**: A visibilidade detalhada de qualquer processamento é essencial para diagnóstico de problemas e para dar confiança ao usuário de que o sistema está funcionando corretamente. Aplicar a todos os tipos de tarefa maximiza o valor da melhoria.

**Independent Test**: Pode ser testado adicionando diferentes tipos de conteúdo (vídeo, documento, FAQ) ao banco de conhecimento, aguardando o processamento e clicando em "Ver Detalhes" para verificar que um log completo e legível é exibido para cada tipo.

**Acceptance Scenarios**:

1. **Given** uma tarefa de processamento de qualquer tipo (vídeo, documento, FAQ) foi iniciada, **When** o administrador clica em "Ver Detalhes", **Then** ele vê um painel/modal com o log completo do processamento em formato de terminal (linha a linha, com timestamps).
2. **Given** o log de processamento está sendo exibido, **When** o administrador lê o log, **Then** cada etapa significativa está registrada com contexto do tipo de tarefa em execução (ex: "Iniciando download do vídeo", "Processando documento PDF", "Importando FAQ em lote").
3. **Given** ocorreu um erro durante o processamento de qualquer tipo de tarefa, **When** o administrador visualiza o log de detalhes, **Then** o erro está claramente registrado no log com contexto suficiente para diagnóstico (mensagem de erro, etapa em que ocorreu).
4. **Given** o processamento foi concluído, **When** o administrador abre os detalhes novamente em uma sessão posterior, **Then** o log completo ainda está disponível e persistido (não é perdido ao recarregar a página).
5. **Given** o processamento está em andamento, **When** o administrador clica em "Ver Detalhes", **Then** o log exibe o progresso em tempo real via push, atualizando à medida que novas etapas são executadas.

---

### User Story 3 - Seleção de Linguagem para Transcrição de Vídeo (Priority: P3)

Um administrador que possui vídeos em diferentes idiomas quer poder escolher o idioma do áudio do vídeo antes de iniciar o processamento de transcrição, garantindo maior precisão no resultado da transcrição.

**Why this priority**: Melhora a qualidade da transcrição para conteúdo multilíngue. É uma melhoria de qualidade, não uma correção de bug, portanto menor prioridade que P1 e P2.

**Independent Test**: Pode ser testado ao adicionar um vídeo, verificando que existe um seletor de idioma na interface de adição, e confirmando que a transcrição resultante reflete o idioma selecionado.

**Acceptance Scenarios**:

1. **Given** o administrador está adicionando um vídeo ao banco de conhecimento, **When** visualiza a tela/formulário de adição de vídeo, **Then** existe um campo de seleção de idioma com as principais opções disponíveis (ex: Português, Inglês, Espanhol, Automático/Detectar).
2. **Given** o administrador selecionou um idioma específico, **When** confirma a adição do vídeo, **Then** o processamento de transcrição em background usa o idioma selecionado.
3. **Given** o administrador não seleciona nenhum idioma, **When** confirma a adição, **Then** o sistema usa "Automático" (detecção automática de idioma) como padrão, mantendo compatibilidade com o comportamento anterior.
4. **Given** o idioma foi selecionado pelo administrador, **When** a transcrição é concluída, **Then** o idioma utilizado está registrado no log de detalhes do processamento.

---

### Edge Cases

- O que acontece se o serviço de transcrição estiver indisponível temporariamente? O sistema tenta novamente até 3 vezes com intervalo progressivo (ex: 30s, 90s, 180s); se todas as tentativas falharem, registra o erro no log e marca a tarefa como falha definitiva com mensagem clara.
- Como o sistema lida com vídeos muito longos que excedem limites do serviço de transcrição? O log deve registrar o problema e a tarefa deve falhar com mensagem descritiva.
- O que acontece se o arquivo de vídeo for removido do armazenamento antes de o processamento iniciar? O log deve capturar o erro de acesso ao arquivo.
- Se o log de processamento exceder 5.000 linhas: as primeiras e últimas linhas são preservadas, e uma mensagem de aviso visível é inserida no meio indicando que parte do conteúdo intermediário foi omitida por excesso de tamanho.
- E se o administrador abrir os detalhes de uma tarefa que nunca gerou nenhum log (tarefa antiga)? Deve exibir uma mensagem indicando que logs detalhados não estão disponíveis para essa tarefa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE corrigir o parâmetro de modelo de transcrição de vídeo para usar a versão atual não descontinuada, eliminando o erro atual de processamento.
- **FR-002**: O sistema DEVE registrar cada etapa significativa de qualquer processamento em background (vídeo, documento, FAQ e outros tipos) como uma entrada de log com timestamp e descrição clara da ação.
- **FR-003**: O sistema DEVE persistir o log detalhado de processamento associado a cada tarefa em background, de forma que possa ser consultado após o processamento terminar (com sucesso ou falha), independentemente do tipo de tarefa.
- **FR-004**: O sistema DEVE exibir o log completo de processamento quando o administrador clica em "Ver Detalhes" de qualquer tarefa em background, em formato legível semelhante a um terminal (sequencial, com timestamps).
- **FR-005**: O sistema DEVE atualizar o log em tempo real enquanto qualquer processamento em background está em andamento e o administrador está visualizando os detalhes, usando um mecanismo de push (WebSocket ou Server-Sent Events) que entrega cada nova linha de log ao cliente imediatamente após ser registrada no servidor.
- **FR-006**: O sistema DEVE incluir na tela/formulário de adição de vídeo um campo para seleção do idioma do áudio do vídeo.
- **FR-007**: O sistema DEVE usar "Automático" (detecção automática de idioma) como valor padrão para o campo de seleção de idioma, mantendo compatibilidade retroativa.
- **FR-008**: O sistema DEVE incluir no log de detalhes o idioma utilizado na transcrição.
- **FR-009**: O sistema DEVE registrar erros de processamento no log com contexto suficiente para diagnóstico, incluindo a etapa em que o erro ocorreu e a mensagem de erro completa.
- **FR-010**: O sistema DEVE oferecer no mínimo as seguintes opções de idioma: Automático (detectar), Português (Brasil), Inglês, Espanhol.
- **FR-011**: Em caso de falha no processamento de transcrição, o sistema DEVE realizar até 3 tentativas automáticas com intervalos progressivos entre elas (ex: 30s, 90s, 180s) antes de marcar a tarefa como falha definitiva. Cada tentativa e seu resultado DEVEM ser registrados no log de detalhes.
- **FR-012**: O log de processamento DEVE ser limitado a 5.000 linhas. Quando esse limite for atingido, o sistema DEVE preservar as primeiras e últimas linhas do log e inserir uma mensagem de aviso explícita no ponto de corte, indicando que parte do conteúdo intermediário foi omitida.
- **FR-013**: Qualquer tarefa em background com status de falha definitiva DEVE exibir um botão "Reprocessar" na interface. Ao acioná-lo, o administrador inicia um novo ciclo de processamento completo para aquela tarefa, com novo log gerado.

### Key Entities

- **Tarefa de Processamento em Background**: Representa qualquer processamento assíncrono do sistema (transcrição de vídeo, importação de documento, importação de FAQ, etc.). Contém: tipo de tarefa, status (pendente, em andamento, concluído, falha), referência ao conteúdo processado, e referência ao log de processamento. Para tarefas de vídeo, contém adicionalmente o idioma selecionado para transcrição.
- **Log de Processamento**: Coleção ordenada de entradas de log associadas a uma tarefa. Cada entrada contém: timestamp, nível (info, aviso, erro), e mensagem descritiva da etapa. Limitado a 5.000 linhas com política de truncamento com aviso.
- **Entrada de Log**: Registro individual de uma etapa do processamento. Atributos: timestamp, nível, mensagem.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos vídeos adicionados ao banco de conhecimento completam o processamento de transcrição em background sem erros relacionados a parâmetros descontinuados.
- **SC-002**: O log de detalhes de qualquer tipo de tarefa em background contém no mínimo 5 entradas distintas descrevendo as etapas do processamento (início, cada etapa principal, conclusão ou erro).
- **SC-003**: O log de uma tarefa de processamento está disponível para consulta até 30 dias após a conclusão do processamento.
- **SC-004**: O administrador consegue identificar a causa de uma falha de processamento lendo apenas o log de detalhes, sem precisar acessar logs técnicos do servidor, em pelo menos 90% dos casos de erro.
- **SC-005**: A seleção de idioma está disponível antes de iniciar o processamento e o idioma selecionado é corretamente utilizado na transcrição, confirmado pelo registro no log.
- **SC-006**: Vídeos em idioma diferente do padrão (Automático) apresentam precisão de transcrição perceptivelmente melhor quando o idioma correto é selecionado manualmente.

## Assumptions

- O sistema já possui uma interface de "Ver Detalhes" para tarefas em background — o escopo é aprimorar o conteúdo exibido para **todos os tipos de tarefa**, não apenas vídeos.
- O sistema de log detalhado será projetado de forma genérica para suportar qualquer tipo de tarefa em background (vídeo, documento, FAQ, etc.) nesta mesma entrega.
- O banco de conhecimento (knowledge base) já tem um mecanismo de processamento em background funcionando; a correção é pontual no parâmetro de modelo de transcrição.
- O serviço externo de transcrição suporta seleção de idioma via parâmetro na API — as opções de idioma serão determinadas pelo que o serviço suporta.
- O log detalhado será armazenado no banco de dados do sistema, associado à tarefa correspondente.
- A atualização em tempo real do log (durante processamento ativo) utiliza WebSocket ou Server-Sent Events (push), entregando cada nova linha de log ao cliente imediatamente após ser registrada no backend.
- Os usuários que adicionam vídeos são administradores autenticados do sistema — não há diferenciação de permissões para esta feature.
- O idioma padrão "Automático" mantém o comportamento atual do sistema, garantindo que vídeos existentes já adicionados sem seleção de idioma não sejam afetados.
- Vídeos adicionados antes desta melhoria não terão logs detalhados disponíveis; o sistema exibirá mensagem informativa nesses casos.
