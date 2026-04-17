import requests
import time

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30


def test_post_api_automations_process():
    session = requests.Session()

    # Login to obtain session cookie
    login_resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        timeout=TIMEOUT,
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()
    assert login_data.get("ok") is True
    assert "provider" in login_data

    headers = {"x-user-id": EMAIL}

    automation_id = None
    try:
        # Create an automation to get a valid automationId for processing
        create_resp = session.post(
            f"{BASE_URL}/api/automations",
            json={
                "name": "Test Automation for TC009",
                "trigger": "schedule",
                "instructions": "Test instructions",
            },
            headers=headers,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 200, f"Automation creation failed: {create_resp.text}"
        automation = create_resp.json().get("automation")
        assert automation is not None, "Automation object missing in response"
        automation_id = automation.get("id")
        assert automation_id, "Automation ID missing"

        # 1) Test processing automations with automationId and context, expect 200 with results array
        process_resp = session.post(
            f"{BASE_URL}/api/automations/process",
            json={"automationId": automation_id, "context": "Sample context"},
            timeout=TIMEOUT,
        )
        assert process_resp.status_code == 200, f"Process with automationId failed: {process_resp.text}"
        process_data = process_resp.json()
        assert isinstance(process_data.get("results"), list), "Results is not a list"

        # 2) Test processing automations without automationId or context, expect 200 with results array
        process_resp2 = session.post(
            f"{BASE_URL}/api/automations/process",
            json={},
            timeout=TIMEOUT,
        )
        assert process_resp2.status_code == 200, f"Process without params failed: {process_resp2.text}"
        process_data2 = process_resp2.json()
        assert isinstance(process_data2.get("results"), list), "Results is not a list"

        # 3) Test rate limit exceeded returns 429 after 10 rapid requests
        responses = []
        for i in range(11):
            resp = session.post(
                f"{BASE_URL}/api/automations/process",
                json={"automationId": automation_id},
                timeout=TIMEOUT,
            )
            responses.append(resp)
            # No delay to trigger rate limit

        # The first 10 should be 200; the 11th should be 429
        for idx, resp in enumerate(responses[:10]):
            assert resp.status_code == 200, f"Request {idx+1} expected 200 but got {resp.status_code}: {resp.text}"
            r_json = resp.json()
            assert "results" in r_json and isinstance(r_json["results"], list), f"Request {idx+1} results missing or invalid"

        last_resp = responses[-1]
        assert last_resp.status_code == 429, f"11th request expected 429 but got {last_resp.status_code}"
        assert "Rate limit exceeded" in last_resp.text or "rate limit" in last_resp.text.lower()

    finally:
        # Cleanup: delete the created automation if it exists
        if automation_id:
            del_resp = session.delete(
                f"{BASE_URL}/api/automations/{automation_id}",
                timeout=TIMEOUT,
            )
            # Accept 200 (ok) or 404 (already deleted) silently
            if del_resp.status_code not in (200, 404):
                raise AssertionError(f"Failed to delete automation {automation_id}: {del_resp.status_code} {del_resp.text}")

    # Logout to clear session cookie
    logout_resp = session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)
    assert logout_resp.status_code == 200, f"Logout failed: {logout_resp.text}"
    logout_data = logout_resp.json()
    assert logout_data.get("ok") is True


test_post_api_automations_process()