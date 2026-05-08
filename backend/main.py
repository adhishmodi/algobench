from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from executor import benchmark_code
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BenchmarkRequest(BaseModel):
    code: str
    target_function: str
    generator_function: str
    sizes: List[int]

class BenchmarkResult(BaseModel):
    size: int
    time_ms: float

class BenchmarkResponse(BaseModel):
    results: List[BenchmarkResult]
    error: str | None = None

@app.post("/api/benchmark", response_model=BenchmarkResponse)
async def run_benchmark(request: BenchmarkRequest):
    try:
        results = benchmark_code(
            request.code, 
            request.target_function, 
            request.generator_function, 
            request.sizes
        )
        return BenchmarkResponse(results=[BenchmarkResult(**r) for r in results])
    except Exception as e:
        logging.error(f"Error executing benchmark: {e}")
        return BenchmarkResponse(results=[], error=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
