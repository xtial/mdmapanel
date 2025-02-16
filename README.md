# MDMAPanel

A powerful real-time target management and monitoring system built with modern web technologies. MDMAPanel provides comprehensive tools for tracking, managing, and interacting with targets in real-time.

[![CI Status](https://github.com/xtial/mdmapanel/workflows/CI/badge.svg)](https://github.com/xtial/mdmapanel/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

### Core Features
- **Real-time Monitoring**
  - Live target status updates
  - Real-time activity tracking
  - Instant notification system
  
- **Advanced Management**
  - Multi-target control
  - Custom action deployment
  - Batch operations support
  
- **Security & Authentication**
  - Role-based access control
  - Secure JWT authentication
  - Session management
  
- **Guild System**
  - Multi-guild support
  - Custom domain management
  - Guild-specific settings

### Additional Features
- Sound notification system
- Email notification integration
- Custom domain management
- Extensive API endpoints
- Real-time WebSocket communication
- Responsive dashboard interface

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16.x or higher)
- PostgreSQL (v12.x or higher)
- npm (v7.x or higher) or yarn (v1.22.x or higher)
- Git

## 🛠 Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/xtial/mdmapanel.git
   cd mdmapanel
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb mdmapanel

   # Initialize schema
   psql -d mdmapanel -f schema.sql

   # (Optional) Add sample data
   psql -d mdmapanel -f seed.sql
   ```

4. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mdmapanel
   JWT_SECRET=your_jwt_secret_here
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Access the application at `http://localhost:5173`

## 📚 Documentation

Detailed documentation is available in the `/docs` directory:

- [Getting Started Guide](docs/getting-started.md)
- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [WebSocket Events](docs/websocket.md)
- [Database Schema](docs/database.md)
- [Security Guide](docs/security.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guide](CONTRIBUTING.md)

## 🚀 Deployment

### Production Build
```bash
npm run build
# or
yarn build
```

### Production Server
```bash
npm run start
# or
yarn start
```

See the [Deployment Guide](docs/deployment.md) for detailed hosting instructions.

## 🏗 Project Structure

```
mdmapanel/
├── src/
│   ├── lib/              # Shared utilities and components
│   │   ├── components/   # Reusable UI components
│   │   ├── db/          # Database configuration
│   │   ├── utils/       # Helper functions
│   │   └── types/       # TypeScript definitions
│   ├── routes/          # SvelteKit routes and API endpoints
│   │   ├── admin/       # Admin dashboard routes
│   │   ├── api/         # API endpoints
│   │   └── dashboard/   # User dashboard routes
│   └── app.html         # HTML template
├── static/              # Static assets
├── docs/               # Documentation
├── tests/              # Test files
├── schema.sql          # Database schema
├── seed.sql           # Sample data
└── server.js          # Socket.IO server
```

## 🔒 Security

- All communications are encrypted using industry-standard protocols
- JWT-based authentication system
- Role-based access control
- Regular security updates
- See [Security Guide](docs/security.md) for best practices

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- SvelteKit team for the amazing framework
- Socket.IO team for real-time capabilities
- All our contributors and supporters

## 💬 Support

- Create an issue for bug reports or feature requests

## 🔄 Version History

See [CHANGELOG.md](CHANGELOG.md) for details about versions and updates.
