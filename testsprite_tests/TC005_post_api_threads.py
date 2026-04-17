import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
THREADS_URL = f"{BASE_URL}/api/threads"

EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30

def test_post_api_threads():
    session = requests.Session()
    try:
        # Login to get session cookie and auth info
        login_payload = {"email": EMAIL, "password": PASSWORD}
        login_resp = session.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert login_data.get("ok") is True
        assert "provider" in login_data

        # Headers with optional x-user-id header (set to user email)
        headers = {
            "x-user-id": EMAIL
        }

        # Body with optional title
        body = {
            "title": "Test Thread Title"
        }

        # Create a new conversation thread with x-user-id and title
        thread_resp = session.post(THREADS_URL, json=body, headers=headers, timeout=TIMEOUT)
        assert thread_resp.status_code == 200, f"Thread creation failed: {thread_resp.text}"
        thread_data = thread_resp.json()
        assert "thread" in thread_data
        thread = thread_data["thread"]
        assert isinstance(thread, dict)
        # thread may have id and title; title optional
        assert "id" in thread and thread["id"]
        # Title matches posted title or may be absent
        if "title" in thread:
            assert thread["title"] == "Test Thread Title"

        # Also test creating thread without title and without x-user-id (ephemeral)
        body_no_title = {}
        headers_no_user = {}
        thread_resp2 = session.post(THREADS_URL, json=body_no_title, headers=headers_no_user, timeout=TIMEOUT)
        assert thread_resp2.status_code == 200, f"Thread creation without title/user failed: {thread_resp2.text}"
        thread_data2 = thread_resp2.json()
        assert "thread" in thread_data2
        thread2 = thread_data2["thread"]
        assert isinstance(thread2, dict)
        assert "id" in thread2 and thread2["id"]

    finally:
        # Cleanup: delete the created thread if possible
        # Deleting threads is not described in the PRD, so no delete endpoint given.
        # Cannot delete thread; do nothing
        pass

test_post_api_threads()