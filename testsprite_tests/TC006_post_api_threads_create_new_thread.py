import requests

BASE_URL = "http://localhost:3000"
THREADS_URL = f"{BASE_URL}/api/threads"
TIMEOUT = 30

def test_post_api_threads_create_new_thread():
    # Prepare payload with optional title
    thread_payload = {"title": "Test Thread Title"}

    create_thread_response = requests.post(
        THREADS_URL,
        json=thread_payload,
        timeout=TIMEOUT
    )

    assert create_thread_response.status_code == 200, f"Expected status 200, got {create_thread_response.status_code}"
    data = create_thread_response.json()
    assert "thread" in data, "Response JSON does not contain 'thread'"
    thread = data["thread"]
    assert isinstance(thread, dict), "'thread' should be a dictionary"
    # Validate some basic fields for thread object (id/title)
    assert "id" in thread, "'thread' object missing 'id'"
    assert "title" in thread, "'thread' object missing 'title'"
    # The title should match the sent value or be empty if optional/ignored
    assert thread["title"] == thread_payload["title"]

    # Cleanup: No DELETE endpoint described; skipping cleanup


test_post_api_threads_create_new_thread()
