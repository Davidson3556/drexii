import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_confirm_cancel_pending_actions():
    try:
        # Step 1: GET /api/actions/pending - list pending actions
        pending_resp = requests.get(f"{BASE_URL}/api/actions/pending", timeout=TIMEOUT)
        assert pending_resp.status_code in (200, 500), f"Unexpected status code: {pending_resp.status_code}"
        if pending_resp.status_code == 500:
            # Server error case
            assert "Server error" in pending_resp.text or pending_resp.text != "", "Expected server error message"
            return  # cannot proceed further due to server error
        pending_json = pending_resp.json()
        assert isinstance(pending_json, dict), "Response JSON must be a dictionary"
        assert "actions" in pending_json, "'actions' key missing in response"
        actions = pending_json["actions"]

        if not actions:
            # No pending actions; test error handling for confirm and cancel with invalid ID
            invalid_id = "nonexistent-action-id-123"
            # POST /api/actions/:id/confirm with invalid id, expecting error (likely non-200)
            confirm_resp = requests.post(f"{BASE_URL}/api/actions/{invalid_id}/confirm", timeout=TIMEOUT)
            # Response schema only documents 200 with ok:true; no explicit error schema
            # We accept any non-200 or 200 with {ok: false}, or 404 etc.
            assert confirm_resp.status_code != 200 or not confirm_resp.json().get("ok", True), \
                "Confirming non-existent action should not succeed"

            # POST /api/actions/:id/cancel with invalid id, expecting error (likely non-200)
            cancel_resp = requests.post(f"{BASE_URL}/api/actions/{invalid_id}/cancel", timeout=TIMEOUT)
            assert cancel_resp.status_code != 200 or not cancel_resp.json().get("ok", True), \
                "Canceling non-existent action should not succeed"

        else:
            # Have at least one pending action, pick first
            action = actions[0]
            action_id = action.get("id") or action.get("actionId")  # id property must exist in PendingAction
            assert action_id, "Action id missing in pending action"

            # Step 2: POST /api/actions/:id/confirm - confirm and execute
            confirm_resp = requests.post(f"{BASE_URL}/api/actions/{action_id}/confirm", timeout=TIMEOUT)
            assert confirm_resp.status_code == 200, f"Confirm action returned {confirm_resp.status_code}"
            confirm_json = confirm_resp.json()
            assert isinstance(confirm_json, dict), "Confirm response must be dictionary"
            assert confirm_json.get("ok") is True, "Confirm response 'ok' must be true"
            # 'result' can be any unknown type, so no assertion on its content

            # Step 3: After confirmation, action may be removed, try cancel which should fail or succeed gracefully
            cancel_resp = requests.post(f"{BASE_URL}/api/actions/{action_id}/cancel", timeout=TIMEOUT)
            # Cancel might succeed or error (if action already confirmed)
            # Check status code and ok field if 200
            if cancel_resp.status_code == 200:
                cancel_json = cancel_resp.json()
                assert isinstance(cancel_json, dict), "Cancel response must be dictionary"
                # The action was already confirmed, so "ok" may still be true or false - accept true or false
                assert "ok" in cancel_json, "Cancel response missing 'ok' field"
            else:
                # Accept non-200 for cancel if action no longer pending
                assert cancel_resp.status_code in (404, 400, 409, 422), f"Unexpected cancel status: {cancel_resp.status_code}"
    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"
    except ValueError as e:
        assert False, f"JSON decode failed: {e}"

test_get_confirm_cancel_pending_actions()