import requests

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30

def test_get_api_auth_check():
    session = requests.Session()
    try:
        # Login to get session cookie
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": EMAIL, "password": PASSWORD},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert isinstance(login_data, dict), "Login response is not a JSON object"
        assert login_data.get("ok") is True, "Login response 'ok' is not True"
        assert "provider" in login_data and isinstance(login_data["provider"], str), "Login response missing or invalid 'provider'"

        # Use session cookie to check auth
        auth_check_resp = session.get(
            f"{BASE_URL}/api/auth/check",
            timeout=TIMEOUT
        )
        assert auth_check_resp.status_code == 200, f"Auth check failed with status {auth_check_resp.status_code}"
        auth_check_data = auth_check_resp.json()
        assert isinstance(auth_check_data, dict), "Auth check response is not a JSON object"
        assert "authenticated" in auth_check_data and isinstance(auth_check_data["authenticated"], bool), "'authenticated' missing or not boolean"

    finally:
        # Logout to clear session cookie regardless of test outcome
        session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)

test_get_api_auth_check()