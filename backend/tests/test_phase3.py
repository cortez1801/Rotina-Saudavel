"""Phase 3 backend tests: news, diary stats, auth protection."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bem-estar-app-20.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@rotina.app", "password": "admin12345"}


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_client(client):
    r = client.post(f"{API}/auth/login", json=ADMIN, timeout=15)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return client


# ------- Auth protection --------
class TestAuthProtection:
    def test_news_requires_auth(self):
        r = requests.get(f"{API}/news", timeout=15)
        assert r.status_code == 401

    def test_diary_stats_requires_auth(self):
        r = requests.get(f"{API}/diary/stats", timeout=15)
        assert r.status_code == 401

    def test_tasks_requires_auth(self):
        r = requests.get(f"{API}/tasks", timeout=15)
        assert r.status_code == 401


# ------- News --------
class TestNews:
    def test_news_returns_three_categories(self, auth_client):
        r = auth_client.get(f"{API}/news", timeout=45)
        assert r.status_code == 200
        data = r.json()
        for cat in ("politics", "economy", "good"):
            assert cat in data, f"Missing category: {cat}"
            assert isinstance(data[cat], list)

    def test_each_category_has_items_and_fields(self, auth_client):
        r = auth_client.get(f"{API}/news", timeout=45)
        data = r.json()
        for cat in ("politics", "economy", "good"):
            items = data[cat]
            assert len(items) >= 3, f"{cat} has only {len(items)} items"
            for item in items[:3]:
                assert item.get("title")
                assert "summary" in item
                assert item.get("source")
                assert item.get("url"), f"{cat} item missing url: {item}"
                assert "published_at" in item
                assert "image" in item

    def test_news_sources_are_real_brazilian(self, auth_client):
        r = auth_client.get(f"{API}/news", timeout=45)
        data = r.json()
        all_sources = set()
        for cat in ("politics", "economy", "good"):
            for it in data[cat]:
                all_sources.add(it.get("source", ""))
        # At least one recognizable Brazilian outlet
        expected = {"G1", "InfoMoney", "CNN", "UOL", "Só Notícia Boa", "Razões", "Catraca"}
        joined = " ".join(all_sources)
        assert any(e in joined for e in expected), f"No recognizable BR sources: {all_sources}"


# ------- Diary stats --------
class TestDiaryStats:
    def test_stats_structure_empty_baseline(self, auth_client):
        r = auth_client.get(f"{API}/diary/stats", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "days" in data and "totals" in data
        assert len(data["days"]) == 7
        for d in data["days"]:
            for k in ("date", "meditation_minutes", "gratitude_count", "reading_count", "entries"):
                assert k in d
        for k in ("total_meditation_minutes", "total_gratitude", "total_reading", "total_entries"):
            assert k in data["totals"]

    def test_stats_reflects_new_diary_entry(self, auth_client):
        # Get baseline
        r0 = auth_client.get(f"{API}/diary/stats", timeout=15).json()
        base_grat = r0["totals"]["total_gratitude"]
        base_read = r0["totals"]["total_reading"]
        base_med = r0["totals"]["total_meditation_minutes"]

        # Create diary entry
        payload = {
            "gratitude": "TEST_gratitude_phase3",
            "book_title": "TEST_book",
            "book_page": "10",
            "meditation": "TEST_med",
            "meditation_seconds": 120,  # 2 min
        }
        cr = auth_client.post(f"{API}/diary", json=payload, timeout=15)
        assert cr.status_code == 200
        diary_id = cr.json()["id"]

        try:
            r1 = auth_client.get(f"{API}/diary/stats", timeout=15).json()
            assert r1["totals"]["total_gratitude"] >= base_grat + 1
            assert r1["totals"]["total_reading"] >= base_read + 1
            assert r1["totals"]["total_meditation_minutes"] >= base_med + 2.0 - 0.01
            # today's entry present
            today = r1["days"][-1]
            assert today["entries"] >= 1
        finally:
            auth_client.delete(f"{API}/diary/{diary_id}", timeout=15)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
