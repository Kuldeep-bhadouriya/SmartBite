"""
Seed script to create default time slots for scheduled delivery
Run this after database migration
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import time
from app.db.session import SessionLocal
from app.models.time_slot import TimeSlot


def seed_time_slots():
    """Create default time slots"""
    db = SessionLocal()
    
    try:
        # Check if time slots already exist
        existing = db.query(TimeSlot).first()
        if existing:
            print("Time slots already exist. Skipping seed.")
            return
        
        # Define default time slots (4 PM to 9 PM)
        time_slots = [
            {
                "name": "4-5 PM",
                "start_time": time(16, 0),
                "end_time": time(17, 0),
                "display_order": 1
            },
            {
                "name": "5-6 PM",
                "start_time": time(17, 0),
                "end_time": time(18, 0),
                "display_order": 2
            },
            {
                "name": "6-7 PM",
                "start_time": time(18, 0),
                "end_time": time(19, 0),
                "display_order": 3
            },
            {
                "name": "7-8 PM",
                "start_time": time(19, 0),
                "end_time": time(20, 0),
                "display_order": 4
            },
            {
                "name": "8-9 PM",
                "start_time": time(20, 0),
                "end_time": time(21, 0),
                "display_order": 5
            }
        ]
        
        # Create time slots
        for slot_data in time_slots:
            time_slot = TimeSlot(**slot_data)
            db.add(time_slot)
        
        db.commit()
        print(f"✅ Successfully created {len(time_slots)} time slots")
        
        # Display created slots
        slots = db.query(TimeSlot).order_by(TimeSlot.display_order).all()
        print("\nCreated Time Slots:")
        for slot in slots:
            print(f"  - ID: {slot.id} | {slot.name} | {slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}")
        
    except Exception as e:
        print(f"❌ Error seeding time slots: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding time slots...")
    seed_time_slots()
    print("✅ Done!")
