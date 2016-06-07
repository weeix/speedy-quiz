var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('storage.db');

db.serialize(function() {
  // Quiz Game Schema
  db.run(
    "CREATE TABLE groups (\
    gid INTEGER,\
    displayName TEXT NOT NULL,\
    PRIMARY KEY (gid))"
  );
  db.run(
    "CREATE TABLE users (\
    uid INTEGER,\
    gid INTEGER,\
    username TEXT NOT NULL,\
    password TEXT NOT NULL,\
    displayName TEXT NOT NULL,\
    role INTEGER NOT NULL DEFAULT 1,\
    FOREIGN KEY (gid) REFERENCES groups(gid),\
    PRIMARY KEY (uid))"
  );
  db.run(
    "CREATE TABLE questions (\
    qid INTEGER,\
    question TEXT,\
    choices TEXT,\
    answer INTEGER,\
    PRIMARY KEY (qid))"
  );
  db.run(
    "CREATE TABLE collections (\
    cid INTEGER,\
    collectionName TEXT,\
    PRIMARY KEY (cid))"
  );
  db.run(
    "CREATE TABLE questions_collections (\
    qid INTEGER,\
    cid INTEGER,\
    FOREIGN KEY (qid) REFERENCES questions(qid),\
    FOREIGN KEY (cid) REFERENCES collections(cid))"
  );
  db.run(
    "CREATE TABLE quizzes (\
    qzid INTEGER,\
    gid INTEGER,\
    cid INTEGER,\
    FOREIGN KEY (gid) REFERENCES groups(gid),\
    FOREIGN KEY (cid) REFERENCES collections(cid),\
    PRIMARY KEY (qzid))"
  );
  db.run(
    "CREATE TABLE quiz_sessions (\
    qsid INTEGER,\
    qzid INTEGER,\
    qid INTEGER,\
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,\
    end_time DATETIME,\
    FOREIGN KEY (qzid) REFERENCES quizzes(qzid),\
    FOREIGN KEY (qid) REFERENCES questions(qid),\
    PRIMARY KEY (qsid))"
  );
  db.run(
    "CREATE TABLE answered (\
    aid INTEGER,\
    qsid INTEGER,\
    uid INTEGER,\
    answer INTEGER,\
    answered_time DATETIME DEFAULT CURRENT_TIMESTAMP,\
    FOREIGN KEY (qsid) REFERENCES quiz_sessions(qsid),\
    FOREIGN KEY (uid) REFERENCES users(uid),\
    PRIMARY KEY (aid))"
  );
  
  // Fill Groups Table
  var stmt = db.prepare("INSERT INTO groups (gid, displayName) VALUES (?, ?)");
  stmt.run(1, "ผู้เข้าร่วมอบรม");
  stmt.finalize();
  
  // Fill Users Table
  var stmt = db.prepare("INSERT INTO users (uid, gid, username, password, displayName, role) VALUES (?, ?, ?, ?, ?, ?)");
  stmt.run(1, null, "admin", "Qz654321", "ผู้ดูแลระบบ", 0);
  stmt.run(2, 1, "g1", "Qz123456", "กลุ่ม 1", 0);
  stmt.run(3, 1, "g2", "Qz123456", "กลุ่ม 2", 1);
  stmt.run(4, 1, "g3", "Qz123456", "กลุ่ม 3", 1);
  stmt.run(5, 1, "g4", "Qz123456", "กลุ่ม 4", 1);
  stmt.run(6, 1, "g5", "Qz123456", "กลุ่ม 5", 1);
  stmt.run(7, 1, "g6", "Qz123456", "กลุ่ม 6", 1);
  stmt.finalize();
});

db.close();

console.log("Database initialization completed!");