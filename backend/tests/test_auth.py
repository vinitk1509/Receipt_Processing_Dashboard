import uuid
import pytest


def test_user_registration_and_login(client):
    suffix = uuid.uuid4().hex[:6]
    email = f"test.user.{suffix}@example.com"
    password = "SecurePassword123"

    # 1. Register a new user
    res = client.post("/api/auth/register", json={
        "fullName": "Test User",
        "email": email,
        "password": password,
        "confirmPassword": password
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == email
    assert data["user"]["role"] == "USER"
    assert data["user"]["initials"] == "TU"

    # 2. Duplicate registration should return 409 Conflict
    dup_res = client.post("/api/auth/register", json={
        "fullName": "Test User Duplicate",
        "email": email,
        "password": password,
        "confirmPassword": password
    })
    assert dup_res.status_code == 409

    # 3. Invalid password login
    bad_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "WrongPassword"
    })
    assert bad_login.status_code == 401

    # 4. Successful login
    good_login = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert good_login.status_code == 200
    token = good_login.json()["access_token"]

    # 5. Access /api/auth/me without token -> 401
    me_unauth = client.get("/api/auth/me")
    assert me_unauth.status_code == 401

    # 6. Access /api/auth/me with valid Bearer token -> 200
    me_auth = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_auth.status_code == 200
    assert me_auth.json()["email"] == email
