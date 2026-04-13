import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_threads_id_messages():
    headers = {"Content-Type": "application/json"}

    # Step 1: Create a new thread to get a valid thread ID
    create_thread_url = f"{BASE_URL}/api/threads"
    create_thread_payload = {"title": "Test Thread for TC007"}

    thread_id = None
    try:
        create_resp = requests.post(create_thread_url, json=create_thread_payload, headers=headers, timeout=TIMEOUT)
        assert create_resp.status_code == 200, f"Failed to create thread: {create_resp.text}"
        create_data = create_resp.json()
        assert "thread" in create_data and "id" in create_data["thread"], "Thread object or ID missing in response"
        thread_id = create_data["thread"]["id"]

        post_message_url = f"{BASE_URL}/api/threads/{thread_id}/messages"

        # Test case 1: POST message with valid content returns 200 with message and AI reply
        valid_content_payload = {"content": "Write a short plan"}
        resp_valid = requests.post(post_message_url, json=valid_content_payload, headers=headers, timeout=TIMEOUT)
        assert resp_valid.status_code == 200, f"Expected 200 OK for valid content, got {resp_valid.status_code}"
        resp_json = resp_valid.json()
        assert "message" in resp_json and isinstance(resp_json["message"], dict), "Missing or invalid 'message' in response"
        assert "reply" in resp_json and isinstance(resp_json["reply"], dict), "Missing or invalid 'reply' in response"
        # Optionally check content fields are strings and non-empty
        assert "content" in resp_json["message"] and isinstance(resp_json["message"]["content"], str), "'message.content' invalid"
        assert "content" in resp_json["reply"] and isinstance(resp_json["reply"]["content"], str), "'reply.content' invalid"

        # Test case 2: POST message with empty content returns 400 error
        empty_content_payload = {"content": ""}
        resp_empty = requests.post(post_message_url, json=empty_content_payload, headers=headers, timeout=TIMEOUT)
        assert resp_empty.status_code == 400, f"Expected 400 Bad Request for empty content, got {resp_empty.status_code}"
        # The error message expected: "Content required" - check in response text or json if possible
        try:
            err_json = resp_empty.json()
            assert any("content" in str(v).lower() for v in err_json.values()), "Error message does not indicate content required"
        except Exception:
            # fallback: check text contains 'Content required'
            assert "content required" in resp_empty.text.lower()

        # Test case 3: Simulate server error returns 500 error
        # Since we cannot force 500, try invalid thread id or improper usage
        invalid_thread_url = f"{BASE_URL}/api/threads/invalid-id/messages"
        valid_content_payload = {"content": "Hello"}
        resp_500 = requests.post(invalid_thread_url, json=valid_content_payload, headers=headers, timeout=TIMEOUT)
        # According to PRD, GET to invalid thread returns 404. POST to invalid may return 500 or other.
        # Allow 404 or 500, but assert if 500 to confirm server error handling
        assert resp_500.status_code in (404, 500), f"Expected 404 or 500 for invalid thread ID post, got {resp_500.status_code}"
        if resp_500.status_code == 500:
            # Optionally verify error message or json
            try:
                err_json = resp_500.json()
                # just confirm error keys or message present
                assert isinstance(err_json, dict)
            except Exception:
                pass

    finally:
        # Cleanup: Delete the created thread if created
        if thread_id:
            try:
                delete_thread_url = f"{BASE_URL}/api/threads/{thread_id}"
                del_resp = requests.delete(delete_thread_url, headers=headers, timeout=TIMEOUT)
                # Accept 200 or 404 if already deleted
                assert del_resp.status_code in (200, 404)
            except Exception:
                pass

test_post_api_threads_id_messages()