import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

# NOTE: Replace these with valid credentials for authentication
AUTH_CREDENTIALS = {
    "username": "testuser",
    "password": "testpassword"
}

def authenticate():
    """Authenticate and return the session token"""
    login_url = f"{BASE_URL}/api/auth/login"
    resp = requests.post(login_url, json=AUTH_CREDENTIALS, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Login failed with status {resp.status_code}"
    data = resp.json()
    assert data.get("success") is True, "Login success flag missing/false"
    # Assuming cookie-based session here
    session_cookies = resp.cookies
    return session_cookies

def test_post_api_memory_create_update_delete_entries():
    session_cookies = authenticate()
    headers = {}  # no specific headers needed other than cookies

    memory_url = f"{BASE_URL}/api/memory"

    # 1. Create memory entry via POST /api/memory
    create_payload = {
        "content": "Initial memory content for testing."
    }
    create_resp = requests.post(memory_url, json=create_payload, cookies=session_cookies, timeout=TIMEOUT)
    assert create_resp.status_code == 200, f"Memory creation failed: {create_resp.status_code}"
    created_entry = create_resp.json()
    assert "content" in created_entry and created_entry["content"] == create_payload["content"], "Created content mismatch"
    # Try to get id field from possible keys
    memory_id = created_entry.get("id") or created_entry.get("_id")
    assert memory_id is not None, f"Missing memory ID in response, got keys: {list(created_entry.keys())}"

    try:
        # 2. Update memory entry via PATCH /api/memory/:id
        update_url = f"{memory_url}/{memory_id}"
        update_payload = {
            "content": "Updated memory content for testing."
        }
        patch_resp = requests.patch(update_url, json=update_payload, cookies=session_cookies, timeout=TIMEOUT)
        assert patch_resp.status_code == 200, f"Memory update failed: {patch_resp.status_code}"
        updated_entry = patch_resp.json()
        assert "content" in updated_entry and updated_entry["content"] == update_payload["content"], "Updated content mismatch"
        updated_id = updated_entry.get("id") or updated_entry.get("_id")
        assert updated_id == memory_id, "Updated memory ID mismatch"

    finally:
        # 3. Delete memory entry via DELETE /api/memory/:id
        delete_url = f"{memory_url}/{memory_id}"
        delete_resp = requests.delete(delete_url, cookies=session_cookies, timeout=TIMEOUT)
        assert delete_resp.status_code == 200, f"Memory deletion failed: {delete_resp.status_code}"
        delete_data = delete_resp.json()
        assert delete_data.get("success") is True, "Memory deletion success flag missing/false"

        # Verify deletion by attempting to GET all memories and ensuring deleted memory not present
        get_resp = requests.get(memory_url, cookies=session_cookies, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Get memories failed after deletion: {get_resp.status_code}"
        memories = get_resp.json()
        assert isinstance(memories, list), "Memories response is not a list"
        # Check the deleted memory ID is not in the list
        ids = [m.get("id") or m.get("_id") for m in memories]
        assert memory_id not in ids, "Deleted memory ID still present in memory list"


test_post_api_memory_create_update_delete_entries()
