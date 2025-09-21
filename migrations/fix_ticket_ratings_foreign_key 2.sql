-- CORREÇÃO: Alterar foreign key para apontar para tabela users em vez de auth.users

-- 1. Primeiro, remover a constraint existente
ALTER TABLE ticket_ratings 
DROP CONSTRAINT IF EXISTS ticket_ratings_user_id_fkey;

-- 2. Adicionar nova constraint apontando para a tabela users
ALTER TABLE ticket_ratings 
ADD CONSTRAINT ticket_ratings_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 3. Verificar se a constraint foi criada corretamente
-- SELECT conname, conrelid::regclass, confrelid::regclass 
-- FROM pg_constraint 
-- WHERE conname = 'ticket_ratings_user_id_fkey';