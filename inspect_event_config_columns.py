#!/usr/bin/env python
from app import create_app, db

app = create_app()

with app.app_context():
    rows = db.session.execute(db.text("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'event_config'
        ORDER BY column_name
    """)).fetchall()
    print("Columns in event_config:")
    for name, dtype in rows:
        print(f"- {name}: {dtype}")
