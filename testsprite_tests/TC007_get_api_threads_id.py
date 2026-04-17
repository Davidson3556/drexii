import requests

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30


def test_get_api_threads_id():
    session = requests.Session()

    # Step 1: Login to get a session cookie and verify login success
    login_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        timeout=TIMEOUT,
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()
    assert login_data.get("ok") is True, "Login response missing ok:true"
    assert "provider" in login_data, "Login response missing provider"

    # Set x-user-id header for requests that require it
    headers = {"x-user-id": EMAIL}

    thread_id = None
    try:
        # Step 2: Create a thread for the authenticated user (to have a thread to query)
        create_thread_resp = session.post(
            f"{BASE_URL}/api/threads",
            headers=headers,
            json={"title": "Test Thread for TC007"},
            timeout=TIMEOUT,
        )
        assert create_thread_resp.status_code == 200, f"Create thread failed: {create_thread_resp.text}"
        create_thread_data = create_thread_resp.json()
        thread = create_thread_data.get("thread")
        assert thread is not None and "id" in thread, "Created thread missing id"
        thread_id = thread["id"]

        # Step 3: Retrieve the thread by id with authentication headers (x-user-id)
        get_thread_resp = session.get(
            f"{BASE_URL}/api/threads/{thread_id}",
            headers=headers,
            timeout=TIMEOUT,
        )
        assert get_thread_resp.status_code == 200, f"GET thread by id failed: {get_thread_resp.text}"
        get_thread_data = get_thread_resp.json()
        assert "thread" in get_thread_data, "Response missing 'thread'"
        assert "messages" in get_thread_data, "Response missing 'messages'"
        assert get_thread_data["thread"]["id"] == thread_id, "Returned thread id mismatch"

        # Step 4: Attempt to get a non-existent thread to trigger 404
        non_existent_id = "non-existent-thread-id-1234"
        get_nonexistent_resp = session.get(
            f"{BASE_URL}/api/threads/{non_existent_id}",
            headers=headers,
            timeout=TIMEOUT,
        )
        assert get_nonexistent_resp.status_code == 404, "Expected 404 for non-existent thread id"
    finally:
        # Clean up: delete the created thread if possible
        if thread_id:
            try:
                # No explicit delete endpoint given for threads: Skipping deletion
                pass
            except Exception:
                pass

        # Logout at the end of test
        session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)


test_get_api_threads_id()