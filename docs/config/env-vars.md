# Environment Variables Configuration

## Overview

MDMAPanel uses environment variables for configuration. This document details all available environment variables and their usage.

## Core Configuration

### Database
```env
# PostgreSQL connection
DATABASE_URL=postgresql://user:password@localhost:5432/mdmapanel
DATABASE_SSL=false
DATABASE_MAX_CONNECTIONS=20
DATABASE_IDLE_TIMEOUT=10000
```

### Server
```env
# Server configuration
PORT=3000
NODE_ENV=development
HOST=0.0.0.0
API_URL=http://localhost:3000
```

### Security
```env
# JWT configuration
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# Encryption
ENCRYPTION_KEY=your_secure_encryption_key
ENCRYPTION_ALGORITHM=aes-256-cbc
```

## Feature Configuration

### Guild System
```env
# Guild settings
DEFAULT_GUILD=default
MAX_GUILDS_PER_USER=5
GUILD_CREATION_ENABLED=true
```

### Email Notifications
```env
# SMTP configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_SECURE=true
SMTP_FROM=noreply@yourdomain.com
```

### WebSocket
```env
# WebSocket configuration
WS_PORT=3001
WS_PATH=/socket.io
WS_CORS_ORIGIN=http://localhost:5173
```

## Development Configuration

### Development Mode
```env
# Development settings
DEBUG=true
DEBUG_LEVEL=verbose
ENABLE_LOGGING=true
LOG_FORMAT=dev
```

### Testing
```env
# Test configuration
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/mdmapanel_test
TEST_JWT_SECRET=test_secret
MOCK_SMTP=true
```

## Production Configuration

### Production Mode
```env
# Production settings
NODE_ENV=production
ENABLE_COMPRESSION=true
TRUST_PROXY=true
```

### SSL/TLS
```env
# SSL configuration
SSL_ENABLED=true
SSL_KEY=/path/to/privkey.pem
SSL_CERT=/path/to/fullchain.pem
```

### Caching
```env
# Redis configuration (optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
CACHE_TTL=3600
```

## Example Configurations

### Development
```env
# Development environment
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mdmapanel
JWT_SECRET=dev_secret
SMTP_HOST=smtp.mailtrap.io
DEBUG=true
```

### Production
```env
# Production environment
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://prod_user:secure_pass@db.example.com:5432/mdmapanel_prod
JWT_SECRET=your_secure_production_secret
SMTP_HOST=smtp.sendgrid.net
SSL_ENABLED=true
```

### Testing
```env
# Test environment
NODE_ENV=test
PORT=3000
DATABASE_URL=postgresql://test:test@localhost:5432/mdmapanel_test
JWT_SECRET=test_secret
MOCK_SMTP=true
```

## Variable Types and Validation

### String Variables
- `JWT_SECRET`
- `DATABASE_URL`
- `SMTP_HOST`
- `ENCRYPTION_KEY`

### Boolean Variables
- `SSL_ENABLED`
- `DEBUG`
- `MOCK_SMTP`
- `TRUST_PROXY`

### Numeric Variables
- `PORT`
- `CACHE_TTL`
- `DATABASE_MAX_CONNECTIONS`
- `MAX_GUILDS_PER_USER`

## Security Considerations

### Sensitive Variables
The following variables should be treated as sensitive:
- `JWT_SECRET`
- `DATABASE_URL`
- `SMTP_PASS`
- `ENCRYPTION_KEY`
- `REDIS_PASSWORD`

### Best Practices
1. Use `.env` files for local development
2. Never commit `.env` files to version control
3. Use secure secrets in production
4. Rotate secrets regularly
5. Use environment-specific files:
   - `.env.development`
   - `.env.production`
   - `.env.test`

## Deployment

### Environment File
```env
# .env.example
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/mdmapanel
JWT_SECRET=your_secure_jwt_secret
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SSL_ENABLED=true
SSL_KEY=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

### Docker Environment
```dockerfile
# Dockerfile environment
ENV NODE_ENV=production
ENV PORT=3000
ENV SSL_ENABLED=true
```

## Troubleshooting

### Common Issues

1. **Database Connection**
   ```
   Problem: DATABASE_URL not properly formatted
   Solution: Ensure URL follows postgresql://user:pass@host:port/db
   ```

2. **JWT Authentication**
   ```
   Problem: JWT_SECRET not set
   Solution: Set a secure random string for JWT_SECRET
   ```

3. **SMTP Configuration**
   ```
   Problem: Email sending fails
   Solution: Verify SMTP_* variables are correctly set
   ```

## Maintenance

### Regular Tasks
1. Review and update secrets
2. Verify SSL certificate paths
3. Check database connection settings
4. Update SMTP configuration

### Backup
1. Document all environment variables
2. Store secure copies of production values
3. Maintain backup configuration files 