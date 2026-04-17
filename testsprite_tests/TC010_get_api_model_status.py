import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
MODEL_STATUS_URL = f"{BASE_URL}/api/model/status"
LOGOUT_URL = f"{BASE_URL}/api/auth/logout"

EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30


def test_get_api_model_status():
    session = requests.Session()

    # Login to get session cookie and confirm auth works (not required but good to validate)
    login_payload = {"email": EMAIL, "password": PASSWORD}
    login_resp = session.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
    login_data = login_resp.json()
    assert login_data.get("ok") is True, "Login response missing ok:true"
    assert "provider" in login_data and isinstance(login_data["provider"], str), "Login missing provider string"

    # Call GET /api/model/status (no auth required)
    resp = session.get(MODEL_STATUS_URL, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Model status returned status {resp.status_code}"
    data = resp.json()
    assert isinstance(data, dict), "Response is not a JSON object"
    assert "models" in data and isinstance(data["models"], dict), "'models' key missing or not an object"
    assert "active" in data and isinstance(data["active"], str), "'active' key missing or not a string"
    # Optionally check that active provider is one of the keys or available in models keys or empty string may be allowed
    # (Provider marked unavailable could be reflected by empty or special strings)
    # Just ensure the keys are as expected

    # Logout to clear session cookie
    logout_resp = session.post(LOGOUT_URL, timeout=TIMEOUT)
    assert logout_resp.status_code == 200, f"Logout failed with status {logout_resp.status_code}"
    logout_data = logout_resp.json()
    assert logout_data.get("ok") is True, "Logout response missing ok:true"


test_get_api_model_status()