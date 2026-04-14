import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_threads_create_new_thread():
    url = f"{BASE_URL}/api/threads"
    payload = {
        "title": "Test Thread Title"
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to create thread failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    resp_json = response.json()
    assert "thread" in resp_json, "Response JSON does not contain 'thread'"
    thread = resp_json["thread"]

    # Validate thread object structure (basic checks)
    assert isinstance(thread, dict), "'thread' is not a dictionary"
    assert "id" in thread, "Thread object missing 'id'"
    assert "title" in thread, "Thread object missing 'title'"
    assert thread["title"] == payload["title"], f"Thread title mismatch: expected '{payload['title']}', got '{thread['title']}'"

test_post_api_threads_create_new_thread()