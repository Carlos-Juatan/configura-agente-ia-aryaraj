# Feature Specification: Atualizar Modal KB — Abas FAQ Manual e Upload de Documentos

**Feature Branch**: `010-kb-faq-modal-upload`  
**Created**: 2026-08-11  
**Status**: Draft  
**Input**: User description: "Na página de banco de dados, na área 'kb-quick-actions' no botão de ação '✨ Adicionar Novo' vamos trocar o nome do botão para '✨ Novo FAQ' e atualizar a estrutura do modal que abre ao clicar no botão, primeiro o conteúdo do modal será dividido em duas abas 'FAQ Manual' e 'Documentos', segundo, o conteúdo atual do modal ficará dentro da aba 'FAQ Manual' e o nome 'Novo Conhecimento' mudará para 'Adicionar FAQ Manualmente', enquanto a aba 'Documentos' terá um campo de upload de arquivo (.txt, .json) com estrutura específica de FAQ's em lote, onde cada item Q/A será adicionado ao banco de dados da mesma forma que a adição manual, porém em processamento em background."

## Clarifications

### Session 2026-08-11

- Q: Qual deve ser o schema do arquivo `.json` para importação em lote? → A: Array de objetos com campos `question`, `answer`, `metadata` (classificação) e `category` (fixo `"FAQ"`), conforme:
  ```json
  [
    {
      "question": "<pergunta>",
      "answer": "<resposta>",
      "metadata": "<classificação>",
      "category": "FAQ"
    }
  ]
  ```
- Q: Como tratar FAQs duplicados (mesma `question` e `answer` já existentes) durante a importação em lote? → A: Ignorar silenciosamente o duplicado e continuar processando os demais registros, sem sinalização ao usuário.
- Q: Como o sistema deve se comportar em caso de falha parcial no background (ex: 5 de 10 FAQs salvos antes de uma falha)? → A: Persistir os registros bem-sucedidos e registrar a falha em log do servidor, sem notificação ao usuário.
- Q: O que deve acontecer se o usuário fechar o modal enquanto o enfileiramento da tarefa em background ainda está em andamento? → A: Permitir fechar o modal livremente; o enfileiramento continua normalmente em background sem interrupção.
- Q: Quais informações devem ser exibidas na prévia após o usuário selecionar o arquivo e antes de confirmar o upload? → A: Apenas o número de FAQs válidos encontrados no arquivo (ex: "12 FAQs encontrados").

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Renomear botão e abrir modal com abas (Priority: P1)

O administrador da plataforma acessa a página de banco de dados e vê o botão de ação com o novo nome **"✨ Novo FAQ"**. Ao clicar no botão, o modal se abre exibindo duas abas: **"FAQ Manual"** e **"Documentos"**.

**Why this priority**: É a mudança de interface mais visível e a porta de entrada para as demais funcionalidades. Sem ela, nenhuma outra história pode ser validada.

**Independent Test**: Pode ser testado navegando até a página do banco de dados, verificando o rótulo do botão e confirmando que o modal exibe as duas abas corretamente ao ser aberto.

**Acceptance Scenarios**:

1. **Given** a página de banco de dados está carregada, **When** o usuário visualiza a área `kb-quick-actions`, **Then** o botão de ação exibe o texto "✨ Novo FAQ" (em vez de "✨ Adicionar Novo").
2. **Given** o usuário clica em "✨ Novo FAQ", **When** o modal é aberto, **Then** duas abas são exibidas: "FAQ Manual" e "Documentos".
3. **Given** o modal está aberto, **When** o usuário está na aba padrão, **Then** a aba "FAQ Manual" está ativa por padrão.

---

### User Story 2 — Adicionar FAQ individualmente via aba "FAQ Manual" (Priority: P2)

O administrador clica na aba "FAQ Manual" e vê o formulário de adição individual renomeado como **"Adicionar FAQ Manualmente"**, com os mesmos campos existentes anteriormente. Ao preencher e salvar, o FAQ é adicionado ao banco de dados normalmente.

**Why this priority**: Preserva a funcionalidade existente sem regressão, garantindo que usuários que já utilizavam o formulário manual não percam o fluxo de trabalho.

**Independent Test**: Pode ser testado criando um FAQ individualmente pela aba "FAQ Manual" e verificando que ele aparece no banco de dados de conhecimento.

**Acceptance Scenarios**:

1. **Given** o modal está aberto na aba "FAQ Manual", **When** o usuário visualiza o formulário, **Then** o título do modal/formulário exibe "Adicionar FAQ Manualmente" (em vez de "Novo Conhecimento").
2. **Given** o usuário preenche os campos de pergunta, resposta e categoria, **When** confirma o envio, **Then** o FAQ é adicionado ao banco de dados com os mesmos campos e comportamento anteriores.
3. **Given** o usuário deixa campos obrigatórios em branco, **When** tenta enviar, **Then** o sistema exibe mensagem de validação impedindo o envio.

---

### User Story 3 — Importar FAQs em lote via arquivo na aba "Documentos" (Priority: P1)

O administrador clica na aba **"Documentos"**, seleciona ou arrasta um arquivo `.txt` ou `.json` com FAQs no formato padronizado. O sistema valida o arquivo, exibe um resumo dos registros encontrados e inicia o processamento em segundo plano. O usuário recebe confirmação imediata de que o processamento foi enfileirado, sem precisar aguardar a conclusão.

**Why this priority**: É a funcionalidade principal desta feature — permitir adição em lote de FAQs, aumentando significativamente a produtividade dos administradores de conteúdo.

**Independent Test**: Pode ser testado fazendo upload de um arquivo `.txt` de exemplo com 3 FAQs válidos e verificando que após o processamento em background, todos os 3 FAQs aparecem no banco de dados com os campos corretos.

**Acceptance Scenarios**:

1. **Given** a aba "Documentos" está ativa, **When** o usuário seleciona um arquivo `.txt` ou `.json` válido, **Then** o sistema aceita o arquivo e exibe exclusivamente o número de FAQs válidos encontrados (ex: "12 FAQs encontrados"), sem listar conteúdo individual.
2. **Given** o arquivo é válido e o usuário confirma o envio, **When** o processamento é iniciado, **Then** o sistema enfileira a tarefa em background e exibe uma mensagem de confirmação imediata, sem travar a interface.
3. **Given** a tarefa em background é concluída, **When** todos os FAQs do arquivo são processados, **Then** cada FAQ é adicionado ao banco de dados com: `question` = conteúdo de "Q:", `answer` = conteúdo de "A:", `category` = "FAQ" (fixo), `metadata` = valor de `[classificação]` do bloco.
4. **Given** o arquivo contém o campo `(Frequência: xxxx)`, **When** o sistema processa o arquivo, **Then** o campo de frequência é ignorado e não é armazenado em nenhum campo do banco de dados.
5. **Given** o usuário faz upload de um arquivo com tipo não suportado (ex: `.pdf`, `.docx`), **When** o sistema valida o arquivo, **Then** uma mensagem de erro clara é exibida informando os formatos aceitos (`.txt` e `.json`).
6. **Given** o arquivo possui blocos malformados (separadores ausentes, Q/A faltando), **When** o sistema processa o arquivo, **Then** os blocos válidos são processados normalmente e os blocos inválidos são ignorados ou sinalizados no relatório de processamento.
7. **Given** o arquivo está vazio ou não contém nenhum FAQ válido, **When** o usuário tenta enviar, **Then** o sistema exibe uma mensagem de erro informando que nenhum FAQ válido foi encontrado.

---

### Edge Cases

- O que acontece quando o arquivo `.txt` usa diferentes codificações de caracteres (UTF-8, Latin-1)?
- Como o sistema se comporta se o arquivo tiver apenas o `[classificação]` sem `Q:` ou `A:`?
- FAQs duplicados no arquivo (mesmo `question` + `answer` já existentes no banco de dados) são **ignorados silenciosamente**; o processamento dos demais registros prossegue normalmente (ver FR-014).
- Em caso de **falha parcial no background** (ex: erro de banco durante o processamento de um lote), os registros já persistidos com sucesso são mantidos; a falha é registrada em log do servidor sem interrupção do restante do lote e sem notificação ao usuário (ver FR-015).
- Se o usuário **fechar o modal** enquanto o enfileiramento está em andamento, o modal fecha livremente e o processamento em background **não é interrompido** (ver FR-016). Nenhum aviso de confirmação é exibido.
- Como o campo `[classificação]` é mapeado quando ele contém caracteres especiais?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE renomear o botão de ação na área `kb-quick-actions` de "✨ Adicionar Novo" para "✨ Novo FAQ".
- **FR-002**: O sistema DEVE apresentar o modal com estrutura de duas abas: "FAQ Manual" (ativa por padrão) e "Documentos".
- **FR-003**: O sistema DEVE renomear o título do formulário existente de "Novo Conhecimento" para "Adicionar FAQ Manualmente", mantendo todos os campos e comportamentos da adição individual intactos.
- **FR-004**: A aba "Documentos" DEVE exibir um componente de upload de arquivo que aceite exclusivamente arquivos com extensão `.txt` e `.json`.
- **FR-005a**: Para arquivos `.txt`, o sistema DEVE fazer o parse identificando cada bloco FAQ separado por `----------------------------------------` (48 hifens), extraindo os campos `[classificação]`, `Q:` e `A:`.
- **FR-005b**: Para arquivos `.json`, o sistema DEVE fazer o parse de um array de objetos onde cada objeto contém os campos `question`, `answer`, `metadata` e `category`. O campo `category` do JSON pode ser ignorado e substituído pelo valor fixo `"FAQ"` conforme FR-007.
- **FR-006**: Para cada bloco válido, o sistema DEVE extrair: o conteúdo após `Q:` como `question`, o conteúdo após `A:` como `answer`, e o valor entre colchetes `[classificação]` como `metadata`.
- **FR-007**: O sistema DEVE definir o campo `category` com o valor fixo `"FAQ"` para todos os registros importados via arquivo.
- **FR-008**: O sistema DEVE ignorar completamente o campo `(Frequência: xxxx)` durante o parse, sem armazená-lo em nenhum campo.
- **FR-009**: O processamento e a persistência dos FAQs extraídos do arquivo DEVEM ser executados em segundo plano (background), utilizando o sistema de processamento em background já existente no projeto.
- **FR-010**: O sistema DEVE exibir uma mensagem de confirmação imediata ao usuário após o enfileiramento da tarefa, sem aguardar a conclusão do processamento.
- **FR-011**: O sistema DEVE validar o arquivo antes do envio e exibir mensagem de erro para arquivos com extensão não suportada ou sem FAQs válidos.
- **FR-012**: Blocos inválidos ou malformados dentro de um arquivo válido NÃO DEVEM impedir o processamento dos blocos válidos restantes.
- **FR-013**: Cada FAQ importado via arquivo DEVE ser adicionado ao banco de dados com a mesma estrutura de dados que a adição manual individual.
- **FR-014**: O sistema DEVE verificar duplicidade antes de persistir cada FAQ importado. Se um registro com a mesma `question` e `answer` já existir no banco de dados, o registro DEVE ser silenciosamente ignorado (sem erro, sem inserção duplicada) e o processamento dos demais registros do arquivo DEVE continuar normalmente.
- **FR-015**: Em caso de falha ao persistir um FAQ individual durante o processamento em background, o sistema DEVE registrar o erro em log do servidor (identificando o registro que falhou) e continuar processando os demais registros do lote. Os registros já persistidos com sucesso NÃO DEVEM ser revertidos. Nenhuma notificação de falha parcial é exibida ao usuário.
- **FR-016**: O modal DEVE poder ser fechado livremente pelo usuário a qualquer momento, mesmo enquanto o enfileiramento da tarefa em background está em andamento. O fechamento do modal NÃO DEVE interromper nem cancelar o processamento já iniciado.
- **FR-017**: Após o usuário selecionar um arquivo válido e antes de confirmar o upload, o sistema DEVE exibir exclusivamente o número de FAQs válidos identificados no arquivo (ex: "12 FAQs encontrados"). Nenhum conteúdo individual (pergunta, resposta, metadado) DEVE ser listado na prévia.

### Key Entities

- **FAQ**: Unidade de conhecimento composta por `question` (pergunta), `answer` (resposta), `category` (categoria, fixo como "FAQ" para importação) e `metadata` (classificação temática extraída do bloco).
- **Arquivo de Importação**: Arquivo `.txt` ou `.json` contendo um ou mais blocos FAQ delimitados por `----------------------------------------`, cada bloco com campos `[classificação]`, `Q:`, `A:` e opcionalmente `(Frequência: xxxx)`.
- **Tarefa de Background**: Unidade de trabalho enfileirada no sistema de processamento assíncrono, responsável por processar e persistir os FAQs extraídos do arquivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administradores conseguem renomear e usar o botão "✨ Novo FAQ" sem nenhuma perda de funcionalidade comparado ao estado anterior.
- **SC-002**: 100% dos FAQs válidos contidos em um arquivo de importação são persistidos no banco de dados com os campos corretos após o processamento em background.
- **SC-003**: O usuário recebe a confirmação de enfileiramento em menos de 3 segundos após confirmar o upload, independentemente do tamanho do arquivo.
- **SC-004**: A adição manual de FAQ via aba "FAQ Manual" continua funcionando sem regressão — taxa de sucesso de 100% dos cenários de adição existentes.
- **SC-005**: Arquivos com blocos parcialmente inválidos têm ao menos os blocos válidos processados — zero blocos válidos descartados por causa de blocos inválidos adjacentes.
- **SC-006**: O campo `(Frequência: xxxx)` não aparece em nenhum registro do banco de dados após a importação — verificável em 100% dos registros importados.
- **SC-007**: FAQs duplicados não geram registros duplicados no banco de dados — após importação de arquivo contendo entradas já existentes, zero duplicatas adicionais são encontradas no banco.

## Assumptions

- O sistema de processamento em background já existente no projeto suporta a adição de novas tarefas de persistência de dados sem modificações estruturais significativas.
- Os usuários que realizam upload de documentos são administradores autenticados com permissão para gerenciar o banco de conhecimento.
- A estrutura de dados de um FAQ no banco de dados (campos `question`, `answer`, `category`, `metadata`) permanece a mesma entre a adição manual e a importação via arquivo.
- O formato `.txt` dos arquivos de importação usa UTF-8 como codificação padrão; outros encodings podem não ser suportados na v1.
- O campo `[classificação]` é sempre a primeira linha de cada bloco FAQ, conforme o formato especificado.
- Os arquivos `.json` devem seguir o schema: array de objetos com campos `question` (string), `answer` (string), `metadata` (string, classificação temática) e `category` (string, ignorado em favor do valor fixo `"FAQ"`). Objetos faltando `question` ou `answer` são tratados como blocos inválidos (ignorados, conforme FR-012).
- A validação do arquivo ocorre no lado do cliente antes do envio para reduzir tráfego desnecessário.
- Não há limite máximo de FAQs por arquivo definido nesta versão; o sistema deve processar arquivos de tamanho razoável (até algumas centenas de registros) sem degradação perceptível.
