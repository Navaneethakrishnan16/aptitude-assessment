from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./aptitude.db"
    jwt_secret_key: str = "change-this-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 120
    admin_seed_email: str = "admin@example.com"
    admin_seed_password: str = "Admin@12345"
    # Comma-separated list of allowed frontend origins, e.g. "https://my-app.vercel.app,http://localhost:5173"
    cors_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
