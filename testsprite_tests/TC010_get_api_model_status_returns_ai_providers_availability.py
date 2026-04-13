import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_api_model_status_returns_ai_providers_availability():
    url = f"{BASE_URL}/api/model/status"
    try:
        response = requests.get(url, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    json_data = response.json()
    assert "models" in json_data, "Response JSON missing 'models' key"
    models = json_data["models"]
    assert isinstance(models, list), "'models' should be a list"

    assert len(models) > 0, "Models array should not be empty"

    for model in models:
        assert isinstance(model, dict), "Each model entry should be a dictionary"
        assert "provider" in model, "Model entry missing 'provider' key"
        assert isinstance(model["provider"], str), "'provider' should be a string"
        assert "status" in model, "Model entry missing 'status' key"
        assert isinstance(model["status"], str), "'status' should be a string"
        # status can be 'available', 'unavailable', or others, so no fixed assertion on value
        assert model["status"], "'status' should not be empty"

if __name__ != "__main__":
    test_get_api_model_status_returns_ai_providers_availability()

test_get_api_model_status_returns_ai_providers_availability()