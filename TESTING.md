# Roteiro de testes — AgendaMogi

## Testes automatizados
- Unitários (Vitest): `npm run test:run`
- E2E (Playwright): `npm run test:e2e` (requer `npm run dev` rodando ou usa webServer automático)

## Testes manuais por perfil

### Admin (admin.alfa@exemplo.test)
- [ ] Login e menu exibe todos os itens (Painel, Agenda, Agendamentos, Pacientes, Profissionais, Serviços, Bloqueios, Clínica, Usuários).
- [ ] Clínica: editar dados, regras, horários, logo.
- [ ] Profissionais: CRUD, foto, serviços vinculados, horários, aviso fora do funcionamento.
- [ ] Serviços: CRUD, busca, filtros.
- [ ] Bloqueios: criar (clínica/profissional), conflito com agendamento, feriados.
- [ ] Usuários: criar, desativar/ativar, redefinir senha, proteção do último admin.
- [ ] Agendamentos: lista com filtros, ações, reagendamento, agendamento manual.
- [ ] Pacientes: CRUD.
- [ ] Painel: indicadores hoje/semana, próximos atendimentos.

### Recepção (recepcao.alfa@exemplo.test)
- [ ] Menu: sem Clínica e Usuários.
- [ ] Serviços: somente leitura.
- [ ] Bloqueios: pode criar/excluir.
- [ ] Agendamentos/Pacientes: pode gerenciar.

### Profissional (ana.alfa@exemplo.test)
- [ ] Menu: sem Clínica, Usuários, Serviços, Bloqueios, Pacientes (apenas próprios).
- [ ] Agenda/Agendamentos: apenas os próprios (somente leitura).
- [ ] Painel: apenas os próprios números.

### Agendamento público (/c/clinica-alfa)
- [ ] Fluxo completo: serviço → profissional → data → horário → dados → confirmação.
- [ ] Dias sem horário desabilitados.
- [ ] Erros amigáveis (slot indisponível, limite de 3, telefone inválido).
- [ ] LGPD: checkbox não pré-marcado; link de política abre modal.
- [ ] Turnstile (se configurado) valida antes de criar.
- [ ] Página de agendamento por token: consultar e cancelar.

### Segurança
- [ ] Isolamento RLS: admin.beta não vê dados da Alfa.
- [ ] Recepção não consegue editar serviço (erro sem_permissao).
- [ ] Último admin não pode ser desativado.
- [ ] Concorrência: dois agendamentos simultâneos no mesmo horário → apenas um vence.
- [ ] Nenhuma chave privada no bundle (verificar .env.local não commitado).

### Responsividade / Acessibilidade
- [ ] Desktop e celular (menu gaveta).
- [ ] Teclado, contraste, foco.