import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = f"{BASE_URL}/api/auth/login"
DELETE_ACCOUNT_ENDPOINT = f"{BASE_URL}/api/auth/delete-account"

def test_post_api_auth_delete_account_without_user_id():
    login_payload = {
        "email": "drexiitest@mailinator.com",
        "password": "12345678"
    }
    session = requests.Session()
    try:
        # Login to get authentication cookie/session if applicable
        login_resp = session.post(LOGIN_ENDPOINT, json=login_payload, timeout=30)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_json = login_resp.json()
        assert login_json.get("ok") is True
        assert login_json.get("provider") == "insforge"

        # Attempt to delete account without x-user-id header or userId in body
        headers = {
            # No 'x-user-id' header intentionally
        }
        body = {
            # No userId provided intentionally
        }

        delete_resp = session.post(DELETE_ACCOUNT_ENDPOINT, headers=headers, json=body, timeout=30)
        assert delete_resp.status_code == 401, f"Expected 401 Unauthorized but got {delete_resp.status_code}"
        resp_json = delete_resp.json()

        # Response body should have message 'User ID is required'
        # The error message might be a string or JSON with error field, 
        # but from PRD it is 'User ID is required'
        # Common pattern returns JSON with message
        # So check if in json or text

        # If response content type is json, parse and check message
        content_type = delete_resp.headers.get('Content-Type', '')
        if 'application/json' in content_type.lower():
            message = resp_json.get("message") or resp_json.get("error") or resp_json.get("detail")
            if not message:
                # maybe plain JSON string or dict?
                message = str(resp_json)
            assert "User ID is required" in message, f"Unexpected error message: {message}"
        else:
            # If text/plain or other, check text directly
            text = delete_resp.text
            assert "User ID is required" in text, f"Unexpected error message: {text}"
    finally:
        session.close()

test_post_api_auth_delete_account_without_user_id()