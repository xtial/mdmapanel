# Deployment Guide

## Development Environment

### Local Development Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/xtial/mdmapanel.git
   cd mdmapanel
   npm install
   ```

2. **Development Environment Variables**
   Create `.env.development`:
   ```env
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mdmapanel
   JWT_SECRET=dev_secret_key
   VITE_API_URL=http://localhost:3000
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_mailtrap_user
   SMTP_PASS=your_mailtrap_password
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1: Start the Socket.IO server
   npm run dev:server

   # Terminal 2: Start the SvelteKit dev server
   npm run dev
   ```

4. **Development Database**
   ```bash
   # Create development database
   createdb mdmapanel_dev

   # Apply schema
   psql -d mdmapanel_dev -f schema.sql

   # Load sample data
   psql -d mdmapanel_dev -f seed.sql
   ```

### Development Best Practices

1. **Code Quality**
   ```bash
   # Run linter
   npm run lint

   # Run type checking
   npm run check

   # Format code
   npm run format
   ```

2. **Testing**
   ```bash
   # Run tests
   npm run test

   # Run tests with coverage
   npm run test:coverage
   ```

3. **Git Workflow**
   ```bash
   # Create feature branch
   git checkout -b feature/your-feature

   # Commit with conventional commits
   git commit -m "feat: add new feature"

   # Push and create PR
   git push origin feature/your-feature
   ```

## Production Deployment

### Prerequisites
- Domain name
- SSL certificate
- Production PostgreSQL database
- Node.js hosting (e.g., DigitalOcean, AWS, etc.)
- Redis (optional, for session storage)

### Server Setup

1. **Server Requirements**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install PM2
   npm install -g pm2

   # Install nginx
   sudo apt install nginx
   ```

2. **PostgreSQL Setup**
   ```bash
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib

   # Create production database
   sudo -u postgres createdb mdmapanel_prod

   # Create production user
   sudo -u postgres createuser --pwprompt mdmapanel_user

   # Grant privileges
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mdmapanel_prod TO mdmapanel_user;"
   ```

3. **Application Deployment**
   ```bash
   # Clone repository
   git clone https://github.com/xtial/mdmapanel.git
   cd mdmapanel

   # Install dependencies
   npm ci --production

   # Build application
   npm run build
   ```

4. **Production Environment Variables**
   Create `.env.production`:
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://mdmapanel_user:password@localhost:5432/mdmapanel_prod
   JWT_SECRET=your_secure_random_string
   VITE_API_URL=https://your-domain.com
   SMTP_HOST=smtp.provider.com
   SMTP_PORT=587
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   REDIS_URL=redis://localhost:6379
   ```

5. **Nginx Configuration**
   ```nginx
   # /etc/nginx/sites-available/mdmapanel
   server {
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /socket.io/ {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }

       listen 443 ssl;
       ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
   }
   ```

6. **Process Management**
   ```bash
   # Create PM2 ecosystem file
   cat > ecosystem.config.js << EOL
   module.exports = {
     apps: [{
       name: 'mdmapanel',
       script: 'build/index.js',
       instances: 'max',
       exec_mode: 'cluster',
       env_production: {
         NODE_ENV: 'production'
       }
     }]
   }
   EOL

   # Start application
   pm2 start ecosystem.config.js --env production
   ```

### Security Measures

1. **Firewall Configuration**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **SSL Setup with Let's Encrypt**
   ```bash
   # Install certbot
   sudo apt install certbot python3-certbot-nginx

   # Get SSL certificate
   sudo certbot --nginx -d your-domain.com
   ```

3. **Database Backup**
   ```bash
   # Create backup script
   cat > backup.sh << EOL
   #!/bin/bash
   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
   pg_dump -U mdmapanel_user mdmapanel_prod > backup_$TIMESTAMP.sql
   EOL

   # Make executable
   chmod +x backup.sh

   # Add to crontab
   crontab -e
   # Add: 0 0 * * * /path/to/backup.sh
   ```

### Monitoring

1. **PM2 Monitoring**
   ```bash
   # Monitor processes
   pm2 monit

   # View logs
   pm2 logs mdmapanel

   # Setup PM2 monitoring
   pm2 install pm2-logrotate
   ```

2. **Application Monitoring**
   ```javascript
   // Add to server.js
   if (process.env.NODE_ENV === 'production') {
     require('@pm2/io').init({
       metrics: {
         network: true,
         http: true
       }
     });
   }
   ```

### Scaling

1. **Horizontal Scaling**
   ```bash
   # Scale application
   pm2 scale mdmapanel +2

   # Load balancing is handled automatically by PM2
   ```

2. **Database Scaling**
   ```bash
   # Configure connection pooling in config.ts
   const pool = new Pool({
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

### Maintenance

1. **Updates**
   ```bash
   # Pull latest changes
   git pull origin main

   # Install dependencies
   npm ci --production

   # Build
   npm run build

   # Restart application
   pm2 reload mdmapanel
   ```

2. **Rollback Procedure**
   ```bash
   # If issues occur
   git reset --hard HEAD^
   npm ci --production
   npm run build
   pm2 reload mdmapanel
   ```

### Troubleshooting

1. **Check Logs**
   ```bash
   # Application logs
   pm2 logs mdmapanel

   # Nginx logs
   sudo tail -f /var/log/nginx/error.log

   # System logs
   sudo journalctl -u nginx
   ```

2. **Common Issues**
   - Database connection issues: Check PostgreSQL service
   - WebSocket disconnects: Check Nginx proxy settings
   - Memory issues: Monitor with `pm2 monit`

### Performance Optimization

1. **Node.js Optimization**
   ```bash
   # Set Node.js flags in PM2
   pm2 start ecosystem.config.js --node-args="--max-old-space-size=4096"
   ```

2. **Nginx Optimization**
   ```nginx
   # Add to nginx.conf
   worker_processes auto;
   worker_connections 1024;
   keepalive_timeout 65;
   gzip on;
   ```

3. **Database Optimization**
   ```sql
   -- Add indexes for frequently accessed columns
   CREATE INDEX idx_targets_status ON targets(status);
   CREATE INDEX idx_targets_belongsto ON targets(belongsto);
   ``` 