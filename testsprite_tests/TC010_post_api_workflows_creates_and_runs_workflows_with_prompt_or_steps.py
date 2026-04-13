import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def test_tc010_post_api_workflows_creates_and_runs_workflows_with_prompt_or_steps():
    headers = {"Content-Type": "application/json"}
    created_workflows = []

    def create_workflow(data):
        resp = requests.post(f"{BASE_URL}/api/workflows", json=data, headers=headers, timeout=TIMEOUT)
        return resp

    def delete_workflow(wid):
        requests.delete(f"{BASE_URL}/api/workflows/{wid}", headers=headers, timeout=TIMEOUT)

    # 1. Test POST /api/workflows with name and prompt returns 200 with workflow
    workflow_data_prompt = {
        "name": "Test Workflow with Prompt",
        "prompt": "This is a simple prompt."
    }
    resp_prompt = create_workflow(workflow_data_prompt)
    assert resp_prompt.status_code == 200, f"Expected 200, got {resp_prompt.status_code}"
    workflow_prompt = resp_prompt.json().get("workflow")
    assert workflow_prompt is not None, "Response missing workflow"
    wid_prompt = workflow_prompt.get("id")
    assert wid_prompt, "Workflow missing id"
    created_workflows.append(wid_prompt)

    # 2. Test POST /api/workflows with name and steps[] returns 200 with workflow
    workflow_data_steps = {
        "name": "Test Workflow with Steps",
        "steps": [
            {"title": "Step 1", "instruction": "Do step 1"},
            {"title": "Step 2", "instruction": "Do step 2"}
        ]
    }
    resp_steps = create_workflow(workflow_data_steps)
    assert resp_steps.status_code == 200, f"Expected 200, got {resp_steps.status_code}"
    workflow_steps = resp_steps.json().get("workflow")
    assert workflow_steps is not None, "Response missing workflow"
    wid_steps = workflow_steps.get("id")
    assert wid_steps, "Workflow missing id"
    created_workflows.append(wid_steps)

    # 3. Test POST /api/workflows missing name returns 400 error
    workflow_missing_name = {
        "prompt": "Prompt without a name"
    }
    resp_missing_name = create_workflow(workflow_missing_name)
    assert resp_missing_name.status_code == 400, f"Expected 400 on missing name, got {resp_missing_name.status_code}"

    # 4. Test POST /api/workflows missing prompt and steps returns 400 error
    workflow_missing_prompt_steps = {
        "name": "Missing prompt and steps"
    }
    resp_missing_both = create_workflow(workflow_missing_prompt_steps)
    assert resp_missing_both.status_code == 400, f"Expected 400 on missing prompt/steps, got {resp_missing_both.status_code}"

    # 5. Test POST /api/workflows/:id/run returns 200 with result string using workflow created with prompt
    try:
        run_resp_prompt = requests.post(
            f"{BASE_URL}/api/workflows/{wid_prompt}/run",
            headers=headers,
            timeout=TIMEOUT
        )
        assert run_resp_prompt.status_code == 200, f"Expected 200 on run prompt workflow, got {run_resp_prompt.status_code}"
        result_prompt = run_resp_prompt.json().get("result")
        assert isinstance(result_prompt, str), "Result expected to be a string"
    except Exception:
        raise
    finally:
        # Clean up
        for wid in created_workflows:
            try:
                delete_workflow(wid)
            except Exception:
                pass

    # Additionally test running workflow created with steps
    # Create again for a clean test and cleanup separately
    resp_steps_cleanup = create_workflow(workflow_data_steps)
    assert resp_steps_cleanup.status_code == 200, f"Expected 200, got {resp_steps_cleanup.status_code}"
    workflow_steps_cleanup = resp_steps_cleanup.json().get("workflow")
    wid_steps_cleanup = workflow_steps_cleanup.get("id")
    assert wid_steps_cleanup, "Workflow missing id"
    try:
        run_resp_steps = requests.post(
            f"{BASE_URL}/api/workflows/{wid_steps_cleanup}/run",
            headers=headers,
            timeout=TIMEOUT
        )
        assert run_resp_steps.status_code == 200, f"Expected 200 on run steps workflow, got {run_resp_steps.status_code}"
        result_steps = run_resp_steps.json().get("result")
        assert isinstance(result_steps, str), "Result expected to be a string"
    finally:
        try:
            delete_workflow(wid_steps_cleanup)
        except Exception:
            pass


test_tc010_post_api_workflows_creates_and_runs_workflows_with_prompt_or_steps()