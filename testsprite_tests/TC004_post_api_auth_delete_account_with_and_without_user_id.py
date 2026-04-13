import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# These credentials and user info must be set to valid values for the test environment
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "correctpassword"
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "testuserpass"

def test_post_api_auth_delete_account_with_and_without_user_id():
    session = requests.Session()

    # 1. Login as admin to get admin session/cookies (if API requires session-based auth)
    # According to PRD, admin auth is via InsForge SDK, which returns session cookie on login.
    login_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=TIMEOUT,
    )
    assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
    login_json = login_resp.json()
    assert login_json.get("ok") is True and login_json.get("provider") == "insforge"

    # 2. Create a test user account to delete; since no API for user creation is defined,
    # we will assume the test user exists and has a user id from /api/auth/check after login.
    # Instead create a new thread as a dummy resource with user ID in header, to get a valid userId to delete.
    # But specification doesn't provide user creation API, so alternate is to login test user to get userId.

    # Login as test user to get userId
    test_user_session = requests.Session()
    test_user_login_resp = test_user_session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
        timeout=TIMEOUT,
    )
    assert test_user_login_resp.status_code == 200, f"Test user login failed: {test_user_login_resp.text}"
    test_user_login_json = test_user_login_resp.json()
    assert test_user_login_json.get("ok") is True and test_user_login_json.get("provider") == "insforge"

    # Check API to get user info (for userId)
    test_user_check_resp = test_user_session.get(
        f"{BASE_URL}/api/auth/check",
        timeout=TIMEOUT,
    )
    assert test_user_check_resp.status_code == 200, f"Test user check failed: {test_user_check_resp.text}"
    user_check_json = test_user_check_resp.json()
    user = user_check_json.get("user")
    assert user and isinstance(user, dict), "Authenticated user object missing in /api/auth/check"
    test_user_id = user.get("id")
    assert test_user_id and isinstance(test_user_id, str), "User ID missing from user object"

    # 3. Test deleting account with x-user-id header (admin credentials established via session cookies in 'session')
    try:
        delete_resp1 = session.post(
            f"{BASE_URL}/api/auth/delete-account",
            headers={"x-user-id": test_user_id},
            timeout=TIMEOUT,
        )
        assert delete_resp1.status_code == 200, f"Delete account with x-user-id header failed: {delete_resp1.text}"
        delete_json1 = delete_resp1.json()
        assert delete_json1.get("success") is True
        assert "message" in delete_json1 and isinstance(delete_json1["message"], str)
    except Exception as e:
        raise AssertionError(f"Exception during delete-account with x-user-id header: {e}")

    # 4. Recreate user or skip if no recreation; Since we cannot recreate user, we simulate with same ID for next tests.

    # 5. Test deleting account with userId in body (re-login test user may fail if user deleted, skip if so)
    # We try login again to check whether user exists; if fails, skip this test part.
    test_user_login_resp_2 = test_user_session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
        timeout=TIMEOUT,
    )
    if test_user_login_resp_2.status_code == 200:
        # User exists, test delete with body.userId
        try:
            delete_resp2 = session.post(
                f"{BASE_URL}/api/auth/delete-account",
                json={"userId": test_user_id},
                timeout=TIMEOUT,
            )
            assert delete_resp2.status_code == 200, f"Delete account with body.userId failed: {delete_resp2.text}"
            delete_json2 = delete_resp2.json()
            assert delete_json2.get("success") is True
            assert "message" in delete_json2 and isinstance(delete_json2["message"], str)
        except Exception as e:
            raise AssertionError(f"Exception during delete-account with body.userId: {e}")

    # 6. Test deleting account without user id (no header, no body.userId) - should get 401 User ID is required
    try:
        delete_resp3 = session.post(
            f"{BASE_URL}/api/auth/delete-account",
            timeout=TIMEOUT,
        )
        assert delete_resp3.status_code == 401, f"Expected 401 when deleting without user id, got {delete_resp3.status_code}: {delete_resp3.text}"
        # Body should include 'User ID is required'
        assert "User ID is required" in delete_resp3.text or "user id" in delete_resp3.text.lower()
    except Exception as e:
        raise AssertionError(f"Exception during delete-account without user id: {e}")

    # 7. Test deleting account with missing admin key - simulate by calling endpoint without admin session/cookies or auth
    # Using a new session without login cookies
    no_auth_session = requests.Session()
    try:
        delete_resp4 = no_auth_session.post(
            f"{BASE_URL}/api/auth/delete-account",
            headers={"x-user-id": test_user_id},
            timeout=TIMEOUT,
        )
        # Expect 500 error due to missing admin key in env
        assert delete_resp4.status_code == 500, f"Expected 500 due to missing admin key, got {delete_resp4.status_code}: {delete_resp4.text}"
        assert "Failed to delete account" in delete_resp4.text or "failed" in delete_resp4.text.lower()
    except Exception as e:
        raise AssertionError(f"Exception during delete-account missing admin key test: {e}")

test_post_api_auth_delete_account_with_and_without_user_id()