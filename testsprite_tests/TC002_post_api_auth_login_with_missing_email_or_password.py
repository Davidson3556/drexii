import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT_SECONDS = 30


def test_post_api_auth_login_with_missing_email_or_password():
    url = BASE_URL + LOGIN_ENDPOINT
    headers = {"Content-Type": "application/json"}

    test_payloads = [
        {},  # missing both email and password
        {"email": "drexiitest@mailinator.com"},  # missing password
        {"password": "12345678"},  # missing email
        {"email": "", "password": "12345678"},  # empty email
        {"email": "drexiitest@mailinator.com", "password": ""},  # empty password
        {"email": None, "password": "12345678"},  # null email
        {"email": "drexiitest@mailinator.com", "password": None},  # null password
    ]

    expected_status_code = 400
    expected_error_message = "email and password are required"

    for payload in test_payloads:
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT_SECONDS)
        except requests.RequestException as e:
            assert False, f"Request failed: {e}"

        assert response.status_code == expected_status_code, f"Expected status 400 but got {response.status_code} for payload {payload}"
        # The response content is expected to be the plain error message string 'email and password are required'
        # Server may return json or plain text, so try both.
        content_type = response.headers.get("Content-Type", "")
        if "application/json" in content_type:
            try:
                data = response.json()
                # The PRD states the 400 response returns the error message string directly, so data might be string or object
                if isinstance(data, dict):
                    # Attempt to find error message in a field (just in case)
                    error_values = [v for v in data.values() if isinstance(v, str) and expected_error_message in v.lower()]
                    assert error_values, f"Response JSON does not contain expected error message '{expected_error_message}': {data}"
                else:
                    assert expected_error_message in str(data).lower()
            except Exception:
                # If error parsing json, fallback to text
                assert expected_error_message in response.text.lower(), f"Response text does not contain expected error message '{expected_error_message}': {response.text}"
        else:
            assert expected_error_message in response.text.lower(), f"Response text does not contain expected error message '{expected_error_message}': {response.text}"


test_post_api_auth_login_with_missing_email_or_password()