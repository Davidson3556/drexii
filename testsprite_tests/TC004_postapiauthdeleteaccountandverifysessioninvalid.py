import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Replace these with valid user credentials for login
VALID_USER_CREDENTIALS = {
    "email": "testuser@example.com",
    "password": "TestPassword123!"
}

def test_postapiauthdeleteaccountandverifysessioninvalid():
    session = requests.Session()
    try:
        # Step 1: Login with valid credentials to get session token (assumed returned in cookie or header)
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json=VALID_USER_CREDENTIALS,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_json = login_resp.json()
        assert login_json.get("success") is True, "Login response success field is not True"

        # The session token should be preserved in session cookies automatically by requests.Session

        # Step 2: POST /api/auth/delete-account with valid session token
        delete_resp = session.post(
            f"{BASE_URL}/api/auth/delete-account",
            timeout=TIMEOUT
        )
        assert delete_resp.status_code == 200, f"Delete account failed with status {delete_resp.status_code}"
        delete_json = delete_resp.json()
        assert delete_json.get("success") is True, "Delete account response success field is not True"

        # Step 3: GET /api/auth/check with old token should return 401 Unauthorized
        check_resp = session.get(
            f"{BASE_URL}/api/auth/check",
            timeout=TIMEOUT,
            allow_redirects=False
        )
        assert check_resp.status_code == 401, f"Old session token still valid after account deletion, status: {check_resp.status_code}"

    finally:
        # No cleanup possible since account is deleted
        session.close()


test_postapiauthdeleteaccountandverifysessioninvalid()