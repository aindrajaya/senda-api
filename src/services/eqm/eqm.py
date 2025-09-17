import requests

proxy_ip = "156.253.131.3"
proxy_port = 2333
proxy_username = "1arista"
proxy_password = "arista1"

proxies = {
    'http': f'http://{proxy_username}:{proxy_password}@{proxy_ip}:{proxy_port}',
    'https': f'http://{proxy_username}:{proxy_password}@{proxy_ip}:{proxy_port}'
}

headers = {
    'Authorization': "ApiKey d5cf7ede-92a5-4800-a4b3-ee6ed32a1852",  # make sure this is a valid token
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

print("\n=== Testing Equals Money API ===")
try:
    response = requests.get(
        'https://api-sandbox.equalsmoney.com/v2/ipaddresses',
        headers=headers,
        proxies=proxies,
        timeout=30,
        verify=False   # for testing through proxy
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request test failed: {e}")