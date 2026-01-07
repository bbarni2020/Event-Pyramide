#!/usr/bin/env python
import os
import sys
from pathlib import Path
from app import create_app, db

app = create_app()

migrations_dir = Path('migrations')
migration_files = sorted(migrations_dir.glob('*.sql'))

with app.app_context():
    for migration_file in migration_files:
        try:
            with open(migration_file, 'r') as f:
                sql = f.read()
            
            statements = [s.strip() for s in sql.split(';') if s.strip()]
            for statement in statements:
                db.session.execute(db.text(statement))
            
            db.session.commit()
            print(f"✓ {migration_file.name}")
        except Exception as e:
            db.session.rollback()
            print(f"✗ {migration_file.name}: {e}")
            sys.exit(1)

print("\n✓ All migrations executed successfully")
