import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
VALID_TEST_USER_ID = "test-user-id-12345"

def test_post_api_auth_delete_account_with_and_without_userid():
    url = f"{BASE_URL}/api/auth/delete-account"
    headers_with_userid = {"x-user-id": VALID_TEST_USER_ID}
    body_with_userid = {"userId": VALID_TEST_USER_ID}
    headers_no_userid = {}
    body_no_userid = {}

    # Case 1: Delete account with x-user-id header
    response = requests.post(url, headers=headers_with_userid, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected 200 but got {response.status_code} with x-user-id header"
    json_resp = response.json()
    assert isinstance(json_resp, dict)
    assert json_resp.get("success") is True, f"Expected success True, got {json_resp}"
    assert isinstance(json_resp.get("message"), str) and json_resp["message"], f"Expected message string, got {json_resp.get('message')}"

    # Case 2: Delete account with body.userId
    response = requests.post(url, json=body_with_userid, timeout=TIMEOUT)
    assert response.status_code == 200, f"Expected 200 but got {response.status_code} with body userId"
    json_resp = response.json()
    assert isinstance(json_resp, dict)
    assert json_resp.get("success") is True, f"Expected success True, got {json_resp}"
    assert isinstance(json_resp.get("message"), str) and json_resp["message"], f"Expected message string, got {json_resp.get('message')}"

    # Case 3: Delete account without user id header or body should get 401
    response = requests.post(url, timeout=TIMEOUT)
    assert response.status_code == 401, f"Expected 401 but got {response.status_code} without userId"
    try:
        json_resp = response.json()
        # The PRD states the error is "User ID is required"
        assert ("User ID is required" in str(json_resp)) or (json_resp.get("error") == "User ID is required") or ("User ID is required" in response.text), f"Expected 'User ID is required' error, got {json_resp}"
    except Exception:
        # Some servers may return plain text, so fallback check response content
        assert "User ID is required" in response.text, f"Expected 'User ID is required' in response text, got {response.text}"

test_post_api_auth_delete_account_with_and_without_userid()