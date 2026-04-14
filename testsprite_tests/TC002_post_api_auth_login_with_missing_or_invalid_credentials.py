import requests

BASE_URL = "http://localhost:3000"
LOGIN_PATH = "/api/auth/login"
TIMEOUT = 30

def test_post_api_auth_login_with_missing_or_invalid_credentials():
    url = BASE_URL + LOGIN_PATH
    headers = {"Content-Type": "application/json"}

    # Test missing email
    payload_missing_email = {
        "password": "any_password"
    }
    response = requests.post(url, json=payload_missing_email, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 400, f"Expected 400 for missing email, got {response.status_code}"
    assert isinstance(response.text, str)
    assert 'email and password are required' in response.text.lower()

    # Test missing password
    payload_missing_password = {
        "email": "anyemail@example.com"
    }
    response = requests.post(url, json=payload_missing_password, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 400, f"Expected 400 for missing password, got {response.status_code}"
    assert isinstance(response.text, str)
    assert 'email and password are required' in response.text.lower()

    # Test missing both email and password (empty body)
    response = requests.post(url, json={}, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 400, f"Expected 400 for missing both email and password, got {response.status_code}"
    assert isinstance(response.text, str)
    assert 'email and password are required' in response.text.lower()

    # Test invalid credentials
    payload_invalid = {
        "email": "invalid_user@example.com",
        "password": "wrongpassword"
    }
    response = requests.post(url, json=payload_invalid, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 401, f"Expected 401 for invalid credentials, got {response.status_code}"
    assert isinstance(response.text, str)
    assert 'invalid credentials' in response.text.lower()

test_post_api_auth_login_with_missing_or_invalid_credentials()