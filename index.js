var express = require('express');
var app = express();

app.use(express.static('www'));

app.listen(3000, function() {
  console.log('Speedy Quiz listening on port 3000!');
});