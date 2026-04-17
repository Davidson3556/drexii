import requests

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"


def test_get_api_threads():
    session = requests.Session()
    try:
        # Login to get session cookie
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": EMAIL, "password": PASSWORD},
            timeout=30,
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_json = login_resp.json()
        assert login_json.get("ok") is True, f"Login response missing ok:true: {login_json}"
        assert "provider" in login_json, f"Login response missing provider: {login_json}"

        # List all threads for authenticated user
        # Auth requires x-user-id header set to user email for threads endpoints
        headers = {"x-user-id": EMAIL}

        threads_resp = session.get(f"{BASE_URL}/api/threads", headers=headers, timeout=30)
        assert threads_resp.status_code == 200, f"Get threads failed: {threads_resp.text}"
        threads_json = threads_resp.json()
        assert isinstance(threads_json, dict), "Response JSON is not a dictionary"
        assert "threads" in threads_json, "'threads' key not in response"
        assert isinstance(threads_json["threads"], list), "'threads' is not a list"

    finally:
        # Logout to clear session
        session.post(f"{BASE_URL}/api/auth/logout", timeout=30)


test_get_api_threads()