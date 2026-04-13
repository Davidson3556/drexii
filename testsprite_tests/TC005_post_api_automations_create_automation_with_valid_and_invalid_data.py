import requests

base_url = "http://localhost:3000"
timeout = 30

def test_post_api_automations_create_automation_with_valid_and_invalid_data():
    # Valid user ID and valid data for creation
    user_id = "test-user-123"
    valid_payload = {
        "name": "Test Automation",
        "trigger": "email_received",
        "instructions": "Do something when email received"
    }
    headers = {"x-user-id": user_id}
    automation_id = None

    try:
        # Create automation with valid data and header
        response = requests.post(f"{base_url}/api/automations", json=valid_payload, headers=headers, timeout=timeout)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        json_response = response.json()
        assert "automation" in json_response, "Response missing 'automation'"
        automation = json_response["automation"]
        assert isinstance(automation, dict), "'automation' should be an object"
        assert automation.get("name") == valid_payload["name"], "Automation name mismatch"
        automation_id = automation.get("id") or automation.get("_id") or None
        # automation_id might be None if id is nested under a different key or not provided

        # Create automation with missing x-user-id header: expect 401
        response_missing_user_id = requests.post(f"{base_url}/api/automations", json=valid_payload, timeout=timeout)
        assert response_missing_user_id.status_code == 401, f"Expected 401, got {response_missing_user_id.status_code}"
        assert "User ID required" in response_missing_user_id.text or "User ID is required" in response_missing_user_id.text, "Expected 'User ID required' error message"

        # Create automation with invalid trigger value, expect 400
        invalid_payload = valid_payload.copy()
        invalid_payload["trigger"] = "invalid_trigger_value"
        response_invalid_trigger = requests.post(f"{base_url}/api/automations", json=invalid_payload, headers=headers, timeout=timeout)
        assert response_invalid_trigger.status_code == 400, f"Expected 400, got {response_invalid_trigger.status_code}"
        assert "Validation error" in response_invalid_trigger.text, "Expected 'Validation error' message"

    finally:
        # Clean up: delete created automation if possible
        if automation_id:
            try:
                requests.delete(f"{base_url}/api/automations/{automation_id}", timeout=timeout)
            except Exception:
                pass

test_post_api_automations_create_automation_with_valid_and_invalid_data()