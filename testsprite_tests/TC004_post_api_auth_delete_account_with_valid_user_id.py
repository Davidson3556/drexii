import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
DELETE_ACCOUNT_ENDPOINT = f"{BASE_URL}/api/auth/delete-account"
TIMEOUT = 30

email = "drexiitest@mailinator.com"
password = "12345678"


def test_post_api_auth_delete_account_with_valid_user_id():
    session = requests.Session()
    # Login to get auth session cookie or token if needed
    login_payload = {
        "email": email,
        "password": password
    }
    try:
        login_resp = session.post(LOGIN_ENDPOINT, json=login_payload, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Login request failed: {e}"
    assert login_resp.status_code == 200, f"Login failed status: {login_resp.status_code}, body: {login_resp.text}"
    login_json = login_resp.json()
    assert login_json.get("ok") is True, f"Login response missing ok:true: {login_json}"
    assert login_json.get("provider") == "insforge", f"Unexpected provider in login: {login_json}"

    # Get current user info to obtain user id
    try:
        check_resp = session.get(f"{BASE_URL}/api/auth/check", timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Auth check request failed: {e}"
    assert check_resp.status_code == 200, f"Auth check failed status: {check_resp.status_code}, body: {check_resp.text}"
    check_json = check_resp.json()
    assert check_json.get("authenticated") is True, f"User is not authenticated: {check_json}"
    user = check_json.get("user")
    assert user and isinstance(user, dict), f"No user object in /auth/check response: {check_json}"
    user_id = user.get("id") or user.get("userId") or user.get("_id")
    assert user_id, f"User id not found in user object: {user}"

    headers = {
        "x-user-id": user_id
    }

    # Perform delete-account with x-user-id header in authenticated admin context
    # Note: According to known limitations, deletion requires INSFORGE_API_KEY in env
    # So 200 or 500 may be returned depending on environment. We expect 200 success in test context.
    try:
        delete_resp = session.post(DELETE_ACCOUNT_ENDPOINT, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Delete account request failed: {e}"

    if delete_resp.status_code == 200:
        delete_json = delete_resp.json()
        assert delete_json.get("success") is True, f"Delete not successful: {delete_json}"
        assert isinstance(delete_json.get("message"), str) and len(delete_json.get("message")) > 0, \
            f"Delete success message missing or empty: {delete_json}"
    elif delete_resp.status_code == 500:
        # According to limitations, 500 may occur if admin key missing, fail test with message
        assert False, f"Delete account returned 500 'Failed to delete account' - possible config issue"
    else:
        assert False, f"Unexpected status code from delete-account: {delete_resp.status_code}, body: {delete_resp.text}"


test_post_api_auth_delete_account_with_valid_user_id()