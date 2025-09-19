-- Verificar configuração de timezone do banco
SHOW timezone;

-- Verificar a data/hora atual no banco
SELECT 
    NOW() as hora_utc,
    NOW() AT TIME ZONE 'America/Sao_Paulo' as hora_brasil,
    CURRENT_TIMESTAMP as timestamp_atual;

-- Verificar tickets criados recentemente
SELECT 
    id,
    ticket_number,
    title,
    created_at as data_utc,
    created_at AT TIME ZONE 'America/Sao_Paulo' as data_brasil,
    TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI:SS') as data_formatada
FROM tickets
ORDER BY created_at DESC
LIMIT 5;

-- Verificar o ticket específico mencionado
SELECT 
    id,
    ticket_number,
    title,
    created_at,
    created_at AT TIME ZONE 'America/Sao_Paulo' as data_brasil,
    TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI') as data_formatada
FROM tickets
WHERE id = 'ce8c3dd9-958a-429f-bac9-e6e786b054e1';

-- Função para formatar datas no padrão brasileiro
CREATE OR REPLACE FUNCTION format_brazil_date(timestamp_utc TIMESTAMPTZ)
RETURNS TEXT AS $$
BEGIN
    RETURN TO_CHAR(
        timestamp_utc AT TIME ZONE 'America/Sao_Paulo', 
        'DD/MM/YYYY "às" HH24:MI'
    );
END;
$$ LANGUAGE plpgsql;

-- Testar a função
SELECT 
    id,
    ticket_number,
    title,
    format_brazil_date(created_at) as criado_em
FROM tickets
ORDER BY created_at DESC
LIMIT 5;