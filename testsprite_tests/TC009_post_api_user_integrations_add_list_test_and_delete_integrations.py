import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
X_USER_ID = "test-user-1234"  # Example user ID for test

def test_post_user_integrations_add_list_test_delete():
    headers = {
        "x-user-id": X_USER_ID,
        "Content-Type": "application/json"
    }
    integration_payload = {
        "integration": "gmail",
        "credentials": {
            "token": "test-token-xyz"
        }
    }

    integration_id = None

    try:
        # 1. POST /api/user-integrations to add or update integration
        post_response = requests.post(
            f"{BASE_URL}/api/user-integrations",
            headers=headers,
            json=integration_payload,
            timeout=TIMEOUT
        )
        assert post_response.status_code == 200, f"Expected 200, got {post_response.status_code}"
        post_json = post_response.json()
        assert "id" in post_json and isinstance(post_json["id"], str), "Response missing 'id'"
        assert post_json.get("integration") == integration_payload["integration"], "Integration mismatch"
        assert post_json.get("status") in ("created", "updated"), "Invalid status"
        integration_id = post_json["id"]

        # 2. GET /api/user-integrations to list integrations with masked credentials
        get_response = requests.get(
            f"{BASE_URL}/api/user-integrations",
            headers={"x-user-id": X_USER_ID},
            timeout=TIMEOUT
        )
        assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}"
        integrations_list = get_response.json()
        assert isinstance(integrations_list, list), "Integrations list should be a list"
        found = False
        for item in integrations_list:
            if item.get("id") == integration_id:
                found = True
                # Check integration is correct
                assert item.get("integration") == integration_payload["integration"], "Listed integration mismatch"
                # Credentials should be masked
                creds = item.get("credentials")
                assert creds == "***masked***", "Credentials not masked in list"
        assert found, "Added integration not found in list"

        # 3. POST /api/user-integrations/test to test credentials (expect success true)
        test_payload = {
            "integration": integration_payload["integration"],
            "credentials": integration_payload["credentials"]
        }
        test_response = requests.post(
            f"{BASE_URL}/api/user-integrations/test",
            json=test_payload,
            timeout=TIMEOUT
        )
        assert test_response.status_code == 200, f"Expected 200, got {test_response.status_code}"
        test_json = test_response.json()
        assert isinstance(test_json.get("success"), bool), "'success' key missing or not bool"
        assert test_json["success"] is True, f"Test credentials failed unexpectedly: {test_json.get('error')}"

    finally:
        # 4. DELETE /api/user-integrations/:id to remove integration if created
        if integration_id:
            try:
                del_response = requests.delete(
                    f"{BASE_URL}/api/user-integrations/{integration_id}",
                    timeout=TIMEOUT
                )
                assert del_response.status_code == 200, f"Expected 200 on delete, got {del_response.status_code}"
                del_json = del_response.json()
                assert del_json.get("ok") is True, "Delete response missing ok: true"
            except RequestException as e:
                raise AssertionError(f"Failed to delete integration {integration_id}: {e}")

test_post_user_integrations_add_list_test_delete()