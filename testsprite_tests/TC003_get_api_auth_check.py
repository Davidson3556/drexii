import requests

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
CHECK_URL = f"{BASE_URL}/api/auth/check"

def test_get_api_auth_check():
    session = requests.Session()
    try:
        # Login to get session cookie
        login_payload = {"email": EMAIL, "password": PASSWORD}
        login_resp = session.post(LOGIN_URL, json=login_payload, timeout=30)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_json = login_resp.json()
        assert login_json.get("ok") is True, "Login response missing ok:true"
        assert "provider" in login_json, "Login response missing provider"

        # Use session cookie to check auth status
        check_resp = session.get(CHECK_URL, timeout=30)
        assert check_resp.status_code == 200, f"Auth check failed with status {check_resp.status_code}"
        check_json = check_resp.json()
        assert isinstance(check_json.get("authenticated"), bool), "Authenticated field missing or not boolean"

    finally:
        # Logout to clear session cookie
        logout_resp = session.post(f"{BASE_URL}/api/auth/logout", timeout=30)
        if logout_resp.status_code == 200:
            logout_json = logout_resp.json()
            assert logout_json.get("ok") is True

test_get_api_auth_check()