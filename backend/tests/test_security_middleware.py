import asyncio
import unittest

from fastapi.responses import JSONResponse
from starlette.requests import Request

import main


def build_request(path: str, headers: list[tuple[bytes, bytes]] | None = None) -> Request:
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": headers or [],
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 80),
    }

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    return Request(scope, receive)


class SecurityMiddlewareTests(unittest.TestCase):
    def setUp(self):
        self.original_health_rule = main.RATE_LIMIT_RULES.get("/health")
        main.request_buckets.clear()

    def tearDown(self):
        main.request_buckets.clear()
        if self.original_health_rule is None:
            main.RATE_LIMIT_RULES.pop("/health", None)
        else:
            main.RATE_LIMIT_RULES["/health"] = self.original_health_rule

    def test_middleware_adds_security_headers_and_request_id(self):
        request = build_request("/health")

        async def call_next(_request: Request):
            return JSONResponse({"status": "ok"})

        response = asyncio.run(main.supabase_auth_middleware(request, call_next))

        self.assertEqual(response.status_code, 200)
        self.assertIn("X-Request-ID", response.headers)
        self.assertEqual(response.headers["X-Frame-Options"], "DENY")
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")

    def test_malformed_bearer_header_is_rejected_before_route_logic(self):
        request = build_request(
            "/api/auth/session",
            headers=[(b"authorization", b"Token nope")],
        )

        async def call_next(_request: Request):
            return JSONResponse({"ok": True})

        response = asyncio.run(main.supabase_auth_middleware(request, call_next))

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.body.decode(),
            '{"detail":"Authorization header must use Bearer <token>."}',
        )
        self.assertIn("X-Request-ID", response.headers)

    def test_rate_limiting_returns_429_after_threshold(self):
        main.RATE_LIMIT_RULES["/health"] = {"limit": 2, "scope": "ip"}

        async def call_next(_request: Request):
            return JSONResponse({"status": "ok"})

        first = asyncio.run(main.supabase_auth_middleware(build_request("/health"), call_next))
        second = asyncio.run(main.supabase_auth_middleware(build_request("/health"), call_next))
        third = asyncio.run(main.supabase_auth_middleware(build_request("/health"), call_next))

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(third.status_code, 429)
        self.assertEqual(
            third.body.decode(),
            '{"detail":"Too many requests. Please slow down and try again."}',
        )
