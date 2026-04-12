import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30

def test_post_api_auth_login_with_valid_and_invalid_credentials():
    valid_credentials = {
        "username": "validuser@example.com",
        "password": "validpassword123"
    }
    invalid_credentials = {
        "username": "invaliduser@example.com",
        "password": "wrongpassword"
    }

    headers = {
        "Content-Type": "application/json"
    }

    # Test valid credentials
    try:
        valid_response = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=valid_credentials,
            headers=headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request to login endpoint with valid credentials failed: {e}"

    assert valid_response.status_code == 200, f"Expected 200 for valid credentials, got {valid_response.status_code}"
    try:
        valid_json = valid_response.json()
    except ValueError:
        assert False, "Response to login with valid credentials is not a valid JSON"

    assert isinstance(valid_json, dict), "Response JSON is not a dictionary for valid credentials"
    assert valid_json.get("success") is True, "Expected 'success': true in response for valid credentials"

    # Test invalid credentials
    try:
        invalid_response = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=invalid_credentials,
            headers=headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request to login endpoint with invalid credentials failed: {e}"

    assert invalid_response.status_code == 401, f"Expected 401 for invalid credentials, got {invalid_response.status_code}"

test_post_api_auth_login_with_valid_and_invalid_credentials()
