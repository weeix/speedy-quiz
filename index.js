var jwt = require('jsonwebtoken');
var express = require('express');
var expressJwt = require('express-jwt');
var bodyParser = require('body-parser');

var user = require('./queries/user');

var secret = 'AZ6Chvpihim6D25/7nMXcZsFy8HykfuEPMsslU2b8mw=';

var app = express();

app.use('/api', expressJwt({secret: secret}));
app.use(bodyParser.json());
app.use(function(err, req, res, next){
  if (err.constructor.name === 'UnauthorizedError') {
    res.status(401).send('Unauthorized');
  }
});

app.post('/authenticate', function (req, res) {
  user.login(req.body.username, req.body.password, function(error, data) {
    if (error) {
      if (error.message == "InvalidCredentials") {
        //if is invalid, return 401
        res.status(401).send('Invalid username/password');
      }
      return;
    }
    var token = jwt.sign(data, secret, { expiresIn: "5m" });
    res.json({ token: token });
  });
});

app.use(express.static('www'));

app.listen(3000, function() {
  console.log('Speedy Quiz listening on port 3000!');
});