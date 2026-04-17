import requests

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30

def test_post_api_threads():
    session = requests.Session()
    thread_json = None
    thread_json2 = None
    try:
        # Step 1: Login to get session cookie
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": EMAIL, "password": PASSWORD},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_json = login_resp.json()
        assert login_json.get("ok") is True, "Login response missing ok:true"
        assert "provider" in login_json, "Login response missing provider"

        # Step 2: Create new thread with x-user-id header (optional) and optional title
        headers = {
            "x-user-id": EMAIL
        }
        thread_payload = {
            "title": "Test Thread Title"
        }
        create_resp = session.post(
            f"{BASE_URL}/api/threads",
            headers=headers,
            json=thread_payload,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 200, f"Thread creation failed: {create_resp.text}"
        thread_json = create_resp.json()
        assert "thread" in thread_json, "Response missing 'thread' object"
        thread = thread_json["thread"]
        assert isinstance(thread, dict), "'thread' is not an object"
        # title is optional but if present it should match what we sent
        if "title" in thread:
            assert thread["title"] == thread_payload["title"], "Thread title mismatch"

        # Step 3: Create new thread without title and without x-user-id header (optional)
        create_resp2 = session.post(
            f"{BASE_URL}/api/threads",
            json={},  # no title
            timeout=TIMEOUT
        )
        assert create_resp2.status_code == 200, f"Thread creation without title failed: {create_resp2.text}"
        thread_json2 = create_resp2.json()
        assert "thread" in thread_json2, "Response missing 'thread' object on creation without title"
        thread2 = thread_json2["thread"]
        assert isinstance(thread2, dict), "'thread' is not an object on creation without title"
        # title is optional; if present, must be string or None
        if "title" in thread2:
            assert thread2["title"] is None or isinstance(thread2["title"], str), "Thread title invalid"

    finally:
        # Cleanup: Delete created threads if they have id (try-finally)
        for t in [thread_json.get("thread") if thread_json else None, thread_json2.get("thread") if thread_json2 else None]:
            if t and "id" in t:
                tid = t["id"]
                try:
                    delete_resp = session.delete(
                        f"{BASE_URL}/api/threads/{tid}",
                        headers={"x-user-id": EMAIL},
                        timeout=TIMEOUT
                    )
                    # If delete endpoint not present or not implemented, ignore errors
                    if delete_resp.status_code not in [200, 404]:
                        pass
                except Exception:
                    # Ignore cleanup errors
                    pass

test_post_api_threads()
