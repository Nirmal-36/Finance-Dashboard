from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import auth, accounts, categories, transactions, uploads, dashboard, budgets, devices, dev

app = FastAPI(
    title="FinanceLens API",
    description="AI-powered personal finance tracker backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(accounts.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(budgets.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(dev.router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
