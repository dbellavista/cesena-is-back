// server
// -*- coding: utf-8 -*-
// vim:fenc=utf-8
// vim:foldmethod=syntax
// vim:foldnestmax=1
//
"use strict;"

var http = require('http');
var express = require('express');
var path = require('path');
var morgan = require('morgan');
var application_root = __dirname;
var injectionGame = require('./games/injection');
var bodyParser = require('body-parser');

var app = express();
app.use(express.static(path.join(application_root, 'frontend/')));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.route('/api/injection')
  .post(injectionGame.command);
var server = http.createServer(app);

server.listen(8080, function() {
  console.log(' [+] Listening on port 8080');
});
