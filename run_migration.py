#!/usr/bin/env python
import os
import sys
from app import create_app, db

app = create_app()

with app.app_context():
    try:
        with open('migrations/add_event_place_and_public_flags.sql', 'r') as f:
            sql = f.read()
        
        db.session.execute(db.text(sql))
        db.session.commit()
        print("✓ Migration executed successfully")
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        sys.exit(1)
