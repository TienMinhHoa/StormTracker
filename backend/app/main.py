from fastapi import FastAPI
from databases import engine, Base
from routers import storms

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(storms.router)
