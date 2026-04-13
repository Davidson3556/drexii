import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def test_post_api_automations_process_triggers_automations_with_optional_context():
    # Helper function to create an automation
    def create_automation(name, trigger, instructions, user_id):
        url = f"{BASE_URL}/api/automations"
        headers = {"x-user-id": user_id}
        body = {
            "name": name,
            "trigger": trigger,
            "instructions": instructions
        }
        resp = requests.post(url, json=body, headers=headers, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        assert "automation" in data
        return data["automation"]["id"]

    # Helper function to delete an automation
    def delete_automation(automation_id):
        url = f"{BASE_URL}/api/automations/{automation_id}"
        try:
            resp = requests.delete(url, timeout=TIMEOUT)
            # Accept 200 OK or 404 if already deleted
            if resp.status_code not in (200, 404):
                resp.raise_for_status()
        except requests.RequestException:
            pass

    # Precondition: Create an automation to use its ID in processing
    user_id = "test-user-123"
    automation_id = None
    try:
        automation_id = create_automation(
            name="Test Automation for TC009",
            trigger="schedule",
            instructions="Test instructions",
            user_id=user_id,
        )

        # Test 1: POST /api/automations/process with automationId and context
        url_process = f"{BASE_URL}/api/automations/process"
        payload_with_id = {
            "automationId": automation_id,
            "context": "This is a test context for automation processing."
        }
        resp = requests.post(url_process, json=payload_with_id, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Status code was {resp.status_code}, response: {resp.text}"
        data = resp.json()
        assert isinstance(data, dict), "Response is not a JSON object"
        assert data.get("ok") is True, "Response 'ok' is not true"
        assert "processed" in data, "'processed' field missing in response"
        assert isinstance(data["processed"], int), "'processed' is not an integer"
        assert data["processed"] >= 0, "'processed' count should be non-negative"

        # Test 2: POST /api/automations/process without automationId - triggers due scheduled automations
        payload_without_id = {}
        resp2 = requests.post(url_process, json=payload_without_id, timeout=TIMEOUT)
        assert resp2.status_code == 200, f"Status code was {resp2.status_code}, response: {resp2.text}"
        data2 = resp2.json()
        assert isinstance(data2, dict), "Response is not a JSON object"
        assert data2.get("ok") is True, "Response 'ok' is not true"
        assert "processed" in data2, "'processed' field missing in response"
        assert isinstance(data2["processed"], int), "'processed' is not an integer"
        assert data2["processed"] >= 0, "'processed' count should be non-negative"

    finally:
        # Cleanup: delete the created automation
        if automation_id:
            delete_automation(automation_id)


test_post_api_automations_process_triggers_automations_with_optional_context()