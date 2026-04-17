import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
CREATE_AUTOMATION_ENDPOINT = "/api/automations"
DELETE_AUTOMATION_ENDPOINT = "/api/automations/{}"
TIMEOUT = 30

EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"

def test_post_api_automations_create_automation_with_valid_data():
    session = requests.Session()
    try:
        # Step 1: Login to get x-user-id
        login_payload = {
            "email": EMAIL,
            "password": PASSWORD
        }
        login_response = session.post(f"{BASE_URL}{LOGIN_ENDPOINT}", json=login_payload, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status code {login_response.status_code}"
        login_json = login_response.json()
        assert login_json.get("ok") is True, "Login response missing ok:true"
        assert login_json.get("provider") == "insforge", "Login provider is not insforge"

        # Since the API requires x-user-id header for /api/automations, but no direct user ID in login response
        # And PRD says TC001 login returns session cookie, but no explicit userId
        # We must get user ID from /api/auth/check endpoint or from session cookie, but it's not possible here.
        # The test instructions mention: "TC008 requires x-user-id header and auth_required true"
        # But no explicit userId from login response, so we assume the email or a placeholder user id can be used as x-user-id.
        # The PRD does not provide an endpoint to get userId in test. We'll simulate usage: use the email as user id.
        # NOTE: This approach follows the assumption based on provided info since no explicit userId retrieval endpoint given.

        x_user_id = EMAIL

        # Step 2: Create automation with valid data
        automation_payload = {
            "name": "Test Automation for TC008",
            "trigger": "email_received",
            "instructions": "Run a test automation triggered by email_received"
        }
        headers = {
            "x-user-id": x_user_id,
            "Content-Type": "application/json"
        }
        create_response = session.post(f"{BASE_URL}{CREATE_AUTOMATION_ENDPOINT}",
                                       json=automation_payload,
                                       headers=headers,
                                       timeout=TIMEOUT)
        assert create_response.status_code == 200, f"Create automation failed with status code {create_response.status_code}"
        create_json = create_response.json()
        assert "automation" in create_json, "Response JSON does not contain 'automation' object"
        automation = create_json["automation"]
        assert automation.get("name") == automation_payload["name"], "Automation name mismatch"
        assert automation.get("trigger") == automation_payload["trigger"], "Automation trigger mismatch"
        assert automation.get("instructions") == automation_payload["instructions"], "Automation instructions mismatch"
        assert "id" in automation or "_id" in automation, "Automation object missing id"

    finally:
        # Cleanup: delete the created automation if possible
        try:
            automation_id = None
            if 'automation' in locals():
                # Try id or _id field for automation id
                automation_id = automation.get("id") or automation.get("_id")
            if automation_id:
                delete_url = f"{BASE_URL}{DELETE_AUTOMATION_ENDPOINT.format(automation_id)}"
                # Delete might not require auth per PRD, so no header
                del_response = session.delete(delete_url, timeout=TIMEOUT)
                assert del_response.status_code == 200, f"Failed to delete automation with status code {del_response.status_code}"
                del_json = del_response.json()
                assert del_json.get("ok") is True, "Delete automation response ok false"
        except Exception:
            # Ignore cleanup errors
            pass

test_post_api_automations_create_automation_with_valid_data()