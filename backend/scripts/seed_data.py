"""
Seed data script for SmartBite
Run this script to populate the database with initial data for development/testing
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole, AuthProvider
from app.models.restaurant import Restaurant, RestaurantStatus, MenuCategory, MenuItem, ItemType


def create_admin_user(db: Session):
    """Create admin user"""
    admin = db.query(User).filter(User.email == "admin@smartbite.com").first()
    if not admin:
        admin = User(
            email="admin@smartbite.com",
            hashed_password=get_password_hash("admin123"),
            first_name="Admin",
            last_name="User",
            role=UserRole.ADMIN,
            auth_provider=AuthProvider.EMAIL,
            is_verified=True,
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("✅ Admin user created: admin@smartbite.com / admin123")
    else:
        print("ℹ️ Admin user already exists")
    return admin


def create_test_user(db: Session):
    """Create test user"""
    user = db.query(User).filter(User.email == "test@example.com").first()
    if not user:
        user = User(
            email="test@example.com",
            phone="+919876543210",
            hashed_password=get_password_hash("test1234"),
            first_name="Test",
            last_name="User",
            role=UserRole.USER,
            auth_provider=AuthProvider.EMAIL,
            is_verified=True,
            is_active=True
        )
        db.add(user)
        db.commit()
        print("✅ Test user created: test@example.com / test1234")
    else:
        print("ℹ️ Test user already exists")
    return user


def create_restaurants(db: Session):
    """Create sample restaurants with menus"""
    restaurants_data = [
        {
            "name": "Spice Garden",
            "slug": "spice-garden",
            "description": "Authentic Indian cuisine with traditional recipes",
            "address": "123 Main Street, Koramangala",
            "city": "Bangalore",
            "state": "Karnataka",
            "postal_code": "560034",
            "phone": "+919876543210",
            "cuisine_type": "Indian, North Indian, Mughlai",
            "is_veg": False,
            "is_non_veg": True,
            "average_cost_for_two": 600,
            "rating": 4.2,
            "total_ratings": 1250,
            "opening_time": "11:00",
            "closing_time": "23:00",
            "preparation_time": 30,
            "delivery_fee": 40,
            "minimum_order": 200,
            "free_delivery_above": 500,
            "is_featured": True,
            "latitude": 12.9352,
            "longitude": 77.6245,
            "categories": [
                {
                    "name": "Starters",
                    "display_order": 1,
                    "items": [
                        {"name": "Paneer Tikka", "description": "Grilled cottage cheese with spices", "price": 249, "item_type": ItemType.VEG, "is_bestseller": True},
                        {"name": "Chicken Tikka", "description": "Tender chicken marinated in yogurt and spices", "price": 299, "item_type": ItemType.NON_VEG},
                        {"name": "Veg Spring Roll", "description": "Crispy rolls filled with vegetables", "price": 149, "item_type": ItemType.VEG},
                    ]
                },
                {
                    "name": "Main Course",
                    "display_order": 2,
                    "items": [
                        {"name": "Butter Chicken", "description": "Creamy tomato-based chicken curry", "price": 349, "item_type": ItemType.NON_VEG, "is_bestseller": True, "is_featured": True},
                        {"name": "Paneer Butter Masala", "description": "Cottage cheese in rich tomato gravy", "price": 299, "item_type": ItemType.VEG, "is_featured": True},
                        {"name": "Dal Makhani", "description": "Creamy black lentils slow-cooked overnight", "price": 249, "item_type": ItemType.VEG},
                        {"name": "Biryani Chicken", "description": "Aromatic rice with tender chicken pieces", "price": 349, "item_type": ItemType.NON_VEG, "is_bestseller": True},
                    ]
                },
                {
                    "name": "Breads",
                    "display_order": 3,
                    "items": [
                        {"name": "Butter Naan", "description": "Soft bread with butter", "price": 59, "item_type": ItemType.VEG},
                        {"name": "Garlic Naan", "description": "Naan topped with garlic", "price": 69, "item_type": ItemType.VEG},
                        {"name": "Tandoori Roti", "description": "Whole wheat bread from tandoor", "price": 39, "item_type": ItemType.VEG},
                    ]
                },
                {
                    "name": "Desserts",
                    "display_order": 4,
                    "items": [
                        {"name": "Gulab Jamun", "description": "Sweet milk dumplings in sugar syrup", "price": 99, "item_type": ItemType.VEG},
                        {"name": "Rasmalai", "description": "Soft cottage cheese in sweetened milk", "price": 129, "item_type": ItemType.VEG},
                    ]
                }
            ]
        },
        {
            "name": "Pizza Palace",
            "slug": "pizza-palace",
            "description": "Authentic Italian pizzas and pastas",
            "address": "456 Brigade Road",
            "city": "Bangalore",
            "state": "Karnataka",
            "postal_code": "560001",
            "phone": "+919876543211",
            "cuisine_type": "Italian, Pizza, Pasta",
            "is_veg": False,
            "is_non_veg": True,
            "average_cost_for_two": 800,
            "rating": 4.5,
            "total_ratings": 2100,
            "opening_time": "10:00",
            "closing_time": "22:30",
            "preparation_time": 25,
            "delivery_fee": 50,
            "minimum_order": 300,
            "free_delivery_above": 600,
            "is_featured": True,
            "latitude": 12.9716,
            "longitude": 77.5946,
            "categories": [
                {
                    "name": "Pizzas",
                    "display_order": 1,
                    "items": [
                        {"name": "Margherita", "description": "Classic tomato and mozzarella", "price": 299, "item_type": ItemType.VEG},
                        {"name": "Pepperoni", "description": "Loaded with pepperoni slices", "price": 449, "item_type": ItemType.NON_VEG, "is_bestseller": True},
                        {"name": "Veggie Supreme", "description": "Loaded with fresh vegetables", "price": 399, "item_type": ItemType.VEG, "is_featured": True},
                        {"name": "BBQ Chicken", "description": "Smoky BBQ sauce with chicken", "price": 499, "item_type": ItemType.NON_VEG},
                    ]
                },
                {
                    "name": "Pastas",
                    "display_order": 2,
                    "items": [
                        {"name": "Spaghetti Bolognese", "description": "Classic meat sauce pasta", "price": 349, "item_type": ItemType.NON_VEG},
                        {"name": "Penne Arrabiata", "description": "Spicy tomato sauce pasta", "price": 299, "item_type": ItemType.VEG},
                        {"name": "Alfredo Pasta", "description": "Creamy white sauce pasta", "price": 329, "item_type": ItemType.VEG, "is_bestseller": True},
                    ]
                },
                {
                    "name": "Sides",
                    "display_order": 3,
                    "items": [
                        {"name": "Garlic Bread", "description": "Toasted bread with garlic butter", "price": 149, "item_type": ItemType.VEG},
                        {"name": "Cheesy Fries", "description": "French fries with cheese sauce", "price": 179, "item_type": ItemType.VEG},
                    ]
                }
            ]
        },
        {
            "name": "Green Bowl",
            "slug": "green-bowl",
            "description": "Healthy salads, smoothies and bowls",
            "address": "789 HSR Layout",
            "city": "Bangalore",
            "state": "Karnataka",
            "postal_code": "560102",
            "phone": "+919876543212",
            "cuisine_type": "Healthy, Salads, Bowls, Vegan",
            "is_veg": True,
            "is_non_veg": False,
            "average_cost_for_two": 500,
            "rating": 4.6,
            "total_ratings": 890,
            "opening_time": "08:00",
            "closing_time": "21:00",
            "preparation_time": 15,
            "delivery_fee": 30,
            "minimum_order": 150,
            "free_delivery_above": 400,
            "is_featured": False,
            "latitude": 12.9081,
            "longitude": 77.6476,
            "categories": [
                {
                    "name": "Salads",
                    "display_order": 1,
                    "items": [
                        {"name": "Caesar Salad", "description": "Romaine lettuce with caesar dressing", "price": 249, "item_type": ItemType.VEG, "is_featured": True, "calories": 350, "protein": 12, "carbs": 20, "fat": 18},
                        {"name": "Greek Salad", "description": "Fresh vegetables with feta cheese", "price": 279, "item_type": ItemType.VEG, "calories": 280, "protein": 8, "carbs": 15, "fat": 20},
                        {"name": "Quinoa Bowl", "description": "Protein-rich quinoa with vegetables", "price": 329, "item_type": ItemType.VEGAN, "is_bestseller": True, "calories": 420, "protein": 18, "carbs": 45, "fat": 12},
                    ]
                },
                {
                    "name": "Smoothie Bowls",
                    "display_order": 2,
                    "items": [
                        {"name": "Acai Bowl", "description": "Acai berry blend with granola", "price": 299, "item_type": ItemType.VEGAN, "is_bestseller": True, "calories": 380, "protein": 6, "carbs": 55, "fat": 8},
                        {"name": "Green Power Bowl", "description": "Spinach, banana, and protein", "price": 279, "item_type": ItemType.VEGAN, "calories": 320, "protein": 15, "carbs": 40, "fat": 6},
                    ]
                },
                {
                    "name": "Smoothies",
                    "display_order": 3,
                    "items": [
                        {"name": "Berry Blast", "description": "Mixed berries smoothie", "price": 179, "item_type": ItemType.VEGAN, "calories": 180, "protein": 4, "carbs": 35, "fat": 2},
                        {"name": "Green Detox", "description": "Spinach, apple, ginger smoothie", "price": 199, "item_type": ItemType.VEGAN, "calories": 150, "protein": 3, "carbs": 30, "fat": 1},
                        {"name": "Protein Shake", "description": "Banana, peanut butter, protein", "price": 229, "item_type": ItemType.VEG, "calories": 350, "protein": 25, "carbs": 30, "fat": 12},
                    ]
                }
            ]
        },
        {
            "name": "Dragon Wok",
            "slug": "dragon-wok",
            "description": "Authentic Chinese and Asian cuisine",
            "address": "321 Indiranagar",
            "city": "Bangalore",
            "state": "Karnataka",
            "postal_code": "560038",
            "phone": "+919876543213",
            "cuisine_type": "Chinese, Asian, Thai",
            "is_veg": False,
            "is_non_veg": True,
            "average_cost_for_two": 700,
            "rating": 4.3,
            "total_ratings": 1560,
            "opening_time": "11:30",
            "closing_time": "23:00",
            "preparation_time": 25,
            "delivery_fee": 45,
            "minimum_order": 250,
            "free_delivery_above": 500,
            "is_featured": True,
            "latitude": 12.9784,
            "longitude": 77.6408,
            "categories": [
                {
                    "name": "Starters",
                    "display_order": 1,
                    "items": [
                        {"name": "Veg Manchurian", "description": "Deep fried vegetable balls in spicy sauce", "price": 199, "item_type": ItemType.VEG, "is_spicy": True},
                        {"name": "Chicken 65", "description": "Spicy deep fried chicken", "price": 279, "item_type": ItemType.NON_VEG, "is_spicy": True, "is_bestseller": True},
                        {"name": "Spring Rolls", "description": "Crispy rolls with vegetable filling", "price": 149, "item_type": ItemType.VEG},
                        {"name": "Drums of Heaven", "description": "Crispy chicken drumettes", "price": 299, "item_type": ItemType.NON_VEG},
                    ]
                },
                {
                    "name": "Noodles & Rice",
                    "display_order": 2,
                    "items": [
                        {"name": "Hakka Noodles", "description": "Stir fried noodles with vegetables", "price": 199, "item_type": ItemType.VEG},
                        {"name": "Chicken Fried Rice", "description": "Wok tossed rice with chicken", "price": 249, "item_type": ItemType.NON_VEG, "is_bestseller": True},
                        {"name": "Schezwan Noodles", "description": "Spicy Schezwan style noodles", "price": 229, "item_type": ItemType.VEG, "is_spicy": True},
                        {"name": "Singapore Rice", "description": "Flavorful rice with vegetables", "price": 219, "item_type": ItemType.VEG},
                    ]
                },
                {
                    "name": "Main Course",
                    "display_order": 3,
                    "items": [
                        {"name": "Kung Pao Chicken", "description": "Chicken with peanuts in spicy sauce", "price": 329, "item_type": ItemType.NON_VEG, "is_spicy": True, "is_featured": True},
                        {"name": "Chilli Paneer", "description": "Cottage cheese in spicy sauce", "price": 279, "item_type": ItemType.VEG, "is_spicy": True},
                        {"name": "Thai Green Curry", "description": "Vegetables in Thai green curry", "price": 299, "item_type": ItemType.VEG},
                    ]
                }
            ]
        }
    ]
    
    for rest_data in restaurants_data:
        existing = db.query(Restaurant).filter(Restaurant.slug == rest_data["slug"]).first()
        if existing:
            print(f"ℹ️ Restaurant '{rest_data['name']}' already exists")
            continue
        
        categories_data = rest_data.pop("categories")
        
        restaurant = Restaurant(**rest_data, status=RestaurantStatus.ACTIVE)
        db.add(restaurant)
        db.flush()
        
        for cat_data in categories_data:
            items_data = cat_data.pop("items")
            
            category = MenuCategory(
                restaurant_id=restaurant.id,
                **cat_data
            )
            db.add(category)
            db.flush()
            
            for idx, item_data in enumerate(items_data):
                item = MenuItem(
                    restaurant_id=restaurant.id,
                    category_id=category.id,
                    display_order=idx,
                    **item_data
                )
                db.add(item)
        
        print(f"✅ Created restaurant: {rest_data['name']}")
    
    db.commit()


def main():
    print("\n🌱 Starting database seed...\n")
    
    db = SessionLocal()
    try:
        create_admin_user(db)
        create_test_user(db)
        create_restaurants(db)
        
        print("\n✅ Database seeding completed!\n")
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}\n")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
