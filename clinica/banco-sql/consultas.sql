-- =========================================================================
-- CLÍNICA VITALIS — Consultas SQL usadas pelo servidor e pelo painel
-- -------------------------------------------------------------------------
-- Cada bloco começa com "-- name: nome_da_consulta".
-- O servidor Python lê este arquivo e guarda cada consulta pelo nome,
-- assim o SQL fica separado do código Python (mais organizado).
-- Os "?" são preenchidos pelo Python com segurança (evita SQL Injection).
-- =========================================================================

-- name: inserir_agendamento
INSERT INTO agendamentos
    (protocolo, nome, telefone, email, especialidade, medico_id, data, horario, observacoes)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: horarios_ocupados_do_medico
-- Horários já reservados de um médico em uma data
SELECT horario
FROM agendamentos
WHERE medico_id = ? AND data = ? AND status <> 'cancelado';

-- name: contar_agendamentos_do_dia
-- Quantos agendamentos já existem na data (usado para gerar o protocolo)
SELECT COUNT(*) FROM agendamentos WHERE data = ?;

-- name: listar_agendamentos
-- Lista para o painel, com filtros opcionais (data e status).
-- Se o filtro vier vazio (''), ele é ignorado.
SELECT id, protocolo, nome, telefone, email, especialidade, medico_id,
       data, horario, observacoes, status, criado_em
FROM agendamentos
WHERE (? = '' OR data = ?)
  AND (? = '' OR status = ?)
ORDER BY data, horario;

-- name: atualizar_status
UPDATE agendamentos SET status = ? WHERE id = ?;

-- name: resumo_geral
-- Números para os cards do painel
SELECT
    COUNT(*)                                                    AS total,
    SUM(CASE WHEN data = date('now', 'localtime') THEN 1 ELSE 0 END) AS hoje,
    SUM(CASE WHEN status = 'pendente'   THEN 1 ELSE 0 END)      AS pendentes,
    SUM(CASE WHEN status = 'confirmado' THEN 1 ELSE 0 END)      AS confirmados,
    SUM(CASE WHEN status = 'cancelado'  THEN 1 ELSE 0 END)      AS cancelados
FROM agendamentos;

-- name: resumo_por_especialidade
-- Ranking de especialidades mais procuradas (sem contar cancelados)
SELECT especialidade, COUNT(*) AS quantidade
FROM agendamentos
WHERE status <> 'cancelado'
GROUP BY especialidade
ORDER BY quantidade DESC;
