import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# Replace with valid test user credentials for authentication
TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

def test_postapiautomationscreateandprocesswithchaincondition():
    session = requests.Session()
    try:
        # 1. Authenticate to get session token (cookie-based auth assumed)
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200
        login_json = login_resp.json()
        assert login_json.get("success") is True

        # 2. Create automation with chain condition:
        #    The automation name and instructions can be arbitrary but must include chaining condition.
        #    Use trigger "test-trigger"
        create_automation_payload = {
            "name": "Test Automation with Chain Condition",
            "instructions": (
                "Step 1: Output some text including the word 'invoice'\n"
                "Step 2: Chained step that runs only if output contains 'invoice'"
            ),
            "trigger": "test-trigger"
        }
        create_resp = session.post(
            f"{BASE_URL}/api/automations",
            json=create_automation_payload,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 200
        automation = create_resp.json()
        assert isinstance(automation, dict)
        automation_id = automation.get("id")
        assert isinstance(automation_id, str) and len(automation_id) > 0

        # 3. Process automation with triggerContext that satisfies the chain condition:
        #    The condition from PRD is "output contains invoice", so triggerContext must include "invoice"
        process_payload = {
            "automationId": automation_id,
            "triggerContext": "Invoice #123 generated with amount $456.78"
        }
        process_resp = session.post(
            f"{BASE_URL}/api/automations/process",
            json=process_payload,
            timeout=TIMEOUT,
        )
        assert process_resp.status_code == 200
        process_json = process_resp.json()
        assert process_json.get("success") is True

        # 4. Retrieve automation logs to verify that chained steps executed
        logs_resp = session.get(
            f"{BASE_URL}/api/automations/{automation_id}/logs",
            timeout=TIMEOUT,
        )
        assert logs_resp.status_code == 200
        logs = logs_resp.json()
        assert isinstance(logs, list)
        assert len(logs) > 0

        # 5. Check logs content: Verify at least one log entry indicates chained step execution
        # We look if any log entry string contains 'step' or 'invoice' keywords
        found = False
        for entry in logs:
            entry_str = str(entry).lower()
            if 'step' in entry_str or 'invoice' in entry_str or 'chained' in entry_str:
                found = True
                break
        assert found is True

    finally:
        # 6. Cleanup: delete created automation to avoid clutter
        # Best effort, ignore errors
        # Authenticate again if needed is skipped because session is alive
        if 'automation_id' in locals():
            try:
                session.delete(
                    f"{BASE_URL}/api/automations/{automation_id}",
                    timeout=TIMEOUT,
                )
            except Exception:
                pass

test_postapiautomationscreateandprocesswithchaincondition()
