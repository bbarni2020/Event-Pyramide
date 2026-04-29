import os
from dotenv import load_dotenv
from app import create_app
import logging

load_dotenv(override=True)

# Configure logging to print all errors
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

if __name__ == '__main__':
    app = create_app()
    app.run(
        debug=os.getenv('FLASK_ENV') == 'development',
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 5002))
    )
