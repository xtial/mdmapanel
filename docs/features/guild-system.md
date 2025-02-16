# Guild System

## Overview

The Guild System is a core feature of MDMAPanel that enables multi-tenant isolation and management. Each guild represents a separate organization with its own users, targets, and settings.

## Features

### Guild Management
- Multi-tenant isolation
- Custom domain support
- Guild-specific settings
- User management
- Resource allocation

### Domain Management
```javascript
// Example domain configuration
{
  guild: "example_guild",
  domains: [
    {
      url: "example.com",
      template: "default",
      settings: {
        redirects: true,
        customScripts: true
      }
    }
  ]
}
```

### User Hierarchy
- Guild Administrators
- Guild Managers
- Standard Users
- Viewers

## Configuration

### Guild Setup
```sql
-- Create new guild
INSERT INTO guildsettings (guild, hideseed) 
VALUES ('new_guild', false);

-- Add guild domain
INSERT INTO guilddomains (guild, url, template)
VALUES ('new_guild', 'example.com', 'default');
```

### Domain Configuration
```nginx
# Nginx configuration for guild domains
server {
    server_name ~^(?<guild>.+)\.yourdomain\.com$;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Guild $guild;
    }
}
```

## Usage

### Creating a New Guild
1. Access the admin dashboard
2. Navigate to Guild Management
3. Click "Create New Guild"
4. Configure basic settings:
   - Guild name
   - Domain settings
   - Security policies
   - Resource limits

### Managing Guild Users
```javascript
// Add user to guild
const addUserToGuild = async (username, guild) => {
  await db.query(
    'INSERT INTO users (username, guild, rank) VALUES ($1, $2, $3)',
    [username, guild, 'user']
  );
};
```

### Domain Management
1. Add domains through admin panel
2. Configure DNS settings
3. Set up SSL certificates
4. Configure domain templates

## Security

### Guild Isolation
- Separate database schemas
- Isolated WebSocket rooms
- Guild-specific encryption keys
- Access control policies

### Cross-Guild Protection
```javascript
// Middleware to verify guild access
const verifyGuildAccess = (req, res, next) => {
  if (req.user.guild !== req.params.guild) {
    return res.status(403).json({ error: 'Guild access denied' });
  }
  next();
};
```

## API Endpoints

### Guild Management
```http
# Create guild
POST /api/guild/create
Content-Type: application/json

{
  "name": "new_guild",
  "settings": {
    "hideseed": false,
    "maxUsers": 100
  }
}

# Update guild settings
PUT /api/guild/:guildId/settings
Content-Type: application/json

{
  "settings": {
    "hideseed": true
  }
}
```

### Domain Management
```http
# Add domain to guild
POST /api/guild/:guildId/domains
Content-Type: application/json

{
  "url": "example.com",
  "template": "default"
}
```

## WebSocket Events

### Guild Room Events
```javascript
// Join guild room
socket.on('joinGuild', (guildId) => {
  socket.join(`guild:${guildId}`);
});

// Guild-wide broadcast
io.to(`guild:${guildId}`).emit('guildUpdate', {
  type: 'settings_changed',
  data: newSettings
});
```

## Database Schema

### Guild Tables
```sql
-- Guild settings
CREATE TABLE guildsettings (
    guild VARCHAR PRIMARY KEY,
    hideseed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guild domains
CREATE TABLE guilddomains (
    guild VARCHAR NOT NULL,
    url VARCHAR PRIMARY KEY,
    template VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Best Practices

### Guild Setup
1. Use meaningful guild names
2. Configure security settings first
3. Set up monitoring and alerts
4. Document guild-specific rules

### Domain Management
1. Verify domain ownership
2. Use SSL certificates
3. Configure backup domains
4. Monitor domain health

### User Management
1. Follow least privilege principle
2. Regular access reviews
3. Monitor user activities
4. Implement role rotation

## Troubleshooting

### Common Issues

1. **Domain Configuration**
   ```
   Problem: Domain not resolving
   Solution: Verify DNS settings and SSL certificates
   ```

2. **Guild Access**
   ```
   Problem: Users can't access guild
   Solution: Check user permissions and guild status
   ```

3. **Cross-Guild Issues**
   ```
   Problem: Data leakage between guilds
   Solution: Verify guild isolation settings
   ```

## Monitoring

### Guild Metrics
```javascript
// Monitor guild activity
const monitorGuild = (guildId) => {
  return {
    activeUsers: getActiveUsers(guildId),
    resourceUsage: getResourceUsage(guildId),
    domainStatus: checkDomainStatus(guildId)
  };
};
```

### Health Checks
1. Domain availability
2. Database connections
3. WebSocket rooms
4. User sessions

## Maintenance

### Regular Tasks
- Audit guild permissions
- Update domain certificates
- Clean up inactive users
- Optimize guild resources

### Backup Procedures
```bash
#!/bin/bash
# Backup guild data
pg_dump -t 'guild*' -d mdmapanel > guild_backup.sql
``` 