# GPTMaker Ops Dashboard - TODO

## Configuração Inicial
- [x] Configurar integração com API GPTMaker (Bearer token)
- [x] Criar schema do banco para armazenar configurações e cache
- [x] Configurar variáveis de ambiente para API GPTMaker

## Backend (tRPC Procedures)
- [x] Criar procedure para listar chats com filtros
- [x] Criar procedure para buscar mensagens de um chat
- [x] Criar procedure para assumir atendimento
- [x] Criar procedure para encerrar atendimento
- [x] Criar procedure para enviar mensagem
- [ ] Criar procedure para editar mensagem
- [ ] Criar procedure para listar atendimentos ativos
- [x] Criar procedure para obter estatísticas do dashboard

## Frontend - Dashboard
- [x] Criar layout principal com sidebar elegante
- [x] Implementar dashboard com KPIs (total de chats, não lidos, em atendimento)
- [x] Criar lista de chats com cards elegantes
- [x] Adicionar filtros por agente, status e busca
- [x] Implementar indicadores visuais de chats não lidos
- [x] Adicionar paginação para lista de chats

## Frontend - Chat Interface
- [x] Criar interface de visualização de mensagens
- [x] Implementar área de envio de mensagens
- [x] Adicionar botão de assumir atendimento
- [x] Adicionar botão de encerrar atendimento
- [x] Mostrar informações do contato e agente
- [x] Implementar scroll automático para novas mensagens

## Funcionalidades em Tempo Real
- [x] Implementar polling para atualizar lista de chats
- [x] Implementar polling para atualizar mensagens do chat ativo
- [ ] Adicionar sistema de notificações para novos chats
- [ ] Adicionar notificações para novas mensagens

## Design e UX
- [x] Aplicar tema elegante e perfeito (cores, tipografia, espaçamentos)
- [x] Adicionar animações suaves nas transições
- [x] Implementar estados de loading elegantes
- [x] Criar estados vazios informativos
- [x] Garantir responsividade mobile completa

## Testes
- [ ] Testar integração com API GPTMaker
- [ ] Testar fluxo de assumir atendimento
- [ ] Testar envio e recebimento de mensagens
- [ ] Testar filtros e busca
- [ ] Testar responsividade em diferentes dispositivos

## Finalização
- [ ] Revisar código e otimizar performance
- [ ] Documentar configuração e uso
- [ ] Criar checkpoint final

## Melhorias Solicitadas
- [x] Implementar descoberta automática do Workspace ID usando o token
- [x] Atualizar página de setup para requerer apenas o token de API

## Correções Necessárias
- [x] Corrigir erro na descoberta de workspace - endpoint correto é /v2/workspaces (plural)
- [x] Adicionar logs detalhados para debug de erros de API
- [x] Corrigir mapeamento de campos da API (text ao invés de content, time ao invés de createdAt)
- [x] Corrigir erro de <a> aninhado na página Home - substituído <a> por <div> dentro do Link
- [x] Corrigir erro 403 - workspace ID não estava sendo passado corretamente do frontend para o backend
- [x] Corrigir pageSize máximo (200) na listagem de chats
- [x] Corrigir endpoint de mensagens - era /v2/chat/{chatId}/messages ao invés de /v2/workspace/{workspaceId}/chats/{chatId}/messages
- [x] Corrigir conversão de timestamp de mensagens (segundos para milissegundos)

## Ajustes de Branding
- [x] Alterar nome "GPTMaker Ops" para "Nina" em toda a aplicação
- [x] Atualizar título da sidebar
- [x] Atualizar título do header mobile
- [x] Atualizar título da página (document title)
- [x] Remover referências ao GPTMaker na página de setup

## Funcionalidades de Agentes
- [x] Implementar endpoint para listar todos os agentes do workspace
- [x] Criar página de listagem de agentes com cards informativos
- [x] Adicionar filtro por agente na listagem de chats (via link)
- [ ] Implementar dashboard com métricas por agente (total de chats, ativos, finalizados)
- [x] Adicionar visualização de detalhes de cada agente
- [x] Criar navegação entre agentes e seus chats
- [x] Adicionar item de menu "Agentes" na sidebar

## Página de Detalhes do Agente
- [x] Criar rota e página de detalhes do agente (/agents/:agentId)
- [x] Implementar gráfico de chats ao longo do tempo (últimos 7 dias)
- [x] Adicionar gráfico de distribuição de status dos chats (ativos, finalizados, não lidos)
- [x] Mostrar métricas principais (total de chats, taxa de finalização, tempo médio)
- [x] Exibir lista de chats recentes deste agente
- [x] Adicionar informações detalhadas do agente (comportamento, configurações)
- [x] Implementar navegação de volta para lista de agentes
- [x] Adicionar botões nos cards de agentes para acessar detalhes

## Página de Comparação de Agentes
- [x] Criar rota e página de comparação de agentes (/agents/compare)
- [x] Implementar seletor múltiplo de agentes (checkboxes)
- [x] Criar gráfico de barras comparativo de métricas principais
- [x] Adicionar gráfico de linha comparando evolução diária de chats
- [x] Implementar tabela comparativa com todas as métricas lado a lado
- [ ] Adicionar opção de exportar comparação em PDF/CSV
- [x] Criar botão de navegação na página de agentes

## Correções
- [x] Corrigir erro 400 na página de estatísticas - pageSize reduzido de 1000 para 200 (máximo da API)

## Gestão de Atendentes Humanos
- [x] Verificar documentação da API para endpoint de atendentes humanos (interactions)
- [x] Implementar endpoint para listar atendimentos (interactions)
- [x] Criar página de listagem de atendentes humanos extraindo dados dos interactions
- [ ] Adicionar opção de transferir chat para atendente humano específico
- [x] Implementar visualização de atendimentos por atendente humano (estatísticas)
- [x] Adicionar menu de navegação para atendentes humanos

## Ajustes Solicitados pelo Vídeo
- [x] Adicionar página de "Equipe" para gerenciar membros/atendentes
- [x] Melhorar interface de chat com botão "Assumir Atendimento" (já existia)
- [x] Adicionar funcionalidade de "Assinatura" nos chats (botão de sino)
- [x] Garantir que atendimento humano possa assumir chats facilmente
- [x] Replicar funcionalidades operacionais do GPTMaker para atendimento humano

## Correções Urgentes
- [x] Corrigir erro "interactions.forEach is not a function" - corrigido retorno da API (response.data.data)
- [x] Exibir estatísticas gerais de atendimentos (aguardando: 26, ativos: 0, finalizados: 85) na página Operators
- [x] Ajustar interface para lidar com ausência de dados de atendentes individuais (userId null retornado pela API)

## Filtro Global de Datas
- [x] Criar contexto React para gerenciar estado do filtro de datas globalmente
- [x] Implementar componente DateRangeFilter com opções predefinidas (Hoje, Últimos 7 dias, Últimos 30 dias, Personalizado)
- [x] Adicionar seletor de datas na página Home (Dashboard)
- [x] Integrar filtro de datas na listagem de chats
- [x] Aplicar filtro de datas nas estatísticas do dashboard
- [x] Integrar filtro na página de Estatísticas
- [x] Integrar filtro na página de Atendentes (Operators)
- [ ] Integrar filtro na página de detalhes de Agentes
- [x] Persistir seleção de filtro no localStorage
- [x] Adicionar indicador visual mostrando período selecionado
