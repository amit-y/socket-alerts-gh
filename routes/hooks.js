var express = require('express');
var router = express.Router();

/* GET users listing. */
router.post('/gh', function(req, res) {
  //console.log(req.body);
  io.emit('alert message', JSON.stringify(req.body));
  res.send('success');
});

module.exports = router;
