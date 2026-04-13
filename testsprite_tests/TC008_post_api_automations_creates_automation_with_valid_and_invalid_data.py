import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_automations_creates_automation_with_valid_and_invalid_data():
    headers_valid = {
        "x-user-id": "test-user-123"
    }
    valid_body = {
        "name": "Notify on email",
        "trigger": "email_received",
        "instructions": "Summarize and notify"
    }
    invalid_trigger_body = {
        "name": "Invalid trigger test",
        "trigger": "invalid_trigger_value",
        "instructions": "Should fail validation"
    }
    url = f"{BASE_URL}/api/automations"

    created_automation_id = None

    try:
        # Test valid x-user-id and valid body -> Expect 200 and automation object with id
        response = requests.post(url, json=valid_body, headers=headers_valid, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 but got {response.status_code} for valid input"
        data = response.json()
        assert "automation" in data, "Response missing 'automation'"
        automation = data["automation"]
        assert isinstance(automation, dict), "'automation' should be a dict"
        assert "id" in automation and isinstance(automation["id"], str) and automation["id"], "Automation ID missing or invalid"
        created_automation_id = automation["id"]

        # Test missing x-user-id header -> Expect 401 User ID required
        response_no_user = requests.post(url, json=valid_body, timeout=TIMEOUT)
        assert response_no_user.status_code == 401, f"Expected 401 but got {response_no_user.status_code} for missing x-user-id header"

        # Test invalid trigger value with x-user-id header -> Expect 400 Validation error
        response_invalid_trigger = requests.post(url, json=invalid_trigger_body, headers=headers_valid, timeout=TIMEOUT)
        assert response_invalid_trigger.status_code == 400, f"Expected 400 but got {response_invalid_trigger.status_code} for invalid trigger"

    finally:
        # Cleanup: delete the created automation if exists
        if created_automation_id:
            try:
                delete_url = f"{url}/{created_automation_id}"
                del_response = requests.delete(delete_url, timeout=TIMEOUT)
                # Not asserting delete here to avoid masking original test failures
            except Exception:
                pass

test_post_api_automations_creates_automation_with_valid_and_invalid_data()