// injection_data
// -*- coding: utf-8 -*-
// vim:fenc=utf-8
// vim:foldmethod=syntax
// vim:foldnestmax=1
//
"use strict;"

var recovery = {
  _type: 'dir',
  'recovery instructions': {
    _type: 'file',
    _content: '\
==================================\n\
SYSTEM CONSOLE APOCALYPSE RECOVERY\n\
==================================\n\
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
  email_from_door: {
    _type: 'file',
    _content: '\
From: door@system.com\n\
To: admin@system.com\n\
Subject: [RE: wrong auth problem]\n\
\n\
Ok ok got it!!\n\
I have created the command "lsdoor", which permits to list\n\
directories with door privilages.\n\
Just please, remove the script when you have solved the problem!\n\
\n\
 > From: admin@system.com\n\
 > To: door@system.com\n\
 > Subject: Wrong auth problem\n\
 > \n\
 > We can\'t continue with this line of work! Those security\n\
 > upgrades are just thwarting my work, please door you have to\n\
 > give access to the recovery user to your home directory. At least\n\
 > to be able to list the content. Just until this work is over.\n\
 > Regards,\n\
 > Administrator\n\
 >'
  }
};

var door = {
  _type: 'dir',
  _auth: 1,
  current_password: {
    _type: 'file',
    _content: 'Password for door user: dontopen'
  },
  close_door_procedure: {
    _type: 'file',
    _content: 'Execute the command close_doors to close the doors!'
  },
  email_from_weapon: {
    _type: 'file',
    _content: '\
From: weapon@system.com\n\
To: door@system.com\n\
Subject: [RE: script for listing]\n\
\n\
Ok, done.\n\
Just for you to know, I have found a command injection\n\
vulnerability in your script. I think I have fixed it.\n\
\n\
 > From: door@system.com\n\
 > To: weapon@system.com\n\
 > Subject: script for listing\n\
 > \n\
 > Hi weapon,\n\
 > I have recently written this script for listing a directory\n\
 > with another user authentication, can you install it in your\n\
 > account with the name lsweapon?\n\
 > Just until this situation is solved.\n\
 >'
  }
};

var weapon = {
  _type: 'dir',
  _auth: 2,
  current_password: {
    _type: 'file',
    _content: 'Password for weapon user: blowit'
  },
  activate_weapons_procedure: {
    _type: 'file',
    _content: 'Execute the command activate_weapons to activate the defence system!'
  },
  email_from_purge: {
    _type: 'file',
    _content: '\
From: purge@system.com\n\
To: weapon@system.com\n\
Subject: [RE: FWD: script for listing]\n\
\n\
Look I think there is a way to bypass your countermeasures.\n\
Now I have hardened the security checks, I don\'t think someone\n\
will be able to exploit it!\n\
BTW, you should fix it too!\n\
\n\
 > From: weapon@system.com\n\
 > To: purge@system.com\n\
 > Subject: FWD: script for listing\n\
 > \n\
 > Hi purge,\n\
 > This administration stuff is rather silly, but nobody can\n\
 > question a sysadmin...\n\
 > Install the script lspurge, until this situation is resolved.\n\
 >'
  }
};

var purge = {
  _type: 'dir',
  _auth: 3,
  current_password: {
    _type: 'file',
    _content: 'Password for purge user: purgethemall'
  },
  purge_procedure: {
    _type: 'file',
    _content: 'Execute the command execute_purge to purge the enemy!'
  }
};

var structure = {
  _type: 'dir',
  system: {
    _type: 'dir',
    recovery: recovery,
    weapon: weapon,
    door: door,
    purge: purge
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
