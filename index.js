var jwt = require('jsonwebtoken');
var express = require('express');
var expressJwt = require('express-jwt');
var bodyParser = require('body-parser');

var user = require('./queries/user');

var secret = 'AZ6Chvpihim6D25/7nMXcZsFy8HykfuEPMsslU2b8mw=';

var app = express();

app.use(bodyParser.json());
app.use(function(err, req, res, next){
  if (err.constructor.name === 'UnauthorizedError') {
    res.status(401).send('Unauthorized');
  }
});

app.use('/api', expressJwt({secret: secret}));
app.use('/api/v1', require('./api')());

app.post('/authenticate', function (req, res) {
  user.login(req.body.username, req.body.password, function(err, data) {
    if (err) {
      if (err.name === 'InvalidCredentialsError') {
        //if is invalid, return 401
        res.status(401).send(err.message);
      }
      return;
    }
    var token = jwt.sign(data, secret, { expiresIn: "4h" });
    res.json({ token: token });
  });
});

app.use(express.static('www'));

app.listen(3000, function() {
  console.log('Speedy Quiz listening on port 3000!');
});