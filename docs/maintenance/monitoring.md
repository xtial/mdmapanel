# Monitoring Guide

## Overview

This guide outlines the monitoring setup and procedures for MDMAPanel, ensuring optimal system performance, reliability, and security.

## System Monitoring

### Server Metrics

#### Resource Monitoring
```javascript
// monitor-resources.js
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const monitorResources = async () => {
  const metrics = {
    cpu: os.loadavg()[0],
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
    },
    uptime: os.uptime()
  };

  if (metrics.cpu > 80 || metrics.memory.usage > 90) {
    await sendAlert('High Resource Usage', metrics);
  }

  return metrics;
};
```

#### Disk Usage
```bash
#!/bin/bash
# monitor-disk.sh
THRESHOLD=90

# Check disk usage
USAGE=$(df -h | grep '/dev/sda1' | awk '{ print $5 }' | sed 's/%//g')

if [ $USAGE -gt $THRESHOLD ]; then
  echo "Warning: Disk usage at ${USAGE}%"
  # Send alert
fi
```

### Application Monitoring

#### API Performance
```javascript
// monitor-api.js
app.use(async (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.recordApiCall({
      path: req.path,
      method: req.method,
      duration,
      status: res.statusCode
    });
    
    if (duration > 1000) {
      sendAlert('Slow API Response', {
        path: req.path,
        duration
      });
    }
  });
  
  next();
});
```

#### Error Tracking
```javascript
// error-tracking.js
const errorMetrics = {
  errors: new Map(),
  window: 60000, // 1 minute
  threshold: 10
};

const trackError = (error) => {
  const count = errorMetrics.errors.get(error.code) || 0;
  errorMetrics.errors.set(error.code, count + 1);

  if (count > errorMetrics.threshold) {
    sendAlert('High Error Rate', {
      code: error.code,
      count,
      window: errorMetrics.window
    });
  }
};
```

### Database Monitoring

#### Connection Pool
```javascript
// monitor-db.js
const monitorDatabase = async () => {
  const metrics = await pool.query(`
    SELECT 
      count(*) as total_connections,
      count(*) filter (where state = 'active') as active_connections,
      count(*) filter (where state = 'idle') as idle_connections,
      count(*) filter (where state = 'waiting') as waiting_connections
    FROM pg_stat_activity
  `);

  if (metrics.active_connections > pool.max * 0.8) {
    sendAlert('High Database Connections', metrics);
  }

  return metrics;
};
```

#### Query Performance
```javascript
// monitor-queries.js
const monitorQueries = async () => {
  const slowQueries = await pool.query(`
    SELECT 
      pid,
      now() - query_start as duration,
      query,
      state
    FROM pg_stat_activity
    WHERE state != 'idle'
      AND now() - query_start > interval '5 seconds'
    ORDER BY duration DESC
  `);

  if (slowQueries.rows.length > 0) {
    sendAlert('Slow Queries Detected', slowQueries.rows);
  }
};
```

### WebSocket Monitoring

#### Connection Status
```javascript
// monitor-websocket.js
const monitorWebSocket = () => {
  const metrics = {
    connections: io.engine.clientsCount,
    rooms: io.sockets.adapter.rooms.size,
    events: getEventMetrics()
  };

  if (metrics.connections > MAX_CONNECTIONS) {
    sendAlert('High WebSocket Connections', metrics);
  }

  return metrics;
};
```

#### Event Latency
```javascript
// monitor-latency.js
const latencyStats = {
  samples: [],
  threshold: 1000 // 1 second
};

io.on('connection', (socket) => {
  setInterval(() => {
    const start = Date.now();
    socket.emit('ping');
    socket.on('pong', () => {
      const latency = Date.now() - start;
      latencyStats.samples.push(latency);
      
      if (latency > latencyStats.threshold) {
        sendAlert('High Latency', { socketId: socket.id, latency });
      }
    });
  }, 30000);
});
```

## Logging

### Application Logs
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'error.log',
      level: 'error'
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    })
  ]
});

// Production logging
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Access Logs
```javascript
// access-logger.js
const morgan = require('morgan');

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use(morgan('combined', { stream: accessLogStream }));
```

## Alerting

### Alert Configuration
```javascript
// alerts-config.js
const alertConfig = {
  channels: {
    email: {
      enabled: true,
      recipients: ['admin@example.com']
    },
    slack: {
      enabled: true,
      webhook: process.env.SLACK_WEBHOOK
    },
    sms: {
      enabled: true,
      numbers: ['+1234567890']
    }
  },
  thresholds: {
    cpu: 80,
    memory: 90,
    disk: 85,
    api_latency: 1000,
    error_rate: 10,
    db_connections: 80
  }
};
```

### Alert Handlers
```javascript
// alert-handlers.js
const sendAlert = async (type, data) => {
  const handlers = {
    email: sendEmailAlert,
    slack: sendSlackAlert,
    sms: sendSMSAlert
  };

  for (const [channel, handler] of Object.entries(handlers)) {
    if (alertConfig.channels[channel].enabled) {
      await handler(type, data);
    }
  }
};
```

## Metrics Dashboard

### Real-time Metrics
```javascript
// dashboard-metrics.js
const getMetrics = async () => {
  return {
    system: await getSystemMetrics(),
    application: await getApplicationMetrics(),
    database: await getDatabaseMetrics(),
    websocket: await getWebSocketMetrics()
  };
};

io.on('connection', (socket) => {
  if (socket.user.isAdmin) {
    setInterval(async () => {
      const metrics = await getMetrics();
      socket.emit('metrics-update', metrics);
    }, 5000);
  }
});
```

### Historical Data
```javascript
// metrics-history.js
const storeMetrics = async (metrics) => {
  await pool.query(`
    INSERT INTO metrics_history (
      timestamp,
      metric_type,
      metric_data
    ) VALUES ($1, $2, $3)
  `, [
    new Date(),
    metrics.type,
    JSON.stringify(metrics.data)
  ]);
};
```

## Performance Optimization

### Caching
```javascript
// cache.js
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }
  
  next();
};
```

### Query Optimization
```javascript
// query-optimizer.js
const optimizeQuery = (query) => {
  // Add query hints
  if (query.includes('WHERE')) {
    query += ' /*+ INDEX(table_name idx_column) */';
  }
  
  return query;
};
```

## Maintenance Procedures

### Database Maintenance
```bash
#!/bin/bash
# maintenance.sh

# Vacuum database
psql -d mdmapanel -c "VACUUM ANALYZE;"

# Reindex tables
psql -d mdmapanel -c "REINDEX TABLE targets;"
psql -d mdmapanel -c "REINDEX TABLE guildsettings;"

# Update statistics
psql -d mdmapanel -c "ANALYZE;"
```

### Log Rotation
```javascript
// log-rotation.js
const rotate = require('winston-daily-rotate-file');

const transport = new rotate({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d'
});
```

## Best Practices

1. **Monitoring Strategy**
   - Monitor key metrics
   - Set appropriate thresholds
   - Implement alerting
   - Keep historical data

2. **Performance**
   - Use efficient queries
   - Implement caching
   - Optimize resource usage
   - Regular maintenance

3. **Security**
   - Monitor access logs
   - Track error rates
   - Implement rate limiting
   - Regular security audits

4. **Maintenance**
   - Regular backups
   - Log rotation
   - Database optimization
   - System updates 