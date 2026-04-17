import requests

BASE_URL = "http://localhost:3000"
LOGIN_EMAIL = "drexiitest@mailinator.com"
LOGIN_PASSWORD = "12345678"
TIMEOUT = 30

def test_post_api_automations_create_with_chain_condition():
    session = requests.Session()
    login_url = f"{BASE_URL}/api/auth/login"
    automations_url = f"{BASE_URL}/api/automations"
    headers = {"Content-Type": "application/json"}

    # Login to get authenticated user info and x-user-id header value
    login_payload = {
        "email": LOGIN_EMAIL,
        "password": LOGIN_PASSWORD
    }
    login_resp = session.post(login_url, json=login_payload, headers=headers, timeout=TIMEOUT)
    assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}: {login_resp.text}"
    login_json = login_resp.json()
    assert login_json.get("ok") is True, "Login response ok is not true"
    assert login_json.get("provider") == "insforge", "Login provider is not insforge"

    # Because x-user-id header is required, get it from user/me or from /api/auth/check could help 
    # But /api/auth/check might not giving authenticated user due to known stateless environment limitation
    # So alternatively, extract user id from login if present or assume a known user id from email (since no direct user id endpoint)
    # Here, we'll try GET /api/auth/check to get user id or fail otherwise
    check_url = f"{BASE_URL}/api/auth/check"
    check_resp = session.get(check_url, timeout=TIMEOUT)
    if check_resp.status_code == 200:
        check_json = check_resp.json()
        user = check_json.get("user")
        if user and "id" in user:
            user_id = user["id"]
        else:
            # fallback: fail test if no user id available
            raise Exception("No user id in /api/auth/check response")
    else:
        raise Exception(f"/api/auth/check request failed with status {check_resp.status_code}")

    # Prepare headers with x-user-id for creating automation
    headers["x-user-id"] = user_id

    # Automation creation payload with chain trigger, chainOn, triggerCondition
    automation_payload = {
        "name": "Test Automation Chain Condition",
        "trigger": "chain",
        "instructions": "Run follow-up tasks when previous automation succeeds",
        "chainOn": "success",
        "triggerCondition": "output contains revenue"
    }

    try:
        resp = session.post(automations_url, json=automation_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Expected 200 but got {resp.status_code}: {resp.text}"
        resp_json = resp.json()
        assert "automation" in resp_json, "Response missing 'automation' object"
        automation = resp_json["automation"]
        assert isinstance(automation, dict), "'automation' is not a dict"
        assert automation.get("trigger") == "chain", "Automation trigger is not 'chain'"
        # chainOn is optional in response? Validate if present matches
        if "chainOn" in automation:
            assert automation["chainOn"] == automation_payload["chainOn"], "chainOn differs in response"
        # triggerCondition may be null or string in response; if present check matches
        if "triggerCondition" in automation and automation["triggerCondition"] is not None:
            assert automation["triggerCondition"] == automation_payload["triggerCondition"], "triggerCondition differs in response"
        assert "id" in automation and isinstance(automation["id"], str) and automation["id"], "Automation id missing or invalid"
    finally:
        # Cleanup by deleting the created automation if id present
        if 'automation' in locals() and 'id' in automation:
            delete_url = f"{automations_url}/{automation['id']}"
            del_resp = session.delete(delete_url, headers=headers, timeout=TIMEOUT)
            # Accept 200 ok or fail silently with warning
            if del_resp.status_code != 200:
                print(f"Warning: Failed to delete automation with id {automation['id']}, status: {del_resp.status_code}")

test_post_api_automations_create_with_chain_condition()