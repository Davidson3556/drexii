import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def test_post_api_workflows_create_and_run_workflow():
    session = requests.Session()
    try:
        # Create a new workflow with name and steps array
        workflow_payload = {
            "name": "Test Workflow from TC010",
            "steps": [
                {
                    "title": "Step 1",
                    "instruction": "Do something important."
                },
                {
                    "title": "Step 2",
                    "instruction": "Do something else important."
                }
            ]
        }
        headers = {"x-user-id": "test-user-id"}
        create_response = session.post(
            f"{BASE_URL}/api/workflows",
            json=workflow_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert create_response.status_code == 200, f"Workflow creation failed: {create_response.text}"
        create_json = create_response.json()
        workflow = create_json.get("workflow")
        assert workflow is not None, "No workflow returned in creation response"
        workflow_id = workflow.get("id") or workflow.get("_id") or workflow.get("workflowId")  # tolerate possible keys
        assert workflow_id, "Workflow ID missing in creation response"

        # Run the created workflow by ID
        run_response = session.post(
            f"{BASE_URL}/api/workflows/{workflow_id}/run",
            timeout=TIMEOUT,
        )
        assert run_response.status_code == 200, f"Running workflow failed: {run_response.text}"
        run_json = run_response.json()
        result = run_json.get("result")
        assert isinstance(result, str), "Workflow run result is not a string"

    finally:
        # Clean up by deleting the created workflow
        if 'workflow_id' in locals() and workflow_id:
            delete_response = session.delete(
                f"{BASE_URL}/api/workflows/{workflow_id}",
                timeout=TIMEOUT,
            )
            # Accept 200 response or ignore errors if already deleted
            if delete_response.status_code != 200:
                print(f"Warning: Failed to delete workflow {workflow_id}: {delete_response.text}")


test_post_api_workflows_create_and_run_workflow()
