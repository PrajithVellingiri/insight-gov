import asyncio
from limiter import limiter

# Mock request class
class MockRequest:
    def __init__(self, ip="127.0.0.1"):
        self.scope = {"type": "http", "client": (ip, 1234)}
        self._headers = []
        
    @property
    def headers(self):
        return {}

def run_test():
    try:
        from limits import RateLimitItemPerMinute
        limit = RateLimitItemPerMinute(5)
        
        req = MockRequest()
        
        # Hit limit 5 times
        for _ in range(5):
            allowed = limiter.limiter.hit(limit, "test_endpoint", req.scope["client"][0])
            print("Allowed:", allowed)
            
        # 6th time should fail
        allowed = limiter.limiter.hit(limit, "test_endpoint", req.scope["client"][0])
        print("6th Attempt Allowed:", allowed)
    except Exception as e:
        print("Error:", e)

run_test()
