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