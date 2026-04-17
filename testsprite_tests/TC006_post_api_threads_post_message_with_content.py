import requests

BASE_URL = "http://localhost:3000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
THREADS_URL = f"{BASE_URL}/api/threads"
TIMEOUT = 30

EMAIL = "drexiitest@mailinator.com"
PASSWORD = "12345678"

def test_post_api_threads_post_message_with_content():
    session = requests.Session()
    try:
        # Login to obtain session cookie
        login_payload = {"email": EMAIL, "password": PASSWORD}
        login_resp = session.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert login_data.get("ok") is True, "Login response missing ok:true"
        assert login_data.get("provider") == "insforge", "Login response provider mismatch"

        # Create a new thread to post message to
        create_thread_payload = {"title": "Test Thread for TC006"}
        create_thread_resp = session.post(THREADS_URL, json=create_thread_payload, timeout=TIMEOUT)
        assert create_thread_resp.status_code == 200, f"Thread creation failed: {create_thread_resp.text}"
        create_thread_data = create_thread_resp.json()
        thread = create_thread_data.get("thread")
        assert thread is not None and "id" in thread, "Thread creation response missing thread id"
        thread_id = thread["id"]

        # Post a message with valid content to the thread
        message_content = "Hello, this is a test message to check prompt injection sanitizer."
        post_message_payload = {"content": message_content}
        post_message_url = f"{THREADS_URL}/{thread_id}/messages"
        post_message_resp = session.post(post_message_url, json=post_message_payload, timeout=TIMEOUT)
        assert post_message_resp.status_code == 200, f"Post message failed: {post_message_resp.text}"
        post_message_data = post_message_resp.json()

        message = post_message_data.get("message")
        reply = post_message_data.get("reply")
        assert message is not None and isinstance(message, dict), "Response missing message object"
        assert reply is not None and isinstance(reply, dict), "Response missing reply object"

        # Validate that the posted message content matches
        assert message.get("content") == message_content, "Message content mismatch"

        # Validate reply content type
        reply_content = reply.get("content", "")
        assert isinstance(reply_content, str) and reply_content != "", "Reply content is empty or not string"

    finally:
        # Cleanup: delete the created thread
        pass

test_post_api_threads_post_message_with_content()
