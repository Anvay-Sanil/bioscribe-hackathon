"""
BioScribe AI - Production Configuration
Industry-grade configuration management with environment-based settings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "BioScribe AI"
    APP_VERSION: str = "2.0.0"
    APP_DESCRIPTION: str = "Industry-Grade Drug Discovery Platform"
    ENVIRONMENT: str = "development"  # development, staging, production
    DEBUG: bool = True
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = True
    WORKERS: int = 4
    
    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "https://bioscribe-ai.vercel.app"
    ]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: List[str] = ["*"]
    CORS_HEADERS: List[str] = ["*"]
    
    # Database Configuration
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "bioscribe_ai"
    MONGODB_MAX_POOL_SIZE: int = 10
    MONGODB_MIN_POOL_SIZE: int = 1
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_DB: int = 0
    REDIS_MAX_CONNECTIONS: int = 10
    CACHE_TTL: int = 3600  # 1 hour
    
    # AI Model Configuration
    HUGGINGFACE_CACHE_DIR: str = "./models/cache"
    MODEL_DEVICE: str = "cpu"  # cpu, cuda, mps
    MAX_SEQUENCE_LENGTH: int = 1000
    BATCH_SIZE: int = 8
    
    # Molecular Docking Settings
    DOCKING_EXHAUSTIVENESS: int = 8
    DOCKING_NUM_MODES: int = 9
    DOCKING_ENERGY_RANGE: float = 3.0
    
    # API Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Logging
    LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    LOG_FORMAT: str = "json"  # json, text
    LOG_FILE: Optional[str] = None
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    PROMETHEUS_ENABLED: bool = False
    
    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".fasta", ".pdb", ".sdf", ".mol"]
    
    # Performance
    ENABLE_CACHING: bool = True
    ASYNC_WORKERS: int = 4
    REQUEST_TIMEOUT: int = 300  # 5 minutes
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


class DevelopmentSettings(Settings):
    """Development environment settings"""
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    RELOAD: bool = True
    LOG_LEVEL: str = "DEBUG"


class ProductionSettings(Settings):
    """Production environment settings"""
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    RELOAD: bool = False
    LOG_LEVEL: str = "WARNING"
    WORKERS: int = 8
    RATE_LIMIT_PER_MINUTE: int = 30
    RATE_LIMIT_PER_HOUR: int = 500


class TestingSettings(Settings):
    """Testing environment settings"""
    ENVIRONMENT: str = "testing"
    DEBUG: bool = True
    MONGODB_DB_NAME: str = "bioscribe_ai_test"
    REDIS_DB: int = 1


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings based on environment"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()


# Global settings instance
settings = get_settings()
