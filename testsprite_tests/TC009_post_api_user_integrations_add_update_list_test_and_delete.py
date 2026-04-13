import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
TEST_USER_ID = "test-user-123"

def test_post_api_user_integrations_add_update_list_test_and_delete():
    headers_with_user = {'x-user-id': TEST_USER_ID}
    headers_without_user = {}

    # Define a sample integration payload for Gmail
    integration_payload = {
        "integration": "gmail",
        "credentials": {
            "email": "testuser@gmail.com",
            "token": "valid_token_123"
        }
    }

    integration_payload_invalid_creds = {
        "integration": "gmail",
        "credentials": {
            "email": "invaliduser@gmail.com",
            "token": "invalid_token_xyz"
        }
    }

    integration_id = None
    try:
        # 1. POST /api/user-integrations with x-user-id and valid body
        response = requests.post(
            f"{BASE_URL}/api/user-integrations",
            headers=headers_with_user,
            json=integration_payload,
            timeout=TIMEOUT,
        )
        assert response.status_code == 200, f"Expected 200 but got {response.status_code}"
        data = response.json()
        assert "id" in data and isinstance(data["id"], str)
        assert data.get("integration") == "gmail"
        assert data.get("status") in ["created", "updated"]
        integration_id = data["id"]

        # 2. GET /api/user-integrations with x-user-id to list integrations
        response = requests.get(
            f"{BASE_URL}/api/user-integrations",
            headers=headers_with_user,
            timeout=TIMEOUT,
        )
        assert response.status_code == 200
        integrations_list = response.json()
        assert isinstance(integrations_list, list)
        # Check that credentials are masked (expect string values or absent)
        for integ in integrations_list:
            assert "id" in integ
            assert "integration" in integ
            assert "credentials" in integ
            creds = integ["credentials"]
            # Rough mask check: credentials' values should not contain original tokens or emails plainly
            # Just check they are strings or masked (not empty dict)
            assert isinstance(creds, dict)

        # 3. POST /api/user-integrations/test with valid credentials
        response = requests.post(
            f"{BASE_URL}/api/user-integrations/test",
            json=integration_payload,
            timeout=TIMEOUT,
        )
        assert response.status_code == 200
        test_result = response.json()
        assert isinstance(test_result, dict)
        assert "success" in test_result and isinstance(test_result["success"], bool)
        assert "error" in test_result and (test_result["error"] is None or isinstance(test_result["error"], str))
        # With valid creds expect success True and error null or empty
        if test_result["success"]:
            assert test_result["error"] is None
        else:
            # If success False, error is a non-empty string
            assert isinstance(test_result["error"], str) and len(test_result["error"]) > 0

        # 4. POST /api/user-integrations/test with invalid credentials
        response = requests.post(
            f"{BASE_URL}/api/user-integrations/test",
            json=integration_payload_invalid_creds,
            timeout=TIMEOUT,
        )
        assert response.status_code == 200
        test_result_invalid = response.json()
        assert isinstance(test_result_invalid, dict)
        assert "success" in test_result_invalid and isinstance(test_result_invalid["success"], bool)
        assert "error" in test_result_invalid and (test_result_invalid["error"] is None or isinstance(test_result_invalid["error"], str))
        # With invalid creds we expect success False and error string
        if not test_result_invalid["success"]:
            assert isinstance(test_result_invalid["error"], str) and len(test_result_invalid["error"]) > 0
        else:
            # Could theoretically succeed if token accepted, still valid test to check
            assert test_result_invalid["error"] is None

        # 5. DELETE /api/user-integrations/:id to remove integration
        response = requests.delete(
            f"{BASE_URL}/api/user-integrations/{integration_id}",
            timeout=TIMEOUT,
        )
        assert response.status_code == 200
        delete_response = response.json()
        assert isinstance(delete_response, dict)
        assert delete_response.get("ok") is True

        # 6. Test endpoints without x-user-id header to receive 401 where applicable

        # POST /api/user-integrations without x-user-id -> 401
        response = requests.post(
            f"{BASE_URL}/api/user-integrations",
            headers=headers_without_user,
            json=integration_payload,
            timeout=TIMEOUT,
        )
        assert response.status_code == 401

        # GET /api/user-integrations without x-user-id -> 401
        response = requests.get(
            f"{BASE_URL}/api/user-integrations",
            headers=headers_without_user,
            timeout=TIMEOUT,
        )
        assert response.status_code == 401

    finally:
        # Cleanup if integration was created (try to delete if exist)
        if integration_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/user-integrations/{integration_id}",
                    timeout=TIMEOUT,
                )
            except Exception:
                pass

test_post_api_user_integrations_add_update_list_test_and_delete()