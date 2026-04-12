import requests

BASE_URL = "http://localhost:3000"
LOGIN_PATH = "/api/auth/login"
LOGOUT_PATH = "/api/auth/logout"
TIMEOUT = 30

def test_post_api_auth_logout_with_valid_session_token():
    """
    Test POST /api/auth/logout endpoint with a valid session token to receive 200 success response.
    """

    login_url = BASE_URL + LOGIN_PATH
    logout_url = BASE_URL + LOGOUT_PATH

    # Use valid credentials for login (assumed for test)
    valid_credentials = {
        "username": "testuser",
        "password": "testpassword"
    }

    headers = {"Content-Type": "application/json"}

    try:
        with requests.Session() as session:
            # Step 1: Log in to establish session
            login_response = session.post(login_url, json=valid_credentials, headers=headers, timeout=TIMEOUT)
            assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
            login_json = login_response.json()
            assert login_json.get("success") is True, "Login response 'success' field is not True"

            # Step 2: Call logout endpoint using same session (session cookie)
            logout_response = session.post(logout_url, headers={"Content-Type": "application/json"}, timeout=TIMEOUT)
            assert logout_response.status_code == 200, f"Logout failed with status {logout_response.status_code}"
            logout_json = logout_response.json()
            assert logout_json.get("success") is True, "Logout response 'success' field is not True"

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {str(e)}"


test_post_api_auth_logout_with_valid_session_token()
