import requests
from requests.exceptions import RequestException

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# For the purpose of this test, set valid auth headers with a session token.
# Adjust the token below with a valid token for real testing.
AUTH_HEADERS = {
    "Authorization": "Bearer valid_session_token_here",
    "Content-Type": "application/json"
}


def test_get_actions_pending_confirm_and_cancel():
    try:
        # Step 1: GET /api/actions/pending to list pending actions
        pending_resp = requests.get(f"{BASE_URL}/api/actions/pending", headers=AUTH_HEADERS, timeout=TIMEOUT)
        assert pending_resp.status_code == 200, f"Expected 200 OK for GET pending actions, got {pending_resp.status_code}"
        pending_actions = pending_resp.json()
        assert isinstance(pending_actions, list), "Pending actions response should be a list"

        if not pending_actions:
            print("No pending actions present. Test skipped.")
            return  # Nothing to confirm or cancel

        # Use the first pending action for confirm and cancel test
        action = pending_actions[0]
        action_id = action.get("id") or action.get("_id")
        assert action_id, "Pending action has no 'id' field"

        # Step 2: POST /api/actions/:id/confirm to confirm action
        confirm_resp = requests.post(f"{BASE_URL}/api/actions/{action_id}/confirm", headers=AUTH_HEADERS, timeout=TIMEOUT)
        assert confirm_resp.status_code == 200, f"Expected 200 OK for POST confirm action, got {confirm_resp.status_code}"
        confirm_json = confirm_resp.json()
        assert confirm_json.get("success") is True, "Confirm action response success field not true"

        # Step 3: GET /api/actions/pending again to verify confirmed action removed
        pending_resp_after_confirm = requests.get(f"{BASE_URL}/api/actions/pending", headers=AUTH_HEADERS, timeout=TIMEOUT)
        assert pending_resp_after_confirm.status_code == 200, f"Expected 200 OK for GET pending actions after confirm, got {pending_resp_after_confirm.status_code}"
        pending_after_confirm = pending_resp_after_confirm.json()
        assert all((a.get("id") or a.get("_id")) != action_id for a in pending_after_confirm), "Confirmed action still present in pending list"

        # Step 4: For cancel test, we need a pending action again. If none, create a dummy one is not in scope.
        # We will get the list again and if empty skip cancel test.
        if not pending_after_confirm:
            print("No pending actions after confirm to test cancel. Skipping cancel test.")
            return

        action_to_cancel = pending_after_confirm[0]
        cancel_action_id = action_to_cancel.get("id") or action_to_cancel.get("_id")
        assert cancel_action_id, "Pending action to cancel has no 'id' field"

        # Step 5: POST /api/actions/:id/cancel to cancel action
        cancel_resp = requests.post(f"{BASE_URL}/api/actions/{cancel_action_id}/cancel", headers=AUTH_HEADERS, timeout=TIMEOUT)
        assert cancel_resp.status_code == 200, f"Expected 200 OK for POST cancel action, got {cancel_resp.status_code}"
        cancel_json = cancel_resp.json()
        assert cancel_json.get("success") is True, "Cancel action response success field not true"

        # Step 6: GET /api/actions/pending to verify canceled action removed
        pending_resp_after_cancel = requests.get(f"{BASE_URL}/api/actions/pending", headers=AUTH_HEADERS, timeout=TIMEOUT)
        assert pending_resp_after_cancel.status_code == 200, f"Expected 200 OK for GET pending actions after cancel, got {pending_resp_after_cancel.status_code}"
        pending_after_cancel = pending_resp_after_cancel.json()
        assert all((a.get("id") or a.get("_id")) != cancel_action_id for a in pending_after_cancel), "Canceled action still present in pending list"

    except RequestException as e:
        raise AssertionError(f"HTTP request failed: {e}")
    except AssertionError:
        raise
    except Exception as e:
        raise AssertionError(f"Unexpected error occurred: {e}")


test_get_actions_pending_confirm_and_cancel()
