import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def test_post_memory_create_update_delete_and_get_memories():
    headers = {}
    memory_id = None

    try:
        # 1. POST /api/memory to create a memory entry
        create_payload = {
            "content": "Likes dark chocolate",
            "category": "preference"
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/memory",
            json=create_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 200, f"Expected 200, got {create_resp.status_code}"
        create_data = create_resp.json()
        assert create_data.get("ok") is True
        assert "id" in create_data
        assert create_data.get("category") == "preference"
        assert create_data.get("content") == "Likes dark chocolate"
        assert "createdAt" in create_data
        memory_id = create_data["id"]

        # 2. GET /api/memory to list memories and check the created memory is present
        get_resp = requests.get(f"{BASE_URL}/api/memory", timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Expected 200, got {get_resp.status_code}"
        get_data = get_resp.json()
        assert "memories" in get_data and isinstance(get_data["memories"], list)
        assert "count" in get_data and isinstance(get_data["count"], int)
        found = False
        for mem in get_data["memories"]:
            if mem.get("id") == memory_id:
                found = True
                assert mem.get("content") == "Likes dark chocolate"
                assert mem.get("category") == "preference"
                break
        assert found, "Created memory entry not found in list"

        # 3. GET /api/memory?q=nonexistent to search memories with no match, expect empty array
        search_resp = requests.get(f"{BASE_URL}/api/memory?q=nonexistent", timeout=TIMEOUT)
        assert search_resp.status_code == 200, f"Expected 200, got {search_resp.status_code}"
        search_data = search_resp.json()
        assert "memories" in search_data and isinstance(search_data["memories"], list)
        assert len(search_data["memories"]) == 0
        assert search_data.get("count") == 0

        # 4. PATCH /api/memory/:id to update the memory content and category
        update_payload = {
            "content": "Prefers dark chocolate",
            "category": "fact"
        }
        patch_resp = requests.patch(
            f"{BASE_URL}/api/memory/{memory_id}",
            json=update_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert patch_resp.status_code == 200, f"Expected 200, got {patch_resp.status_code}"
        patch_data = patch_resp.json()
        assert patch_data.get("ok") is True
        updated_memory = patch_data.get("memory")
        assert updated_memory is not None
        assert updated_memory.get("id") == memory_id
        assert updated_memory.get("content") == "Prefers dark chocolate"
        assert updated_memory.get("category") == "fact"

        # 5. DELETE /api/memory/:id to delete the memory entry
        delete_resp = requests.delete(
            f"{BASE_URL}/api/memory/{memory_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert delete_resp.status_code == 200, f"Expected 200, got {delete_resp.status_code}"
        delete_data = delete_resp.json()
        assert delete_data.get("ok") is True

        memory_id = None  # mark as deleted

        # 6. GET /api/memory to check memory is deleted, should not find the deleted id
        get_after_del_resp = requests.get(f"{BASE_URL}/api/memory", timeout=TIMEOUT)
        assert get_after_del_resp.status_code == 200, f"Expected 200, got {get_after_del_resp.status_code}"
        get_after_del_data = get_after_del_resp.json()
        ids_after_delete = [m.get("id") for m in get_after_del_data.get("memories", [])]
        assert memory_id not in ids_after_delete

    finally:
        # Cleanup: delete memory if test failed before delete step
        if memory_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/memory/{memory_id}",
                    headers=headers,
                    timeout=TIMEOUT
                )
            except Exception:
                pass


test_post_memory_create_update_delete_and_get_memories()