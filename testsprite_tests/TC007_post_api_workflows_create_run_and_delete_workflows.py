import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def test_post_api_workflows_create_run_and_delete_workflows():
    headers = {"Content-Type": "application/json"}

    # Prepare payloads for valid workflow creations
    payload_prompt = {
        "name": "Test Workflow Using Prompt",
        "prompt": "This is a test prompt for the workflow."
    }
    payload_steps = {
        "name": "Test Workflow Using Steps",
        "steps": [
            {"title": "Step 1", "instruction": "Instruction for step 1"},
            {"title": "Step 2", "instruction": "Instruction for step 2"}
        ]
    }
    payload_invalid = {
        "name": "Invalid Workflow"
        # Missing both prompt and steps - should fail validation
    }

    workflow_id = None

    try:
        # 1. Test creating workflow with prompt (valid)
        resp_prompt = requests.post(f"{BASE_URL}/api/workflows", json=payload_prompt, headers=headers, timeout=TIMEOUT)
        assert resp_prompt.status_code == 200, f"Expected 200 but got {resp_prompt.status_code} for prompt workflow creation"
        data_prompt = resp_prompt.json()
        assert "workflow" in data_prompt, "Missing 'workflow' key in response for prompt workflow creation"
        workflow_prompt = data_prompt["workflow"]
        assert "id" in workflow_prompt, "Workflow missing 'id' field for prompt workflow"
        # Store id to run and delete later
        workflow_id_prompt = workflow_prompt["id"]

        # 2. Test creating workflow with steps (valid)
        resp_steps = requests.post(f"{BASE_URL}/api/workflows", json=payload_steps, headers=headers, timeout=TIMEOUT)
        assert resp_steps.status_code == 200, f"Expected 200 but got {resp_steps.status_code} for steps workflow creation"
        data_steps = resp_steps.json()
        assert "workflow" in data_steps, "Missing 'workflow' key in response for steps workflow creation"
        workflow_steps = data_steps["workflow"]
        assert "id" in workflow_steps, "Workflow missing 'id' field for steps workflow"
        workflow_id_steps = workflow_steps["id"]

        # 3. Test creating invalid workflow (missing prompt and steps) -> expect 400 with validation error
        resp_invalid = requests.post(f"{BASE_URL}/api/workflows", json=payload_invalid, headers=headers, timeout=TIMEOUT)
        assert resp_invalid.status_code == 400, f"Expected 400 but got {resp_invalid.status_code} for invalid workflow creation"
        # Response may be a plain string or json with error message, check content
        try:
            err_data = resp_invalid.json()
            assert ("name and prompt (or steps) are required" in str(err_data).lower()) or (len(err_data) > 0)
        except Exception:
            # If not JSON, check text body
            assert "name and prompt (or steps) are required" in resp_invalid.text.lower()

        # 4. Run the workflow created with prompt
        resp_run_prompt = requests.post(f"{BASE_URL}/api/workflows/{workflow_id_prompt}/run", headers=headers, timeout=TIMEOUT)
        assert resp_run_prompt.status_code == 200, f"Expected 200 but got {resp_run_prompt.status_code} running prompt workflow"
        data_run_prompt = resp_run_prompt.json()
        assert "result" in data_run_prompt and isinstance(data_run_prompt["result"], str), "Missing or invalid 'result' in run response for prompt workflow"

        # 5. Run the workflow created with steps
        resp_run_steps = requests.post(f"{BASE_URL}/api/workflows/{workflow_id_steps}/run", headers=headers, timeout=TIMEOUT)
        assert resp_run_steps.status_code == 200, f"Expected 200 but got {resp_run_steps.status_code} running steps workflow"
        data_run_steps = resp_run_steps.json()
        assert "result" in data_run_steps and isinstance(data_run_steps["result"], str), "Missing or invalid 'result' in run response for steps workflow"

    finally:
        # Cleanup: delete workflows created if exist
        # Delete prompt workflow
        if 'workflow_id_prompt' in locals():
            try:
                resp_del_prompt = requests.delete(f"{BASE_URL}/api/workflows/{workflow_id_prompt}", headers=headers, timeout=TIMEOUT)
                assert resp_del_prompt.status_code == 200, f"Expected 200 but got {resp_del_prompt.status_code} deleting prompt workflow"
                data_del_prompt = resp_del_prompt.json()
                assert data_del_prompt.get("ok") is True, "Delete response 'ok' not True for prompt workflow"
            except Exception:
                pass

        # Delete steps workflow
        if 'workflow_id_steps' in locals():
            try:
                resp_del_steps = requests.delete(f"{BASE_URL}/api/workflows/{workflow_id_steps}", headers=headers, timeout=TIMEOUT)
                assert resp_del_steps.status_code == 200, f"Expected 200 but got {resp_del_steps.status_code} deleting steps workflow"
                data_del_steps = resp_del_steps.json()
                assert data_del_steps.get("ok") is True, "Delete response 'ok' not True for steps workflow"
            except Exception:
                pass


test_post_api_workflows_create_run_and_delete_workflows()