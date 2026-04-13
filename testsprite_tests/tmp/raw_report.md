
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** drexii
- **Date:** 2026-04-12
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 post api auth login with valid and invalid credentials
- **Test Code:** [TC001_post_api_auth_login_with_valid_and_invalid_credentials.py](./TC001_post_api_auth_login_with_valid_and_invalid_credentials.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 88, in <module>
  File "<string>", line 18, in test_post_api_auth_login_with_valid_and_invalid_credentials
AssertionError: Expected 200 for valid credentials, got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/97fd4c3c-0748-47a1-ad3f-34d7cbcc2b6a/17aa296d-0ed7-4231-bda7-de673201192d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 post api auth logout returns success
- **Test Code:** [TC002_post_api_auth_logout_returns_success.py](./TC002_post_api_auth_logout_returns_success.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/97fd4c3c-0748-47a1-ad3f-34d7cbcc2b6a/1d189398-af28-4ce8-80a9-adbc311dd482
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 get api auth check returns authenticated user or null
- **Test Code:** [TC003_get_api_auth_check_returns_authenticated_user_or_null.py](./TC003_get_api_auth_check_returns_authenticated_user_or_null.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/97fd4c3c-0748-47a1-ad3f-34d7cbcc2b6a/534af15b-4165-40a8-a5dd-17e18fe9bbd8
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 post api auth delete account with and without user id
- **Test Code:** [TC004_post_api_auth_delete_account_with_and_without_user_id.py](./TC004_post_api_auth_delete_account_with_and_without_user_id.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 119, in <module>
  File "<string>", line 22, in test_post_api_auth_delete_account_with_and_without_user_id
AssertionError: Admin login failed: {
  "error": true,
  "url": "http://localhost:3000/api/auth/login",
  "statusCode": 401,
  "statusMessage": "Server Error",
  "message": "Invalid credentials",
  "stack": [
    "Invalid credentials",
    "at createError (/Users/user/Documents/drexii/node_modules/h3/dist/index.mjs:71:15)",
    "at Object.handler (/Users/user/Documents/drexii/server/api/auth/login.post.ts:18:1)",
    "at process.processTicksAndRejections (node:internal/process/task_queues:104:5)",
    "at async file:///Users/user/Documents/drexii/node_modules/h3/dist/index.mjs:2011:19)",
    "at async Object.callAsync (/Users/user/Documents/drexii/node_modules/unctx/dist/index.mjs:72:16)",
    "at async Server.toNodeHandle (/Users/user/Documents/drexii/node_modules/h3/dist/index.mjs:2303:7)"
  ]
}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/97fd4c3c-0748-47a1-ad3f-34d7cbcc2b6a/a56da597-f8fc-4738-87d3-a71b8e36c222
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 post api threads create and post messages with sanitization
- **Test Code:** [TC005_post_api_threads_create_and_post_messages_with_sanitization.py](./TC005_post_api_threads_create_and_post_messages_with_sanitization.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 112, in <module>
  File "<string>", line 81, in test_post_api_threads_create_and_post_messages_with_sanitization
AssertionError: AI reply content is empty

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/97fd4c3c-0748-47a1-ad3f-34d7cbcc2b6a/e2c4ee24-1496-4779-acf2-fcf3260cc3c7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 get api threads id returns thread and messages or 404
- **Test Code:** [TC006_get_api_threads_id_returns_thread_and_messages_or_404.py](./TC006_get_api_threads_id_returns_thread_and_messages_or_404.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/97fd4c3c-0748-47a1-ad3f-34d7cbcc2b6a/2633106c-af20-4848-8abe-cf5004b91e51
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 post api automations create list toggle delete and process
- **Test Code:** [TC007_post_api_automations_create_list_toggle_delete_and_process.py](./TC007_post_api_automations_create_list_toggle_delete_and_process.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/lang/lib/python3.12/site-packages/urllib3/connectionpool.py", line 534, in _make_request
    response = conn.getresponse()
               ^^^^^^^^^^^^^^^^^^
  File "/var/lang/lib/python3.12/site-packages/urllib3/connection.py", line 571, in getresponse
    httplib_response = super().getresponse()
                       ^^^^^^^^^^^^^^^^^^^^^
  File "/var/lang/lib/python3.12/http/client.py", line 1430, in getresponse
    response.begin()
  File "/var/lang/lib/python3.12/http/client.py", line 331, in begin
    version, status, reason = self._read_status()
                              ^^^^^^^^^^^^^^^^^^^
  File "/var/lang/lib/python3.12/http/client.py", line 292, in _read_status
    line = str(self.fp.readline(_MAXLINE + 1), "iso-8859-1")
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/lang/lib/python3.12/socket.py", line 720, in readinto
    return self._sock.recv_into(b)
           ^^^^^^^^^^^^^^^^^^^^^^^
TimeoutError: timed out

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/var/lang/lib/python3.12/site-packages/requests/adapters.py", line 667, in send
    resp = conn.urlopen(
           ^^^^^^^^^^^^^
  File "/var/lang/lib/python3.12/site-packages/urllib3/connectionpool.py", line 841, in urlopen
    retries = retries.increment(
              ^^^^^^^^^^^^^^^^^^
  File "/var/lang/lib/python3.12/site-packages/urllib3/util/retry.py", line 490, in increment
    raise reraise(type(error), error, _stacktrace)
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/lang/lib/python3.12/site-packages/urllib3/util/util.py", line 39, in reraise
    raise value
  File "/var/lang/lib/python3.12/site-packages/urllib3/connectionpool.py", line 787, in urlopen
    response = self._make_request(
               ^^^^^^^^^^^^^^^^^^^
  File "/var/lang/lib/python3.12/site-packages/urllib3/connectionpool.py", line 536, in _make_request
    self._raise_timeout(err=e, url=url, timeout_value=read_timeout)
  File "/var/lang/lib/python3.12/site-packages/urllib3/connectionpool.py", line 367, in _raise_timeout
    raise ReadTimeoutError(
urllib3.exceptions.ReadTimeoutError: HTTPConnectionPool(host='tun.testsprite.com', port=8080): Read timed out. (read timeout=30)

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "<string>", line 71, in test_post_api_automations_create_list_toggle_delete_and_process
  File "/var/lang/lib/python3.12/site-packages/requests/api.py", line 115, in post
    return request("post", url, data=data, json=json, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/lang/lib/python3.12/site-packages/requests/api.py", line 59, in request
    return session.request(method=method, url=url, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/lang/lib/python3.12/site-packages/requests/sessions.py", line 589, in request
    resp = self.send(prep, **send_kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/lang/lib/python3.12/site-packages/requests/sessions.py", line 703, in send
    r = adapter.send(request, **kwargs)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/lang/lib/python3.12/site-packages/requests/adapters.py", line 713, in send
    raise ReadTimeout(e, request=request)
requests.exceptions.ReadTimeout: HTTPConnectionPool(host='tun.testsprite.com', port=8080): Read timed out. (read timeout=30)

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 106, in <module>
  File "<string>", line 102, in test_post_api_automations_create_list_toggle_delete_and_process
AssertionError: Expected 200 on delete, got 401

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/97fd4c3c-0748-47a1-ad3f-34d7cbcc2b6a/51902fbc-6460-4039-84b1-c3125742189f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 post api workflows create list run and delete
- **Test Code:** [TC008_post_api_workflows_create_list_run_and_delete.py](./TC008_post_api_workflows_create_list_run_and_delete.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 106, in <module>
  File "<string>", line 77, in test_post_api_workflows_create_list_run_and_delete
AssertionError: Run response missing 'result'

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/97fd4c3c-0748-47a1-ad3f-34d7cbcc2b6a/574f3f08-a8a3-4bd0-bc33-7ee77e4e5244
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 post api user integrations add update list test and delete
- **Test Code:** [TC009_post_api_user_integrations_add_update_list_test_and_delete.py](./TC009_post_api_user_integrations_add_update_list_test_and_delete.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 139, in <module>
  File "<string>", line 104, in test_post_api_user_integrations_add_update_list_test_and_delete
AssertionError

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/97fd4c3c-0748-47a1-ad3f-34d7cbcc2b6a/879eebae-a1f3-419a-b0ad-24c80f3dbad0
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 get api model status returns ai providers availability
- **Test Code:** [TC010_get_api_model_status_returns_ai_providers_availability.py](./TC010_get_api_model_status_returns_ai_providers_availability.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 33, in <module>
  File "<string>", line 17, in test_get_api_model_status_returns_ai_providers_availability
AssertionError: Response JSON missing 'models' key

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/97fd4c3c-0748-47a1-ad3f-34d7cbcc2b6a/8a6b35d8-2a7b-41dd-bbfc-46fcc76a525f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **30.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---