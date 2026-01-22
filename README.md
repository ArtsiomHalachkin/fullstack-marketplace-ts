# Marketplace Application

A full-stack microservices-based marketplace application built with Vue 3, Express.js, MongoDB, and Keycloak authentication. The entire application runs in Docker containers for easy setup and deployment.

## Project Architecture

### Services

- **Frontend** - Vue 3 SPA with TypeScript
- **Product Service** - Product management microservice (Node.js + Express)
- **Order Service** - Order management with Socket.IO real-time updates
- **Payment Service** - Payment processing microservice
- **Notification Service** - Email notifications via SMTP
- **Keycloak** - Identity and access management (IAM)
- **MongoDB** - Data persistence layer

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Docker** - [Download and install Docker](https://www.docker.com/products/docker-desktop)
- **Docker Compose** - Usually included with Docker Desktop
- **Git** - For cloning the repository

### Verify Installation

```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd wab_zs2025-2026_xhalachk
```

### 2. Start All Services

```bash
docker-compose up --build
```

This command will:
- Build all Docker images for the services
- Pull the required MongoDB and Keycloak images
- Start all containers in the correct order
- Create the necessary networks and volumes

**First startup may take 5-10 minutes** as services need to initialize.

### 3. Access the Application

Once all services are running, access them via:

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5000 | Main application UI |
| Product Service | http://localhost:5002 | Product API & Swagger Docs |
| Order Service | http://localhost:5003 | Order API & Swagger Docs |
| Payment Service | http://localhost:5004 | Payment API & Swagger Docs |
| Notification Service | http://localhost:5005 | Notification API & Swagger Docs |
| Keycloak Admin | http://localhost:8091/admin | Authentication management |

### 4. Keycloak Configuration

Keycloak admin credentials (in development):
- **Username**: `admin`
- **Password**: `1234`

Access the admin console at: http://localhost:8091/admin

## Docker Compose Configuration

### Environment Variables

The `docker-compose.yaml` file includes:

- **MongoDB**: Port 27018, volume for data persistence
- **Keycloak**: Pre-configured with MARKETPLACE-APP realm
- **Services**: Each service has:
  - MongoDB connection string
  - CORS settings
  - Keycloak authentication URLs
  - Service-to-service communication URLs
  - Email (SMTP) credentials for notifications

### Networks and Volumes

- **mongo-net**: Custom Docker network for service communication
- **marketplace-mongo**: MongoDB data volume
- **keycloak-data**: Keycloak data volume

## Development Workflow

### Stop All Services

```bash
docker-compose down
```

### Stop Services but Keep Volumes

```bash
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f product_service

# Last 100 lines
docker-compose logs --tail=100 order_service
```

### Rebuild Specific Service

```bash
docker-compose up --build product_service
```

### Access Service Shell

```bash
docker-compose exec order_service sh
```

## Running Tests

Tests can be run inside containers:

```bash
# Order Service tests
docker-compose exec order_service npm test

# Payment Service tests
docker-compose exec payment_service npm test

# Frontend tests
docker-compose exec frontend npm test:unit
```

## Database Seeding

Some services include seed scripts:

```bash
# Seed Order Service
docker-compose exec order_service npm run seed

# Clear Order Service data
docker-compose exec order_service npm run seed:clear

# Seed Payment Service
docker-compose exec payment_service npm run seed
```

## API Documentation

Each backend service provides Swagger documentation:

- Product Service: http://localhost:5002/api-docs
- Order Service: http://localhost:5003/api-docs
- Payment Service: http://localhost:5004/api-docs
- Notification Service: http://localhost:5005/api-docs

## Common Issues & Solutions

### Services Won't Start

**Problem**: Containers fail to start or crash immediately

**Solutions**:
1. Check logs: `docker-compose logs -f`
2. Ensure ports aren't already in use
3. Try rebuilding: `docker-compose up --build --force-recreate`
4. Restart Docker daemon

### Port Already in Use

**Problem**: "Address already in use" error

**Solution**: Either:
- Stop the conflicting application
- Or modify the port mapping in `docker-compose.yaml`:

```yaml
frontend:
  ports:
    - "5000:4173"  # Change first number to a different port
```

### Database Connection Issues

**Problem**: Services can't connect to MongoDB

**Solutions**:
1. Ensure MongoDB container is running: `docker-compose ps`
2. Check network connectivity: `docker network ls`
3. Verify MONGO_URL matches the service name: `mongodb://mongo:27017/...`

### Keycloak Not Ready

**Problem**: Services fail with Keycloak connection errors

**Solution**: Keycloak takes time to start (2-3 minutes). Check logs:
```bash
docker-compose logs keycloak
```

### Memory Issues

**Problem**: Docker containers crash or run slowly

**Solution**: Allocate more resources to Docker:
- Docker Desktop → Settings → Resources → Increase Memory

## Project Structure

```
wab_zs2025-2026_xhalachk/
├── docker-compose.yaml          # Docker orchestration
├── frontend/
│   └── vue-marketplace/         # Vue 3 SPA
├── product-service/             # Product microservice
├── order-service/               # Order microservice
├── payment-service/             # Payment microservice
├── notification-service/        # Email notifications
└── debug-requests/              # HTTP debug files
```

## Technology Stack

### Frontend
- Vue 3
- TypeScript
- Vite
- Pinia (state management)
- Socket.IO (real-time updates)

### Backend Services
- Node.js
- Express.js
- TypeScript
- MongoDB
- JWT Authentication
- Socket.IO (Order Service)

### Authentication & Security
- Keycloak (OIDC/OAuth2)
- JWKS for token validation

### Database
- MongoDB

### Email
- Nodemailer with Mailtrap SMTP

## Useful Docker Commands

```bash
# List running containers
docker ps

# View container resource usage
docker stats

# Remove unused images and volumes
docker system prune -a

# Inspect a service
docker-compose exec <service-name> /bin/sh

# View resource limits
docker stats <container-name>
```

## Production Deployment

For production deployment:

1. **Update Environment Variables**: Replace development URLs and credentials
2. **Enable HTTPS**: Add SSL certificates and configure Keycloak
3. **Database**: Use managed MongoDB instead of containerized version
4. **Secrets Management**: Use Docker secrets or environment files
5. **Resource Limits**: Add memory and CPU limits in docker-compose.yaml
6. **Logging**: Configure centralized logging (ELK, Datadog, etc.)

Example production docker-compose additions:

```yaml
services:
  product_service:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

## Contributing

When modifying services:

1. Update the service code
2. Rebuild the specific service: `docker-compose up --build <service-name>`
3. Test changes: `docker-compose exec <service-name> npm test`
4. Commit changes to git

## Troubleshooting Checklist

- [ ] Docker and Docker Compose are installed and running
- [ ] All required ports (5000, 5001-5005, 8091, 27018) are available
- [ ] System has at least 4GB free RAM available
- [ ] All services appear in `docker-compose ps`
- [ ] No error messages in service logs
- [ ] Keycloak is fully initialized (wait 2-3 minutes)

## Support & Documentation

- **Docker Docs**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Vue 3**: https://vuejs.org/
- **Express.js**: https://expressjs.com/
- **Keycloak**: https://www.keycloak.org/documentation
- **MongoDB**: https://docs.mongodb.com/

