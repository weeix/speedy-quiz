var fs = require('fs');
var readline = require('readline');
var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('storage.db');
var rl = readline.createInterface({
  input: fs.createReadStream('questions.txt')
});

db.serialize(function() {
  // Quiz Game Schema
  db.run(
    "CREATE TABLE groups (\
    gid INTEGER,\
    displayName TEXT NOT NULL,\
    PRIMARY KEY (gid))",
    function(error) {
      console.log("Table 'groups' created!");
  });
  db.run(
    "CREATE TABLE users (\
    uid INTEGER,\
    gid INTEGER,\
    username TEXT NOT NULL,\
    password TEXT NOT NULL,\
    displayName TEXT NOT NULL,\
    role INTEGER NOT NULL DEFAULT 1,\
    FOREIGN KEY (gid) REFERENCES groups(gid),\
    PRIMARY KEY (uid))",
    function(error) {
      console.log("Table 'users' created!");
  });
  db.run(
    "CREATE TABLE questions (\
    qid INTEGER,\
    question TEXT,\
    choices TEXT,\
    answer INTEGER,\
    PRIMARY KEY (qid))",
    function(error) {
      console.log("Table 'questions' created!");
  });
  db.run(
    "CREATE TABLE collections (\
    cid INTEGER,\
    collectionName TEXT,\
    PRIMARY KEY (cid))",
    function(error) {
      console.log("Table 'collections' created!");
  });
  db.run(
    "CREATE TABLE questions_collections (\
    qid INTEGER,\
    cid INTEGER,\
    FOREIGN KEY (qid) REFERENCES questions(qid),\
    FOREIGN KEY (cid) REFERENCES collections(cid))",
    function(error) {
      console.log("Table 'questions_collections' created!");
  });
  db.run(
    "CREATE TABLE quizzes (\
    qzid INTEGER,\
    gid INTEGER,\
    cid INTEGER,\
    FOREIGN KEY (gid) REFERENCES groups(gid),\
    FOREIGN KEY (cid) REFERENCES collections(cid),\
    PRIMARY KEY (qzid))",
    function(error) {
      console.log("Table 'quizzes' created!");
  });
  db.run(
    "CREATE TABLE quiz_sessions (\
    qsid INTEGER,\
    qzid INTEGER,\
    qid INTEGER,\
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,\
    end_time DATETIME,\
    FOREIGN KEY (qzid) REFERENCES quizzes(qzid),\
    FOREIGN KEY (qid) REFERENCES questions(qid),\
    PRIMARY KEY (qsid))",
    function(error) {
      console.log("Table 'quiz_sessions' created!");
  });
  db.run(
    "CREATE TABLE answered (\
    aid INTEGER,\
    qsid INTEGER,\
    uid INTEGER,\
    answer INTEGER,\
    answered_time DATETIME DEFAULT CURRENT_TIMESTAMP,\
    FOREIGN KEY (qsid) REFERENCES quiz_sessions(qsid),\
    FOREIGN KEY (uid) REFERENCES users(uid),\
    PRIMARY KEY (aid))",
    function(error) {
      console.log("Table 'answered' created!");
  });
  
  // Fill Groups Table
  var stmt = db.prepare("INSERT INTO groups (gid, displayName) VALUES (?, ?)");
  stmt.run(1, "ผู้เข้าร่วมอบรม");
  stmt.finalize(function(error) {
    console.log("Groups table filled!");
  });
  
  // Fill Users Table
  var stmt = db.prepare("INSERT INTO users (uid, gid, username, password, displayName, role) VALUES (?, ?, ?, ?, ?, ?)");
  stmt.run(1, null, "admin", "Qz654321", "ผู้ดูแลระบบ", 0);
  stmt.run(2, 1, "g1", "Qz123456", "กลุ่ม 1", 1);
  stmt.run(3, 1, "g2", "Qz123456", "กลุ่ม 2", 1);
  stmt.run(4, 1, "g3", "Qz123456", "กลุ่ม 3", 1);
  stmt.run(5, 1, "g4", "Qz123456", "กลุ่ม 4", 1);
  stmt.run(6, 1, "g5", "Qz123456", "กลุ่ม 5", 1);
  stmt.run(7, 1, "g6", "Qz123456", "กลุ่ม 6", 1);
  stmt.finalize(function(error) {
    console.log("Users table filled!");
  });
  
  // Fill Collections Table
  var stmt = db.prepare("INSERT INTO collections (cid, collectionName) VALUES (?, ?)");
  stmt.run(1, "ชุดคำถามที่ 1");
  stmt.finalize(function(error) {
    console.log("Collections table filled!");
  });
  
  // Import Questions
  var stmt = db.prepare("INSERT INTO questions (question, choices, answer) VALUES (?, ?, ?)");
  var count = 0;
  var question = "";
  var choices = [];
  var answer;
  var saveToDB = function() {
    if (question.length !== 0 && answer != null) {
      stmt.run(question, JSON.stringify(choices), answer);
      question = "";
      choices = [];
      answer = undefined;
    }
  }
  rl.on('line', (line) => {
    count++;
    line = line.trim();
    if (line.length === 0) {
      saveToDB();
      count = 0;
    } else {
      if (count == 1) { question = line; }
      else if (count > 1) {
        if (line.charAt(0) == '*') {
          line = line.slice(1);
          answer = count - 2;
        }
        choices.push(line);
      }
    }
  });
  rl.on('close', () => {
    saveToDB(question, choices, answer);
    stmt.finalize(function(error) {
      if (error) { console.log(error); }
      console.log("Questions imported!");
      
      // Add all questions to default collection
      var stmt = db.prepare("INSERT INTO questions_collections (qid, cid) VALUES (?, ?)");
      db.each("SELECT qid FROM questions", (error, row) => {
        stmt.run(row.qid, 1);
      }, (error, num) => {
        stmt.finalize(function(error) {
          console.log("Added all questions to the default collection!");
        });
      });
    });
  });
});

db.close(function(error) {
  console.log("Database initialization completed!");
});