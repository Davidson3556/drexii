import requests

def test_post_api_auth_login():
    url = "http://localhost:3000/api/auth/login"
    payload = {
        "email": "drexiitest@mailinator.com",
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
    assert "ok" in data, "Response JSON missing 'ok'"
    assert data["ok"] is True, f"Expected ok:true, got ok:{data.get('ok')}"
    assert "provider" in data and isinstance(data["provider"], str), \
        "Response JSON missing 'provider' string"
    set_cookie = response.headers.get("Set-Cookie")
    assert set_cookie is not None and set_cookie != "", "Session cookie not set in response headers"

test_post_api_auth_login()