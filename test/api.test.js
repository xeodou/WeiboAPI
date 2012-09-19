/*!
 * yet another Weibo API
 * Copyright(c) 2012 rockdai <rockdai@qq.com>
 */

/**
 * Module dependencies.
 */

var rewire = require('rewire');
var should = require('should');
var api = process.env.WB_API_COV ? rewire('../lib-cov/api') : rewire('../lib/api');

var USERNAME = 'weibo@rockdai.com';
var PASSWORD = 'Internet!@#';
var APIS = [
  'login',
  'getUser',
  'update',
  'search',
  'comment',
  'msgList',
  'msgChatList',
  'msgSend'
];

describe('api.test.js', function () {
  var cookie = 'USER_LAST_LOGIN_NAME=weibo%40rockdai.com;gsid_CTandWM=3_5bcf000bb1c0a7e94479590525a58c533d60e082b4ff';
  var captId;

  describe('#login() normal', function () {
    it('should get CAPTCHA code', function (done) {
      api.login(USERNAME, 'FAKE_PASSWD', function (err, data) {
        should.not.exist(err);
        should.exist(data);
        data.cookies.should.be.a('string');
        data.captcha.should.be.a('string');
        captId = data.captcha;
        done();
      });
    });
    // it('should login', function (done) {
    //   api.login(USERNAME, PASSWORD, function (err, data) {
    //     should.not.exist(err);
    //     should.exist(data);
    //     should.not.exist(data.captcha);
    //     data.cookies.should.be.a('string');
    //     var gsid = data.cookies.indexOf('gsid_');
    //     gsid.should.above(0);
    //     cookie = data.cookies;
    //     done();
    //   });
    // });
  });

  describe('#getUser() normal', function () {
    var query = { uid: '2957300904' };

    it('should get arguments missing error', function (done) {
      api.getUser(cookie, {}, function (err, result) {
        should.exist(err);
        err.message.should.equal('arguments missing');
        done();
      });
    });
    it('should get response', function (done) {
      api.getUser(cookie, query, function (err, user) {
        should.not.exist(err);
        user.ok.should.equal(1);
        user.should.have.property('userInfo');
        user.userInfo.id.should.equal(query.uid);
        done();
      });
    });
  });

  describe('#update() normal', function () {
    var query = { uid: '2957300904', status: 'unitest' + (new Date()).valueOf() };

    it('should get arguments missing error', function (done) {
      api.update(cookie, {}, function (err, result) {
        should.exist(err);
        err.message.should.equal('arguments missing');
        done();
      });
    });
    it('should get response', function (done) {
      api.update(cookie, query, function (err, result) {
        should.not.exist(err);
        result.should.have.property('id');
        result.should.have.property('status');
        result.status.should.have.property('id');
        result.status.text.should.equal(query.status);
        done();
      });
    });
  });

  describe('#search() normal', function () {
    var query = { keyword: '李开复', page: 1 };

    it('should get response', function (done) {
      api.search(cookie, query, function (err, result) {
        should.not.exist(err);
        result.list.length.should.above(1);
        result.list[0]['id'].should.be.a('string');
        result.maxPage.should.above(0);
        done();
      });
    });
  });

  describe('#comment() normal', function () {
    var query = { id: '4212805', content: 'unitest' + (new Date().valueOf()) };

    it('should get arguments missing error', function (done) {
      api.comment(cookie, {}, function (err, result) {
        should.exist(err);
        err.message.should.equal('arguments missing');
        done();
      });
    });
    it('should send comment', function (done) {
      api.comment(cookie, query, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  describe('#msgList() normal', function () {
    var cookieRockDai = 'USER_LAST_LOGIN_NAME=15055309432; gsid_CTandWM=3_58a34a14e638d7dced679dff85bb5e01aeea793ed15c';
    var query = { page: 3 };

    it('should get arguments missing error', function (done) {
      api.msgList(cookie, {}, function (err, result) {
        should.exist(err);
        err.message.should.equal('arguments missing');
        done();
      });
    });
    it('should get messages', function (done) {
      api.msgList(cookieRockDai, query, function (err, messages) {
        should.not.exist(err);
        messages.should.have.property('list');
        messages.list.should.be.an.instanceOf(Array);
        messages.should.have.property('total');
        done();
      });
    });
  });

  describe('#msgChatList() normal', function () {
    var cookieRockDai = 'USER_LAST_LOGIN_NAME=15055309432; gsid_CTandWM=3_58a34a14e638d7dced679dff85bb5e01aeea793ed15c';
    var query = { page: 1, uid: '1774310572' };

    it('should get arguments missing error', function (done) {
      api.msgChatList(cookie, {}, function (err, result) {
        should.exist(err);
        err.message.should.equal('arguments missing');
        done();
      });
    });
    it('should get chat messages', function (done) {
      api.msgChatList(cookieRockDai, query, function (err, messages) {
        should.not.exist(err);
        messages.should.have.property('user');
        messages.user.id.should.equal(query.uid);
        messages.should.have.property('maxPage');
        messages.should.have.property('previous_cursor');
        messages.should.have.property('next_cursor');
        messages.should.have.property('list');
        var list = messages.list;
        list.should.be.an.instanceOf(Array);
        for (var i = 0, l = list.length; i < l; i++) {
          list[i].id.should.be.a('string');
          list[i].time.should.be.a('string');
          list[i].text.should.be.a('string');
          list[i].type.should.be.a('number');
        }
        done();
      });
    });
  });

  describe('#msgSend() normal', function () {
    var cookieRockDai = 'USER_LAST_LOGIN_NAME=15055309432; gsid_CTandWM=3_58a34a14e638d7dced679dff85bb5e01aeea793ed15c';
    var query = { nick: 'RockDai01', content: 'unitest' + (new Date().valueOf()) };

    it('should get arguments missing error', function (done) {
      api.msgSend(cookie, {}, function (err, result) {
        should.exist(err);
        err.message.should.equal('arguments missing');
        done();
      });
    });
    it('should send chat messages', function (done) {
      api.msgSend(cookieRockDai, query, function (err, result) {
        should.not.exist(err);
        result.should.have.property('user');
        result.user.screen_name.should.equal(query.nick);
        result.should.have.property('msg');
        result.msg.text.should.equal(query.content);
        done();
      });
    });
  });

  describe('#msgDelete() normal', function () {
    var cookieRockDai = 'USER_LAST_LOGIN_NAME=15055309432; gsid_CTandWM=3_58a34a14e638d7dced679dff85bb5e01aeea793ed15c';
    var msgIds = [];
    before(function (done) {
      // send three messages
      for (var i = 0; i < 3; i++) {
        (function (i) {
          var query = {
            nick: 'RockDai01',
            content: 'unitest' + (new Date().valueOf())
          };
          api.msgSend(cookieRockDai, query, function (err, result) {
            should.not.exist(err);
            result.should.have.property('msg');
            msgIds.push(result.msg.id);
            if (msgIds.length === 3) {
              done();
              return;
            }
          });
        })(i);
      }
    });

    after(function (done) {
      done();
    });

    it('should get arguments missing error', function (done) {
      api.msgDelete(cookie, {}, function (err, result) {
        should.exist(err);
        err.message.should.equal('arguments missing');
        done();
      });
    });
    it('should delete message by single id', function (done) {
      var toDeleteId = msgIds.pop();
      var query = { id: toDeleteId };
      api.msgDelete(cookieRockDai, query, function (err, result) {
        should.not.exist(err);
        result.should.be.an.instanceOf(Array);
        result.length.should.equal(1);
        result[0].should.have.property('idstr');
        result[0].idstr.should.equal(toDeleteId);
        done();
      });
    });
    it('should delete message by batch ids', function (done) {
      var query = { id: msgIds };
      api.msgDelete(cookieRockDai, query, function (err, result) {
        should.not.exist(err);
        result.should.be.an.instanceOf(Array);
        var len = result.length;
        len.should.equal(2);
        for (var i = 0; i < len; i++) {
          result[i].should.have.property('idstr');
          msgIds.indexOf(result[i].idstr).should.above(-1);
        }
        done();
      });
    });
  });

  describe('http request error', function () {
    var _urllib;
    var query = {
      uid: '12345',
      id: '4212805',
      status: 'unitest',
      content: 'unitest',
      keyword: 'unitest',
      page: 1,
      nick: 'RockDai01'
    };
    before(function (done) {
      _urllib = api.__get__('urllib');
      var mockUrllib = {
        request: function (url, args, callback) {
          return callback(new Error('Error occurred'));
        }
      };
      api.__set__('urllib', mockUrllib);
      done();
    });
    after(function (done) {
      api.__set__('urllib', _urllib);
      done();
    });
    APIS.forEach(function (m, index) {
      it('#' + m + '()', function (done) {
        if (m === 'login') {
          api[m](USERNAME, PASSWORD, function (err) {
            should.exist(err);
            err.message.should.equal('Error occurred');
            done();
          });
        } else {
          api[m](cookie, query, function (err) {
            should.exist(err);
            err.message.should.equal('Error occurred');
            done();
          });
        }
      });
    });
  });

});