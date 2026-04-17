import requests
import time

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def tc008_post_api_threads_id_messages():
    session = requests.Session()

    # Login to get any session cookies if needed
    login_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_json = login_resp.json()
    assert login_json.get("ok") is True and "provider" in login_json

    x_user_id = EMAIL

    # Create a new thread to use for messages
    created_thread = None
    try:
        create_thread_resp = session.post(
            f"{BASE_URL}/api/threads",
            json={"title": "TC008 Test Thread"},
            headers={"x-user-id": x_user_id, "Content-Type": "application/json"},
            timeout=TIMEOUT,
        )
        assert create_thread_resp.status_code == 200, f"Thread creation failed: {create_thread_resp.text}"
        thread_json = create_thread_resp.json()
        assert "thread" in thread_json and "id" in thread_json["thread"]
        created_thread = thread_json["thread"]
        thread_id = created_thread["id"]

        # 1. Happy case: Post a user message to the thread with valid content and x-user-id
        message_content = "Hello, AI! Summarize today's news."
        post_msg_resp = session.post(
            f"{BASE_URL}/api/threads/{thread_id}/messages",
            json={"content": message_content},
            headers={"x-user-id": x_user_id, "Content-Type": "application/json"},
            timeout=TIMEOUT,
        )
        assert post_msg_resp.status_code == 200, f"Valid message post failed: {post_msg_resp.text}"
        post_msg_json = post_msg_resp.json()
        assert "message" in post_msg_json and "reply" in post_msg_json
        # Check that message content matches
        assert post_msg_json["message"].get("content") == message_content
        # Check reply has content
        assert isinstance(post_msg_json["reply"].get("content"), str)
        assert len(post_msg_json["reply"].get("content")) > 0

        # 2. Error case: Missing content
        missing_content_resp = session.post(
            f"{BASE_URL}/api/threads/{thread_id}/messages",
            json={},
            headers={"x-user-id": x_user_id, "Content-Type": "application/json"},
            timeout=TIMEOUT,
        )
        assert missing_content_resp.status_code == 400, f"Missing content did not error as expected: {missing_content_resp.text}"
        assert "Missing content" in missing_content_resp.text

        # 3. Error case: Missing x-user-id header (expect 401)
        missing_userid_resp = session.post(
            f"{BASE_URL}/api/threads/{thread_id}/messages",
            json={"content": "Test message with no user ID"},
            headers={"Content-Type": "application/json"},
            timeout=TIMEOUT,
        )
        assert missing_userid_resp.status_code == 401, f"Missing x-user-id did not return 401: {missing_userid_resp.text}"
        assert "User ID required" in missing_userid_resp.text

        # 4. Error case: Thread not found (use made-up UUID)
        invalid_thread_id = "00000000-0000-0000-0000-000000000000"
        not_found_resp = session.post(
            f"{BASE_URL}/api/threads/{invalid_thread_id}/messages",
            json={"content": "Hello on non-existent thread"},
            headers={"x-user-id": x_user_id, "Content-Type": "application/json"},
            timeout=TIMEOUT,
        )
        assert not_found_resp.status_code == 404, f"Thread not found did not return 404: {not_found_resp.text}"
        assert "Thread not found" in not_found_resp.text

        # 5. Error case: Rate limiting (send 11 rapid requests to hit limit)
        # According to instructions, 429 with 'Rate limit exceeded' after too many requests
        # First 10 requests may pass or some may hit limit depending on timing;
        # We'll send 11 and expect the last to 429.
        rate_limit_hit = False
        for i in range(11):
            rl_resp = session.post(
                f"{BASE_URL}/api/threads/{thread_id}/messages",
                json={"content": f"Rate limit test message {i+1}"},
                headers={"x-user-id": x_user_id, "Content-Type": "application/json"},
                timeout=TIMEOUT,
            )
            if rl_resp.status_code == 429:
                assert "Rate limit exceeded" in rl_resp.text
                rate_limit_hit = True
                break
            else:
                # For valid responses, expect 200 and valid structure
                assert rl_resp.status_code == 200, f"Request {i+1} failed unexpectedly: {rl_resp.text}"
                rl_json = rl_resp.json()
                assert "message" in rl_json and "reply" in rl_json
                # Brief delay to not overblast (can be removed if needed)
                time.sleep(0.05)

        assert rate_limit_hit, "Rate limit 429 not triggered after 11 rapid requests"

    finally:
        # Clean up: delete the created thread if possible (not in PRD for delete thread, so skip)
        # No API endpoint for deleting thread mentioned in PRD, so no delete call.
        pass

tc008_post_api_threads_id_messages()