# Feature Specification: Criar Opção de Agente Roteador para Filtragem e Direcionamento de Mensagens

**Feature Branch**: `012-add-router-agent`  
**Created**: 2026-08-29  
**Status**: Draft  
**Input**: User description: "Vamos adicionar uma segunda opção de criação de agente. Além do agente que já temos, quero criar um agente rounter que eu possa colocar um prompt para filtrar as mensagens do lead. E com base no tipo de mensagem, direcionar a conversa para agentes diferentes. A ideia é ter vários agentes, cada um com um prompt diferente, que faz coisas diferentes, e ter um agente router para direcionar a conversa para um desses agentes, conforme o nescessário. voce poderá criar quantos agentes diferentes quizer e adicionar no agente hounter para realizar essa filtragem das mensagens usando prompts customizados do agente hounter para filtrar"

## Clarifications

### Session 2026-08-29

- Q: O que acontece se a mensagem do lead não se enquadrar em nenhuma das regras do prompt do Agente Roteador? → A: Encaminhar para um Agente de Destino Padrão (Fallback Agent) definido pelo usuário nas configurações do Roteador.
- Q: Como o histórico da conversa é repassado quando o Agente Roteador transfere a mensagem para um agente de destino? → A: Transferência de Histórico Completo — o agente de destino recebe todas as mensagens anteriores da conversa para ter contexto total.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seleção do Tipo de Agente e Criação de Agente Roteador (Priority: P1)

Como gestor do sistema de IA, quero poder escolher entre criar um "Agente Padrão" (existente) ou um "Agente Roteador" no momento de adicionar um novo agente, para que eu possa estruturar fluxos de atendimento mais complexos e especializados.

**Why this priority**: É a funcionalidade base necessária para permitir a coexistência de dois tipos de agentes e disponibilizar a criação do Agente Roteador na interface.

**Independent Test**: Pode ser testado acessando a tela de criação de agentes, verificando que existem duas opções ("Agente Padrão" e "Agente Roteador") e completando com sucesso a criação de um Agente Roteador com nome e prompt de filtragem base.

**Acceptance Scenarios**:

1. **Given** o usuário está na tela de criação de agente, **When** ele clica para criar um novo agente, **Then** o sistema exibe opções claras para selecionar entre "Agente Padrão" e "Agente Roteador".
2. **Given** o usuário seleciona "Agente Roteador", **When** ele preenche os dados cadastrais (nome, descrição, prompt de filtragem do roteador), **Then** o agente é salvo com a classificação de tipo "Roteador".
3. **Given** o usuário está listando os agentes cadastrados, **When** a lista é exibida, **Then** cada agente indica visivelmente o seu tipo ("Padrão" ou "Roteador").

---

### User Story 2 - Associar Agentes de Destino e Regras de Filtragem por Prompt (Priority: P2)

Como gestor do sistema, quero adicionar múltiplos agentes de destino a um Agente Roteador e definir o prompt de filtragem/critérios de direcionamento para cada um deles, para que o roteador saiba exatamente qual agente acionar de acordo com o conteúdo da mensagem do lead.

**Why this priority**: O valor do Agente Roteador está em conectar múltiplos agentes com responsabilidades diferentes. Sem a associação e definição de critérios de filtro, o roteador não saberia para onde enviar as conversas.

**Independent Test**: Pode ser testado abrindo as configurações de um Agente Roteador criado, vinculando pelo menos dois agentes de destino diferentes, especificando as regras/instruções do prompt de filtragem para cada um e salvando as alterações.

**Acceptance Scenarios**:

1. **Given** um Agente Roteador existente, **When** o usuário edita suas configurações, **Then** ele pode selecionar e associar múltiplos agentes (de qualquer quantidade criada no sistema) como destinos de roteamento.
2. **Given** o usuário está configurando o Agente Roteador, **When** ele escreve o prompt customizado de filtragem, **Then** ele pode orientar como as mensagens do lead devem ser analisadas e mapeadas para cada agente de destino associado.
3. **Given** o usuário tenta salvar um Agente Roteador sem nenhum agente de destino vinculado, **When** ele confirma, **Then** o sistema valida e solicita a associação de pelo menos um agente de destino antes de salvar.

---

### User Story 3 - Processamento e Roteamento Dinâmico de Mensagens do Lead (Priority: P3)

Como lead/cliente em atendimento, quando envio uma mensagem no chat, quero que o Agente Roteador analise minha mensagem usando seu prompt de filtragem e direcione meu atendimento de forma transparente para o agente especializado correto.

**Why this priority**: Garante que o motor de execução utilize a inteligência do prompt do roteador para encaminhar a conversa para o agente adequado em tempo real.

**Independent Test**: Pode ser testado enviando mensagens com diferentes intenções/assuntos para um canal associado a um Agente Roteador e verificando se o agente de destino correspondente é acionado para gerar a resposta.

**Acceptance Scenarios**:

1. **Given** um lead envia uma mensagem sobre um assunto específico (ex: "Quero agendar uma consulta"), **When** a mensagem chega ao Agente Roteador, **Then** o roteador avalia o texto com seu prompt de filtragem e encaminha a execução para o agente especializado correspondente (ex: Agente de Agendamento).
2. **Given** o atendimento foi direcionado para um agente especializado, **When** novas mensagens desse lead chegam na mesma conversa, **Then** o sistema mantém a continuidade no agente correto ou reavalia a rota conforme a política de sessão estabelecida.

---

### Edge Cases

- O que acontece se a mensagem do lead não se enquadrar em nenhuma das regras do prompt do Agente Roteador? O sistema encaminha a conversa para o Agente de Destino Padrão (Fallback Agent) configurado no Agente Roteador.
- Como o histórico da conversa é repassado quando o Agente Roteador transfere a mensagem para um agente de destino? É realizada a transferência do histórico completo da conversa, permitindo que o agente de destino mantenha contexto total do atendimento.
- O que ocorre se um dos agentes de destino vinculados for desativado ou excluído? O sistema deve alertar na configuração do Agente Roteador e impedir que mensagens sejam roteadas para agentes inativos, direcionando para o agente de fallback.
- E se o modelo de linguagem falhar ao classificar a mensagem do lead? O sistema deve registrar o evento de falha e aplicar o Agente de Destino Padrão (fallback) configurado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE disponibilizar duas opções explícitas na criação de agente: "Agente Padrão" e "Agente Roteador".
- **FR-002**: O sistema DEVE permitir a criação de uma quantidade ilimitada de agentes padrão e de agentes roteadores.
- **FR-003**: O sistema DEVE armazenar no Agente Roteador um prompt customizado exclusivo para a filtragem e classificação de mensagens recebidas.
- **FR-004**: O sistema DEVE permitir a associação de um ou mais agentes de destino a um Agente Roteador através de vínculo relacional direto.
- **FR-005**: O sistema DEVE permitir definir instruções e critérios específicos de classificação no prompt do roteador para cada agente de destino configurado.
- **FR-006**: O sistema DEVE identificar visualmente na listagem de agentes quais são do tipo "Padrão" e quais são do tipo "Roteador".
- **FR-007**: O sistema DEVE processar as mensagens dos leads através do Agente Roteador para determinar o agente especializado adequado antes de responder ao lead.
- **FR-008**: O sistema DEVE validar e impedir a ativação de um Agente Roteador que não possua pelo menos um agente de destino associado e configurado.
- **FR-009**: O sistema DEVE tratar falhas na classificação ou instabilidades do serviço de IA utilizando um agente ou resposta de contingência (fallback).
- **FR-010**: O sistema DEVE impedir a delegação de mensagens para agentes de destino que estejam inativos ou desativados pelo usuário.
- **FR-011**: O sistema DEVE registrar em log ou histórico de atendimento qual agente foi selecionado pelo roteador para responder à mensagem.
- **FR-012**: O sistema DEVE permitir a configuração de um Agente de Destino Padrão (Fallback Agent) no Agente Roteador, acionado caso a mensagem do lead não atenda aos critérios específicos de filtragem.
- **FR-013**: O sistema DEVE transferir o histórico completo de mensagens da conversa ao repassar a execução para um agente de destino.

### Key Entities

- **Agente**: Representa uma entidade de IA configurada no sistema. Possui os atributos: tipo ("Padrão" ou "Roteador"), nome, descrição, prompt de sistema, status (ativo/inativo) e configurações de conhecimento.
- **Agente Roteador**: Especialização da entidade Agente contendo o prompt customizado de filtragem e os vínculos com a lista de agentes de destino associados.
- **Regra / Mapeamento de Roteamento**: Definição da relação entre os critérios do prompt do roteador e o agente de destino correspondente que processará as mensagens daquela categoria.
- **Sessão de Atendimento de Lead**: Estado da conversa de um lead contendo o histórico de mensagens, o agente roteador responsável pelo canal e o agente de destino atualmente ativo no atendimento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% das criações de agente permitem ao usuário escolher entre "Agente Padrão" e "Agente Roteador" sem erros de validação.
- **SC-002**: O Agente Roteador consegue filtrar e encaminhar corretamente mensagens de teste para o agente de destino esperado em pelo menos 95% dos testes de envio com prompts bem definidos.
- **SC-003**: A transição do Agente Roteador para o agente de destino adiciona no máximo 1,5 segundo ao tempo total de resposta ao lead.
- **SC-004**: O painel de configuração DEVE permitir associar múltiplos agentes de destino e salvar as alterações em formulário único com feedback visual imediato e sem recarregamento de página.

## Assumptions

- O sistema já possui um fluxo funcional de criação e atendimento com agentes padrão; a nova funcionalidade adiciona o Agente Roteador como uma nova modalidade.
- Qualquer agente de destino selecionado pelo roteador pode possuir suas próprias configurações independentes, base de conhecimento e prompts específicos.
- O prompt do Agente Roteador é focado no entendimento da intenção/tipo de mensagem do lead para fins de direcionamento.
- A interface apresentará seletores simples e amigáveis para vinculação de agentes de destino no painel do Agente Roteador.
