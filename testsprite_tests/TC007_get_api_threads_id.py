import requests

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30

def test_get_api_threads_id():
    session = requests.Session()
    # Login to get session cookie
    login_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        timeout=TIMEOUT,
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_json = login_resp.json()
    assert login_json.get("ok") is True
    assert "provider" in login_json

    x_user_id = EMAIL

    thread_id = None
    try:
        # Create a new thread to get a valid thread id
        create_thread_resp = session.post(
            f"{BASE_URL}/api/threads",
            headers={"x-user-id": x_user_id},
            json={"title": "Test Thread for TC007"},
            timeout=TIMEOUT,
        )
        assert create_thread_resp.status_code == 200, f"Create thread failed: {create_thread_resp.text}"
        create_thread_json = create_thread_resp.json()
        assert "thread" in create_thread_json
        thread = create_thread_json["thread"]
        assert isinstance(thread, dict)
        thread_id = thread.get("id")
        assert thread_id, "Thread ID missing in create response"

        # Retrieve the created thread by ID (authenticated via x-user-id header)
        get_thread_resp = session.get(
            f"{BASE_URL}/api/threads/{thread_id}",
            headers={"x-user-id": x_user_id},
            timeout=TIMEOUT,
        )
        assert get_thread_resp.status_code == 200, f"Get thread failed: {get_thread_resp.text}"
        get_thread_json = get_thread_resp.json()
        assert "thread" in get_thread_json and "messages" in get_thread_json
        thread_data = get_thread_json["thread"]
        messages = get_thread_json["messages"]
        assert isinstance(thread_data, dict)
        assert isinstance(messages, list)

        # Attempt to get a non-existent thread id, expect 404
        fake_thread_id = "nonexistentthreadid12345"
        get_fake_thread_resp = session.get(
            f"{BASE_URL}/api/threads/{fake_thread_id}",
            headers={"x-user-id": x_user_id},
            timeout=TIMEOUT,
        )
        assert get_fake_thread_resp.status_code == 404, f"Expected 404 for non-existent thread id but got {get_fake_thread_resp.status_code}"

    finally:
        # Cleanup: delete created thread if possible
        if thread_id:
            # The PRD does not specify a delete endpoint for threads, so no cleanup here.
            pass

test_get_api_threads_id()