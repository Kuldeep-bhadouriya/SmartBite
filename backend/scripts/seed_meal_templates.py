"""
Seed meal plan templates
Creates pre-built meal plans for different dietary goals
"""
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.meal_plan import MealPlan, PlannedMeal, MealType
from app.models.restaurant import MenuItem
from app.models.user import User


def seed_meal_plan_templates(db: Session):
    """Create pre-built meal plan templates"""
    
    # Get admin user (or create a system user for templates)
    admin = db.query(User).filter(User.email == "admin@smartbite.com").first()
    if not admin:
        print("Admin user not found. Creating system user for templates...")
        from app.core.security import get_password_hash
        admin = User(
            email="system@smartbite.com",
            hashed_password=get_password_hash("system_password_123"),
            first_name="System",
            last_name="Templates",
            is_verified=True,
            role="admin"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
    
    # Check if templates already exist
    existing = db.query(MealPlan).filter(MealPlan.is_template == True).first()
    if existing:
        print("Templates already exist. Skipping...")
        return
    
    # Get some menu items to use in templates
    menu_items = db.query(MenuItem).filter(MenuItem.is_available == True).limit(50).all()
    if not menu_items:
        print("No menu items found. Please seed menu items first.")
        return
    
    print(f"Found {len(menu_items)} menu items to use in templates")
    
    # Template 1: Weight Loss Plan
    weight_loss_plan = MealPlan(
        user_id=admin.id,
        name="Healthy Weight Loss Plan",
        description="Balanced, low-calorie meals for sustainable weight loss. Focuses on protein and vegetables.",
        is_template=True,
        template_category="Weight Loss",
        is_active=True
    )
    db.add(weight_loss_plan)
    db.flush()
    
    # Add meals to weight loss plan (using available items)
    meal_index = 0
    for day in range(7):  # 7 days
        for meal_type in [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER]:
            if meal_index < len(menu_items):
                item = menu_items[meal_index]
                meal = PlannedMeal(
                    meal_plan_id=weight_loss_plan.id,
                    menu_item_id=item.id,
                    restaurant_id=item.restaurant_id,
                    day_of_week=day,
                    meal_type=meal_type,
                    quantity=1,
                    notes="Healthy option for weight loss"
                )
                db.add(meal)
                meal_index += 1
    
    # Template 2: Muscle Gain Plan
    muscle_gain_plan = MealPlan(
        user_id=admin.id,
        name="Muscle Gain & Protein Plan",
        description="High-protein meals to support muscle building and recovery. Perfect for active lifestyles.",
        is_template=True,
        template_category="Muscle Gain",
        is_active=True
    )
    db.add(muscle_gain_plan)
    db.flush()
    
    # Add meals to muscle gain plan
    for day in range(7):
        for meal_type in [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK]:
            if meal_index < len(menu_items):
                item = menu_items[meal_index]
                meal = PlannedMeal(
                    meal_plan_id=muscle_gain_plan.id,
                    menu_item_id=item.id,
                    restaurant_id=item.restaurant_id,
                    day_of_week=day,
                    meal_type=meal_type,
                    quantity=1,
                    notes="High protein option"
                )
                db.add(meal)
                meal_index += 1
    
    # Template 3: Balanced Diet Plan
    balanced_diet_plan = MealPlan(
        user_id=admin.id,
        name="Balanced Nutrition Plan",
        description="Well-rounded meals with the right mix of proteins, carbs, and healthy fats for overall wellness.",
        is_template=True,
        template_category="Balanced Diet",
        is_active=True
    )
    db.add(balanced_diet_plan)
    db.flush()
    
    # Add meals to balanced diet plan
    meal_index = 0  # Reset to reuse items
    for day in range(7):
        for meal_type in [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER]:
            if meal_index < len(menu_items):
                item = menu_items[meal_index]
                meal = PlannedMeal(
                    meal_plan_id=balanced_diet_plan.id,
                    menu_item_id=item.id,
                    restaurant_id=item.restaurant_id,
                    day_of_week=day,
                    meal_type=meal_type,
                    quantity=1,
                    notes="Balanced nutrition"
                )
                db.add(meal)
                meal_index = (meal_index + 1) % len(menu_items)
    
    # Template 4: Vegan Delight Plan
    vegan_plan = MealPlan(
        user_id=admin.id,
        name="Vegan Delight Plan",
        description="100% plant-based meals that are nutritious, delicious, and good for the planet.",
        is_template=True,
        template_category="Vegan",
        is_active=True
    )
    db.add(vegan_plan)
    db.flush()
    
    for day in range(7):
        for meal_type in [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER]:
            if meal_index < len(menu_items):
                item = menu_items[meal_index]
                meal = PlannedMeal(
                    meal_plan_id=vegan_plan.id,
                    menu_item_id=item.id,
                    restaurant_id=item.restaurant_id,
                    day_of_week=day,
                    meal_type=meal_type,
                    quantity=1,
                    notes="100% plant-based"
                )
                db.add(meal)
                meal_index = (meal_index + 1) % len(menu_items)
    
    # Template 5: Keto-Friendly Plan
    keto_plan = MealPlan(
        user_id=admin.id,
        name="Keto-Friendly Plan",
        description="Low-carb, high-fat meals designed for the ketogenic diet. Stay in ketosis while enjoying great food.",
        is_template=True,
        template_category="Keto",
        is_active=True
    )
    db.add(keto_plan)
    db.flush()
    
    for day in range(7):
        for meal_type in [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER]:
            if meal_index < len(menu_items):
                item = menu_items[meal_index]
                meal = PlannedMeal(
                    meal_plan_id=keto_plan.id,
                    menu_item_id=item.id,
                    restaurant_id=item.restaurant_id,
                    day_of_week=day,
                    meal_type=meal_type,
                    quantity=1,
                    notes="Low-carb, high-fat"
                )
                db.add(meal)
                meal_index = (meal_index + 1) % len(menu_items)
    
    db.commit()
    
    print("✅ Successfully created 5 meal plan templates:")
    print("   - Healthy Weight Loss Plan")
    print("   - Muscle Gain & Protein Plan")
    print("   - Balanced Nutrition Plan")
    print("   - Vegan Delight Plan")
    print("   - Keto-Friendly Plan")


def main():
    db = SessionLocal()
    try:
        print("🌱 Seeding meal plan templates...")
        seed_meal_plan_templates(db)
        print("✅ Meal plan templates seeding completed!")
    except Exception as e:
        print(f"❌ Error seeding templates: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
