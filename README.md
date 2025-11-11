# TrueTab API

A comprehensive Point of Sale (POS) and restaurant management API built with Node.js, Express, and Prisma.

## Features

- **Multi-tenant Architecture**: Support for brands, branches, and users
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Restaurant Management**: Tables, zones, orders, menu items, and modifiers
- **Inventory Management**: Products, suppliers, purchase orders, and stock tracking
- **Point of Sale**: Register sessions, payments, and order processing
- **Staff Management**: Tips, settlements, and user management
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **🤖 AI Features**: Smart recommendations, forecasting, NLP, dynamic pricing, chatbot, and analytics (See [AI_FEATURES.md](AI_FEATURES.md))

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with BullMQ
- **Authentication**: JWT tokens with refresh mechanism
- **File Storage**: Cloudinary integration
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with Supertest

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Redis server
- Cloudinary account (for file uploads)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd truetab-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **View API Documentation**
   Open http://localhost:9000/api-docs

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run seed` - Seed database with sample data

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Core Resources
- `/api/brands` - Brand management
- `/api/branches` - Branch management
- `/api/users` - User management
- `/api/menu` - Menu items and categories
- `/api/inventory` - Inventory management
- `/api/orders` - Order processing
- `/api/floor` - Table and zone management

### AI Features 🤖
- `/api/ai/recommendations` - AI-powered menu recommendations
- `/api/ai/forecast` - Sales and inventory forecasting
- `/api/ai/nlp` - Natural language processing
- `/api/ai/pricing` - Dynamic pricing suggestions
- `/api/ai/chat` - Support chatbot
- `/api/ai/analytics` - Business insights and analytics

**Subscription-Based Access**
All AI features are controlled by subscription plans ($29-$299/month).
- **Quick Start**: [AI_QUICK_START.md](AI_QUICK_START.md)
- **Full AI Docs**: [AI_FEATURES.md](AI_FEATURES.md)
- **Subscription Integration**: [AI_SUBSCRIPTION_INTEGRATION.md](AI_SUBSCRIPTION_INTEGRATION.md)
- **Quick Reference**: [AI_SUBSCRIPTION_QUICKREF.md](AI_SUBSCRIPTION_QUICKREF.md)

## Environment Variables

See `.env.example` for all required and optional environment variables.

## Database Schema

The application uses Prisma as an ORM with PostgreSQL. Key entities include:

- **User**: System users with role-based access
- **Brand**: Top-level tenant organization
- **Branch**: Physical locations under a brand
- **Menu**: Items, categories, modifiers, and variants
- **Order**: Customer orders and order items
- **Inventory**: Products, suppliers, and stock management
- **Table**: Restaurant floor management

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique JWT secrets
- [ ] Configure proper database connection pooling
- [ ] Set up monitoring and logging
- [ ] Configure Redis for production
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for your frontend domain

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 9000
CMD ["node", "src/server.js"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `npm run lint && npm test`
6. Submit a pull request

## Security

- JWT tokens with refresh mechanism
- Rate limiting on authentication endpoints
- Input validation with Joi
- SQL injection protection via Prisma
- CORS configuration
- Helmet.js security headers

## License

MIT License - see LICENSE file for details

## Support

For support, please contact the development team or create an issue in the repository.
