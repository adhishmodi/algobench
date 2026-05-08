import multiprocessing
import time
import timeit
import traceback
import copy
from typing import List, Dict, Any

def _worker(code: str, target_func: str, generator_func: str, sizes: List[int], result_queue: multiprocessing.Queue):
    """
    Worker process to execute the code.
    This runs in a separate process so if it infinite loops, we can kill it.
    """
    try:
        # Create a restricted namespace
        namespace = {"__builtins__": __builtins__}
        
        # Execute the user code to define functions
        exec(code, namespace)
        
        if target_func not in namespace:
            raise ValueError(f"Target function '{target_func}' not found in the code.")
        if generator_func not in namespace:
            raise ValueError(f"Generator function '{generator_func}' not found in the code.")
            
        target = namespace[target_func]
        generator = namespace[generator_func]
        
        results = []
        for size in sizes:
            # Generate input
            input_data = generator(size)
            
            # Execute and measure
            if size < 100:
                # Use timeit for n < 100 to get better precision on O(1) operations
                # Use timeit for n < 100 to get better precision
                # We need to run it multiple times and average
                num_runs = 1000
                t_sec = timeit.timeit(lambda: target(copy.deepcopy(input_data)), number=num_runs) / num_runs
                t_ns = int(t_sec * 1_000_000_000)
                results.append({"size": size, "time_ns": t_ns})
            else:
                start = time.perf_counter_ns()
                target(input_data)
                end = time.perf_counter_ns()
                results.append({"size": size, "time_ns": end - start})
                
        result_queue.put({"status": "success", "data": results})
        
    except Exception as e:
        error_trace = traceback.format_exc()
        result_queue.put({"status": "error", "error": str(e), "traceback": error_trace})


def benchmark_code(code: str, target_function: str, generator_function: str, sizes: List[int], timeout: int = 5) -> List[Dict[str, Any]]:
    """
    Spawns a process to safely execute and benchmark the code.
    """
    queue = multiprocessing.Queue()
    process = multiprocessing.Process(
        target=_worker, 
        args=(code, target_function, generator_function, sizes, queue)
    )
    
    process.start()
    process.join(timeout)
    
    if process.is_alive():
        process.terminate()
        process.join()
        raise TimeoutError(f"Code execution timed out after {timeout} seconds. Possible infinite loop.")
        
    if not queue.empty():
        res = queue.get()
        if res["status"] == "success":
            return res["data"]
        else:
            raise RuntimeError(f"Execution Error: {res['error']}\n{res.get('traceback', '')}")
    else:
        raise RuntimeError("Process terminated unexpectedly without returning results.")
