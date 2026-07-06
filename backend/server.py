from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import re
import html as html_lib
import asyncio
import logging
import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
import feedparser
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

# ============ Config ============
JWT_ALGORITHM = "HS256"
FALLBACK_MOTIVATIONS = [
    "Bom trabalho! Continue assim.",
    "Você está mandando bem!",
    "Mais uma vitória do seu dia.",
    "Excelente! Um passo de cada vez.",
    "Feito! Você é imparável.",
    "Sensacional. Orgulho de você.",
    "Missão cumprida com maestria.",
    "Isso! Um dia produtivo é feito assim.",
]

# ============ DB ============
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ============ App ============
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ============ Auth helpers ============
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Tipo de token inválido")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )


# ============ Models ============
class RegisterInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class TaskOut(BaseModel):
    id: str
    title: str
    completed: bool
    created_at: str


class DiaryCreate(BaseModel):
    gratitude: str = ""
    book_title: str = ""
    book_page: str = ""
    meditation: str = ""
    meditation_seconds: int = 0


class DiaryOut(BaseModel):
    id: str
    gratitude: str
    book_title: str
    book_page: str
    meditation: str
    meditation_seconds: int
    created_at: str


# ============ Auth endpoints ============
@api_router.post("/auth/register", response_model=UserOut)
async def register(data: RegisterInput, response: Response):
    email = data.email.lower().strip()
    exists = await db.users.find_one({"email": email})
    if exists:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado")
    doc = {
        "email": email,
        "name": data.name.strip(),
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    return UserOut(id=user_id, email=email, name=data.name.strip())


@api_router.post("/auth/login", response_model=UserOut)
async def login(data: LoginInput, response: Response):
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    user_id = str(user["_id"])
    token = create_access_token(user_id, email)
    set_auth_cookie(response, token)
    return UserOut(id=user_id, email=email, name=user.get("name", ""))


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(id=user["id"], email=user["email"], name=user.get("name", ""))


# ============ Task endpoints ============
def _task_from_doc(doc: dict) -> TaskOut:
    return TaskOut(
        id=str(doc["_id"]),
        title=doc["title"],
        completed=doc.get("completed", False),
        created_at=doc.get("created_at", ""),
    )


@api_router.get("/tasks", response_model=List[TaskOut])
async def list_tasks(user: dict = Depends(get_current_user)):
    docs = await db.tasks.find({"user_id": user["id"]}).sort("created_at", -1).to_list(500)
    return [_task_from_doc(d) for d in docs]


@api_router.post("/tasks", response_model=TaskOut)
async def create_task(data: TaskCreate, user: dict = Depends(get_current_user)):
    doc = {
        "user_id": user["id"],
        "title": data.title.strip(),
        "completed": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.tasks.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _task_from_doc(doc)


class TaskUpdate(BaseModel):
    completed: bool


@api_router.patch("/tasks/{task_id}", response_model=TaskOut)
async def update_task(task_id: str, data: TaskUpdate, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")
    doc = await db.tasks.find_one({"_id": oid, "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    await db.tasks.update_one({"_id": oid}, {"$set": {"completed": data.completed}})
    doc["completed"] = data.completed
    return _task_from_doc(doc)


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(task_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")
    res = await db.tasks.delete_one({"_id": oid, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return {"ok": True}


# ============ Motivational AI ============
class MotivationInput(BaseModel):
    task_title: str = ""


@api_router.post("/motivation")
async def motivational_message(data: MotivationInput, user: dict = Depends(get_current_user)):
    """Returns a short motivational message in Portuguese, generated by Gemini 3 Flash."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise RuntimeError("Missing EMERGENT_LLM_KEY")
        session_id = f"motiv-{user['id']}-{uuid.uuid4().hex[:8]}"
        system = (
            "Você é um coach motivacional brasileiro carinhoso e breve. "
            "Sempre responda em português do Brasil, com uma frase curta (máximo 8 palavras), "
            "positiva, celebrando a conclusão de uma tarefa. Sem emojis. Sem aspas. "
            "Varie as frases e evite repetição."
        )
        chat = LlmChat(api_key=api_key, session_id=session_id, system_message=system) \
            .with_model("gemini", "gemini-3-flash-preview")
        task_hint = data.task_title.strip() or "uma tarefa"
        prompt = f"O usuário acabou de concluir: '{task_hint}'. Escreva uma frase curta de comemoração."
        msg = await chat.send_message(UserMessage(text=prompt))
        text = str(msg).strip().strip('"').strip("'")
        if not text or len(text) > 120:
            text = random.choice(FALLBACK_MOTIVATIONS)
        return {"message": text}
    except Exception as e:
        logger.warning(f"Motivation AI fallback: {e}")
        return {"message": random.choice(FALLBACK_MOTIVATIONS)}


# ============ Diary endpoints ============
def _diary_from_doc(doc: dict) -> DiaryOut:
    return DiaryOut(
        id=str(doc["_id"]),
        gratitude=doc.get("gratitude", ""),
        book_title=doc.get("book_title", ""),
        book_page=doc.get("book_page", ""),
        meditation=doc.get("meditation", ""),
        meditation_seconds=doc.get("meditation_seconds", 0),
        created_at=doc.get("created_at", ""),
    )


@api_router.get("/diary", response_model=List[DiaryOut])
async def list_diary(user: dict = Depends(get_current_user)):
    docs = await db.diary.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    return [_diary_from_doc(d) for d in docs]


@api_router.post("/diary", response_model=DiaryOut)
async def create_diary(data: DiaryCreate, user: dict = Depends(get_current_user)):
    doc = {
        "user_id": user["id"],
        "gratitude": data.gratitude.strip(),
        "book_title": data.book_title.strip(),
        "book_page": data.book_page.strip(),
        "meditation": data.meditation.strip(),
        "meditation_seconds": max(0, int(data.meditation_seconds)),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.diary.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _diary_from_doc(doc)


@api_router.delete("/diary/{diary_id}")
async def delete_diary(diary_id: str, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(diary_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID inválido")
    res = await db.diary.delete_one({"_id": oid, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return {"ok": True}


# ============ Streak ============
@api_router.get("/streak")
async def get_streak(user: dict = Depends(get_current_user)):
    """Streak of consecutive days with a saved diary entry (Brasília / user-local: uses UTC date)."""
    docs = await db.diary.find(
        {"user_id": user["id"]}, {"created_at": 1}
    ).sort("created_at", -1).to_list(1000)

    days = set()
    for d in docs:
        ca = d.get("created_at", "")
        if isinstance(ca, str) and len(ca) >= 10:
            days.add(ca[:10])

    if not days:
        return {"current": 0, "longest": 0}

    today = datetime.now(timezone.utc).date()
    # Current streak: count backwards starting today (or from yesterday if today missing)
    current = 0
    cursor = today
    if cursor.isoformat() not in days:
        cursor = cursor - timedelta(days=1)
    while cursor.isoformat() in days:
        current += 1
        cursor = cursor - timedelta(days=1)

    # Longest streak
    sorted_days = sorted(days)
    longest = 1
    run = 1
    for i in range(1, len(sorted_days)):
        prev = datetime.fromisoformat(sorted_days[i - 1]).date()
        curr = datetime.fromisoformat(sorted_days[i]).date()
        if (curr - prev).days == 1:
            run += 1
            longest = max(longest, run)
        else:
            run = 1
    return {"current": current, "longest": max(longest, current)}


# ============ News (real RSS from Brazilian outlets) ============
# Curated Brazilian RSS feeds. All sources are verifiable (URL back to origin).
NEWS_FEEDS = {
    "politics": [
        ("G1 Política", "https://g1.globo.com/rss/g1/politica/"),
        ("UOL Política", "https://noticias.uol.com.br/politica/rss.xml"),
        ("CNN Brasil - Política", "https://www.cnnbrasil.com.br/politica/feed/"),
    ],
    "economy": [
        ("G1 Economia", "https://g1.globo.com/rss/g1/economia/"),
        ("InfoMoney", "https://www.infomoney.com.br/feed/"),
        ("CNN Brasil - Economia", "https://www.cnnbrasil.com.br/economia/feed/"),
    ],
    "good": [
        ("Só Notícia Boa", "https://sonoticiaboa.com.br/feed/"),
        ("Razões para Acreditar", "https://razoesparaacreditar.com/feed/"),
        ("Catraca Livre - Cidadania", "https://catracalivre.com.br/cidadania/feed/"),
    ],
}

_HTML_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


def _clean_html_text(raw: str, max_len: int = 260) -> str:
    if not raw:
        return ""
    txt = _HTML_TAG_RE.sub(" ", raw)
    txt = html_lib.unescape(txt)
    txt = _WS_RE.sub(" ", txt).strip()
    if len(txt) > max_len:
        txt = txt[: max_len - 1].rstrip() + "…"
    return txt


def _extract_image(entry) -> str:
    """Try to extract an image URL from a feedparser entry."""
    # media:content / media:thumbnail
    for key in ("media_content", "media_thumbnail"):
        media = entry.get(key) or []
        if media and isinstance(media, list):
            url = media[0].get("url")
            if url:
                return url
    # enclosures
    for enc in entry.get("enclosures", []) or []:
        if enc.get("type", "").startswith("image") and enc.get("href"):
            return enc["href"]
        if enc.get("url", "").lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            return enc["url"]
    # look for <img> in summary/content
    for field in ("summary", "description"):
        raw = entry.get(field, "") or ""
        m = re.search(r'<img[^>]+src="([^"]+)"', raw)
        if m:
            return m.group(1)
    content = entry.get("content")
    if content and isinstance(content, list):
        raw = content[0].get("value", "") if isinstance(content[0], dict) else ""
        m = re.search(r'<img[^>]+src="([^"]+)"', raw)
        if m:
            return m.group(1)
    return ""


def _parse_feed_sync(url: str, source_name: str, limit: int = 6) -> list:
    """Blocking feedparser call — must be run in a thread."""
    parsed = feedparser.parse(url, request_headers={
        "User-Agent": "Mozilla/5.0 (RotinaApp/1.0)"
    })
    items = []
    for entry in parsed.entries[:limit]:
        title = _clean_html_text(entry.get("title", ""), 160)
        if not title:
            continue
        summary_raw = entry.get("summary", "") or entry.get("description", "")
        summary = _clean_html_text(summary_raw, 240)
        link = entry.get("link", "") or ""
        # Try to parse published date to ISO
        published_iso = ""
        pp = entry.get("published_parsed") or entry.get("updated_parsed")
        if pp:
            try:
                published_iso = datetime(*pp[:6], tzinfo=timezone.utc).isoformat()
            except Exception:
                published_iso = ""
        image = _extract_image(entry)
        items.append({
            "id": uuid.uuid4().hex[:10],
            "title": title,
            "summary": summary,
            "source": source_name,
            "url": link,
            "published_at": published_iso,
            "image": image,
        })
    return items


async def _fetch_feed(source_name: str, url: str, limit: int = 6) -> list:
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_parse_feed_sync, url, source_name, limit),
            timeout=10.0,
        )
    except Exception as e:
        logger.warning(f"Feed failed [{source_name}]: {e}")
        return []


async def _fetch_category(cat_key: str) -> list:
    feeds = NEWS_FEEDS.get(cat_key, [])
    per_feed = 5
    results = await asyncio.gather(*[_fetch_feed(n, u, per_feed) for (n, u) in feeds])
    merged = []
    for items in results:
        merged.extend(items)
    # Sort by published date desc when available
    def _sort_key(x):
        return x.get("published_at") or ""
    merged.sort(key=_sort_key, reverse=True)
    # De-duplicate by title (first 60 chars)
    seen = set()
    deduped = []
    for it in merged:
        key = it["title"][:60].lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(it)
    return deduped[:15]


@api_router.get("/news")
async def get_news(user: dict = Depends(get_current_user)):
    """Return real news from Brazilian RSS feeds. Cached in Mongo for 30 minutes."""
    now = datetime.now(timezone.utc)
    cache = await db.news_cache.find_one({"key": "current"})
    if cache and cache.get("data") and cache.get("generated_at"):
        try:
            gen = datetime.fromisoformat(cache["generated_at"])
            if (now - gen) < timedelta(minutes=30):
                return cache["data"]
        except Exception:
            pass

    tasks = {k: _fetch_category(k) for k in NEWS_FEEDS.keys()}
    keys = list(tasks.keys())
    values = await asyncio.gather(*[tasks[k] for k in keys])
    result = {k: v for k, v in zip(keys, values)}

    await db.news_cache.update_one(
        {"key": "current"},
        {"$set": {"key": "current", "data": result, "generated_at": now.isoformat()}},
        upsert=True,
    )
    return result


# ============ Diary weekly stats ============
@api_router.get("/diary/stats")
async def diary_stats(user: dict = Depends(get_current_user)):
    """Return last 7 days aggregation for charts on Diario tab."""
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=6)  # 7-day window including today
    start_iso = start.isoformat()

    docs = await db.diary.find(
        {"user_id": user["id"], "created_at": {"$gte": start_iso}},
    ).to_list(500)

    # Aggregate per day
    per_day = {}
    for i in range(7):
        d = (start + timedelta(days=i)).isoformat()
        per_day[d] = {
            "date": d,
            "meditation_minutes": 0,
            "gratitude_count": 0,
            "reading_count": 0,
            "entries": 0,
        }

    for doc in docs:
        ca = doc.get("created_at", "")
        if isinstance(ca, str) and len(ca) >= 10:
            key = ca[:10]
            if key in per_day:
                per_day[key]["entries"] += 1
                per_day[key]["meditation_minutes"] += round(
                    doc.get("meditation_seconds", 0) / 60, 1
                )
                if doc.get("gratitude", "").strip():
                    per_day[key]["gratitude_count"] += 1
                if doc.get("book_title", "").strip():
                    per_day[key]["reading_count"] += 1

    days = [per_day[k] for k in sorted(per_day.keys())]
    totals = {
        "total_meditation_minutes": round(sum(d["meditation_minutes"] for d in days), 1),
        "total_gratitude": sum(d["gratitude_count"] for d in days),
        "total_reading": sum(d["reading_count"] for d in days),
        "total_entries": sum(d["entries"] for d in days),
    }
    return {"days": days, "totals": totals}


@api_router.get("/")
async def root():
    return {"message": "Rotina API"}


# ============ Startup ============
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.tasks.create_index([("user_id", 1), ("created_at", -1)])
    await db.diary.create_index([("user_id", 1), ("created_at", -1)])

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@rotina.app").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin12345")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )


# ============ CORS + Router ============
app.include_router(api_router)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
