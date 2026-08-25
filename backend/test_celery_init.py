import sys
import traceback

try:
    import worker
    print("Worker initialized successfully!")
except Exception as e:
    print("Worker initialization failed:")
    traceback.print_exc()
