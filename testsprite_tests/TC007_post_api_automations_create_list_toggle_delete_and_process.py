import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_automations_create_list_toggle_delete_and_process():
    headers_valid = {"x-user-id": "test-user-123"}
    invalid_trigger_body = {
        "name": "Invalid Trigger Automation",
        "trigger": "invalid_trigger_value",
        "instructions": "Some instructions"
    }
    valid_automation_body = {
        "name": "Test Automation",
        "trigger": "schedule",
        "instructions": "Run this every day at noon",
        "description": "Test automation description"
    }

    # Create Automation with valid x-user-id and valid body
    automation = None
    try:
        r_create = requests.post(
            f"{BASE_URL}/api/automations",
            headers=headers_valid,
            json=valid_automation_body,
            timeout=TIMEOUT,
        )
        assert r_create.status_code == 200, f"Expected 200, got {r_create.status_code}"
        resp_create = r_create.json()
        assert "automation" in resp_create, "Response missing 'automation'"
        automation = resp_create["automation"]
        assert isinstance(automation, dict), "'automation' should be a dict"
        assert "id" in automation, "Automation object missing 'id'"
        automation_id = automation["id"]
        assert automation_id, "No automation ID found"

        # List automations with valid x-user-id
        r_list = requests.get(
            f"{BASE_URL}/api/automations",
            headers=headers_valid,
            timeout=TIMEOUT,
        )
        assert r_list.status_code == 200, f"Expected 200, got {r_list.status_code}"
        resp_list = r_list.json()
        assert "automations" in resp_list, "Response missing 'automations'"
        assert isinstance(resp_list["automations"], list), "'automations' should be a list"
        # There should be at least one automation (the one created)
        assert any(
            a.get("id") == automation_id for a in resp_list["automations"]
        ), "Created automation not found in list"

        # POST /api/automations without x-user-id should give 401 error
        r_no_user_id = requests.post(
            f"{BASE_URL}/api/automations",
            json=valid_automation_body,
            timeout=TIMEOUT,
        )
        assert r_no_user_id.status_code == 401, f"Expected 401, got {r_no_user_id.status_code}"

        # POST /api/automations with invalid trigger should give 400
        r_invalid_trigger = requests.post(
            f"{BASE_URL}/api/automations",
            headers=headers_valid,
            json=invalid_trigger_body,
            timeout=TIMEOUT,
        )
        assert r_invalid_trigger.status_code == 400, f"Expected 400, got {r_invalid_trigger.status_code}"

        # POST /api/automations/process to process automations
        r_process = requests.post(
            f"{BASE_URL}/api/automations/process",
            json={"automationId": automation_id},
            timeout=TIMEOUT,
        )
        assert r_process.status_code == 200, f"Expected 200, got {r_process.status_code}"
        resp_process = r_process.json()
        assert "ok" in resp_process and resp_process["ok"] is True, "'ok' is missing or not True"
        assert "processed" in resp_process, "'processed' count missing"
        assert isinstance(resp_process["processed"], int), "'processed' should be int"
        assert resp_process["processed"] >= 0, "'processed' should be >= 0"

        # POST /api/automations/:id/toggle to enable/disable automation
        r_toggle = requests.post(
            f"{BASE_URL}/api/automations/{automation_id}/toggle",
            timeout=TIMEOUT,
        )
        assert r_toggle.status_code == 200, f"Expected 200, got {r_toggle.status_code}"
        resp_toggle = r_toggle.json()
        assert "automation" in resp_toggle, "Response missing 'automation' on toggle"
        toggled_automation = resp_toggle["automation"]
        assert isinstance(toggled_automation, dict), "'automation' should be dict on toggle"
        assert toggled_automation.get("id") == automation_id, "Toggled automation id mismatch"

    finally:
        # Clean up - DELETE automation if created
        if automation:
            r_delete = requests.delete(
                f"{BASE_URL}/api/automations/{automation_id}",
                timeout=TIMEOUT,
            )
            assert r_delete.status_code == 200, f"Expected 200 on delete, got {r_delete.status_code}"
            resp_delete = r_delete.json()
            assert "ok" in resp_delete and resp_delete["ok"] is True, "'ok' missing or false on delete"

test_post_api_automations_create_list_toggle_delete_and_process()
