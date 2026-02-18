import os
import time
import uuid
import datetime
import shutil
import asyncio
from typing import List, Optional, Dict
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, DateTime, Text, ForeignKey, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import socketio

# --- DB ---
DATABASE_URL = "sqlite:///./chatify.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, index=True)
    avatar = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))
    last_seen = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))

class Channel(Base):
    __tablename__ = "channels"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, index=True)
    channel_id = Column(String, index=True)
    uid = Column(String)
    name = Column(String)
    avatar = Column(String)
    text = Column(Text)
    ts = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))
    nonce = Column(String, nullable=True)
    reactions = Column(Text, default="{}")
    reply_to = Column(Text, nullable=True) # JSON string of replied message snippet

Base.metadata.create_all(bind=engine)

# --- UPLOADS ---
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "server", "uploads")
if not os.path.exists(UPLOAD_DIR): os.makedirs(UPLOAD_DIR)

# --- CORE SYSTEM (Socket.io) ---
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*', logger=True, engineio_logger=True)
sid_to_uid: Dict[str, str] = {}
uid_to_name: Dict[str, str] = {}

async def cleanup_cycle():
    while True:
        await asyncio.sleep(60) # Check every minute
        db = SessionLocal()
        try:
            # Delete users inactive for more than 30 minutes
            inactive_threshold = datetime.datetime.now(datetime.UTC) - datetime.timedelta(minutes=30)
            db.query(User).filter(User.last_seen < inactive_threshold).delete()
            db.commit()
            
            # File cleanup: Remove files older than 15 minutes
            now = time.time()
            for f in os.listdir(UPLOAD_DIR):
                fp = os.path.join(UPLOAD_DIR, f)
                if os.path.isfile(fp):
                    if now - os.path.getmtime(fp) > 15 * 60:
                        try:
                            os.remove(fp)
                            print(f"[System] Deleted file: {f}")
                        except: pass
        except Exception as e:
            print(f"[System] Cleanup Error: {e}")
        finally: db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    db = SessionLocal()

    # Only seed if the database is empty to avoid data loss on every restart
    if db.query(Channel).count() == 0:
        db.add_all([
            Channel(id="general", name="General"),
            Channel(id="chill", name="Chill Area"),
            Channel(id="dev", name="Development")
        ])

        # Seed Real Data for initial UX showcase
        users = [
            User(id="alex-1", username="Alex Johnson", avatar="https://api.dicebear.com/7.x/micah/svg?seed=Alex", last_seen=datetime.datetime.now(datetime.UTC)),
            User(id="jordan-2", username="Jordan Smith", avatar="https://api.dicebear.com/7.x/micah/svg?seed=Jordan", last_seen=datetime.datetime.now(datetime.UTC)),
            User(id="taylor-3", username="Taylor Reed", avatar="https://api.dicebear.com/7.x/micah/svg?seed=Taylor", last_seen=datetime.datetime.now(datetime.UTC))
        ]
        db.add_all(users)

        # Welcome messages
        db.add(Message(id=str(uuid.uuid4()), channel_id="general", uid="alex-1", name="Alex Johnson", avatar=users[0].avatar, text="Hey everyone! Welcome to the new Chatify interface. I'm Alex from the UX team.", ts=datetime.datetime.now(datetime.UTC)))
        db.add(Message(id=str(uuid.uuid4()), channel_id="general", uid="jordan-2", name="Jordan Smith", avatar=users[1].avatar, text="Wow, the new 4-column layout is so much cleaner. Great job on the micro-interactions too!", ts=datetime.datetime.now(datetime.UTC)))

        db.commit()

    db.close()
    task = asyncio.create_task(cleanup_cycle())
    yield
    # Shutdown
    task.cancel()

# --- APP ---
app = FastAPI(title="Chatify Backend", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class UserCreate(BaseModel):
    username: str
    avatar: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    avatar: Optional[str] = None

# --- REST ---
@app.get("/health")
def health(): return {"status": "online"}

@app.post("/guest")
def create_guest(user_data: UserCreate):
    db = SessionLocal()
    uid = str(uuid.uuid4())
    db_user = User(id=uid, username=user_data.username, avatar=user_data.avatar)
    db.add(db_user); db.commit(); db.refresh(db_user)
    res = {"user": {"uid": db_user.id, "name": db_user.username, "avatar": db_user.avatar}}
    db.close(); return res

@app.patch("/users/{uid}")
def update_user(uid: str, user_data: UserUpdate):
    db = SessionLocal()
    db_user = db.query(User).filter(User.id == uid).first()
    if not db_user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.username:
        db_user.username = user_data.username
        uid_to_name[uid] = user_data.username
    if user_data.avatar:
        db_user.avatar = user_data.avatar
    
    db.commit()
    db.refresh(db_user)
    res = {"uid": db_user.id, "name": db_user.username, "avatar": db_user.avatar}
    db.close()
    return res

@app.get("/channels")
def get_channels():
    db = SessionLocal(); channels = db.query(Channel).all()
    res = [{"id": c.id, "name": c.name} for c in channels]
    db.close(); return res

@app.get("/users")
def get_users():
    db = SessionLocal()
    # Only show users active in the last 2 minutes
    active_limit = datetime.datetime.now(datetime.UTC) - datetime.timedelta(minutes=2)
    users = db.query(User).filter(User.last_seen > active_limit).order_by(User.last_seen.desc()).limit(50).all()
    res = [{"uid": u.id, "name": u.username, "avatar": u.avatar} for u in users]
    db.close(); return res

@app.get("/messages/{cid}")
def get_messages(cid: str):
    import json
    db = SessionLocal(); messages = db.query(Message).filter(Message.channel_id == cid).order_by(Message.ts.asc()).limit(100).all()
    res = [{"id": m.id, "channelId": m.channel_id, "uid": m.uid, "name": m.name, "avatar": m.avatar, "text": m.text, "ts": m.ts.isoformat(), "nonce": m.nonce, "reactions": json.loads(m.reactions), "reply_to": json.loads(m.reply_to) if m.reply_to else None} for m in messages]
    db.close(); return res

@app.delete("/messages/{mid}")
def delete_message(mid: str, uid: str):
    db = SessionLocal()
    msg = db.query(Message).filter(Message.id == mid).first()
    if not msg:
        db.close()
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if the requester is the author
    if msg.uid != uid:
        db.close()
        raise HTTPException(status_code=403, detail="Unauthorized deletion request")
    
    db.delete(msg)
    db.commit()
    db.close()
    return {"status": "success"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        fn = f"{uuid.uuid4()}_{file.filename}"
        fp = os.path.join(UPLOAD_DIR, fn)
        print(f"[System] Receiving file: {file.filename} -> {fp}")
        with open(fp, "wb") as b: shutil.copyfileobj(file.file, b)
        return {"url": f"/uploads/{fn}", "filename": file.filename}
    except Exception as e:
        print(f"[System] Upload Error: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")

@app.get("/download-source")
async def download_source():
    from fastapi.responses import FileResponse
    import tempfile
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    tmp_dir = tempfile.gettempdir()
    zip_filename = "chatify-source"
    zip_path = os.path.join(tmp_dir, f"{zip_filename}.zip")
    
    # Remove old zip if exists
    if os.path.exists(zip_path): os.remove(zip_path)
    
    # Prepare files list to include
    try:
        # Create a temporary directory to stage files
        with tempfile.TemporaryDirectory() as stage_dir:
            for folder in ['client', 'server', 'python_service']:
                src = os.path.join(root_dir, folder)
                if os.path.exists(src):
                    dst = os.path.join(stage_dir, folder)
                    # Copy tree excluding junk
                    shutil.copytree(src, dst, ignore=shutil.ignore_patterns('node_modules', 'venv', '__pycache__', '.git'))
            
            for f in ['package.json', 'client/index.html', '.env', 'run.sh']:
                src = os.path.join(root_dir, f)
                if os.path.exists(src):
                    shutil.copy2(src, stage_dir)

            # Archive the staged directory
            shutil.make_archive(os.path.join(tmp_dir, zip_filename), 'zip', stage_dir)

        return FileResponse(zip_path, filename="chatify-source.zip", media_type="application/zip")
    except Exception as e:
        print(f"[System] Export Error: {e}")
        raise HTTPException(status_code=500, detail="Source export failed")

# --- SOCKETS ---
@sio.on('connect')
async def connect(sid, environ):
    print(f"[Socket] Connected: {sid}")

@sio.on('identify')
async def identify(sid, uid):
    sid_to_uid[sid] = uid
    db = SessionLocal()
    user = db.query(User).filter(User.id == uid).first()
    if user:
        user.last_seen = datetime.datetime.now(datetime.UTC)
        uid_to_name[uid] = user.username
        db.commit()
        print(f"[Socket] User joined: {user.username}")
    db.close()
    await sio.emit('user_list_update', {"refresh": True})

@sio.on('join')
async def join(sid, cid):
    # Update last_seen if we have a uid mapping
    uid = sid_to_uid.get(sid)
    if uid:
        db = SessionLocal()
        user = db.query(User).filter(User.id == uid).first()
        if user:
            user.last_seen = datetime.datetime.now(datetime.UTC)
            db.commit()
        db.close()

    # Leave previous rooms
    rooms = list(sio.rooms(sid))
    for r in rooms:
        if r != sid: 
            await sio.leave_room(sid, r)
            print(f"[Socket] {sid} left channel {r}")
            
    await sio.enter_room(sid, cid)
    print(f"[Socket] {sid} joined channel {cid}")
    await sio.emit('joined', {"channelId": cid}, room=sid)

@sio.on('typing')
async def typing(sid, data):
    cid, uid, is_typing = data.get('cid'), data.get('uid'), data.get('isTyping')
    name = uid_to_name.get(uid, "Someone")
    await sio.emit('typing_update', {"cid": cid, "uid": uid, "name": name, "isTyping": is_typing}, room=cid, skip_sid=sid)

@sio.on('add_reaction')
async def add_reaction(sid, data):
    import json
    mid, emoji, uid = data.get('mid'), data.get('emoji'), data.get('uid')
    db = SessionLocal()
    msg = db.query(Message).filter(Message.id == mid).first()
    if msg:
        reactions = json.loads(msg.reactions)
        if emoji not in reactions: reactions[emoji] = []
        if uid not in reactions[emoji]:
            reactions[emoji].append(uid)
            msg.reactions = json.dumps(reactions)
            db.commit()
            await sio.emit('reaction_update', {"mid": mid, "reactions": reactions}, room=msg.channel_id)
    db.close()

@sio.on('send_message')
async def send_message(sid, data):
    import json
    cid, text, uid, nonce, reply_to = data.get('cid'), data.get('text'), data.get('uid'), data.get('nonce'), data.get('reply_to')
    if not cid or not text or not uid: 
        print(f"[Socket] Invalid message from {sid}")
        return
    
    db = SessionLocal()
    user = db.query(User).filter(User.id == uid).first()
    if user:
        user.last_seen = datetime.datetime.now(datetime.UTC)
        mid = str(uuid.uuid4())
        m = Message(id=mid, channel_id=cid, uid=uid, name=user.username, avatar=user.avatar, text=text, nonce=nonce, reply_to=json.dumps(reply_to) if reply_to else None)
        db.add(m); db.commit()
        
        msg_data = {
            "id": mid,
            "nonce": nonce,
            "channelId": cid,
            "uid": uid,
            "name": user.username,
            "avatar": user.avatar,
            "text": text,
            "ts": datetime.datetime.now(datetime.UTC).isoformat(),
            "reactions": {},
            "reply_to": reply_to
        }
        
        print(f"[Socket] Broadcasting message from {user.username} to channel {cid}")
        await sio.emit('message', msg_data, room=cid)
    else:
        print(f"[Socket] Message dropped: User {uid} not found in DB")
    db.close()

@sio.on('disconnect')
async def disconnect(sid):
    uid = sid_to_uid.pop(sid, None)
    if uid:
        print(f"[Socket] User left: {uid}")
        await sio.emit('user_list_update', {"refresh": True})



# --- MOUNT & EXEC ---
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*40)
    print("🚀 CHATIFY_CORE: v12.4.0")
    print("🛠️  SYSTEM_STATUS: ONLINE")
    print("="*40 + "\n")
    uvicorn.run(socket_app, host="0.0.0.0", port=8000, log_level="info")
