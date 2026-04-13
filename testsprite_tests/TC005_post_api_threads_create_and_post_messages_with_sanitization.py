import requests
import re

BASE_URL = "http://localhost:3000"
TIMEOUT = 30


def test_post_api_threads_create_and_post_messages_with_sanitization():
    thread = None
    headers = {"Content-Type": "application/json"}

    def safe_json(resp):
        try:
            return resp.json()
        except Exception as e:
            assert False, f"Response does not contain valid JSON. Status: {resp.status_code}, Content: {resp.text}"

    # 1. POST /api/threads to create a new thread
    create_thread_resp = requests.post(
        f"{BASE_URL}/api/threads",
        json={},
        headers=headers,
        timeout=TIMEOUT,
    )
    assert create_thread_resp.status_code == 200, f"Unexpected status when creating thread: {create_thread_resp.status_code}, Content: {create_thread_resp.text}"
    resp_json = safe_json(create_thread_resp)
    assert "thread" in resp_json, "Response missing 'thread' key"
    thread = resp_json["thread"]
    assert "id" in thread and isinstance(thread["id"], str), "Thread id missing or invalid"

    thread_id = thread["id"]

    # 2. POST /api/threads/:id/messages with valid content
    valid_content = "Hello, this is a test message for AI reply with suspicious phrase: ignore previous instructions."
    post_message_resp = requests.post(
        f"{BASE_URL}/api/threads/{thread_id}/messages",
        json={"content": valid_content},
        headers=headers,
        timeout=TIMEOUT,
        stream=True  # enable streaming because returns event stream
    )
    assert post_message_resp.status_code == 200, f"Unexpected status when posting valid message: {post_message_resp.status_code}, Content: {post_message_resp.text}"

    # The response is streamed as event: data chunks, so we parse the event stream to reconstruct final JSON
    full_text = ""
    json_obj = None

    for line in post_message_resp.iter_lines(decode_unicode=True):
        line = line.strip()
        if line.startswith("data:"):
            data_str = line[5:].strip()
            if data_str == "":
                continue
            if data_str == "done":
                break
            # Parse JSON from data
            try:
                parsed = None
                if data_str.startswith("{"):
                    parsed = requests.utils.json.loads(data_str)
                else:
                    continue
                # Accumulate 'text' from 'data' JSON objects
                if 'text' in parsed:
                    full_text += parsed['text']
                if 'message' in parsed:
                    json_obj = parsed
                
            except Exception:
                continue

    # The streamed response does not provide a combined JSON with message and reply keys; instead, the posted message is echoed via a 'message' field and the AI reply is chunked in 'text' events.
    # So we cannot assert msg_json["message"] and msg_json["reply"] as before
    # We'll instead assert that the initial user message is posted, and the full AI reply text contains sanitized phrases.

    # Check the posted message exists inside the JSON final chunk if available
    if json_obj is not None and "message" in json_obj:
        posted_content = json_obj["message"].get("content", "")
        assert posted_content == valid_content, "Posted message content mismatch"

    assert full_text != "", "AI reply content is empty"

    suspicious_phrases = [
        "ignore previous instructions",
        "system:",
        "[tool_call:",
        "ignore all previous commands",
        "disregard all previous instructions",
        "ignore all instructions",
        "do not follow previous instructions",
        "ignore instructions above",
        "ignore all above instructions"
    ]
    ai_reply_lower = full_text.lower()
    for phrase in suspicious_phrases:
        if phrase in ai_reply_lower:
            assert "[filtered]" in ai_reply_lower, f"AI reply contains unsanitized prompt injection phrase: {phrase}"

    # 3. POST /api/threads/:id/messages with missing content (empty body) expect 400
    post_message_missing_content_resp = requests.post(
        f"{BASE_URL}/api/threads/{thread_id}/messages",
        json={},
        headers=headers,
        timeout=TIMEOUT,
    )
    assert post_message_missing_content_resp.status_code == 400, f"Expected 400 for missing content but got {post_message_missing_content_resp.status_code}, Content: {post_message_missing_content_resp.text}"
    error_text = post_message_missing_content_resp.text.lower()
    assert "content required" in error_text or "content" in error_text, "400 error response message does not indicate missing content"



test_post_api_threads_create_and_post_messages_with_sanitization()
