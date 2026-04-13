import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS_JSON = {"Content-Type": "application/json"}


def test_post_api_workflows_create_list_run_and_delete():
    # Helper function to create workflow
    def create_workflow(payload):
        resp = requests.post(f"{BASE_URL}/api/workflows", json=payload, headers=HEADERS_JSON, timeout=TIMEOUT)
        return resp

    # 1. Test POST /api/workflows with name and prompt (valid creation)
    payload_prompt = {
        "name": "Test Workflow Prompt",
        "prompt": "This is a test workflow prompt."
    }
    resp_create_prompt = create_workflow(payload_prompt)
    assert resp_create_prompt.status_code == 200, f"Expected 200, got {resp_create_prompt.status_code}"
    json_create_prompt = resp_create_prompt.json()
    assert "workflow" in json_create_prompt, "Response missing 'workflow'"
    workflow_id_prompt = json_create_prompt["workflow"].get("id")
    assert workflow_id_prompt, "Created workflow has no 'id'"

    # 2. Test POST /api/workflows with name and steps array (valid creation)
    payload_steps = {
        "name": "Test Workflow Steps",
        "steps": [
            {
                "title": "Step 1",
                "instruction": "Do something first."
            },
            {
                "title": "Step 2",
                "instruction": "Do something second."
            }
        ]
    }
    resp_create_steps = create_workflow(payload_steps)
    assert resp_create_steps.status_code == 200, f"Expected 200, got {resp_create_steps.status_code}"
    json_create_steps = resp_create_steps.json()
    assert "workflow" in json_create_steps, "Response missing 'workflow'"
    workflow_id_steps = json_create_steps["workflow"].get("id")
    assert workflow_id_steps, "Created workflow has no 'id'"

    # 3. Test POST /api/workflows with missing name or prompt/steps to receive 400 error
    # Missing prompt and steps
    payload_invalid = {
        "name": "Invalid Workflow"
        # no prompt, no steps
    }
    resp_invalid = create_workflow(payload_invalid)
    assert resp_invalid.status_code == 400, f"Expected 400, got {resp_invalid.status_code}"
    err_text = resp_invalid.text.lower()
    assert "name and prompt" in err_text or "required" in err_text, "Error message does not mention missing name and prompt or steps"

    # 4. Test GET /api/workflows to list workflows
    resp_list = requests.get(f"{BASE_URL}/api/workflows", timeout=TIMEOUT)
    assert resp_list.status_code == 200, f"Expected 200, got {resp_list.status_code}"
    json_list = resp_list.json()
    assert "workflows" in json_list, "Response missing 'workflows'"
    workflows_list = json_list["workflows"]
    assert isinstance(workflows_list, list), "'workflows' is not a list"
    # Verify created workflows included in list by their ids
    ids_list = {wf.get("id") for wf in workflows_list}
    assert workflow_id_prompt in ids_list, "Created prompt workflow not in list"
    assert workflow_id_steps in ids_list, "Created steps workflow not in list"

    # 5. Test POST /api/workflows/:id/run to run workflow and receive 200 with result string
    def run_workflow(workflow_id):
        return requests.post(f"{BASE_URL}/api/workflows/{workflow_id}/run", headers=HEADERS_JSON, timeout=TIMEOUT)

    resp_run_prompt = run_workflow(workflow_id_prompt)
    assert resp_run_prompt.status_code == 200, f"Run prompt workflow expected 200, got {resp_run_prompt.status_code}"
    json_run_prompt = resp_run_prompt.json()
    assert "result" in json_run_prompt, "Run response missing 'result'"
    assert isinstance(json_run_prompt["result"], str), "'result' is not a string"

    resp_run_steps = run_workflow(workflow_id_steps)
    assert resp_run_steps.status_code == 200, f"Run steps workflow expected 200, got {resp_run_steps.status_code}"
    json_run_steps = resp_run_steps.json()
    assert "result" in json_run_steps, "Run response missing 'result'"
    assert isinstance(json_run_steps["result"], str), "'result' is not a string"

    # 6. Test DELETE /api/workflows/:id to delete workflow and receive 200 ok true
    def delete_workflow(workflow_id):
        return requests.delete(f"{BASE_URL}/api/workflows/{workflow_id}", timeout=TIMEOUT)

    try:
        resp_delete_prompt = delete_workflow(workflow_id_prompt)
        assert resp_delete_prompt.status_code == 200, f"Delete prompt workflow expected 200, got {resp_delete_prompt.status_code}"
        json_del_prompt = resp_delete_prompt.json()
        assert json_del_prompt.get("ok") is True, "Delete prompt workflow response 'ok' not True"

        resp_delete_steps = delete_workflow(workflow_id_steps)
        assert resp_delete_steps.status_code == 200, f"Delete steps workflow expected 200, got {resp_delete_steps.status_code}"
        json_del_steps = resp_delete_steps.json()
        assert json_del_steps.get("ok") is True, "Delete steps workflow response 'ok' not True"
    except Exception:
        # In case delete fails, ignore here but re-raise for visibility
        raise
    # No resource cleanup needed here because workflows were deleted


test_post_api_workflows_create_list_run_and_delete()