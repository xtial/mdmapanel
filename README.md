# Atrium

A real-time target management and monitoring system built with SvelteKit, Socket.IO, and PostgreSQL.

## Features

- Real-time target monitoring and management
- User authentication and authorization
- Admin dashboard
- Target tracking and status updates
- Guild management system
- Sound notification system
- Custom domain management
- Email notification system

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/xtial/atrium.git
cd atrium
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up the database:
```bash
# Create a new PostgreSQL database
createdb atrium

# Initialize the database schema
psql -d atrium -f schema.sql

# (Optional) Seed the database with sample data
psql -d atrium -f seed.sql
```

4. Configure environment variables:
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atrium
JWT_SECRET=your_jwt_secret_here
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Production Deployment

1. Build the application:
```bash
npm run build
# or
yarn build
```

2. Start the production server:
```bash
npm run start
# or
yarn start
```

## Project Structure

```
atrium/
├── src/
│   ├── lib/           # Shared components and utilities
│   ├── routes/        # SvelteKit routes and API endpoints
│   └── app.html       # HTML template
├── static/            # Static assets
├── schema.sql         # Database schema
├── seed.sql          # Sample data for development
└── server.js         # Socket.IO server
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- SvelteKit team for the amazing framework
- Socket.IO team for real-time capabilities
- All contributors who have helped with the project

## Support

For support, open an issue in the GitHub repository.
