# Projector Warranty CRM System

A comprehensive Customer Relationship Management system for projector warranty and service management, built with React frontend and Express.js backend.

## 🏗️ Project Structure

```
projector-warranty-crm/
├── frontend/                 # React frontend application
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   ├── Dockerfile           # Frontend Docker configuration
│   └── nginx.conf           # Nginx configuration
├── backend/                 # Express.js backend API
│   ├── server/              # Server code
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   └── migrations/      # Database migrations
│   ├── package.json         # Backend dependencies
│   └── Dockerfile           # Backend Docker configuration
├── deployment/              # Deployment configurations
│   ├── docker-compose.yml   # Docker Compose configuration
│   ├── mongodb-init.js      # MongoDB initialization
│   └── nginx.conf           # Production Nginx config
├── scripts/                 # Deployment and setup scripts
│   ├── setup-dev.sh         # Development setup
│   └── deploy-production.sh # Production deployment
└── package.json             # Root package.json with workspace scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm 8+
- Docker & Docker Compose (for production deployment)
- MongoDB (or use Docker)

### Development Setup

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd projector-warranty-crm
   ./scripts/setup-dev.sh
   ```

2. **Configure environment:**
   - Update `backend/.env` with your MongoDB connection string
   - Update `frontend/.env` if needed

3. **Start development servers:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - API Health: http://localhost:4000/api/health

### Production Deployment

1. **Deploy with Docker:**
   ```bash
   ./scripts/deploy-production.sh
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## 📋 Available Scripts

### Root Level Commands

```bash
# Development
npm run dev                 # Start both frontend and backend
npm run dev:frontend        # Start only frontend
npm run dev:backend         # Start only backend

# Building
npm run build               # Build both frontend and backend
npm run build:frontend      # Build only frontend
npm run build:backend       # Build only backend

# Production
npm run start               # Start production server
npm run start:frontend      # Start frontend preview
npm run start:backend       # Start backend server

# Utilities
npm run lint                # Lint both frontend and backend
npm run type-check          # TypeScript type checking
npm run clean               # Clean node_modules and build files
npm run install:all         # Install all dependencies
```

### Frontend Commands

```bash
cd frontend
npm run dev                 # Start Vite dev server
npm run build               # Build for production
npm run preview             # Preview production build
npm run lint                # ESLint
npm run type-check          # TypeScript check
```

### Backend Commands

```bash
cd backend
npm run dev                 # Start with nodemon
npm start                   # Start production server
npm run migrate             # Run database migrations
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Services Included

- **Frontend**: React app served by Nginx
- **Backend**: Express.js API server
- **MongoDB**: Database with initialization
- **Nginx**: Reverse proxy (optional)

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/projector_warranty
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api
VITE_APP_NAME=Projector Warranty CRM
VITE_APP_VERSION=1.0.0
```

## 📊 Features

### Core CRM Features
- **Site Management**: Manage customer sites and locations
- **Projector Tracking**: Track projectors by model, serial number, and location
- **Service Management**: Schedule and track service visits
- **RMA Processing**: Handle Return Merchandise Authorization
- **Spare Parts Management**: Inventory and ordering
- **Purchase Orders**: Create and manage POs
- **FSE Portal**: Field Service Engineer mobile interface
- **Analytics Dashboard**: Performance metrics and insights

### Technical Features
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Live data synchronization
- **Photo Upload**: Cloudinary integration for service photos
- **PDF Reports**: Generate service reports
- **User Management**: Role-based access control
- **API Documentation**: RESTful API with health checks

## 🛠️ Development

### Adding New Features

1. **Backend API:**
   - Add routes in `backend/server/routes/`
   - Create models in `backend/server/models/`
   - Update API documentation

2. **Frontend Components:**
   - Add components in `frontend/src/components/`
   - Create pages in `frontend/src/components/pages/`
   - Update routing and navigation

### Database Migrations

```bash
cd backend
npm run migrate
```

### Code Quality

- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting
- Husky for git hooks (optional)

## 🚀 Deployment Options

### 1. Docker Compose (Recommended)
- Single command deployment
- Includes all services
- Easy scaling and management

### 2. Manual Deployment
- Deploy frontend to static hosting (Netlify, Vercel)
- Deploy backend to cloud provider (AWS, DigitalOcean)
- Use managed MongoDB (MongoDB Atlas)

### 3. Cloud Platforms
- **AWS**: Use App Runner or ECS
- **DigitalOcean**: Use App Platform
- **Railway**: One-click deployment
- **Heroku**: Traditional PaaS deployment

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guide](docs/contributing.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

---

**Built with ❤️ by the ProjectorCare Team**