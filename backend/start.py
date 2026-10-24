#!/usr/bin/env python3
"""
BioScribe AI Backend Startup Script
"""

import sys
import os
import subprocess
import logging

# This launcher selects only the evidence-constrained application.
if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    import uvicorn
    uvicorn.run("bioscribe.api:app", host="127.0.0.1", port=8000, access_log=False)
    sys.exit(0)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        logger.error("Python 3.8 or higher is required")
        return False
    return True

def install_dependencies():
    """Install required dependencies"""
    logger.info("Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        logger.info("Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install dependencies: {e}")
        return False

def start_server():
    """Start the FastAPI server"""
    logger.info("Starting BioScribe AI backend server...")
    try:
        # Import and run the main application
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except ImportError as e:
        logger.error(f"Failed to import required modules: {e}")
        logger.info("Trying to install dependencies...")
        if install_dependencies():
            import uvicorn
            uvicorn.run(
                "main:app",
                host="0.0.0.0",
                port=8000,
                reload=True,
                log_level="info"
            )
        else:
            logger.error("Failed to start server")
            return False
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        return False

if __name__ == "__main__":
    logger.info("🧬 BioScribe AI Backend Starting...")
    
    if not check_python_version():
        sys.exit(1)
    
    # Change to backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    start_server()
