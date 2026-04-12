import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
AUTH_EMAIL = "testuser@example.com"
AUTH_PASSWORD = "testpassword"

def test_postapiworkflowscreateandrunwithtoolcalls():
    session = requests.Session()
    try:
        # Authenticate to get session token (Assuming token-based auth via cookies or header)
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": AUTH_EMAIL, "password": AUTH_PASSWORD},
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_json = login_resp.json()
        assert login_json.get("success") is True, "Login response missing success=true"
        # Session cookie or token is managed by session object if cookie-based

        # Prepare workflow creation payload with steps including tool schemas
        workflow_payload = {
            "name": "Test Workflow with Tool Calls",
            "steps": [
                {
                    "name": "Step 1",
                    "type": "tool",
                    "tool": {
                        "name": "myTool",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "key": {"type": "string"}
                            },
                            "required": ["key"]
                        }
                    },
                    "input": {"key": "value1"}
                },
                {
                    "name": "Step 2",
                    "type": "tool",
                    "tool": {
                        "name": "anotherTool",
                        "schema": {
                            "type": "object",
                            "properties": {
                                "param": {"type": "string"}
                            },
                            "required": ["param"]
                        }
                    },
                    "input": {"param": "value2"}
                }
            ]
        }

        # Create the workflow
        create_resp = session.post(
            f"{BASE_URL}/api/workflows",
            json=workflow_payload,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code == 200, f"Workflow creation failed: {create_resp.text}"
        workflow = create_resp.json()
        assert "id" in workflow, "Created workflow missing id"
        workflow_id = workflow["id"]

        # Run the created workflow
        run_resp = session.post(
            f"{BASE_URL}/api/workflows/{workflow_id}/run",
            timeout=TIMEOUT,
        )
        assert run_resp.status_code == 200, f"Workflow run failed: {run_resp.text}"
        run_result = run_resp.json()

        # Validate that run result contains step outputs and status
        assert "stepOutputs" in run_result or "steps" in run_result, "Run result missing step outputs"
        assert "status" in run_result, "Run result missing status"
        # Check aggregated run results include executed tool calls details
        steps_result = run_result.get("stepOutputs") or run_result.get("steps")

        assert isinstance(steps_result, (list, dict)), "Invalid step outputs format"

        # Basic check: at least one step output has execution results
        found_tool_call = False
        if isinstance(steps_result, list):
            for step in steps_result:
                if isinstance(step, dict) and "output" in step:
                    found_tool_call = True
                    break
        elif isinstance(steps_result, dict):
            # If steps_result is a dict keyed by step ids or names
            for key in steps_result:
                step = steps_result[key]
                if isinstance(step, dict) and "output" in step:
                    found_tool_call = True
                    break

        assert found_tool_call, "No tool call outputs found in run results"

    finally:
        # Cleanup: delete the workflow created if it exists
        if 'workflow_id' in locals():
            del_resp = session.delete(
                f"{BASE_URL}/api/workflows/{workflow_id}",
                timeout=TIMEOUT,
            )
            # Accept 200 success or 404 if already deleted
            assert del_resp.status_code in (200, 404), f"Failed to delete workflow: {del_resp.text}"

test_postapiworkflowscreateandrunwithtoolcalls()
