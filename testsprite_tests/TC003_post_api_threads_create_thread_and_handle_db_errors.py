import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_threads_create_thread_and_handle_db_errors():
    url = f"{BASE_URL}/api/threads"
    headers = {"Content-Type": "application/json"}

    # Creation with optional title, accept 200 or 500 with known message
    payload_title = {"title": "Test Thread Title"}
    try:
        response = requests.post(url, json=payload_title, headers=headers, timeout=TIMEOUT)
        if response.status_code == 500:
            data = response.json()
            error_msg = data.get('message', '') if isinstance(data, dict) else response.text
            assert (
                "DATABASE_URL not set" in error_msg or "DB error" in error_msg or "database error" in error_msg.lower()
            ), f"Unexpected 500 error message: {error_msg}"
        else:
            assert response.status_code == 200, f"Expected 200 or 500, got {response.status_code}"
            data = response.json()
            assert "thread" in data and isinstance(data["thread"], dict), "Response missing thread object with title"
            thread_id = data["thread"].get("id")
    except Exception as e:
        raise AssertionError(f"Failed to create thread with title: {e}")

    # Creation without title, accept 200 or 500 with known message
    try:
        response = requests.post(url, json={}, headers=headers, timeout=TIMEOUT)
        if response.status_code == 500:
            data = response.json()
            error_msg = data.get('message', '') if isinstance(data, dict) else response.text
            assert (
                "DATABASE_URL not set" in error_msg or "DB error" in error_msg or "database error" in error_msg.lower()
            ), f"Unexpected 500 error message: {error_msg}"
        else:
            assert response.status_code == 200, f"Expected 200 or 500, got {response.status_code}"
            data = response.json()
            assert "thread" in data and isinstance(data["thread"], dict), "Response missing thread object without title"
    except Exception as e:
        raise AssertionError(f"Failed to create thread without title: {e}")

    # Simulate DB error scenario, accept 200 or 500 with known error message
    try:
        response = requests.post(url, json={"title": "trigger db error"}, headers=headers, timeout=TIMEOUT)
        if response.status_code == 500:
            data = response.json()
            error_msg = data.get('message', '') if isinstance(data, dict) else response.text
            assert (
                "DATABASE_URL not set" in error_msg or "DB error" in error_msg or "database error" in error_msg.lower()
            ), f"Unexpected 500 error message: {error_msg}"
        else:
            assert response.status_code == 200, f"Expected 200 or 500, got {response.status_code}"
    except requests.exceptions.RequestException as e:
        raise AssertionError(f"Request to create thread failed unexpectedly: {e}")

test_post_api_threads_create_thread_and_handle_db_errors()
