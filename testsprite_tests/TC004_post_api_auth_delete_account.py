import requests

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30

def test_post_api_auth_delete_account():
    session = requests.Session()
    # Login to get session cookie
    login_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        timeout=TIMEOUT
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_json = login_resp.json()
    assert login_json.get("ok") is True and "provider" in login_json

    try:
        # Test delete account with valid session and userId
        delete_payload = {"userId": EMAIL}
        delete_resp = session.post(
            f"{BASE_URL}/api/auth/delete-account",
            json=delete_payload,
            timeout=TIMEOUT
        )
        assert delete_resp.status_code == 200, f"Delete account failed: {delete_resp.text}"
        delete_json = delete_resp.json()
        assert delete_json.get("ok") is True

        # Since account is deleted, the session should be invalid now.
        # To continue testing negative cases, re-login or create a new session?
        # We'll attempt test on missing userId with a new login session:
    finally:
        # Attempt logout to clean session if still valid
        session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)

    # Negative tests: missing userId field with valid session
    # We need a fresh valid session for this
    session2 = requests.Session()
    login_resp2 = session2.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        timeout=TIMEOUT
    )
    assert login_resp2.status_code == 200, f"Login failed: {login_resp2.text}"
    login_json2 = login_resp2.json()
    assert login_json2.get("ok") is True and "provider" in login_json2

    # Missing userId in body
    missing_userid_resp = session2.post(
        f"{BASE_URL}/api/auth/delete-account",
        json={},  # no userId provided
        timeout=TIMEOUT
    )
    assert missing_userid_resp.status_code == 400, f"Expected 400 Missing userId, got {missing_userid_resp.status_code} {missing_userid_resp.text}"

    # Invalid userId in body (e.g. empty string)
    invalid_userid_resp = session2.post(
        f"{BASE_URL}/api/auth/delete-account",
        json={"userId": ""},
        timeout=TIMEOUT
    )
    # Expect 400 Missing userId or 401 unauthorized according to spec
    assert invalid_userid_resp.status_code in (400, 401), f"Expected 400 or 401 for invalid userId, got {invalid_userid_resp.status_code} {invalid_userid_resp.text}"

    # Missing session cookie (no auth)
    no_session_resp = requests.post(
        f"{BASE_URL}/api/auth/delete-account",
        json={"userId": EMAIL},
        timeout=TIMEOUT
    )
    assert no_session_resp.status_code == 401, f"Expected 401 Unauthorized without session, got {no_session_resp.status_code} {no_session_resp.text}"

    # Cleanup logout
    session2.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)

test_post_api_auth_delete_account()