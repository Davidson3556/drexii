import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_api_threads_id_returns_thread_and_messages_or_404():
    # Step 1: Create a new thread to get a valid existing thread ID
    create_thread_url = f"{BASE_URL}/api/threads"
    create_payload = {"title": f"Test Thread {uuid.uuid4()}"}
    try:
        create_response = requests.post(create_thread_url, json=create_payload, timeout=TIMEOUT)
        assert create_response.status_code == 200, f"Unexpected status code on thread creation: {create_response.status_code}"
        create_json = create_response.json()
        assert "thread" in create_json, "Response JSON missing 'thread' key"
        thread = create_json["thread"]
        assert isinstance(thread, dict), "'thread' is not a dict"
        thread_id = thread.get("id") or thread.get("_id") or thread.get("threadId")
        assert thread_id, "Thread id not found in created thread object"

        # Step 2: GET /api/threads/:id with existing thread id, expect 200 and proper structure
        get_thread_url = f"{BASE_URL}/api/threads/{thread_id}"
        get_response = requests.get(get_thread_url, timeout=TIMEOUT)
        assert get_response.status_code == 200, f"Expected 200 for existing thread, got {get_response.status_code}"
        get_json = get_response.json()
        assert "thread" in get_json and "messages" in get_json, "Response JSON missing 'thread' or 'messages'"
        assert isinstance(get_json["thread"], dict), "'thread' is not a dict"
        assert isinstance(get_json["messages"], list), "'messages' is not a list"

        # Step 3: GET /api/threads/:id with a non-existent thread id, expect 404 error
        non_existent_thread_id = str(uuid.uuid4())
        get_nonexistent_url = f"{BASE_URL}/api/threads/{non_existent_thread_id}"
        get_404_response = requests.get(get_nonexistent_url, timeout=TIMEOUT)
        assert get_404_response.status_code == 404, f"Expected 404 for non-existent thread id, got {get_404_response.status_code}"
        # Optional: Could check error message text if available

    finally:
        # Cleanup: delete the created thread if possible (not specified in PRD, so ignoring)
        pass

test_get_api_threads_id_returns_thread_and_messages_or_404()