#!/bin/bash

echo "🚀 Starting SmartBite Frontend Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

cd frontend

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo "⚠️  Please update the .env.local file with your configuration!"
fi

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Update .env.local file with your API keys"
echo "   2. Start the dev server: npm run dev"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
