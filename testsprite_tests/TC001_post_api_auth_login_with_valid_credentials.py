import requests

def test_post_api_auth_login_with_valid_credentials():
    url = "http://localhost:3000/api/auth/login"
    payload = {
        "email": "drexiitest@mailinator.com",
        "password": "12345678"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
    json_resp = response.json()
    assert isinstance(json_resp, dict), "Response is not a JSON object"
    assert json_resp.get("ok") is True, "Response 'ok' field is not True"
    assert json_resp.get("provider") == "insforge", f"Response 'provider' field is not 'insforge' but {json_resp.get('provider')}"

test_post_api_auth_login_with_valid_credentials()