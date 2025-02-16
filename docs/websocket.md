# WebSocket Events Documentation

## Overview

MDMAPanel uses Socket.IO for real-time communication between the server and clients. This document details all available WebSocket events and their usage.

## Connection Setup

### Server Configuration
```javascript
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});
```

### Client Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5
});
```

## Events

### Dashboard Events

#### Join Dashboard Room
Subscribes a dashboard to receive updates for a specific username.

**Emit:**
```javascript
socket.emit('joinDashboardRoom', { username: string });
```

**Server Response:**
```javascript
// Success
socket.on('roomJoined', (data) => {
  console.log(`Joined room for ${data.username}`);
});

// Error
socket.on('roomError', (error) => {
  console.error('Failed to join room:', error);
});
```

### Target Events

#### Target Identification
Registers a new target in the system.

**Emit:**
```javascript
socket.emit('identify', {
  belongsto: string,
  browser: string,
  location: string,
  currentPage: string
});
```

**Response:**
```javascript
socket.on('identified', ({ targetID, start_page }) => {
  // Handle successful identification
});
```

#### Update Target Status
Updates the status and current page of a target.

**Emit:**
```javascript
socket.emit('updateStatus', {
  targetID: string,
  status: 'Online' | 'Offline' | 'Busy',
  currentPage: string
});
```

**Broadcast:**
```javascript
socket.on('targetUpdated', {
  targetID: string,
  status: string,
  currentPage: string
});
```

#### Send Action to Target
Sends a command or action to a specific target.

**Emit:**
```javascript
socket.emit('sendActionToTarget', {
  targetID: string,
  action: string,
  customUrl?: string
});
```

**Target Receives:**
```javascript
socket.on('action', ({ action, customUrl }) => {
  // Handle received action
});
```

### System Events

#### Disconnect Handling
```javascript
socket.on('disconnect', () => {
  // Handle disconnection
  // Targets are automatically marked as Offline
});
```

#### Reconnection
```javascript
socket.on('reconnect', (attemptNumber) => {
  // Handle successful reconnection
});

socket.on('reconnect_error', (error) => {
  // Handle reconnection failure
});
```

## Event Data Structures

### Target Data
```typescript
interface TargetData {
  id: string;
  ip: string;
  status: 'Online' | 'Offline' | 'Busy';
  currentpage: string;
  browser: string;
  location: string;
  belongsto: string;
}
```

### Action Data
```typescript
interface ActionData {
  action: string;
  customUrl?: string;
  parameters?: Record<string, any>;
}
```

## Error Handling

### Error Events
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Reconnection Strategy
```javascript
const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});
```

## Best Practices

1. **Connection Management**
   - Implement proper reconnection handling
   - Monitor connection state
   - Clean up resources on disconnect

2. **Event Handling**
   - Use type-safe event handlers
   - Implement error handling for all events
   - Log important events for debugging

3. **Performance**
   - Minimize event payload size
   - Use room-based broadcasting
   - Implement rate limiting

4. **Security**
   - Validate all incoming data
   - Implement authentication
   - Use secure connections (WSS)

## Example Implementation

### Dashboard Client
```typescript
import { io, Socket } from 'socket.io-client';

class DashboardSocket {
  private socket: Socket;
  private username: string;

  constructor(username: string) {
    this.username = username;
    this.socket = io('http://localhost:3000');
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.socket.on('connect', () => {
      this.joinDashboardRoom();
    });

    this.socket.on('targetUpdated', (data) => {
      this.handleTargetUpdate(data);
    });

    this.socket.on('targetAdded', (data) => {
      this.handleNewTarget(data);
    });
  }

  private joinDashboardRoom() {
    this.socket.emit('joinDashboardRoom', { username: this.username });
  }

  public sendActionToTarget(targetID: string, action: string) {
    this.socket.emit('sendActionToTarget', { targetID, action });
  }

  private handleTargetUpdate(data: TargetData) {
    // Update UI with new target data
  }

  private handleNewTarget(data: TargetData) {
    // Add new target to UI
  }
}
```

### Target Client
```typescript
class TargetSocket {
  private socket: Socket;
  private targetID: string | null = null;

  constructor(belongsto: string) {
    this.socket = io('http://localhost:3000');
    this.identify(belongsto);
    this.setupEventHandlers();
  }

  private identify(belongsto: string) {
    const data = {
      belongsto,
      browser: this.getBrowserInfo(),
      location: this.getLocation(),
      currentPage: window.location.pathname
    };

    this.socket.emit('identify', data);
  }

  private setupEventHandlers() {
    this.socket.on('identified', ({ targetID }) => {
      this.targetID = targetID;
    });

    this.socket.on('action', this.handleAction.bind(this));
  }

  private handleAction({ action, customUrl }: ActionData) {
    // Execute received action
  }
}
```

## Debugging

### Client-side Debugging
```javascript
// Enable socket.io debugging
localStorage.debug = 'socket.io-client:socket';

// Monitor all events
socket.onAny((eventName, ...args) => {
  console.log(`Event: ${eventName}`, args);
});
```

### Server-side Debugging
```javascript
// Enable socket.io debugging
process.env.DEBUG = 'socket.io:*';

// Monitor room joins
io.on('connection', (socket) => {
  socket.onAny((eventName, ...args) => {
    console.log(`[${socket.id}] ${eventName}`, args);
  });
});
``` 