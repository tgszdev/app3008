# Email Configuration System

## Overview
The email notification system has been updated to use database-stored configuration instead of environment variables. This allows administrators to configure email settings through the web interface without needing server access or environment variable changes.

## Configuration Methods

### 1. Web Interface (Recommended)
- Navigate to `/dashboard/settings`
- Enter your Gmail email and App Password
- Configure SMTP settings (default values work for Gmail)
- Save the configuration

### 2. Environment Variables (Fallback)
If no database configuration exists, the system will fall back to environment variables:
- `SMTP_USER`: Gmail email address
- `SMTP_PASS`: Gmail App Password
- `SMTP_HOST`: SMTP server (default: smtp.gmail.com)
- `SMTP_PORT`: SMTP port (default: 587)
- `EMAIL_FROM`: From email address
- `EMAIL_FROM_NAME`: From name (default: Sistema de Suporte Técnico)

## How It Works

### Configuration Storage
1. Email settings are stored in the `system_settings` table with key `email_config`
2. Passwords are encrypted using AES-256-CBC before storage
3. Configuration is cached for 5 minutes to reduce database queries

### Configuration Priority
1. **Database First**: System checks `system_settings` table for `email_config`
2. **Environment Fallback**: If not found in database, checks environment variables
3. **No Configuration**: Returns error if neither source has configuration

### Email Sending Flow
```typescript
1. sendEmail() or sendNotificationEmail() is called
2. getEmailConfig() fetches configuration:
   - Check cache (valid for 5 minutes)
   - Query database for system_settings
   - Fall back to environment variables if needed
3. createEmailTransporter() creates nodemailer transport
4. Email is sent using the configured SMTP settings
```

## Security Features

### Password Encryption
- Passwords are encrypted using AES-256-CBC algorithm
- Encryption key from `ENCRYPTION_KEY` env variable (or default)
- Passwords are never stored in plain text in the database

### Cache Management
- Configuration cached for 5 minutes to reduce database queries
- Cache automatically cleared when settings are updated
- Manual cache clear available via `clearEmailConfigCache()`

## Testing Email Configuration

### Via Web Interface
1. Go to `/dashboard/settings/notifications`
2. Click "Teste Email" button
3. Check your inbox for the test email

### Via API
```bash
# Check configuration status
curl http://localhost:3000/api/test-email

# Send test email (requires authentication)
curl -X POST http://localhost:3000/api/test-email \
  -H "Cookie: [auth-cookie]"
```

## Gmail App Password Setup

### Creating an App Password
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification if not already enabled
3. Search for "App passwords"
4. Create a new app password for "Mail"
5. Copy the 16-character password (remove spaces)
6. Use this password in the email configuration

### Common Issues
- **Authentication Failed**: Ensure you're using an App Password, not your regular Gmail password
- **Connection Timeout**: Check firewall settings for port 587
- **Invalid Login**: Verify 2-Step Verification is enabled on your Google account

## Files Modified

### Core Email Module
- `/src/lib/email-config.ts`: Main email configuration and sending logic

### API Routes
- `/src/app/api/settings/email/route.ts`: Save/retrieve email configuration
- `/src/app/api/test-email/route.ts`: Test email sending endpoint

### UI Components
- `/src/app/dashboard/settings/page.tsx`: Email configuration UI
- `/src/app/dashboard/settings/notifications/page.tsx`: Notification preferences with test button

## Database Schema

### system_settings Table
```sql
CREATE TABLE system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id)
);
```

### Email Configuration JSON Structure
```json
{
  "service": "smtp",
  "host": "smtp.gmail.com",
  "port": "587",
  "secure": false,
  "user": "your-email@gmail.com",
  "pass": "encrypted-app-password",
  "from": "your-email@gmail.com",
  "fromName": "Sistema de Suporte Técnico"
}
```

## Troubleshooting

### Email Not Sending
1. Check configuration exists in database: `/dashboard/settings`
2. Verify App Password is correct (16 characters, no spaces)
3. Check `/api/test-email` response for specific error messages
4. Review server logs for detailed error information

### Configuration Not Loading
1. Ensure `system_settings` table exists in database
2. Check database connection is working
3. Verify user has admin role to access settings
4. Clear browser cache and reload page

### Cache Issues
- Configuration changes take up to 5 minutes to propagate
- Settings page automatically clears cache when saving
- Restart server to force immediate cache clear

## Future Improvements
- Support for other email providers (SendGrid, Mailgun, etc.)
- Email template management via UI
- Email sending logs and analytics
- Queue system for bulk email sending
- Support for attachments and rich HTML templates