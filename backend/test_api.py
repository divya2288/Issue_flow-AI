import requests

url = "http://127.0.0.1:5000/api/issues"

issue = {
    "title": "VPN connection issue",
    "description": "VPN disconnects frequently while accessing internal applications.",
    "reporter": "Ragul",
    "department": "IT",
    "category": "Network",
    "priority": "High",
}

response = requests.post(url, json=issue)

print(response.status_code)
print(response.json())
