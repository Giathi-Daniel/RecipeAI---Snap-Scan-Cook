import os
import unittest

import jwt
from fastapi import HTTPException

from services.auth_service import decode_supabase_jwt


class DecodeSupabaseJwtTests(unittest.TestCase):
    TEST_SECRET = "test-secret-that-is-long-enough-for-hs256"

    def setUp(self):
        self.previous_secret = os.environ.get("SUPABASE_JWT_SECRET")
        self.previous_url = os.environ.get("SUPABASE_URL")
        self.previous_public_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        os.environ["SUPABASE_JWT_SECRET"] = self.TEST_SECRET
        os.environ["SUPABASE_URL"] = "https://example.supabase.co"
        os.environ["NEXT_PUBLIC_SUPABASE_URL"] = "https://example.supabase.co"

    def tearDown(self):
        if self.previous_secret is None:
            os.environ.pop("SUPABASE_JWT_SECRET", None)
        else:
            os.environ["SUPABASE_JWT_SECRET"] = self.previous_secret

        if self.previous_url is None:
            os.environ.pop("SUPABASE_URL", None)
        else:
            os.environ["SUPABASE_URL"] = self.previous_url

        if self.previous_public_url is None:
            os.environ.pop("NEXT_PUBLIC_SUPABASE_URL", None)
        else:
            os.environ["NEXT_PUBLIC_SUPABASE_URL"] = self.previous_public_url

    def test_decodes_valid_supabase_jwt(self):
        token = jwt.encode(
            {
                "sub": "user-123",
                "iss": "https://example.supabase.co/auth/v1",
            },
            self.TEST_SECRET,
            algorithm="HS256",
        )

        payload = decode_supabase_jwt(token)

        self.assertEqual(payload["sub"], "user-123")

    def test_rejects_invalid_token(self):
        with self.assertRaises(HTTPException) as context:
            decode_supabase_jwt("not-a-real-token")

        self.assertEqual(context.exception.status_code, 401)
