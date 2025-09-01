# Projector Warranty Management System

A comprehensive React-based frontend application for managing projector warranties, with a Node.js/Express backend and MongoDB database.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
# MONGODB_URI=mongodb://localhost:27017/projector_warranty
# PORT=5000
# NODE_ENV=development
# CORS_ORIGIN=http://localhost:3000

# Start MongoDB (if not running as a service)
# macOS: brew services start mongodb-community
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod

# Start the backend server
npm run dev
```

### 3. Frontend Setup

```bash
# In a new terminal, from the root directory
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── pages/          # Page components
│   │   └── Dashboard.tsx   # Main dashboard
│   ├── utils/
│   │   ├── api/            # API client
│   │   └── config.ts       # Configuration
│   ├── styles/
│   │   └── globals.css     # Global styles
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── server/                 # Backend Express.js server
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   └── index.js            # Server entry point
├── package.json            # Frontend dependencies
└── README.md              # This file
```

## 🛠️ Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
MONGODB_URI=mongodb://localhost:27017/projector_warranty
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### API Configuration

The frontend is configured to connect to the backend at `http://localhost:5000/api`. You can modify this in `src/utils/config.ts`.

## 🎨 Features

- **Dashboard**: Overview with key metrics and charts
- **Sites Management**: Manage customer sites and locations
- **Projector Management**: Track projectors and warranties
- **Service Planning**: Schedule and manage maintenance
- **RMA Management**: Handle warranty claims and returns
- **Spare Parts**: Inventory management
- **Analytics**: Reports and insights
- **Settings**: System configuration

## 🚀 Deployment

### Frontend
```bash
npm run build
# Deploy the `dist` folder to your hosting service
```

### Backend
```bash
cd server
npm start
# Deploy to your server or cloud platform
```

## 📝 Development

### Adding New Components
1. Create your component in `src/components/`
2. Import and use in the appropriate page
3. Follow the existing component patterns

### API Integration
- Use the `apiClient` from `src/utils/api/client.ts`
- All API calls are centralized and typed
- Error handling is built-in

### Styling
- Uses Tailwind CSS with custom dark theme
- Global styles in `src/styles/globals.css`
- Component-specific styles use Tailwind classes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 