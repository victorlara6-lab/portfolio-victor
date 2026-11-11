-- =========================================================================
-- CLÍNICA VITALIS — Estrutura do banco de dados (SQLite)
-- -------------------------------------------------------------------------
-- Este arquivo é executado automaticamente pelo servidor Python
-- (backend-python/servidor.py) na primeira vez que ele roda.
-- "IF NOT EXISTS" garante que rodar de novo não apaga nada.
-- =========================================================================

CREATE TABLE IF NOT EXISTS agendamentos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    protocolo      TEXT    NOT NULL UNIQUE,              -- ex.: VIT-20261111-0001
    nome           TEXT    NOT NULL CHECK (length(nome) >= 3),
    telefone       TEXT    NOT NULL CHECK (length(telefone) BETWEEN 10 AND 11),
    email          TEXT,
    especialidade  TEXT    NOT NULL,
    medico_id      TEXT    NOT NULL,                     -- id do médico (dados/clinica.json)
    data           TEXT    NOT NULL,                     -- formato AAAA-MM-DD
    horario        TEXT    NOT NULL,                     -- formato HH:MM
    observacoes    TEXT,
    status         TEXT    NOT NULL DEFAULT 'pendente'
                   CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'concluido')),
    criado_em      TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Impede que o mesmo médico tenha duas consultas no mesmo dia e horário.
-- Agendamentos cancelados não contam (o horário volta a ficar livre).
CREATE UNIQUE INDEX IF NOT EXISTS idx_horario_unico
    ON agendamentos (medico_id, data, horario)
    WHERE status <> 'cancelado';

-- Índice para deixar rápidas as buscas por data (usadas no painel e no site)
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos (data);
