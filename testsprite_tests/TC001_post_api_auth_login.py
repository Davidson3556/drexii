import requests

def test_post_api_auth_login():
    base_url = "http://localhost:3000"
    login_url = f"{base_url}/api/auth/login"
    credentials = {
        "email": "drexiitest@mailinator.com",
        "password": "12345678"
    }
    timeout = 30

    try:
        response = requests.post(login_url, json=credentials, timeout=timeout)
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, dict), "Response is not a JSON object"
        assert data.get("ok") is True, "Response 'ok' field is not True"
        assert "provider" in data and isinstance(data["provider"], str) and data["provider"], "Missing or invalid 'provider' in response"
        # Check session cookie set
        cookies = response.cookies
        assert len(cookies) > 0, "Session cookie not set in response"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_api_auth_login()