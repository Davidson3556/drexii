import requests

def test_post_api_auth_login_with_invalid_credentials():
    url = "http://localhost:3000/api/auth/login"
    headers = {"Content-Type": "application/json"}

    # Case 1: Whitespace-only email — caught by input validation before reaching auth provider.
    # The endpoint trims the email; an empty/whitespace value is treated as missing input (400),
    # not as wrong credentials (401). This is the correct and documented behavior.
    payload_whitespace = {"email": "   ", "password": "12345678"}
    resp_whitespace = requests.post(url, json=payload_whitespace, headers=headers, timeout=30)
    assert resp_whitespace.status_code == 400, (
        f"Expected 400 for whitespace-only email (missing input), got {resp_whitespace.status_code}"
    )

    # Case 2: Well-formed email with wrong password → auth provider returns 401
    payload_wrong = {"email": "notauser@example.com", "password": "wrongpassword"}
    resp_wrong = requests.post(url, json=payload_wrong, headers=headers, timeout=30)
    assert resp_wrong.status_code == 401, (
        f"Expected 401 for wrong credentials, got {resp_wrong.status_code}"
    )

test_post_api_auth_login_with_invalid_credentials()
