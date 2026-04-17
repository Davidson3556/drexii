import requests

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30

def test_get_api_threads():
    session = requests.Session()
    try:
        # Login to get a session cookie
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": EMAIL, "password": PASSWORD},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert login_data.get("ok") is True
        assert "provider" in login_data

        # Set x-user-id header for thread listing as required (auth uses this header)
        headers = {"x-user-id": EMAIL}

        # Get list of threads for authenticated user
        threads_resp = session.get(
            f"{BASE_URL}/api/threads",
            headers=headers,
            timeout=TIMEOUT
        )
        assert threads_resp.status_code == 200, f"Threads listing failed: {threads_resp.text}"
        threads_data = threads_resp.json()
        assert "threads" in threads_data
        assert isinstance(threads_data["threads"], list)

    finally:
        # Logout to clear session
        logout_resp = session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)
        # It's OK if logout fails but we ignore errors here

test_get_api_threads()