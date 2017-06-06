  'use strict';

  var config = require('../config/config');
  var mongoose = require('mongoose');

  var User = require('../models/user');

  beforeEach(function (done) {

    function clearDB() {
      for (var i in mongoose.connection.collections) {
        mongoose.connection.collections[i].remove(function() {});
      }

      User.find().remove();

      return done();
    }

    function reconnect() {
      mongoose.connect(config.test.db, function (err) {
        if (err) {
          throw err;
        }
        return clearDB();
      });
    }

    function checkState() {
      switch (mongoose.connection.readyState) {
      case 0:
         reconnect();
         break;
      case 1:
         clearDB();
         break;
      default:
         process.nextTick(checkState);
      }
    }

    checkState();
  });

  afterEach(function (done) {
    mongoose.disconnect();
    return done();
  });


