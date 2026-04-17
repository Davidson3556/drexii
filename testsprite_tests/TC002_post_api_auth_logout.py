import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
LOGOUT_ENDPOINT = "/api/auth/logout"
TIMEOUT = 30

def test_post_api_auth_logout():
    login_url = BASE_URL + LOGIN_ENDPOINT
    logout_url = BASE_URL + LOGOUT_ENDPOINT
    login_payload = {
        "email": "drexiitest@mailinator.com",
        "password": "12345678"
    }
    session = requests.Session()
    try:
        # Login to get session cookie
        login_resp = session.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert "ok" in login_data and login_data["ok"] is True, "Login response does not have ok:true"
        assert "provider" in login_data and isinstance(login_data["provider"], str), "Login response missing provider"

        # Logout using session with cookie
        logout_resp = session.post(logout_url, timeout=TIMEOUT)
        assert logout_resp.status_code == 200, f"Logout failed with status {logout_resp.status_code}"
        logout_data = logout_resp.json()
        assert "ok" in logout_data and logout_data["ok"] is True, "Logout response does not have ok:true"

        # Check that session cookie is cleared (session.cookies should be empty or expired)
        cookies = session.cookies.get_dict()
        # Session cookie names might vary, check no relevant cookies remain
        assert not cookies, f"Session cookies not cleared after logout: {cookies}"

    finally:
        session.close()

test_post_api_auth_logout()