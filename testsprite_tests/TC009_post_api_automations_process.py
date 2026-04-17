import requests
import time

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_post_api_automations_process():
    session = requests.Session()
    # Login to get session cookie
    login_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_json = login_resp.json()
    assert login_json.get("ok") is True
    assert "provider" in login_json

    # Create an automation to use for the process with automationId
    create_auto_resp = session.post(
        f"{BASE_URL}/api/automations",
        headers={**HEADERS, "x-user-id": EMAIL},
        json={
            "name": "Test Automation for Processing",
            "trigger": "schedule",
            "instructions": "Do something",
        },
        timeout=TIMEOUT,
    )
    assert create_auto_resp.status_code == 200, f"Create automation failed: {create_auto_resp.text}"
    automation = create_auto_resp.json().get("automation")
    assert automation is not None
    automation_id = automation.get("id")
    assert isinstance(automation_id, str)

    try:
        # Test processing automations with optional automationId and context
        process_body = {"automationId": automation_id, "context": "Sample context"}
        process_resp = session.post(
            f"{BASE_URL}/api/automations/process",
            json=process_body,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert process_resp.status_code == 200, f"Process request failed: {process_resp.text}"
        process_json = process_resp.json()
        assert isinstance(process_json.get("results"), list)

        # Also test processing with no automationId and no context (all optional)
        process_resp2 = session.post(
            f"{BASE_URL}/api/automations/process",
            json={},
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert process_resp2.status_code == 200, f"Process request (no params) failed: {process_resp2.text}"
        process_json2 = process_resp2.json()
        assert isinstance(process_json2.get("results"), list)

        # Test exceeding rate limit: send 11 rapid requests to cause 429
        last_resp = None
        # 10 allowed, 11th should fail
        for i in range(11):
            last_resp = session.post(
                f"{BASE_URL}/api/automations/process",
                json={"automationId": automation_id},
                headers=HEADERS,
                timeout=TIMEOUT,
            )
            if i < 10:
                assert last_resp.status_code == 200, f"Request {i+1} failed unexpectedly: {last_resp.text}"
                json_resp = last_resp.json()
                assert isinstance(json_resp.get("results"), list)
            else:
                # Expect rate limit exceeded 429 on 11th request
                assert last_resp.status_code == 429, f"Expected 429 on request {i+1}, got {last_resp.status_code}: {last_resp.text}"
                assert "Rate limit exceeded" in last_resp.text or last_resp.json().get("message", "").lower().find("rate limit") != -1

    finally:
        # Clean up: delete the automation created
        del_resp = session.delete(
            f"{BASE_URL}/api/automations/{automation_id}",
            headers={**HEADERS, "x-user-id": EMAIL},
            timeout=TIMEOUT,
        )
        # Deletion may return 200 or 404 if already deleted, accept both
        assert del_resp.status_code in (200, 404), f"Failed to delete automation: {del_resp.text}"

    # Logout to clear session
    logout_resp = session.post(
        f"{BASE_URL}/api/auth/logout",
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    assert logout_resp.status_code == 200
    logout_json = logout_resp.json()
    assert logout_json.get("ok") is True

test_post_api_automations_process()