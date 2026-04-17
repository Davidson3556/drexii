import requests
import time

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30


def test_post_api_threads_id_messages():
    session = requests.Session()

    # Step 1: Login to get session cookie and authentication
    login_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        timeout=TIMEOUT
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()
    assert login_data.get("ok") is True, f"Login response missing ok:true: {login_data}"
    assert "provider" in login_data, f"Login response missing provider: {login_data}"

    headers = {"x-user-id": EMAIL}

    # Step 2: Create a thread (since not provided) to post messages to
    create_thread_resp = session.post(
        f"{BASE_URL}/api/threads",
        headers=headers,
        json={"title": "Test Thread for TC008"},
        timeout=TIMEOUT,
    )
    assert create_thread_resp.status_code == 200, f"Create thread failed: {create_thread_resp.text}"
    create_thread_data = create_thread_resp.json()
    thread = create_thread_data.get("thread")
    assert thread and "id" in thread, f"Thread creation response invalid: {create_thread_data}"
    thread_id = thread["id"]

    try:
        # --- Test 1: POST message with content and x-user-id header (Happy Path) ---
        message_content = "Hello, this is a test message."
        post_message_resp = session.post(
            f"{BASE_URL}/api/threads/{thread_id}/messages",
            headers=headers,
            json={"content": message_content},
            timeout=TIMEOUT,
        )
        assert post_message_resp.status_code == 200, f"Post message failed: {post_message_resp.text}"
        post_message_data = post_message_resp.json()
        assert "message" in post_message_data and "reply" in post_message_data, \
            f"Response missing message or reply: {post_message_data}"
        assert isinstance(post_message_data["message"], dict), "message is not an object"
        assert isinstance(post_message_data["reply"], dict), "reply is not an object"

        # --- Test 2: POST message with missing content (should return 400) ---
        missing_content_resp = session.post(
            f"{BASE_URL}/api/threads/{thread_id}/messages",
            headers=headers,
            json={},  # no content
            timeout=TIMEOUT,
        )
        assert missing_content_resp.status_code == 400, f"Expected 400 missing content, got: {missing_content_resp.status_code}"
        missing_content_text = missing_content_resp.text
        # Expect error message containing "Missing content"
        assert "Missing content" in missing_content_text or missing_content_text.lower().find("missing content") != -1, f"Expected error message with 'Missing content', got: {missing_content_text}"

        # --- Test 3: POST message missing x-user-id header (should return 401) ---
        missing_userid_resp = session.post(
            f"{BASE_URL}/api/threads/{thread_id}/messages",
            json={"content": "Message without user id"},
            timeout=TIMEOUT,
        )
        assert missing_userid_resp.status_code == 401, f"Expected 401 missing x-user-id, got: {missing_userid_resp.status_code}"
        missing_userid_text = missing_userid_resp.text
        # Expect error message containing "User ID required"
        assert "User ID required" in missing_userid_text or missing_userid_text.lower().find("user id required") != -1, f"Expected error message 'User ID required', got: {missing_userid_text}"

        # --- Test 4: POST message to non-existent thread id (should return 404) ---
        fake_thread_id = "nonexistent-thread-id-12345"
        notfound_resp = session.post(
            f"{BASE_URL}/api/threads/{fake_thread_id}/messages",
            headers=headers,
            json={"content": "Message to invalid thread"},
            timeout=TIMEOUT,
        )
        assert notfound_resp.status_code == 404, f"Expected 404 thread not found, got: {notfound_resp.status_code}"
        notfound_text = notfound_resp.text
        assert "Thread not found" in notfound_text or notfound_text.lower().find("thread not found") != -1, f"Expected error message 'Thread not found', got: {notfound_text}"

        # --- Test 5: POST messages rapidly to trigger rate limit (expect 429 after some threshold) ---
        # Rapidly send 15 messages; expect 429 after some number (likely 10)
        rate_limit_triggered = False
        for i in range(15):
            resp = session.post(
                f"{BASE_URL}/api/threads/{thread_id}/messages",
                headers=headers,
                json={"content": f"Rapid message {i}"},
                timeout=TIMEOUT,
            )
            if resp.status_code == 429:
                rate_limit_triggered = True
                error_text = resp.text
                assert "Rate limit exceeded" in error_text or error_text.lower().find("rate limit exceeded") != -1, f"Expected 'Rate limit exceeded', got: {error_text}"
                break
            else:
                assert resp.status_code == 200, f"Unexpected status code during rapid messages: {resp.status_code}, body: {resp.text}"

        assert rate_limit_triggered, "Rate limit (429) was not triggered after rapid requests"

    finally:
        # Cleanup: Delete the created thread to keep environment clean
        # No delete endpoint for threads documented; if exists, it would be something like:
        # DELETE /api/threads/:id (not in PRD) - so skip cleanup if no endpoint available
        # Otherwise could logout to clear session
        try:
            session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)
        except Exception:
            pass


test_post_api_threads_id_messages()