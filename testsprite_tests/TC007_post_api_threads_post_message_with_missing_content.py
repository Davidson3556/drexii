import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_thread_message_missing_content():
    # Create a thread to get a valid thread ID
    thread_resp = requests.post(
        f"{BASE_URL}/api/threads",
        json={},
        timeout=TIMEOUT
    )
    assert thread_resp.status_code == 200, f"Thread creation failed: {thread_resp.text}"
    thread_data = thread_resp.json()
    thread_id = thread_data.get("thread", {}).get("id")
    assert thread_id, "Thread ID not found in create thread response"

    try:
        # Test with empty content
        resp_empty = requests.post(
            f"{BASE_URL}/api/threads/{thread_id}/messages",
            json={"content": ""},
            timeout=TIMEOUT
        )
        assert resp_empty.status_code == 400, f"Expected 400 for empty content, got {resp_empty.status_code}"
        assert "Content required" in resp_empty.text, f"Expected 'Content required' error message, got: {resp_empty.text}"

        # Test with missing content
        resp_missing = requests.post(
            f"{BASE_URL}/api/threads/{thread_id}/messages",
            json={},
            timeout=TIMEOUT
        )
        assert resp_missing.status_code == 400, f"Expected 400 for missing content, got {resp_missing.status_code}"
        assert "Content required" in resp_missing.text, f"Expected 'Content required' error message, got: {resp_missing.text}"

    finally:
        # Clean up: delete the created thread
        requests.delete(
            f"{BASE_URL}/api/threads/{thread_id}",
            timeout=TIMEOUT
        )

test_post_thread_message_missing_content()