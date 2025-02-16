# Getting Started with MDMAPanel

This guide will help you get up and running with MDMAPanel quickly.

## System Requirements

### Minimum Requirements
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB
- Node.js v16.x or higher
- PostgreSQL v12.x or higher

### Recommended Requirements
- CPU: 4 cores
- RAM: 8GB
- Storage: 40GB
- Node.js v18.x or higher
- PostgreSQL v14.x or higher

## Installation Steps

### 1. System Preparation

#### Linux (Ubuntu/Debian)
```bash
# Update system
sudo apt update && sudo apt upgrade

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
```

#### Windows
1. Download and install Node.js from [nodejs.org](https://nodejs.org/)
2. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/)

### 2. Database Setup

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE mdmapanel;
CREATE USER mdmauser WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mdmapanel TO mdmauser;

# Exit PostgreSQL
\q
```

### 3. Application Installation

```bash
# Clone repository
git clone https://github.com/xtial/mdmapanel.git
cd mdmapanel

# Install dependencies
npm install

# Initialize database
psql -d mdmapanel -f schema.sql
```

### 4. Configuration

Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=postgresql://mdmauser:your_password@localhost:5432/mdmapanel

# Security
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=production

# Email (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASS=your_password
```

### 5. Running the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm run start
```

## Initial Setup

### 1. Create Admin Account
Access the application at `http://localhost:5173/admin/register` and create your first admin account.

### 2. Configure Guild Settings
1. Log in to the admin dashboard
2. Navigate to Guild Settings
3. Configure your guild parameters:
   - Domain settings
   - Notification preferences
   - Security policies

### 3. Add Users
1. Navigate to User Management
2. Create new user accounts
3. Assign appropriate roles and permissions

## Basic Usage

### Dashboard Navigation
- Overview: Real-time target status
- Targets: Detailed target management
- Settings: System configuration
- Users: User management
- Logs: Activity monitoring

### Target Management
1. View target status in real-time
2. Send commands to targets
3. Monitor target activities
4. Generate reports

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```
   Solution: Check PostgreSQL service status and credentials
   ```

2. **WebSocket Connection Error**
   ```
   Solution: Verify port 3000 is open and available
   ```

3. **JWT Token Issues**
   ```
   Solution: Check JWT_SECRET in .env and clear browser cache
   ```

## Next Steps

- Read the [API Documentation](api.md)
- Review [Security Best Practices](security.md)
- Explore [Advanced Features](advanced-features.md)
- Join our [Discord Community](https://discord.gg/your-server)