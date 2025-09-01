-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- ticket_created, ticket_updated, ticket_assigned, comment_added, etc
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, error, success
    data JSONB, -- Dados adicionais (ticket_id, comment_id, etc)
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Para notificações temporárias
    action_url TEXT -- URL para onde redirecionar ao clicar
);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Tabela de preferências de notificação do usuário
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Preferências gerais
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    
    -- Preferências por tipo de notificação
    ticket_created JSONB DEFAULT '{"email": true, "push": true, "in_app": true}'::jsonb,
    ticket_assigned JSONB DEFAULT '{"email": true, "push": true, "in_app": true}'::jsonb,
    ticket_updated JSONB DEFAULT '{"email": true, "push": false, "in_app": true}'::jsonb,
    ticket_resolved JSONB DEFAULT '{"email": true, "push": true, "in_app": true}'::jsonb,
    comment_added JSONB DEFAULT '{"email": false, "push": false, "in_app": true}'::jsonb,
    comment_mention JSONB DEFAULT '{"email": true, "push": true, "in_app": true}'::jsonb,
    
    -- Horário de silêncio
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    
    -- Frequência de emails
    email_frequency VARCHAR(20) DEFAULT 'instant', -- instant, hourly, daily, weekly
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de dispositivos para push notifications
CREATE TABLE IF NOT EXISTS user_push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL, -- p256dh e auth keys
    device_info JSONB, -- Informações do dispositivo (browser, OS, etc)
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

-- Tabela de templates de email
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    variables JSONB, -- Lista de variáveis disponíveis no template
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir templates de email padrão
INSERT INTO email_templates (name, subject, html_body, text_body, variables) VALUES
('ticket_created', 'Novo Chamado Criado: {{ticket_title}}', 
'<h2>Novo Chamado #{{ticket_number}}</h2><p>Um novo chamado foi criado.</p><p><strong>Título:</strong> {{ticket_title}}</p><p><strong>Prioridade:</strong> {{priority}}</p><p><strong>Criado por:</strong> {{created_by}}</p><p><a href="{{ticket_url}}">Ver Chamado</a></p>',
'Novo Chamado #{{ticket_number}}\n\nUm novo chamado foi criado.\n\nTítulo: {{ticket_title}}\nPrioridade: {{priority}}\nCriado por: {{created_by}}\n\nVer chamado: {{ticket_url}}',
'{"ticket_number": "Número do chamado", "ticket_title": "Título do chamado", "priority": "Prioridade", "created_by": "Nome do criador", "ticket_url": "URL do chamado"}'::jsonb),

('ticket_assigned', 'Chamado Atribuído: {{ticket_title}}', 
'<h2>Chamado #{{ticket_number}} Atribuído</h2><p>Um chamado foi atribuído a você.</p><p><strong>Título:</strong> {{ticket_title}}</p><p><strong>Prioridade:</strong> {{priority}}</p><p><strong>Atribuído por:</strong> {{assigned_by}}</p><p><a href="{{ticket_url}}">Ver Chamado</a></p>',
'Chamado #{{ticket_number}} Atribuído\n\nUm chamado foi atribuído a você.\n\nTítulo: {{ticket_title}}\nPrioridade: {{priority}}\nAtribuído por: {{assigned_by}}\n\nVer chamado: {{ticket_url}}',
'{"ticket_number": "Número do chamado", "ticket_title": "Título do chamado", "priority": "Prioridade", "assigned_by": "Nome de quem atribuiu", "ticket_url": "URL do chamado"}'::jsonb),

('comment_mention', 'Você foi mencionado em um comentário', 
'<h2>Você foi mencionado</h2><p>{{mentioned_by}} mencionou você em um comentário no chamado #{{ticket_number}}.</p><p><strong>Comentário:</strong></p><blockquote>{{comment_preview}}</blockquote><p><a href="{{comment_url}}">Ver Comentário</a></p>',
'Você foi mencionado\n\n{{mentioned_by}} mencionou você em um comentário no chamado #{{ticket_number}}.\n\nComentário:\n{{comment_preview}}\n\nVer comentário: {{comment_url}}',
'{"mentioned_by": "Nome de quem mencionou", "ticket_number": "Número do chamado", "comment_preview": "Prévia do comentário", "comment_url": "URL do comentário"}'::jsonb);

-- Função para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title VARCHAR(255),
    p_message TEXT,
    p_type VARCHAR(50),
    p_severity VARCHAR(20) DEFAULT 'info',
    p_data JSONB DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, severity, data, action_url)
    VALUES (p_user_id, p_title, p_message, p_type, p_severity, p_data, p_action_url)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID) RETURNS VOID AS $$
BEGIN
    UPDATE notifications 
    SET read = TRUE, read_at = CURRENT_TIMESTAMP 
    WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar todas as notificações de um usuário como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID) RETURNS VOID AS $$
BEGIN
    UPDATE notifications 
    SET read = TRUE, read_at = CURRENT_TIMESTAMP 
    WHERE user_id = p_user_id AND read = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar preferências padrão quando um novo usuário é criado
CREATE OR REPLACE FUNCTION create_default_notification_preferences() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_default_notification_preferences();

-- Criar preferências para usuários existentes
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;