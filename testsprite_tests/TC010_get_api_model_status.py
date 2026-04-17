import requests

BASE_URL = "http://localhost:3000"
EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"
TIMEOUT = 30

def test_get_api_model_status():
    # No auth required for this endpoint per PRD
    url = f"{BASE_URL}/api/model/status"

    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    assert "models" in data, "'models' key not in response JSON"
    assert isinstance(data["models"], dict), "'models' should be an object/dictionary"

    assert "active" in data, "'active' key not in response JSON"
    assert isinstance(data["active"], str), "'active' should be a string"

    # models object should have at least one provider key (optional check)
    assert len(data["models"]) > 0, "'models' object is empty"

test_get_api_model_status()