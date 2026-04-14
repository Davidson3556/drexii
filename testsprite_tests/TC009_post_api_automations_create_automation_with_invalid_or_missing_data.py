import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_automations_create_automation_with_invalid_or_missing_data():
    url = f"{BASE_URL}/api/automations"
    payload_valid_trigger = {
        "name": "Test Automation",
        "trigger": "invalid_trigger_value",
        "instructions": "Test instructions"
    }

    # Case 1: POST without x-user-id header -> expect 401 User ID required
    try:
        response_no_user_id = requests.post(url, json=payload_valid_trigger, timeout=TIMEOUT)
        assert response_no_user_id.status_code == 401, f"Expected 401 but got {response_no_user_id.status_code}"
        # Check error message contains expected text
        resp_json = response_no_user_id.json()
        error_msgs = [resp_json.get("message"), resp_json.get("error"), resp_json.get("detail")]
        error_msgs = [msg for msg in error_msgs if msg]
        found_msg = any("User ID required" in str(msg) for msg in error_msgs)
        assert found_msg, f"Expected error message containing 'User ID required' but got {resp_json}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Case 2: POST with x-user-id header but invalid trigger -> expect 400 with specific invalid trigger message
    headers = {
        "x-user-id": "fake-user-id"
    }
    try:
        response_invalid_trigger = requests.post(url, json=payload_valid_trigger, headers=headers, timeout=TIMEOUT)
        assert response_invalid_trigger.status_code == 400, f"Expected 400 but got {response_invalid_trigger.status_code}"
        resp_json = response_invalid_trigger.json()
        error_msgs = [resp_json.get("message"), resp_json.get("error"), resp_json.get("detail")]
        error_msgs = [msg for msg in error_msgs if msg]
        found_msg = any("Invalid trigger. Must be one of: email_received, schedule, webhook, chain" in str(msg) for msg in error_msgs)
        assert found_msg, f"Expected error message containing 'Invalid trigger. Must be one of: email_received, schedule, webhook, chain' but got {resp_json}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_api_automations_create_automation_with_invalid_or_missing_data()
