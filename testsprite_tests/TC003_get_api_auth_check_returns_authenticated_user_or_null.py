import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_api_auth_check_returns_authenticated_user_or_null():
    url = f"{BASE_URL}/api/auth/check"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate keys existence
    assert "authenticated" in data, "Response missing 'authenticated' key"
    assert "provider" in data, "Response missing 'provider' key"
    assert "user" in data, "Response missing 'user' key"

    # Validate types and values
    assert isinstance(data["authenticated"], bool), "'authenticated' is not boolean"
    assert data["provider"] == "insforge", f"Expected provider 'insforge', got {data['provider']}"

    user = data["user"]
    # user can be an object or None
    assert (user is None) or isinstance(user, dict), "'user' should be an object or null"

test_get_api_auth_check_returns_authenticated_user_or_null()