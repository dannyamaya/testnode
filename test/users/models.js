'use strict';

var utils = require('../utils');
var should = require('should');
var User = require('../../models/user');

describe('Users: model', function () {

    describe('#create()', function () {
      it('should create a new User', function (done) {

          var u = {
              name: {
                  first: 'firstname',
                  last:  'lastname'
              },
              email: 'test@email.com',
              password: 'password'
          };

          User.create(u, function (err, createdUser) {
             should.not.exist(err);

             createdUser.name.first.should.equal('firstname');
             createdUser.name.last.should.equal('lastname');
             createdUser.email.should.equal('test@email.com');
             createdUser.email_verified.should.equal(false);

             done();
         });
      });
    });

    describe('#hashPassword()', function () {
      it('should return a hashed password asynchronously', function (done) {

         var password = 'secret';

         User.hashPassword(password, function (err, passwordHash) {
           // Confirm that that an error does not exist
           should.not.exist(err);
           // Confirm that the passwordHash is not null
           should.exist(passwordHash);
           done();
         });
      });
    });

    describe('#comparePasswordAndHash()', function () {
      it('should return true if password is valid', function (done) {

        var password = 'secret';

        // first we need to create a password hash
        User.hashPassword(password, function (err, passwordHash) {
          // Confirm that that an error does not exist
          User.comparePasswordAndHash(password, passwordHash, function (err, areEqual) {
            // Confirm that that an error does not exist
            should.not.exist(err);
            // Confirm that the areEqaul is `true`
            areEqual.should.equal(true);
            // notice how we call done() from the final callback
            done();
          });
        });
      });

      it('should return false if password is invalid', function (done) {

        var password = 'secret';

        // first we need to create a password hash
        User.hashPassword(password, function (err, passwordHash) {
          var fakePassword = 'imahacker';
          // Confirm that that an error does not exist
          User.comparePasswordAndHash(fakePassword, passwordHash, function (err, areEqual) {
            // Confirm that that an error does not exist
            should.not.exist(err);
            // Confirm that the areEqaul is `false`
            areEqual.should.equal(false);
            done();
          });
        });
      });


    });
});
