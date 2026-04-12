import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Replace these with valid test user credentials
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

def get_auth_token():
    login_url = f"{BASE_URL}/api/auth/login"
    payload = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }
    try:
        resp = requests.post(login_url, json=payload, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        assert data.get("success") is True
        # Assuming the token is in a cookie or in headers or response JSON (not specified)
        # We'll check if Authorization header is expected or a session cookie
        # Since no explicit token location in PRD, assume session cookie managed by requests session.
        return resp.cookies
    except Exception as e:
        raise RuntimeError(f"Failed to login and get auth token: {e}")

def test_get_user_integrations_and_post_test_integration():
    session = requests.Session()

    # Authenticate and get session cookies
    try:
        login_url = f"{BASE_URL}/api/auth/login"
        login_payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        login_resp = session.post(login_url, json=login_payload, timeout=TIMEOUT)
        login_resp.raise_for_status()
        login_data = login_resp.json()
        assert login_data.get("success") is True
    except Exception as e:
        raise RuntimeError(f"Authentication failed: {e}")

    headers = {"Content-Type": "application/json"}

    # Step 1: GET /api/user-integrations to list user integrations
    user_integrations_url = f"{BASE_URL}/api/user-integrations"
    try:
        resp = session.get(user_integrations_url, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        user_integrations = resp.json()
        assert isinstance(user_integrations, list)
    except Exception as e:
        raise RuntimeError(f"Failed to get user integrations: {e}")

    # Prepare an integrationId to test. If no user integrations, create one and delete later.
    # Creation endpoint: POST /api/user-integrations with body { type: string, credentials: object }

    created_integration_id = None
    need_cleanup = False

    if user_integrations:
        # Use the first integrationId from the list for testing
        integration_id = None
        # Each item is a UserIntegration object - presumably has an "id"
        for ui in user_integrations:
            if isinstance(ui, dict) and "id" in ui:
                integration_id = ui["id"]
                break
        if not integration_id:
            integration_id = None
    else:
        integration_id = None

    # If no integrationId available, create a new user integration for test
    if not integration_id:
        create_url = f"{BASE_URL}/api/user-integrations"
        # For the type and credentials, assume a dummy integration type "testIntegration" acceptable by backend.
        create_payload = {
            "type": "testIntegration",
            "credentials": {
                "apiKey": "dummy-api-key",
                "otherField": "dummy-value"
            }
        }
        try:
            create_resp = session.post(create_url, json=create_payload, headers=headers, timeout=TIMEOUT)
            create_resp.raise_for_status()
            created_integration = create_resp.json()
            assert isinstance(created_integration, dict)
            assert "id" in created_integration
            integration_id = created_integration["id"]
            created_integration_id = integration_id
            need_cleanup = True
        except Exception as e:
            raise RuntimeError(f"Failed to create a user integration: {e}")

    test_integration_url = f"{BASE_URL}/api/user-integrations/test"

    try:
        # Step 2a: POST /api/user-integrations/test with valid integrationId - expect success
        valid_payload = {
            "integrationId": integration_id
        }
        resp_valid = session.post(test_integration_url, json=valid_payload, headers=headers, timeout=TIMEOUT)
        resp_valid.raise_for_status()
        valid_result = resp_valid.json()
        assert isinstance(valid_result, dict)
        assert "success" in valid_result and isinstance(valid_result["success"], bool)
        assert valid_result["success"] is True
        assert "message" in valid_result and isinstance(valid_result["message"], str)

        # Step 2b: POST /api/user-integrations/test with invalid integrationId - expect failure response
        invalid_payload = {
            "integrationId": "invalid-integration-id-1234567890"
        }
        resp_invalid = session.post(test_integration_url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        # The PRD says this can return 200 with success: false or 400 if malformed payload
        # So handle both:
        if resp_invalid.status_code == 200:
            invalid_result = resp_invalid.json()
            assert isinstance(invalid_result, dict)
            assert "success" in invalid_result and isinstance(invalid_result["success"], bool)
            assert invalid_result["success"] is False
            assert "message" in invalid_result and isinstance(invalid_result["message"], str)
        else:
            # If 400, just assert it
            assert resp_invalid.status_code == 400

    finally:
        # Cleanup - delete created integration if any
        if need_cleanup and created_integration_id:
            delete_url = f"{BASE_URL}/api/user-integrations/{created_integration_id}"
            try:
                del_resp = session.delete(delete_url, headers=headers, timeout=TIMEOUT)
                del_resp.raise_for_status()
                del_data = del_resp.json()
                assert isinstance(del_data, dict)
                assert del_data.get("success") is True
            except Exception as e:
                raise RuntimeError(f"Failed to delete created user integration: {e}")

def run_test():
    test_get_user_integrations_and_post_test_integration()

run_test()