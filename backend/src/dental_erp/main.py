from fastapi import FastAPI

app = FastAPI(title="Dental ERP")


@app.get("/health")
def health():
    return {"status": "ok"}
