# 🍔 SmartBite

**Next-generation food delivery platform with scheduled deliveries, AI-powered meal planning, and health tracking.**

SmartBite revolutionizes food delivery by allowing users to schedule meals in advance, plan their weekly nutrition, and track health goals—all while enjoying fresh, timely delivered food.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Database](#-database)
- [Scripts](#-scripts)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Features (Phase 1 & 2)
- 🔐 **User Authentication** - Sign up, login with JWT tokens, social authentication
- 🏪 **Restaurant Management** - Browse restaurants, view menus, search and filter
- 🛒 **Cart & Ordering** - Add to cart, manage orders, instant and scheduled deliveries
- 📍 **Address Management** - Multiple delivery addresses with Google Maps integration
- 💳 **Payment Integration** - Stripe payment gateway with multiple payment methods
- ⏰ **Scheduled Delivery** - Pre-order meals up to 2 days in advance with time slot selection
- 📅 **Time Slot Management** - Choose delivery windows (4-5 PM, 5-6 PM, 6-7 PM, 7-8 PM, 8-9 PM)

### Advanced Features (Phase 3-6)
- 🧠 **AI Meal Planner** - Weekly meal planning with intelligent suggestions
- 🎯 **Smart Recommendations** - Order history analysis and personalized meal suggestions
- 📊 **Health Tracking** - Calorie counting, macro tracking, nutritional information
- 🎁 **Meal Subscriptions** - Budget packs, healthy meal packs, gym packs
- 👥 **Group Ordering** - Order together with friends, automatic bill splitting
- 🚚 **Live Order Tracking** - Real-time delivery tracking with detailed stages
- 🏆 **Loyalty System** - Order streaks, rewards, and loyalty points
- ⭐ **Ratings & Reviews** - Restaurant and meal ratings with feedback system

---

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with python-jose
- **Password Hashing**: Passlib with bcrypt
- **Migrations**: Alembic
- **Payment**: Stripe API
- **Caching**: Redis
- **Validation**: Pydantic v2

### Frontend
- **Framework**: Next.js 14.0.4 with React 18
- **Language**: TypeScript 5.3.3
- **Styling**: Tailwind CSS 3.4.0
- **UI Components**: Radix UI primitives
- **State Management**: Zustand 4.4.7
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Date Utilities**: date-fns
- **Notifications**: React Hot Toast

### DevOps & Tools
- **API Server**: Uvicorn with ASGI
- **Package Manager**: pip (backend), npm (frontend)
- **Testing**: pytest, pytest-asyncio
- **Code Quality**: ESLint, TypeScript compiler
- **Environment**: python-dotenv for configuration

---

## 📁 Project Structure

```
SmartBite/
├── backend/                    # FastAPI backend application
│   ├── alembic/               # Database migrations
│   ├── app/
│   │   ├── api/               # API routes and endpoints
│   │   │   └── v1/            # API version 1
│   │   │       └── endpoints/ # Individual endpoint modules
│   │   ├── core/              # Core configurations
│   │   │   ├── config.py      # Application settings
│   │   │   └── security.py    # Authentication & security
│   │   ├── db/                # Database setup
│   │   │   ├── base_models.py # SQLAlchemy base
│   │   │   └── session.py     # Database sessions
│   │   ├── models/            # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── restaurant.py
│   │   │   ├── order.py
│   │   │   ├── meal_plan.py
│   │   │   └── ...
│   │   ├── schemas/           # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── order.py
│   │   │   └── ...
│   │   ├── services/          # Business logic
│   │   │   └── recommendation_service.py
│   │   └── main.py            # FastAPI application entry
│   ├── scripts/               # Database seeding scripts
│   │   ├── seed_data.py
│   │   ├── seed_meal_templates.py
│   │   └── seed_time_slots.py
│   └── requirements.txt       # Python dependencies
│
├── frontend/                  # Next.js frontend application
│   ├── src/
│   │   ├── app/              # Next.js app directory
│   │   │   ├── auth/         # Authentication pages
│   │   │   ├── cart/         # Shopping cart
│   │   │   ├── checkout/     # Checkout flow
│   │   │   ├── meal-planner/ # Meal planning interface
│   │   │   ├── orders/       # Order management
│   │   │   ├── profile/      # User profile & settings
│   │   │   ├── recommendations/ # AI recommendations
│   │   │   └── restaurants/  # Restaurant browsing
│   │   ├── components/       # React components
│   │   │   ├── layout/       # Layout components
│   │   │   ├── recommendations/
│   │   │   ├── scheduled-delivery/
│   │   │   └── ui/           # UI primitives
│   │   ├── lib/              # Utilities and helpers
│   │   │   ├── api.ts        # API client
│   │   │   └── utils.ts      # Helper functions
│   │   └── store/            # Zustand stores
│   │       ├── auth-store.ts
│   │       └── cart-store.ts
│   ├── public/               # Static assets
│   ├── package.json          # npm dependencies
│   └── tsconfig.json         # TypeScript configuration
│
├── scripts/                   # Setup and utility scripts
│   ├── setup-backend.sh      # Backend setup script
│   ├── setup-frontend.sh     # Frontend setup script
│   ├── setup-phase2.sh       # Phase 2 features setup
│   └── start-dev.sh          # Start development servers
│
├── IMPLEMENTATION_PLAN.md    # Detailed 6-phase development plan
└── README.md                 # This file
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Python** 3.10 or higher
- **Node.js** 18.0 or higher
- **PostgreSQL** 14 or higher (or SQLite for development)
- **Redis** (optional, for caching)
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Kuldeep-bhadouriya/SmartBite.git
cd SmartBite
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Linux/Mac:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed initial data (optional)
python scripts/seed_time_slots.py
python scripts/seed_data.py
python scripts/seed_meal_templates.py
```

#### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# or using yarn
yarn install
```

### Configuration

#### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Application
PROJECT_NAME=SmartBite
API_V1_STR=/api/v1
DEBUG=True

# Security
SECRET_KEY=your-secret-key-here-generate-with-openssl
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/smartbite
# For development with SQLite:
# DATABASE_URL=sqlite:///./smartbite.db

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe Payment
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Redis (optional)
REDIS_URL=redis://localhost:6379

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

**Generate a secure SECRET_KEY:**
```bash
openssl rand -hex 32
```

#### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Running the Application

#### Quick Start (Both Services)

```bash
# From the root directory
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

#### Manual Start

**Backend:**
```bash
cd backend
source .venv/bin/activate  # On Linux/Mac
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

#### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

---

## 📚 API Documentation

Once the backend is running, you can access comprehensive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

#### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

#### Restaurants
- `GET /api/v1/restaurants` - List all restaurants
- `GET /api/v1/restaurants/{id}` - Get restaurant details
- `GET /api/v1/restaurants/{id}/menu` - Get restaurant menu

#### Orders
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders` - List user orders
- `GET /api/v1/orders/{id}` - Get order details
- `PUT /api/v1/orders/{id}/cancel` - Cancel order

#### Meal Planning
- `GET /api/v1/meal-plans` - Get user meal plans
- `POST /api/v1/meal-plans` - Create meal plan
- `GET /api/v1/recommendations` - Get AI recommendations

#### Payments
- `POST /api/v1/payments/create-intent` - Create payment intent
- `POST /api/v1/payments/confirm` - Confirm payment

---

## 💻 Development

### Backend Development

**Run tests:**
```bash
cd backend
pytest
```

**Create new migration:**
```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

**Run linting:**
```bash
flake8 app/
black app/
```

### Frontend Development

**Run linting:**
```bash
npm run lint
```

**Type checking:**
```bash
npx tsc --noEmit
```

**Build for production:**
```bash
npm run build
npm run start
```

---

## 🗄 Database

### Schema Overview

The application uses the following main models:

- **User** - User accounts and authentication
- **Restaurant** - Restaurant information and details
- **MenuItem** - Food items with pricing and nutrition
- **Order** - Order records (instant and scheduled)
- **Cart** - Shopping cart items
- **Address** - User delivery addresses
- **TimeSlot** - Available delivery time slots
- **MealPlan** - User meal plans
- **Payment** - Payment transactions
- **UserPreference** - Dietary preferences and settings
- **Recommendation** - AI-generated recommendations

### Database Migrations

All migrations are managed with Alembic. The migration files are located in `backend/alembic/versions/`.

**Apply all migrations:**
```bash
alembic upgrade head
```

**Rollback one migration:**
```bash
alembic downgrade -1
```

**View migration history:**
```bash
alembic history
```

---

## 🔧 Scripts

### Backend Scripts

- **`seed_time_slots.py`** - Populate default delivery time slots
- **`seed_data.py`** - Seed sample restaurants and menu items
- **`seed_meal_templates.py`** - Create meal plan templates

### Setup Scripts

- **`setup-backend.sh`** - Automated backend setup
- **`setup-frontend.sh`** - Automated frontend setup
- **`setup-phase2.sh`** - Setup Phase 2 features (scheduled delivery)
- **`start-dev.sh`** - Start both backend and frontend in development mode

---

## 📖 Implementation Roadmap

SmartBite is being developed in 6 phases:

1. **Phase 1**: Core foundation & basic food delivery ✅
2. **Phase 2**: Custom scheduled delivery system ✅
3. **Phase 3**: Smart meal planner & AI suggestions 🚧
4. **Phase 4**: Health tracking & subscriptions 📋
5. **Phase 5**: Social features & enhanced tracking 📋
6. **Phase 6**: Optimization & launch preparation 📋

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for detailed phase descriptions.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Follow PEP 8 for Python code
- Use TypeScript strict mode
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Kuldeep Bhadouriya** - [GitHub](https://github.com/Kuldeep-bhadouriya)

---

## 🙏 Acknowledgments

- FastAPI documentation and community
- Next.js team for the amazing framework
- Radix UI for accessible component primitives
- Tailwind CSS for utility-first styling
- All open-source contributors

---

## 📞 Support

For support, email kuldeepbhadouriya@example.com or open an issue in the GitHub repository.

---

**Built with ❤️ by the SmartBite team**