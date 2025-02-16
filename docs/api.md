# API Documentation

## Overview

The MDMAPanel API provides a comprehensive set of endpoints for managing targets, users, and system functionality. All API endpoints are prefixed with `/api/`.

## Authentication

### JWT Authentication
All API requests must include a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Obtaining a Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

## API Endpoints

### Target Management

#### List Targets
```http
GET /api/targets/:username
```
Returns all targets belonging to the specified username.

Response:
```json
[
  {
    "id": "uuid",
    "ip": "192.168.1.1",
    "status": "Online",
    "currentpage": "account_review",
    "browser": "Chrome",
    "location": "US",
    "belongsto": "username"
  }
]
```

#### Update Target Status
```http
POST /api/targets/status
Content-Type: application/json

{
  "targetID": "uuid",
  "status": "Online",
  "currentPage": "account_review"
}
```

### Guild Management

#### Get Guild Callers
```http
GET /api/guild/getGuildCallers
```

#### Remove Caller
```http
POST /api/guild/removeCaller
Content-Type: application/json

{
  "callerID": "uuid"
}
```

### Email Notifications

#### Send Email
```http
POST /api/mailer/sendmail/:mailtype
Content-Type: application/json

{
  "recipient": "user@example.com",
  "subject": "Notification",
  "content": "Message content"
}
```

### Sound Notifications

#### Get Sound Settings
```http
GET /api/sound/:username
```

#### Update Sound Settings
```http
POST /api/sound/:username
Content-Type: application/json

{
  "enabled": true,
  "volume": 0.8
}
```

### Starting Page Configuration

#### Set Starting Page
```http
POST /api/startingPage/set
Content-Type: application/json

{
  "username": "user",
  "page": "dashboard"
}
```

## WebSocket Events

### Client Events

#### Join Dashboard Room
```javascript
socket.emit('joinDashboardRoom', { username: 'user' });
```

#### Update Status
```javascript
socket.emit('updateStatus', {
  targetID: 'uuid',
  status: 'Online',
  currentPage: 'account_review'
});
```

#### Identify Target
```javascript
socket.emit('identify', {
  belongsto: 'username',
  browser: 'Chrome',
  location: 'US',
  currentPage: 'account_review'
});
```

### Server Events

#### Target Updated
```javascript
socket.on('targetUpdated', (data) => {
  // Handle target update
});
```

#### Target Added
```javascript
socket.on('targetAdded', (data) => {
  // Handle new target
});
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `AUTH_FAILED`: Authentication failed
- `INVALID_INPUT`: Invalid input parameters
- `NOT_FOUND`: Resource not found
- `SERVER_ERROR`: Internal server error

## Rate Limiting

API requests are limited to:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Best Practices

1. **Authentication**
   - Store JWT tokens securely
   - Refresh tokens before expiration
   - Clear tokens on logout

2. **Error Handling**
   - Implement proper error handling
   - Log errors appropriately
   - Provide meaningful error messages

3. **Data Validation**
   - Validate input data
   - Sanitize user input
   - Use appropriate data types

4. **Performance**
   - Minimize request payload size
   - Use pagination for large datasets
   - Cache responses when appropriate

## Examples

### JavaScript/TypeScript
```typescript
// Example API call using axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get targets
async function getTargets(username: string) {
  try {
    const response = await api.get(`/targets/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching targets:', error);
    throw error;
  }
}
```

### Python
```python
import requests

# Example API call using requests
def get_targets(username, token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(
        f'http://localhost:3000/api/targets/{username}',
        headers=headers
    )
    return response.json()
```

## Support

For API support:
- Create an issue on GitHub