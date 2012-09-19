/*!
 * yet another Weibo API
 * Copyright(c) 2012 rockdai <rockdai@qq.com>
 */

"use strict";

/**
 * Module dependencies
 */

var urllib = require('urllib');

var DOMAIN      = 'http://m.weibo.cn';
var URL_LOGIN   = DOMAIN + '/login';
var URL_USER    = DOMAIN + '/home/homeData?u={{UID}}&page=1&_=1345363841483';
var URL_UPDATE  = DOMAIN + '/mblogDeal/addAMblog?uid={{UID}}&st=5aa4&';
var URL_SEARCH  = DOMAIN + '/searchs/weibo?key={{KEYWORD}}&page={{PAGE}}&_=1345356646213';
var URL_COMMENT = DOMAIN + '/commentDeal/addCmt?id={{ID}}&st=5aa4&';
var URL_MSGLST  = DOMAIN + '/msg/getMsgUserList?page={{PAGE}}&&_=1347389732203';
var URL_MSGCHAT = DOMAIN + '/msg/getMsgChatList?uid={{UID}}&page={{PAGE}}&&_=1347391757340';
var URL_MSGSEND = DOMAIN + '/msgDeal/sendMsg?st=5aa4&';
var URL_MSGDEL  = DOMAIN + '/msgDeal/deleteMsgById?id={{ID}}&st=5aa4&';
var VERIFIED    = 'http://u1.sinaimg.cn/upload/2011/07/28/5338.gif';
var headers = {
  'Accept' : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Charset': 'UTF-8,*;q=0.5',
  'Accept-Language' : 'zh-CN,zh;q=0.8',
  'Cache-Control': 'max-age=0',
  'Connection' : 'keep-alive',
  'Host' : 'm.weibo.cn',
  'Referer' : 'http://m.weibo.cn/',
  'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:14.0) Gecko/20100101 Firefox/14.0.1'
};

// 登录
var login = exports.login = function (user, passwd, captcha, cb) {
  if (typeof captcha === 'function' && !cb) {
    cb = captcha;
    captcha = {};
  }
  var postData = {
    check : '1',
    backURL : '/',
    uname : user,
    pwd : passwd,
    autoLogin : '1'
  };
  if (captcha && captcha.id && captcha.code) {
    postData.captId = captcha.id;
    postData.code = captcha.code;
  }
  var h = JSON.parse(JSON.stringify(headers));
  h['Content-Type'] = 'application/x-www-form-urlencoded';
  var args = { type: 'POST', headers: h, data: postData };
  urllib.request(URL_LOGIN, args, function (err, data, res) {
    if (err) {
      return cb(err);
    }
    var result = {};
    var body = data.toString();
    // save cookies no matter succeed or not
    if (res.headers['set-cookie']) {
      var cookies = [];
      res.headers['set-cookie'].forEach(function (cookie, i) {
        cookies.push(cookie.split(';')[0]);
      });
      result.cookies = cookies.join(';');
    }
    // CAPTCHA occurred
    if (body.indexOf('captId') !== -1) {
      var reg = /<input(\s+)id=\"captId\"(\s+)type=\"hidden\"(\s+)name=\"captId\"(\s+)value=\"(.*?)\"(\s+)\/>/i;
      var parsed = reg.exec(body);
      if (!parsed[5]) {
        return cb(new Error('get CAPTCHA code failed'));
      }
      result.captcha = parsed[5];
      result.captchaUrl = 'http://weibo.cn/interface/f/ttt/captcha/show.php?c=' + parsed[5];
      return cb(null, result);
    }
    // username or password incorrect
    if (body.indexOf('登录名或密码错误') !== -1) {
      return cb(new Error('username or password incorrect'));
    }
    // login succeed
    if (res.statusCode === 302 && res.headers.location === '/') {
      return cb(null, result);
    }
    return cb(new Error('login failed'));
  });
};

// 获取用户信息
var getUser = exports.getUser = function (cookies, query, cb) {
  query = query || {};
  var uid = query.uid || '';
  if (!cookies || !uid) {
    return cb(new Error('arguments missing'));
  }
  var url = URL_USER.replace('{{UID}}', encodeURIComponent(uid));
  var h = JSON.parse(JSON.stringify(headers));
  h['Cookie'] = cookies;
  var args = { type: 'GET', headers: h };
  urllib.request(url, args, function (err, data, res) {
    if (err) {
      return cb(err);
    }
    var json;
    try {
      json = JSON.parse(data.toString());
    } catch (ex) {
      return cb(ex);
    }
    if (json.ok !== 1) {
      var err = new Error('get user failed');
      err.msg = json.msg;
      return cb(err);
    }
    return cb(null, json);
  });
};

// 发微博
var update = exports.update = function (cookies, query, cb) {
  query = query || {};
  var status = query.status || '';
  var uid = query.uid || '';
  if (!cookies || !status || !uid) {
    return cb(new Error('arguments missing'));
  }
  var url = URL_UPDATE.replace('{{UID}}', encodeURIComponent(uid));
  var h = JSON.parse(JSON.stringify(headers));
  h['Cookie'] = cookies;
  h['Content-Type'] = 'application/x-www-form-urlencoded';
  var args = { type: 'POST', headers: h, data: { content: status } };
  urllib.request(url, args, function (err, data, res) {
    if (err) {
      return cb(err);
    }
    var json;
    try {
      // 原字符串中包含了 \" 这样的内容，直接用 JSON.parse 会抛 Unexpected token 异常
      // 除非使用 \\" ，这是临时方案
      json = eval('(' + data.toString() + ')');
    } catch (ex) {
      return cb(ex);
    }
    if (json.ok !== 1) {
      var err = new Error('update failed');
      err.msg = json.msg;
      return cb(err);
    }
    var result = {
      id: uid,
      status: {
        id: json.id,
        text: status
      }
    };
    return cb(null, result);
  });
};

// 搜索
var search = exports.search = function (cookies, query, cb) {
  query = query || {};
  var keyword = query.keyword || '';
  var page = query.page || '';
  if (!cookies || !keyword || !page) {
    return cb(new Error('arguments missing'));
  }
  var url = URL_SEARCH
              .replace('{{KEYWORD}}', encodeURIComponent(keyword))
              .replace('{{PAGE}}', encodeURIComponent(page));
  var h = JSON.parse(JSON.stringify(headers));
  h['Cookie'] = cookies;
  var args = { type: 'GET', headers: h };
  urllib.request(url, args, function (err, data, res) {
    if (err) {
      return cb(err);
    }
    var json;
    try {
      json = JSON.parse(data.toString());
    } catch (ex) {
      return cb(ex);
    }
    if (json.ok !== 1) {
      var err = new Error('search failed');
      err.msg = json.msg;
      return cb(err);
    }
    var result = formatSearchResult(json);
    return cb(null, result);
  });
};

function formatSearchResult(json) {
  var result = { list: [] };
  if (!json) return result;
  result.maxPage = typeof json.maxPage === 'undefined' ? 1 : json.maxPage;
  var list = json.mblogList || {};
  for (var id in list) {
    var status = { id: id };
    var mb = list[id];
    status.mid = mb.bid;
    status.bid = mb.bid;
    status.uid = mb.uid;
    status.text = mb.cont.replace(/<[^>]*>/g, "");
    status.t_url = 'http://weibo.com/' + status.uid + '/' + status.bid;
    status.source = mb.info && mb.info[2];
    if (mb.pic && mb.pic.length) {
      status.thumbnail_pic = mb.pic[0];
      status.bmiddle_pic = mb.pic[1];
      status.original_pic = mb.pic[2];
    }
    status.favorited = mb.faved === 0 ? false : true;
    status.user = {
      id: mb.uid,
      screen_name: mb.info && mb.info[0],
      profile_image_url: 'http://tp1.sinaimg.cn/' + mb.uid + '/50/0/1',
      gender: mb.gender === '他' ? 'm' : mb.gender === '她' ? 'f' : '',
      location: mb.location,
      followers_count: mb.fans,
      verified: (Array.isArray(mb.vip) && mb.vip.indexOf(VERIFIED) >= 0) ? true : false,
      avatar_large: 'http://tp1.sinaimg.cn/' + mb.uid + '/180/0/1'
    };
    result.list.push(status);
  }
  return result;
}

// 评论
var comment = exports.comment = function (cookies, query, cb) {
  query = query || {};
  var id = query.id || '';
  var content = query.content || '';
  if (!cookies || !id || !content) {
    return cb(new Error('arguments missing'));
  }
  var url = URL_COMMENT.replace('{{ID}}', encodeURIComponent(id));
  var h = JSON.parse(JSON.stringify(headers));
  h['Cookie'] = cookies;
  h['Content-Type'] = 'application/x-www-form-urlencoded';
  var args = { type: 'POST', headers: h, data: { content: content } };
  urllib.request(url, args, function (err, data, res) {
    if (err) {
      return cb(err);
    }
    var json;
    try {
      // 原字符串中包含了 \" 这样的内容，直接用 JSON.parse 会抛 Unexpected token 异常
      // 除非使用 \\" ，这是临时方案
      json = eval('(' + data.toString() + ')');
    } catch (ex) {
      return cb(ex);
    }
    if (json.ok !== 1) {
      var err = new Error('comment failed');
      err.msg = json.msg;
      return cb(err);
    }
    return cb();
  });
};

// 获取私信列表
var msgList = exports.msgList = function (cookies, query, cb) {
  query = query || {};
  var page = query.page || '';
  if (!cookies || !page) {
    return cb(new Error('arguments missing'));
  }
  var url = URL_MSGLST.replace('{{PAGE}}', encodeURIComponent(page));
  var h = JSON.parse(JSON.stringify(headers));
  h['Cookie'] = cookies;
  var args = { type: 'GET', headers: h };
  urllib.request(url, args, function (err, data, res) {
    if (err) {
      return cb(err);
    }
    var json;
    try {
      json = JSON.parse(data.toString());
    } catch (ex) {
      return cb(ex);
    }
    if (json.ok !== 1) {
      if (json.msg === '没有私信数') {
        return cb(null, { total: 0, list: [] });
      }
      var err = new Error('get message list failed');
      err.msg = json.msg;
      return cb(err);
    }
    var result = formatMsgLstResult(json);
    return cb(null, result);
  });
};

function formatMsgLstResult(json) {
  var result = { list: [] };
  if (!json) return result;
  result.maxPage = typeof json.maxPage === 'undefined' ? 1 : json.maxPage;
  result.total = typeof json.total === 'undefined' ? 0 : json.total;
  var list = json.data || {};
  for (var id in list) {
    var msg = { id: id };
    var m = list[id];
    msg.time = m.time; // TODO: format date
    msg.text = m.text.replace(/<[^>]*>/g, "");
    msg.total = m.total;
    msg.type = m.type;
    msg.unread_count = m.unread_count;
    msg.user = {
      id: m.uid,
      screen_name: m.name,
      profile_image_url: 'http://tp1.sinaimg.cn/' + m.uid + '/50/0/1',
      avanta: m.avanta,
      verified: (Array.isArray(m.vip) && m.vip.indexOf(VERIFIED) >= 0) ? true : false,
      avatar_large: 'http://tp1.sinaimg.cn/' + m.uid + '/180/0/1'
    };
    result.list.push(msg);
  }
  return result;
}

// 获取与某人的私信记录
var msgChatList = exports.msgChatList = function (cookies, query, cb) {
  query = query || {};
  var uid = query.uid || '';
  var page = query.page || '';
  if (!cookies || !uid || !page) {
    return cb(new Error('arguments missing'));
  }
  var url = URL_MSGCHAT
              .replace('{{UID}}', encodeURIComponent(uid))
              .replace('{{PAGE}}', encodeURIComponent(page));
  var h = JSON.parse(JSON.stringify(headers));
  h['Cookie'] = cookies;
  var args = { type: 'GET', headers: h };
  urllib.request(url, args, function (err, data, res) {
    if (err) {
      return cb(err);
    }
    var json;
    try {
      json = JSON.parse(data.toString());
    } catch (ex) {
      return cb(ex);
    }
    if (json.ok !== 1) {
      var err = new Error('get chat list failed');
      err.msg = json.msg;
      return cb(err);
    }
    var result = formatMsgChatLstResult(json);
    return cb(null, result);
  });
};

function formatMsgChatLstResult(json) {
  var result = { list: [] };
  if (!json) return result;
  result.maxPage = typeof json.maxPage === 'undefined' ? 1 : json.maxPage;
  result.previous_cursor = typeof json.previous_cursor === 'undefined' ? 0 : json.previous_cursor;
  result.next_cursor = typeof json.next_cursor === 'undefined' ? 0 : json.next_cursor;
  var data = json.data || {};
  var userInf = data.userInfo || {};
  var list = data.msgInfo || {};
  result.user = {
    id: userInf.uid,
    screen_name: userInf.name,
    profile_image_url: 'http://tp1.sinaimg.cn/' + userInf.uid + '/50/0/1',
    avanta: userInf.avanta,
    verified: (Array.isArray(userInf.vip) && userInf.vip.indexOf(VERIFIED) >= 0) ? true : false,
    avatar_large: 'http://tp1.sinaimg.cn/' + userInf.uid + '/180/0/1'
  };
  for (var id in list) {
    var msg = { id: id };
    var m = list[id];
    msg.time = m.time; // TODO: format date
    msg.text = m.text.replace(/<[^>]*>/g, "");
    msg.type = m.type;
    result.list.push(msg);
  }
  return result;
}

// 发私信
var msgSend = exports.msgSend = function (cookies, query, cb) {
  query = query || {};
  var nick = query.nick || '';
  var gid = query.gid || '';
  var content = query.content || '';
  if (!cookies || !nick || !content) {
    return cb(new Error('arguments missing'));
  }
  var postData = {
    nick: nick,
    gid: gid,
    content: content
  };
  var url = URL_MSGSEND;
  var h = JSON.parse(JSON.stringify(headers));
  h['Cookie'] = cookies;
  h['Content-Type'] = 'application/x-www-form-urlencoded';
  var args = { type: 'POST', headers: h, data: postData };
  urllib.request(url, args, function (err, data, res) {
    if (err) {
      return cb(err);
    }
    var json;
    try {
      json = JSON.parse(data.toString());
    } catch (ex) {
      return cb(ex);
    }
    if (json.ok !== 1) {
      var err = new Error('send message failed');
      err.msg = json.msg;
      return cb(err);
    }
    var data = json.data || {};
    var msgInfo = data.msgInfo || {};
    var userInf = data.userInfo || {};
    var msgId = Object.keys(msgInfo);
    if (!msgId || !msgId.length) {
      return cb(new Error('no message id'));
    }
    msgId = msgId[0];
    var m = msgInfo[msgId];
    var result = {
      user: {
        id: userInf.uid,
        screen_name: userInf.name,
        profile_image_url: 'http://tp1.sinaimg.cn/' + userInf.uid + '/50/0/1',
        avanta: userInf.avanta,
        verified: (Array.isArray(userInf.vip) && userInf.vip.indexOf(VERIFIED) >= 0) ? true : false,
        avatar_large: 'http://tp1.sinaimg.cn/' + userInf.uid + '/180/0/1'
      },
      msg: {
        id: msgId,
        time: m.time, // TODO: format date
        text: m.text.replace(/<[^>]*>/g, ""),
        type: m.type
      }
    };
    return cb(null, result);
  });
};

// 删除私信
var msgDelete = exports.msgDelete = function (cookies, query, cb) {
  query = query || {};
  var id = query.id || '';
  if (!cookies || !id) {
    return cb(new Error('arguments missing'));
  }
  var ids = '';
  if (Array.isArray(id)) {
    ids = id.join(',');
  } else if ('string' === typeof id) {
    ids = id;
  } else {
    return cb(new Error('invalid id'));
  }
  var url = URL_MSGDEL.replace('{{ID}}', encodeURIComponent(ids));
  var h = JSON.parse(JSON.stringify(headers));
  h['Cookie'] = cookies;
  var args = { type: 'GET', headers: h };
  urllib.request(url, args, function (err, data, res) {
    if (err) {
      return cb(err);
    }
    var json;
    try {
      json = JSON.parse(data.toString());
    } catch (ex) {
      return cb(ex);
    }
    if (json.ok !== 1) {
      var err = new Error('delete message failed');
      err.msg = json.msg;
      return cb(err);
    }
    var apirtn = json.apirtn || {};
    var result = apirtn.rst || [];
    return cb(null, result);
  });
};