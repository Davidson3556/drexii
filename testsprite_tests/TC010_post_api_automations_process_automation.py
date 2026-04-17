import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
AUTOMATIONS_URL = f"{BASE_URL}/api/automations"
PROCESS_URL = f"{BASE_URL}/api/automations/process"

EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30


def test_post_api_automations_process_automation():
    session = requests.Session()
    try:
        # Login to get authenticated session (cookie)
        login_resp = session.post(
            LOGIN_URL,
            json={"email": EMAIL, "password": PASSWORD},
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert login_data.get("ok") is True
        assert login_data.get("provider") == "insforge"

        # Get user info from /api/auth/check (optional step, but not required by PRD for this test)
        # Create a new automation to get an automationId
        user_check_resp = session.get(f"{BASE_URL}/api/auth/check", timeout=TIMEOUT)
        assert user_check_resp.status_code == 200
        user_check_data = user_check_resp.json()
        assert user_check_data.get("authenticated") is True
        user = user_check_data.get("user")
        assert user is not None and "id" in user
        user_id = user["id"]

        # Create an automation to process
        automation_payload = {
            "name": "Test Automation for Processing",
            "trigger": "schedule",
            "instructions": "Test instructions for processing automation",
        }
        headers = {"x-user-id": user_id}
        create_resp = session.post(
            AUTOMATIONS_URL, json=automation_payload, headers=headers, timeout=TIMEOUT
        )
        assert create_resp.status_code == 200, f"Create automation failed: {create_resp.text}"
        create_data = create_resp.json()
        automation = create_data.get("automation")
        assert automation is not None and "id" in automation
        automation_id = automation["id"]

        # Process the created automation with automationId and context
        process_body = {"automationId": automation_id, "context": "Test context for processing"}
        process_resp = session.post(PROCESS_URL, json=process_body, timeout=TIMEOUT)
        assert process_resp.status_code == 200, f"Process automation failed: {process_resp.text}"
        process_data = process_resp.json()
        assert process_data.get("ok") is True
        assert isinstance(process_data.get("processed"), int)

        # Also test processing without automationId or context (process due scheduled automations)
        process_resp2 = session.post(PROCESS_URL, json={}, timeout=TIMEOUT)
        assert process_resp2.status_code == 200, f"Process automation (no body) failed: {process_resp2.text}"
        process_data2 = process_resp2.json()
        assert process_data2.get("ok") is True
        assert isinstance(process_data2.get("processed"), int)

    finally:
        # Clean up: delete the created automation
        if 'automation_id' in locals():
            delete_url = f"{AUTOMATIONS_URL}/{automation_id}"
            try:
                delete_resp = session.delete(delete_url, timeout=TIMEOUT)
                assert delete_resp.status_code == 200, f"Delete automation failed: {delete_resp.text}"
                delete_data = delete_resp.json()
                assert delete_data.get("ok") is True
            except Exception:
                pass


test_post_api_automations_process_automation()