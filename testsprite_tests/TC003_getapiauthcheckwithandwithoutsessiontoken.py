import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_api_auth_check_with_and_without_session_token():
    login_url = f"{BASE_URL}/api/auth/login"
    auth_check_url = f"{BASE_URL}/api/auth/check"

    valid_credentials = {
        "email": "testuser@example.com",
        "password": "testpassword"
    }

    try:
        login_resp = requests.post(login_url, json=valid_credentials, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_json = login_resp.json()
        assert login_json.get("success") is True

        # Use cookies for session management as per PRD
        cookies = login_resp.cookies

        # Step 2: GET /api/auth/check with valid session token (via cookies)
        auth_check_resp = requests.get(auth_check_url, cookies=cookies, timeout=TIMEOUT)
        assert auth_check_resp.status_code == 200, f"Auth check with token failed with status {auth_check_resp.status_code}"
        auth_check_json = auth_check_resp.json()
        assert "user" in auth_check_json and isinstance(auth_check_json["user"], dict), "Missing or invalid user info in auth check response"

        # Step 3: GET /api/auth/check without token (no headers or cookies)
        auth_check_resp_no_token = requests.get(auth_check_url, timeout=TIMEOUT)
        assert auth_check_resp_no_token.status_code == 401, f"Auth check without token should return 401 but returned {auth_check_resp_no_token.status_code}"

    except requests.RequestException as e:
        assert False, f"Request failed with exception: {str(e)}"


test_get_api_auth_check_with_and_without_session_token()
