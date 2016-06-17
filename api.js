var express = require('express');
var api = express.Router();

var group = require('./queries/group');
var collection = require('./queries/collection');

module.exports = function() {  
  api.get('/me', function(req, res) {
    res.json(req.user);
  });
  api.get('/group', function(req, res) {
    if (req.user.role === 0) {
      group.list(function (err, rows) {
        if (err) {
          res.status(404).send(err.message);
          return;
        }
        res.json(rows);
      })
    }
  });
  api.get('/collection', function(req, res) {
    if (req.user.role === 0) {
      collection.list(function (err, rows) {
        if (err) {
          res.status(404).send(err.message);
          return;
        }
        res.json(rows);
      })
    }
  });
  
  return api;
}