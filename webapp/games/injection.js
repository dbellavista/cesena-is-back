// injection
// -*- coding: utf-8 -*-
// vim:fenc=utf-8
// vim:foldmethod=syntax
// vim:foldnestmax=1
//
"use strict;"

var crypto = require('crypto');
var shasum = crypto.createHash('sha1');
var base64url = require('base64url');

var injdata = require('../games/injection_data');
var structure = injdata.structure;

function randomStringAsBase64Url(size) {
  return base64url(crypto.randomBytes(size));
}

var status = {};

var levelCredentials = [{
  user: 'rec',
  password: 'rec',
  path: '/system/recovery',
  auth: 0
}, {
  user: 'door',
  password: 'dontopen',
  path: '/system/door',
  auth: 1
}, {
  user: 'weapon',
  password: 'blowit',
  path: '/system/weapon',
  auth: 2
}, {
  user: 'purge',
  password: 'purgethemall',
  path: '/system/purge',
  auth: 3
}];

function checkCredentials(user, pwd) {
  var level = -1;
  for (var i = 0; i < levelCredentials.length; i++) {
    if (user === levelCredentials[i].user && pwd === levelCredentials[i].password)
      level = i;
  }
  return level;
}

function login(user, pwd) {

  var level = checkCredentials(user, pwd);
  if (level === -1) {
    throw new Error('Wrong credentials');
  }

  var token;
  do {
    token = randomStringAsBase64Url(32);
  } while (status[token] !== undefined);

  status[token] = {
    token: token,
    level: level,
    path: levelCredentials[level].path,
    auth: levelCredentials[level].auth,
    commands: levelCredentials[level].commands || []
  };

  return token;
}

var commands = {
  cat: cat,
  ls: ls,
  pwd: pwd,
  help: help,
  lsdoor: lsdoor,
  whoami: whoami
};

function help() {
  var help = [
    'ls (path): list the content of path',
    'help: display this help',
    'pwd: display the current directory',
    'pwd: display the current user',
    'cat (file): read file content',
    'whoami: display the current user'
  ];
  var str = 'Commands:';
  for (var i = 0; i < help.length; i++)
    str += '\n ' + help[i];
  str += '\nNOTE: you can concatenate commands with \';\'';
  return str;
}

function whoami(token) {
  return levelCredentials[token.level].user;
}

function lsdoor(token, path) {
  if (token.level !== 0) {
    return "Error: only recovery user can use this API";
  }

  var auth = 0;
  for (var i = 0; i < levelCredentials.length; i++)
    if (levelCredentials[i].user === 'door')
      auth = levelCredentials[i].auth;

  var tmptoken = {
    token: null,
    level: token.level,
    path: token.path,
    auth: auth
  };

  var cmd = 'ls ' + path;
  return 'Excecuting ' + cmd + ' with door authorization:\n\n' + exec(cmd, tmptoken);
}

function ls(token, path) {
  var r = injdata.getElement(token, path);
  if (r.obj === null) {
    if (r.unauth)
      return 'Error: unauthorized to access ' + r.path + '!';
    else
      return 'Error: path ' + r.path + ' not found!';
  }
  return injdata.toString(r.name, r.obj);
}

function cat(token, path) {
  var r = injdata.getElement(token, path);
  if (r.obj === null) {
    if (r.unauth)
      return 'Error: unauthorized to access ' + r.path + '!';
    else
      return 'Error: path ' + r.path + ' not found!';
  }

  if (r.obj._type === 'dir') {
    return 'Error: ' + r.path + ' is a directory!';
  }
  return r.obj._content;
}

function pwd(token) {
  return token.path;
}

exports.command = function(req, res) {

  console.log(req.body);
  var cmd = req.body.method;
  var params = req.body.params;
  var id = req.body.id;

  try {
    var data;
    if (cmd === 'system.describe') {
      data = '';
    } else if (cmd === 'login') {
      data = login.apply(this, params);
    } else if (cmd === '') {
      data = login.apply(this, params);
    } else {
      var token = status[params[0]];
      if (token === undefined || token === null) {
        data = 'Error: not authenticated (press Ctrl+D to logout)';
      } else {
        data = exec(cmd + ' ' + (params[1] || ''), token);
      }
    }
    console.log(data);
    res.json(buildReply(data, id, null));
  } catch (e) {
    console.log(e.stack);
    res.json(buildReply(null, id, {
      code: -1,
      message: e.message
    }));
  }
}

function exec(cmdstring, token) {
  var stack = parse(cmdstring, token);
  return executeCommands(stack);
}

function parse(cmdstring, token) {

  var name = null;
  var fargs = [token];
  var insideDouble = false;
  var insideSingle = false;
  var commands = [];

  var str = '';
  for (var i = 0; i < cmdstring.length; i++) {
    if (cmdstring[i] === ' ' && !insideDouble && !insideSingle) {
      if (str !== '') {
        if (name === null)
          name = str
        else
          fargs.push(str);
      }
      str = '';
    } else if (cmdstring[i] === '"' && !insideSingle) {
      insideDouble = !insideDouble;
    } else if (cmdstring[i] === "'" && !insideDouble) {
      insideSingle = !insideSingle;
    } else if (cmdstring[i] === ';' && !insideDouble && !insideSingle) {
      if (str !== '') {
        if (name === null)
          name = str
        else
          fargs.push(str);
      }
      if (name !== null) {
        commands.push({
          name: name,
          args: fargs
        });

        fargs = [token];
        name = null;
      }
      str = '';
    } else {
      str += cmdstring[i];
    }
  }
  if (name !== null) {
    if (str !== '')
      fargs.push(str);
    commands.push({
      name: name,
      args: fargs
    });
  } else if (str !== '') {
    commands.push({
      name: str,
      args: fargs
    });
  }
  return commands;
}

function executeCommands(stack) {
  var outs = stack.map(function(cmd) {
    if (commands[cmd.name] !== undefined) {
      return commands[cmd.name].apply(this, cmd.args);
    } else {
      return 'Error: unknown command ' + cmd.name;
    }
  });

  var str = '';
  for (var i = 0; i < outs.length; i++) {
    str += outs[i];
    if (i < outs.length - 1)
      str += '\n';
  }
  return str;
}

function buildReply(response, id, error) {
  return {
    jsonrpc: '2.0',
    result: response,
    id: id,
    error: error
  };
}
