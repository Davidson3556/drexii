import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
AUTOMATIONS_ENDPOINT = "/api/automations"
AUTOMATIONS_PROCESS_ENDPOINT = "/api/automations/process"
AUTOMATIONS_DELETE_ENDPOINT = "/api/automations/{id}"

EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30

def test_post_api_automations_process_with_automation_id_and_context():
    session = requests.Session()

    # Step 1: Login to get user info (no token required per PRD, but we will get user id to create automation)
    login_resp = session.post(
        BASE_URL + LOGIN_ENDPOINT,
        json={"email": EMAIL, "password": PASSWORD},
        timeout=TIMEOUT
    )
    assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code} and body {login_resp.text}"
    login_json = login_resp.json()
    assert login_json.get("ok") is True
    assert login_json.get("provider") == "insforge"

    # The PRD does not explicitly mention that login returns userId; for creating automation x-user-id header required.
    # We must get authenticated user id by calling GET /api/auth/check (which returns user object)
    auth_check_resp = session.get(BASE_URL + "/api/auth/check", timeout=TIMEOUT)
    assert auth_check_resp.status_code == 200, f"Auth check failed with status {auth_check_resp.status_code}"
    auth_check_json = auth_check_resp.json()
    user = auth_check_json.get("user")
    assert auth_check_json.get("authenticated") is True, "User not authenticated after login"
    assert user is not None and "id" in user, "User info missing from auth check"
    user_id = user["id"]

    # Step 2: Create an automation to get an automationId
    automation_data = {
        "name": "Test Automation for TC009",
        "trigger": "chain",
        "instructions": "Instructions for processing test automation",
        "chainOn": "success",
        "triggerCondition": None
    }
    create_headers = {"x-user-id": user_id}
    create_resp = session.post(
        BASE_URL + AUTOMATIONS_ENDPOINT,
        json=automation_data,
        headers=create_headers,
        timeout=TIMEOUT
    )
    assert create_resp.status_code == 200, f"Automation creation failed with status {create_resp.status_code}, body: {create_resp.text}"
    create_json = create_resp.json()
    automation = create_json.get("automation")
    assert automation is not None, "No automation object returned from creation"
    automation_id = automation.get("id")
    assert automation_id and isinstance(automation_id, str), "Invalid automationId from creation"

    try:
        # Step 3: Process the automation with automationId and context
        process_payload = {
            "automationId": automation_id,
            "context": "test_context_value"
        }
        process_resp = session.post(
            BASE_URL + AUTOMATIONS_PROCESS_ENDPOINT,
            json=process_payload,
            timeout=TIMEOUT
        )
        assert process_resp.status_code == 200, f"Automation process failed with status {process_resp.status_code}, body: {process_resp.text}"
        process_json = process_resp.json()
        assert isinstance(process_json.get("ok"), bool) and process_json.get("ok") is True, "Process response ok is not true"
        processed = process_json.get("processed")
        assert isinstance(processed, int), "Processed count missing or not an integer"
    finally:
        # Step 4: Cleanup - delete the created automation
        delete_resp = session.delete(
            BASE_URL + AUTOMATIONS_DELETE_ENDPOINT.format(id=automation_id),
            timeout=TIMEOUT
        )
        # Deletion might not depend on authorization, check for ok:true
        if delete_resp.status_code == 200:
            delete_json = delete_resp.json()
            assert delete_json.get("ok") is True, f"Failed to delete automation, response: {delete_resp.text}"

test_post_api_automations_process_with_automation_id_and_context()