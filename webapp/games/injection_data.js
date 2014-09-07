// injection_data
// -*- coding: utf-8 -*-
// vim:fenc=utf-8
// vim:foldmethod=syntax
// vim:foldnestmax=1
//
"use strict;"

var recovery = {
  _type: 'dir',
  instructions: {
    _type: 'file',
    _content: 'SYSTEM CONSOLE APOCALYPSE RECOVERY\n\
Welcome unknown user. If you are here, it means\n\
the world is suffering a severe apocalypse event.\n\
\n\
NOTE: this system is unable to handle super-viruses infections.\n\
The infrastructure can however protect the human being against\n\
Zombies or moderately advanced Aliens.\n\
\n\
If the conditions applies, please follow the recovery instruction:\n\
1. Contact your "DOOR" supervisor and log in as door.\n\
2. Begin the door closing procedure.\n\
3. Contact your "WEAPON" supervisor and log in as weapon.\n\
4. Begin the weapons activation procedure.\n\
5. Contact your "PURGE" supervisor and log in as purge.\n\
6. Begin the purge procedure.\n\
\n\
If any supervisor is missing, the human being cannot be saved.\n\
We are deeply sorry for the inconvenience.'
  },
  note_from_door: {
    _type: 'file',
    _content: '\
From: door@system.com\n\
To: admin@system.com\n\
Subject: [RE: wrong auth problem]\n\
\n\
Ok ok got it!!\n\
I have created the command "lsdoor", which permits to list\n\
directories with door privilages.\n\
Just please, remove the script when you have solved the problem!'
  }
};

var door = {
  _type: 'dir',
  _auth: 1,
  current_password: {
    _type: 'file',
    _content: 'Password for door user: dontopen'
  },
  shutdown_door_procedure: {
    _type: 'file',
    _content: 'TODO' }
};

var structure = {
  _type: 'dir',
  system: {
    _type: 'dir',
    recovery: recovery,
    weapon: {
      _type: 'dir',
      _auth: 2,
    },
    door: door,
    purge: {
      _type: 'dir',
      _auth: 3
    }
  }
};

function adjust(pre, structure) {
  structure._parent = pre;
  for (var s in structure) {
    if (s[0] !== '_')
      adjust(structure, structure[s]);
  }
}

adjust({}, structure);

exports.structure = structure;

exports.toString = function(name, pobj) {
  var str = '';
  if (pobj._type === 'file') {
    return innerToString(name, pobj);
  } else if (pobj._type === 'dir') {
    for (var dir in pobj) {
      if (dir[0] === '_')
        continue;
      str += innerToString(dir, pobj[dir]) + '\n';
    }
  }
  return str;
}

exports.getElement = function(token, path) {
  if (path === undefined) {
    path = token.path;
  } else if (path[0] !== '/') {
    path = token.path + '/' + path;
  }

  var arr = path.split("/");
  var pobj = structure;
  var name = '/';

  for (var i = 1; i < arr.length; i++) {
    if (arr[i] === '')
      continue;

    if (arr[i] === '..') {
      // ehehe
      pobj = pobj._parent;
      continue;
    }
    if (arr[i] === '.') {
      continue;
    }

    name = arr[i];
    if (pobj[name] === undefined) {
      return {name: null, obj: null, path: path};
    } else if (pobj[name]._auth !== undefined && token.auth < pobj[name]._auth) {
      return {name: null, obj: null, path: path, unauth: true};
    }
    pobj = pobj[name];
  }
  return {name: name, obj: pobj, path: path};
}

function innerToString(name, pobj) {
  if (pobj._type === 'file')
    return ' [f] ' + name;
  else if (pobj._type === 'dir')
    return ' [d] ' + name;
  else
    return ' [wrong] ' + name;
}
