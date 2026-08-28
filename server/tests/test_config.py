def test_config_exposes_default_language(client):
    res = client.get("/config")
    assert res.status_code == 200
    body = res.json()
    assert body["DEFAULT_LANGUAGE"] == "zh-CN"
    assert body["BASE_URL"] == ""
    assert body["ENABLE_EXTERNAL_APIS"] is False
