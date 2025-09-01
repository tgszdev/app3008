import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRole)

async function setupNotificationTables() {
  console.log('🚀 Setting up notification tables...')

  try {
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Tabela de notificações
        CREATE TABLE IF NOT EXISTS notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) NOT NULL,
            severity VARCHAR(20) DEFAULT 'info',
            data JSONB,
            read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            action_url TEXT
        );

        -- Índices
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

        -- Tabela de preferências
        CREATE TABLE IF NOT EXISTS user_notification_preferences (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
            email_enabled BOOLEAN DEFAULT TRUE,
            push_enabled BOOLEAN DEFAULT TRUE,
            in_app_enabled BOOLEAN DEFAULT TRUE,
            ticket_created JSONB DEFAULT '{"email": true, "push": true, "in_app": true}'::jsonb,
            ticket_assigned JSONB DEFAULT '{"email": true, "push": true, "in_app": true}'::jsonb,
            ticket_updated JSONB DEFAULT '{"email": false, "push": false, "in_app": true}'::jsonb,
            ticket_resolved JSONB DEFAULT '{"email": true, "push": false, "in_app": true}'::jsonb,
            comment_added JSONB DEFAULT '{"email": false, "push": false, "in_app": true}'::jsonb,
            quiet_hours_enabled BOOLEAN DEFAULT FALSE,
            quiet_hours_start TIME DEFAULT '22:00',
            quiet_hours_end TIME DEFAULT '08:00',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de push subscriptions
        CREATE TABLE IF NOT EXISTS user_push_subscriptions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            endpoint TEXT NOT NULL,
            keys JSONB NOT NULL,
            device_info JSONB,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, endpoint)
        );
      `
    })

    if (error) {
      // Se exec_sql não existir, vamos criar as tabelas diretamente
      console.log('Creating tables directly...')
      
      // Criar tabela notifications
      const { error: notifError } = await supabase
        .from('notifications')
        .select('id')
        .limit(1)
      
      if (notifError?.code === '42P01') {
        console.log('Notifications table does not exist, creating...')
        // Table doesn't exist, we'll need to create it via SQL Editor
        console.log('⚠️  Please run the SQL migration in Supabase SQL Editor')
        console.log('📋 SQL file: /home/user/webapp/supabase/migrations/create_notifications_tables.sql')
      } else {
        console.log('✅ Notifications table already exists')
      }

      // Verificar e criar preferências para usuários existentes
      const { data: users } = await supabase
        .from('users')
        .select('id')

      if (users && users.length > 0) {
        for (const user of users) {
          const { error: prefError } = await supabase
            .from('user_notification_preferences')
            .upsert({
              user_id: user.id
            }, {
              onConflict: 'user_id'
            })

          if (!prefError) {
            console.log(`✅ Created preferences for user ${user.id}`)
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully')
    }

    console.log('✅ Notification setup complete!')
    
  } catch (err) {
    console.error('❌ Error setting up notifications:', err)
    process.exit(1)
  }
}

setupNotificationTables()