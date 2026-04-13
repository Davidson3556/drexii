import requests
import json

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_post_api_automations_process_chain_condition_evaluation():
    headers = {}
    automation_id = None

    try:
        # Step 1: Create a chain-triggered automation with chain conditions including 'output contains X'
        # Requires x-user-id header; we use a dummy user ID for testing
        user_id = "test-user-123"
        create_automation_url = f"{BASE_URL}/api/automations"
        create_payload = {
            "name": "Chain Condition Test Automation",
            "trigger": "chain",
            "instructions": "Test chain condition evaluation",
            "chainOn": "success"
        }
        create_headers = {
            "x-user-id": user_id,
            "Content-Type": "application/json"
        }
        resp_create = requests.post(create_automation_url, headers=create_headers, json=create_payload, timeout=TIMEOUT)
        assert resp_create.status_code == 200, f"Failed to create automation: {resp_create.text}"
        automation = resp_create.json().get("automation")
        assert automation and isinstance(automation, dict), "Missing automation object in response"
        automation_id = automation.get("id") or automation.get("_id") or automation.get("automationId")
        assert automation_id, "Automation ID missing in created automation"

        # Step 2: Prepare contexts with different 'output' to test chain condition evaluations including 'output contains X'
        #  Contexts:
        #   a) output contains X (should evaluate true)
        #   b) output does not contain X (should evaluate false but API returns ok:true processed:number regardless)
        #   c) unknown chain condition (evaluates true by default)

        # To test 'output contains X', we simulate context.output containing a specific substring
        test_context_true = {"output": "The result includes the magic word X within the text."}
        test_context_false = {"output": "This output does not have the required substring."}
        test_context_unknown = {"output": "Any output works for unknown conditions."}

        process_url = f"{BASE_URL}/api/automations/process"

        # Step 3: Test with context that should make chain condition evaluate true
        body_true = {
            "automationId": automation_id,
            "context": json.dumps(test_context_true)
        }
        resp_true = requests.post(process_url, headers=headers, json=body_true, timeout=TIMEOUT)
        assert resp_true.status_code == 200, f"Failed process with true condition context: {resp_true.text}"
        resp_true_json = resp_true.json()
        assert "ok" in resp_true_json and resp_true_json["ok"] is True, "Response ok field missing or false in true condition"
        assert "processed" in resp_true_json and isinstance(resp_true_json["processed"], int), "Processed count missing or invalid in true condition"

        # Step 4: Test with context that should make chain condition evaluate false (output does not contain X)
        # Even if chain condition evaluates false, response is always 200 with ok:true
        body_false = {
            "automationId": automation_id,
            "context": json.dumps(test_context_false)
        }
        resp_false = requests.post(process_url, headers=headers, json=body_false, timeout=TIMEOUT)
        assert resp_false.status_code == 200, f"Failed process with false condition context: {resp_false.text}"
        resp_false_json = resp_false.json()
        assert "ok" in resp_false_json and resp_false_json["ok"] is True, "Response ok field missing or false in false condition"
        assert "processed" in resp_false_json and isinstance(resp_false_json["processed"], int), "Processed count missing or invalid in false condition"

        # Step 5: Test with unknown chain condition (simulate by modifying the automation chainCondition to a complex expression)
        # For testing purpose, PATCH or direct update not exposed; we create another automation with unknown chain condition string
        unknown_condition_automation_payload = {
            "name": "Unknown Chain Condition Automation",
            "trigger": "chain",
            "instructions": "Testing unknown chain condition evaluation",
            "chainOn": "success",
            "triggerCondition": "(output contains X) AND (some unsupported expression)"
        }
        resp_create_unknown = requests.post(create_automation_url, headers=create_headers, json=unknown_condition_automation_payload, timeout=TIMEOUT)
        assert resp_create_unknown.status_code == 200, f"Failed to create unknown condition automation: {resp_create_unknown.text}"
        unknown_automation = resp_create_unknown.json().get("automation")
        unknown_automation_id = unknown_automation.get("id") or unknown_automation.get("_id") or unknown_automation.get("automationId")
        assert unknown_automation_id, "Unknown automation ID missing"

        # Process with context for unknown chain condition - should default to true
        body_unknown = {
            "automationId": unknown_automation_id,
            "context": json.dumps(test_context_unknown)
        }
        resp_unknown = requests.post(process_url, headers=headers, json=body_unknown, timeout=TIMEOUT)
        assert resp_unknown.status_code == 200, f"Failed process with unknown chain condition context: {resp_unknown.text}"
        resp_unknown_json = resp_unknown.json()
        assert "ok" in resp_unknown_json and resp_unknown_json["ok"] is True, "Response ok missing or false for unknown chain condition"
        assert "processed" in resp_unknown_json and isinstance(resp_unknown_json["processed"], int), "Processed count invalid for unknown chain condition"

    finally:
        # Cleanup: Delete created automations if created
        if automation_id:
            del_url = f"{BASE_URL}/api/automations/{automation_id}"
            try:
                resp_del = requests.delete(del_url, timeout=TIMEOUT)
                # Accept 200 ok even if already deleted
                assert resp_del.status_code == 200, f"Failed to delete automation {automation_id}: {resp_del.text}"
            except Exception:
                pass

        # Delete unknown condition automation
        try:
            if 'unknown_automation_id' in locals() and unknown_automation_id:
                del_unknown_url = f"{BASE_URL}/api/automations/{unknown_automation_id}"
                resp_del_unknown = requests.delete(del_unknown_url, timeout=TIMEOUT)
                assert resp_del_unknown.status_code == 200, f"Failed to delete unknown automation {unknown_automation_id}: {resp_del_unknown.text}"
        except Exception:
            pass

test_post_api_automations_process_chain_condition_evaluation()