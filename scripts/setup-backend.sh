#!/bin/bash

echo "🚀 Starting SmartBite Backend Setup..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL 14 or higher."
    echo "   Ubuntu/Debian: sudo apt-get install postgresql"
    echo "   macOS: brew install postgresql"
    exit 1
fi

cd backend

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration!"
fi

# Create database
echo "🗄️  Setting up database..."
read -p "Enter PostgreSQL username (default: postgres): " db_user
db_user=${db_user:-postgres}

read -p "Enter database name (default: smartbite): " db_name
db_name=${db_name:-smartbite}

# Check if database exists
if psql -U $db_user -lqt | cut -d \| -f 1 | grep -qw $db_name; then
    echo "ℹ️  Database '$db_name' already exists."
else
    echo "📦 Creating database '$db_name'..."
    createdb -U $db_user $db_name
fi

# Update DATABASE_URL in .env
sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://$db_user:postgres@localhost:5432/$db_name|" .env

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads/profiles uploads/restaurants uploads/menu-items

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update .env file with your API keys (Stripe, Google, etc.)"
echo "   2. Run migrations: python scripts/seed_data.py"
echo "   3. Start the server: uvicorn app.main:app --reload"
echo ""
