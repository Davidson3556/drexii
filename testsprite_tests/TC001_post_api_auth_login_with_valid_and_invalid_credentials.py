import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_auth_login_with_valid_and_invalid_credentials():
    login_url = f"{BASE_URL}/api/auth/login"
    headers = {"Content-Type": "application/json"}

    # --- Test 1: Valid credentials ---
    # NOTE: Replace these with actual valid test credentials existing in InsForge for meaningful test
    valid_payload = {
        "email": "drexiitest@mailinator.com",
        "password": "12345678"
    }
    try:
        resp = requests.post(login_url, json=valid_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 for valid credentials, got {resp.status_code}"
        data = resp.json()
        assert data.get("ok") is True, f"Expected ok: true in response, got {data}"
        assert data.get("provider") == "insforge", f"Expected provider 'insforge', got {data.get('provider')}"
    except requests.RequestException as e:
        assert False, f"Request exception on valid login: {e}"

    # --- Test 2: Missing email ---
    missing_email_payload = {
        "password": "somepassword"
    }
    try:
        resp = requests.post(login_url, json=missing_email_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for missing email, got {resp.status_code}"
        text = resp.text.lower()
        assert "email and password are required" in text, f"Expected error message for missing email/password, got {resp.text}"
    except requests.RequestException as e:
        assert False, f"Request exception on missing email test: {e}"

    # --- Test 3: Missing password ---
    missing_password_payload = {
        "email": "user@example.com"
    }
    try:
        resp = requests.post(login_url, json=missing_password_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for missing password, got {resp.status_code}"
        text = resp.text.lower()
        assert "email and password are required" in text, f"Expected error message for missing email/password, got {resp.text}"
    except requests.RequestException as e:
        assert False, f"Request exception on missing password test: {e}"

    # --- Test 4: Empty email string ---
    empty_email_payload = {
        "email": "",
        "password": "somepassword"
    }
    try:
        resp = requests.post(login_url, json=empty_email_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for empty email, got {resp.status_code}"
        text = resp.text.lower()
        assert "email and password are required" in text, f"Expected error message for empty email/password, got {resp.text}"
    except requests.RequestException as e:
        assert False, f"Request exception on empty email test: {e}"

    # --- Test 5: Empty password string ---
    empty_password_payload = {
        "email": "user@example.com",
        "password": ""
    }
    try:
        resp = requests.post(login_url, json=empty_password_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 400, f"Expected 400 for empty password, got {resp.status_code}"
        text = resp.text.lower()
        assert "email and password are required" in text, f"Expected error message for empty email/password, got {resp.text}"
    except requests.RequestException as e:
        assert False, f"Request exception on empty password test: {e}"

    # --- Test 6: Invalid credentials ---
    invalid_payload = {
        "email": "nonexistent_user@example.com",
        "password": "wrongpassword"
    }
    try:
        resp = requests.post(login_url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 401, f"Expected 401 for invalid credentials, got {resp.status_code}"
        text = resp.text.lower()
        assert "invalid credentials" in text, f"Expected 'Invalid credentials' error message, got {resp.text}"
    except requests.RequestException as e:
        assert False, f"Request exception on invalid credentials test: {e}"

test_post_api_auth_login_with_valid_and_invalid_credentials()