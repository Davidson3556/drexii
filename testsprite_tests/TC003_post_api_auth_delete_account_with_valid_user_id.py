import requests

def test_post_api_auth_delete_account_with_valid_user_id():
    base_url = "http://localhost:3000"
    url = f"{base_url}/api/auth/delete-account"
    fake_user_id = "fake-user-id-for-testing-12345"
    headers = {
        "x-user-id": fake_user_id,
        "Content-Type": "application/json"
    }
    # Body can include userId or rely on header, test using header here
    body = {}

    try:
        response = requests.post(url, headers=headers, json=body, timeout=30)
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        json_data = response.json()
        assert "success" in json_data, "Response missing 'success' key"
        assert json_data["success"] is True, "Expected success to be True"
        assert "message" in json_data and isinstance(json_data["message"], str) and len(json_data["message"]) > 0, "Response missing confirmation message"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_api_auth_delete_account_with_valid_user_id()