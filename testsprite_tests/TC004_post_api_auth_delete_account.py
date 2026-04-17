import requests

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30

def test_post_api_auth_delete_account():
    session = requests.Session()
    try:
        # Step 1: Login to obtain session cookie
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": EMAIL, "password": PASSWORD},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert login_data.get("ok") is True, "Login response missing ok true"
        assert "provider" in login_data, "Login response missing provider"
        # Session cookie is maintained by session object automatically

        # Step 2: Delete account with valid userId in body and valid session cookie
        delete_resp = session.post(
            f"{BASE_URL}/api/auth/delete-account",
            json={"userId": EMAIL},
            timeout=TIMEOUT
        )
        assert delete_resp.status_code == 200, f"Delete account failed: {delete_resp.text}"
        delete_data = delete_resp.json()
        assert delete_data.get("ok") is True, "Delete account response missing ok true"

        # Step 3: Attempt delete account with missing userId (expect 400)
        missing_userid_resp = session.post(
            f"{BASE_URL}/api/auth/delete-account",
            json={},
            timeout=TIMEOUT
        )
        assert missing_userid_resp.status_code in (400, 401), (
            f"Expected 400 or 401 for missing userId but got {missing_userid_resp.status_code}. "
            f"Response: {missing_userid_resp.text}"
        )

        # Step 4: Attempt delete account with invalid session (new session, no login)
        no_session = requests.Session()
        invalid_session_resp = no_session.post(
            f"{BASE_URL}/api/auth/delete-account",
            json={"userId": EMAIL},
            timeout=TIMEOUT
        )
        assert invalid_session_resp.status_code in (400, 401), (
            f"Expected 400 or 401 for invalid session but got {invalid_session_resp.status_code}. "
            f"Response: {invalid_session_resp.text}"
        )

    finally:
        # Cleanup: If account was deleted, cannot logout; if account was not deleted,
        # try logging out to clean session
        try:
            # Attempt logout to clear session if account exists
            logout_resp = session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)
            # Not asserting logout here because account might be deleted
        except Exception:
            pass

test_post_api_auth_delete_account()