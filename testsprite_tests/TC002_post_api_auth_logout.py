import requests

BASE_URL = "http://localhost:3000"
LOGIN_PATH = "/api/auth/login"
LOGOUT_PATH = "/api/auth/logout"

EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30

def test_post_api_auth_logout():
    session = requests.Session()
    try:
        # Login to get session cookie
        login_payload = {
            "email": EMAIL,
            "password": PASSWORD
        }
        login_response = session.post(
            BASE_URL + LOGIN_PATH,
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        login_json = login_response.json()
        assert login_json.get("ok") is True, "Login did not return ok true"
        assert "provider" in login_json, "Login response missing provider"

        # Confirm session cookie is set (at least one cookie)
        assert session.cookies, "Session cookie not set after login"

        # Logout - expect 200 with {ok: true} and session cookie cleared
        logout_response = session.post(
            BASE_URL + LOGOUT_PATH,
            timeout=TIMEOUT
        )
        assert logout_response.status_code == 200, f"Logout failed: {logout_response.text}"
        logout_json = logout_response.json()
        assert logout_json.get("ok") is True, "Logout did not return ok true"

        # After logout, session cookies should be cleared
        # Some servers may clear cookies by setting expired cookies; check that session.cookies is empty or no session cookie
        # Check that all cookies set by server for the domain have expired or session cookie removed
        is_session_cleared = True
        for cookie in session.cookies:
            # If a cookie still valid, session may not be cleared
            if cookie.name.lower() == "session" or cookie.name.startswith("session") or cookie.value:
                is_session_cleared = False
                break
        assert is_session_cleared, "Session cookie not cleared after logout"
    finally:
        session.close()

test_post_api_auth_logout()