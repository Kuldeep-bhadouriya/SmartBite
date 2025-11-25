#!/bin/bash

# Phase 2: Scheduled Delivery Setup Script
# This script sets up the database and seeds initial data

echo "🚀 SmartBite Phase 2: Scheduled Delivery Setup"
echo "=============================================="
echo ""

# Change to backend directory
cd "$(dirname "$0")/../backend" || exit

echo "📦 Step 1: Database Migration"
echo "-----------------------------"
echo "Creating migration for scheduled delivery models..."
alembic revision --autogenerate -m "Add scheduled delivery and time slot models"

echo ""
echo "Applying migration..."
alembic upgrade head

echo ""
echo "✅ Database migration complete!"

echo ""
echo "🌱 Step 2: Seeding Time Slots"
echo "-----------------------------"
python scripts/seed_time_slots.py

echo ""
echo "✅ Time slots seeded successfully!"

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Start the backend server:"
echo "   cd backend && uvicorn app.main:main --reload"
echo ""
echo "2. Configure restaurant time slots (Admin):"
echo "   POST /api/v1/time-slots/restaurant-slot-config/bulk"
echo "   {\"restaurant_id\": 1, \"time_slot_ids\": [1,2,3,4,5], \"max_orders_per_slot\": 20}"
echo ""
echo "3. Start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Test scheduled delivery:"
echo "   - Go to a restaurant page"
echo "   - Add items to cart"
echo "   - Proceed to checkout"
echo "   - Select 'Scheduled Delivery'"
echo "   - Choose date and time slot"
echo "   - Complete order"
echo ""
echo "🎉 Phase 2 setup complete! Happy scheduling!"
