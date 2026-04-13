import requests

BASE_URL = "http://localhost:3000"
LOGOUT_ENDPOINT = "/api/auth/logout"
TIMEOUT = 30

def test_post_api_auth_logout_returns_success():
    url = BASE_URL + LOGOUT_ENDPOINT
    try:
        response = requests.post(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed with exception: {e}"
    
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    
    assert isinstance(json_data, dict), "Response JSON is not a dictionary"
    assert "success" in json_data, "'success' key not found in response JSON"
    assert json_data["success"] is True, f"Expected 'success' to be True, got {json_data['success']}"

test_post_api_auth_logout_returns_success()