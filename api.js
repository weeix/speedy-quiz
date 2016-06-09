var express = require('express');
var api = express.Router();

module.exports = function() {  
  api.get('/me', function(req, res) {
    res.json(req.user)
  });
  
  return api;
}