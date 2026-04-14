import requests

BASE_URL = "http://localhost:3000"

def test_post_api_auth_delete_account_without_user_id():
    url = f"{BASE_URL}/api/auth/delete-account"

    try:
        response = requests.post(url, headers={}, json={}, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"
    try:
        json_body = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    # According to PRD, error message is 'User ID is required'
    # But error message could be in text or in JSON detail. Check both:
    error_text = json_body if isinstance(json_body, str) else json_body.get("message") or json_body.get("error")
    assert error_text and 'User ID is required' in str(error_text), f"Expected error message 'User ID is required', got '{error_text}'"


test_post_api_auth_delete_account_without_user_id()