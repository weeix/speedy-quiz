var express = require('express');
var api = express.Router();

var group = require('./queries/group');
var collection = require('./queries/collection');
var quiz = require('./queries/quiz');

module.exports = function () {
  api.get('/me', function (req, res) {
    res.json(req.user);
  });

  api.get('/group', function (req, res) {
    adminCheck(req, function (err) {
      if (err) {
        res.status(401).send(err.message);
        return;
      }
      group.list(function (err, rows) {
        if (err) {
          res.status(404).send(err.message);
          return;
        }
        res.json(rows);
      });
    });
  });

  api.get('/collection', function (req, res) {
    adminCheck(req, function (err) {
      if (err) {
        res.status(401).send(err.message);
        return;
      }
      collection.list(function (err, rows) {
        if (err) {
          res.status(404).send(err.message);
          return;
        }
        res.json(rows);
      });
    });
  });

  api.post('/quiz', function (req, res) {
    adminCheck(req, function (err) {
      if (err) {
        res.status(401).send(err.message);
        return;
      }
      quiz.add(req.body.gid, req.body.cid, function (err, result) {
        if (err) {
          res.status(404).send(err.message);
          return;
        }
        res.json(result);
      })
    });
  });

  api.post('/quiz-session/start', function (req, res) {
    adminCheck(req, function (err) {
      if (err) {
        res.status(401).send(err.message);
        return;
      }
      quiz.start(req.body.qzid, req.body.qid, function (err, result) {
        if (err) {
          res.status(404).send(err.message);
          return;
        }
        res.json(result);
      })
    });
  });

  api.post('/quiz-session/end', function (req, res) {
    adminCheck(req, function (err) {
      if (err) {
        res.status(401).send(err.message);
        return;
      }
      quiz.end(req.body.qsid, function (err, result) {
        if (err) {
          res.status(404).send(err.message);
          return;
        }
        res.json(result);
      })
    });
  });

  api.get('/quiz', function (req, res) {
    adminCheck(req, function (err) {
      if (err) {
        res.status(401).send(err.message);
        return;
      }
      quiz.list(function (err, result) {
        if (err) {
          res.status(404).send(err.message);
          return;
        }
        res.json(result);
      })
    });
  });

  api.get('/quiz/:qzid', function (req, res) {
    adminCheck(req, function (err) {
      var unasked = false;
      if (err) {
        res.status(401).send(err.message);
        return;
      }
      if (req.query.unasked != null) {
        unasked = true;
      }
      if (req.params.qzid) {
        quiz.showQuestions(req.params.qzid, unasked, function (err, rows) {
          if (err) {
            res.status(404).send(err.message);
            return;
          }
          res.json(rows);
        });
      } else {
        res.status(400).send('No quiz ID specified');
        return;
      }
    });
  })

  return api;
}

function adminCheck(req, callback) {
  if (req.user.role === 0) {
    callback(null);
  } else {
    var err = new Error('Admin only');
    callback(err);
  }
}