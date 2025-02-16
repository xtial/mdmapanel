# VPS Hosting Guide

## Prerequisites

### VPS Requirements
- **Minimum Specifications**:
  - CPU: 2 cores
  - RAM: 4GB
  - Storage: 40GB SSD
  - OS: Ubuntu 20.04 LTS or newer
- **Recommended Specifications**:
  - CPU: 4 cores
  - RAM: 8GB
  - Storage: 80GB SSD
  - OS: Ubuntu 22.04 LTS

### Domain Requirements
- A registered domain name
- Access to domain's DNS settings
- SSL certificate (Let's Encrypt)

## Initial Server Setup

### 1. Update System
```bash
# Update package list and upgrade system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

### 2. Create Non-Root User
```bash
# Create new user
sudo adduser mdmapanel

# Add to sudo group
sudo usermod -aG sudo mdmapanel

# Switch to new user
su - mdmapanel
```

### 3. Configure SSH
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Set these values
PermitRootLogin no
PasswordAuthentication no
Port 2222  # Change default SSH port

# Restart SSH service
sudo systemctl restart sshd
```

## Install Dependencies

### 1. Node.js
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. PostgreSQL
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER mdmapanel WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE mdmapanel OWNER mdmapanel;"
```

### 3. Nginx
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Application Setup

### 1. Clone Repository
```bash
# Create application directory
mkdir -p ~/apps
cd ~/apps

# Clone repository
git clone https://github.com/xtial/mdmapanel.git
cd mdmapanel

# Install dependencies
npm ci --production
```

### 2. Environment Configuration
```bash
# Create production environment file
nano .env.production

# Add these configurations
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://mdmapanel:your_secure_password@localhost:5432/mdmapanel
JWT_SECRET=your_secure_random_string
VITE_API_URL=https://your-domain.com
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

### 3. Build Application
```bash
# Build the application
npm run build
```

## Process Management

### 1. Install PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 configuration
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'mdmapanel',
    script: 'build/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '1G',
    error_file: 'logs/error.log',
    out_file: 'logs/output.log'
  }]
}
EOL

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
sudo pm2 startup ubuntu
```

## Nginx Configuration

### 1. SSL Certificate
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 2. Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/mdmapanel

# Add this configuration
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

    # SSL configuration
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# Enable site configuration
sudo ln -s /etc/nginx/sites-available/mdmapanel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Security Setup

### 1. Firewall Configuration
```bash
# Install UFW
sudo apt install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp  # SSH port
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. Fail2Ban Installation
```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Create Fail2Ban configuration
sudo nano /etc/fail2ban/jail.local

# Add configuration
[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

## Monitoring Setup

### 1. Setup Monitoring
```bash
# Install monitoring tools
pm2 install pm2-logrotate
pm2 install pm2-server-monit

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 2. Setup Logging
```bash
# Create logs directory
mkdir -p ~/apps/mdmapanel/logs

# Configure application logging
nano ~/apps/mdmapanel/config/logging.js

# Add logging configuration
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});
```

## Backup Configuration

### 1. Setup Automated Backups
```bash
# Create backup script
nano ~/scripts/backup.sh

# Add backup script
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/mdmapanel/backups"

# Database backup
pg_dump -U mdmapanel mdmapanel > $BACKUP_DIR/db_backup_$TIMESTAMP.sql

# Configuration backup
tar -czf $BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz \
    ~/apps/mdmapanel/.env* \
    ~/apps/mdmapanel/config

# Make executable
chmod +x ~/scripts/backup.sh

# Add to crontab
crontab -e

# Add this line
0 0 * * * /home/mdmapanel/scripts/backup.sh
```

## Maintenance Procedures

### Regular Maintenance Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart services
sudo systemctl restart nginx
pm2 reload all

# Check logs
pm2 logs
sudo tail -f /var/log/nginx/error.log

# Monitor system resources
htop
pm2 monit
```

## Troubleshooting

### Common Issues

1. **Application Not Starting**
```bash
# Check PM2 logs
pm2 logs mdmapanel

# Check system logs
journalctl -u pm2-mdmapanel
```

2. **Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"
```

3. **Nginx Issues**
```bash
# Check Nginx configuration
sudo nginx -t
sudo systemctl status nginx
```

## Performance Optimization

### 1. Node.js Optimization
```bash
# Update PM2 configuration
pm2 reload mdmapanel --node-args="--max-old-space-size=4096"
```

### 2. Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
```

### 3. PostgreSQL Optimization
```sql
-- Add indexes for frequently accessed columns
CREATE INDEX idx_targets_status ON targets(status);
CREATE INDEX idx_targets_belongsto ON targets(belongsto);
``` 