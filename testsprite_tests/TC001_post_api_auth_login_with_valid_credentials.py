import requests

def test_post_api_auth_login_with_valid_credentials():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/auth/login"
    payload = {
        "email": "valid_test_user@example.com",
        "password": "12345678"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    assert data.get("ok") is True, f"Expected ok true, got {data.get('ok')}"
    assert data.get("provider") == "insforge", f"Expected provider 'insforge', got {data.get('provider')}"
    # Check that session cookie is set
    cookies = response.cookies
    session_cookie = None
    for cookie in cookies:
        # Typically session cookies might have names like 'session', 'sid', or custom names
        # We check if any cookie exists
        session_cookie = cookie
        break
    assert session_cookie is not None, "Session cookie not set in response"

test_post_api_auth_login_with_valid_credentials()