# API Documentation

## Overview

The MDMAPanel API provides a comprehensive set of endpoints for managing targets, guilds, and system functionality. This documentation covers all available API endpoints, authentication, and usage examples.

## Authentication

### JWT Authentication
All API requests must include a valid JWT token in the Authorization header:
```http
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

Response:
```json
{
  "token": "your.jwt.token",
  "user": {
    "username": "your_username",
    "guild": "your_guild",
    "rank": "user"
  }
}
```

## API Endpoints

### Target Management

#### List Targets
```http
GET /api/targets/:username
Authorization: Bearer <token>
```

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
POST /api/targets/:targetId/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "Online",
  "currentPage": "account_review"
}
```

### Guild Management

#### Create Guild
```http
POST /api/guild/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "new_guild",
  "settings": {
    "hideseed": false,
    "maxUsers": 100
  }
}
```

#### Update Guild Settings
```http
PUT /api/guild/:guildId/settings
Content-Type: application/json
Authorization: Bearer <token>

{
  "settings": {
    "hideseed": true
  }
}
```

### User Management

#### Create User
```http
POST /api/users/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "username": "newuser",
  "password": "securepassword",
  "guild": "existing_guild",
  "rank": "user"
}
```

#### Update User
```http
PUT /api/users/:username
Content-Type: application/json
Authorization: Bearer <token>

{
  "rank": "admin",
  "guild": "new_guild"
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message",
    "details": {}
  }
}
```

### Common Error Codes
- `AUTH_ERROR`: Authentication failed
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data
- `SERVER_ERROR`: Internal server error

## Rate Limiting

API requests are limited to:
- 100 requests per minute per IP
- 1000 requests per hour per user

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1623456789
```

## Pagination

For endpoints returning lists, pagination is supported via query parameters:

```http
GET /api/targets?page=1&limit=20
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

## Filtering and Sorting

### Filtering
Use query parameters for filtering:
```http
GET /api/targets?status=Online&browser=Chrome
```

### Sorting
Use `sort` parameter for sorting:
```http
GET /api/targets?sort=-created_at,+status
```

## WebSocket Integration

Some API endpoints have corresponding WebSocket events. See [WebSocket Documentation](websocket.md) for details.

## Examples

### JavaScript/TypeScript
```typescript
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

def get_targets(username: str, token: str):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(
        f'http://localhost:3000/api/targets/{username}',
        headers=headers
    )
    return response.json()
```

### cURL
```bash
# Get targets
curl -X GET \
  'http://localhost:3000/api/targets/username' \
  -H 'Authorization: Bearer your.jwt.token'

# Create user
curl -X POST \
  'http://localhost:3000/api/users/create' \
  -H 'Authorization: Bearer your.jwt.token' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "newuser",
    "password": "password123",
    "guild": "existing_guild",
    "rank": "user"
  }'
```

## Security Considerations

1. Always use HTTPS in production
2. Keep tokens secure
3. Implement proper error handling
4. Validate all input data
5. Follow rate limiting guidelines

## API Versioning

The API version is specified in the URL:
```http
/api/v1/targets
```

Current stable version: `v1`

## Support

For API support:
1. Check the documentation
2. Review common issues
3. Contact support team
4. Open GitHub issue 