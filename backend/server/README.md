# Projector Warranty Management Backend

Express.js and MongoDB backend for the projector warranty management system.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
- `MONGODB_URI`: Your MongoDB connection string
- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: Secret key for JWT tokens

## MongoDB Setup

### Option 1: Local MongoDB
1. Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Use default connection string: `mongodb://localhost:27017/projector_warranty`

### Option 2: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Get connection string and update `MONGODB_URI` in `.env`

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Database
- `POST /api/init-database` - Initialize database with sample data

### Projectors
- `GET /api/projectors` - Get all projectors
- `GET /api/projectors/:serial` - Get projector by serial number
- `POST /api/projectors` - Create new projector
- `PUT /api/projectors/:serial` - Update projector
- `DELETE /api/projectors/:serial` - Delete projector

### Services
- `GET /api/services` - Get all services
- `GET /api/services/projector/:serial` - Get services by projector
- `POST /api/services` - Create new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### RMA
- `GET /api/rma` - Get all RMA records
- `GET /api/rma/projector/:serial` - Get RMA records by projector
- `POST /api/rma` - Create new RMA
- `PUT /api/rma/:id` - Update RMA
- `DELETE /api/rma/:id` - Delete RMA

### Spare Parts
- `GET /api/spare-parts` - Get all spare parts
- `POST /api/spare-parts` - Create new spare part
- `PUT /api/spare-parts/:id` - Update spare part
- `DELETE /api/spare-parts/:id` - Delete spare part
- `PATCH /api/spare-parts/:id/stock` - Update stock quantity

## Data Models

### Projector
- Serial number (unique)
- Model, brand, site location
- Installation and warranty dates
- Status and condition tracking
- Usage statistics

### Service
- Service ID and projector association
- Date, type, technician
- Status, notes, costs
- Spare parts used

### RMA
- RMA number and projector association
- Part details and issue information
- Status tracking and cost estimation
- Physical/logical condition assessment

### Spare Part
- Part number (unique) and details
- Category (Spare Parts/RMA)
- Stock management and pricing
- Supplier and location information

## Frontend Integration

Update your frontend API configuration:

```typescript
// In /utils/api/client.ts
const baseUrl = 'http://localhost:5000/api';
```

Or set environment variable:
```bash
REACT_APP_API_URL=http://localhost:5000/api
```

## Database Initialization

After starting the server, initialize the database with sample data:

```bash
curl -X POST http://localhost:5000/api/init-database
```

Or use the frontend initialization process.

## Development

The server includes:
- CORS configuration for frontend integration
- Request logging and error handling
- Input validation and sanitization
- RESTful API design patterns
- MongoDB indexing for performance

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use a process manager like PM2
3. Configure reverse proxy (nginx)
4. Set up MongoDB Atlas for cloud database
5. Implement proper authentication and authorization
6. Add rate limiting and security middleware

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string format
- Verify network connectivity for Atlas

### Port Already in Use
- Change PORT in .env file
- Kill existing process: `lsof -ti:5000 | xargs kill -9`

### CORS Errors
- Verify frontend URL in CORS configuration
- Check that both frontend and backend are running

## Support

For issues or questions, please check the logs and ensure all dependencies are properly installed and configured.