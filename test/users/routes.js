
/*
'use strict';

var utils = require('../utils');
var request = require('supertest');
var should = require('should');
var app = require('../../server').app;

describe('Users: routes', function () {
    describe('POST /signup', function () {
        it('should redirect to "/account" if the form is valid', function (done) {
            var post = {
                givenName: 'Barrack',
                familyName: 'Obama',
                email: 'berry@example.com',
                password: 'secret'
            };
        request(app)
        .post('/signup')
        .send(post)
        .expect(302)
        .end(function (err, res) {
            should.not.exist(err);
                // confirm the redirect
                res.header.location.should.include('/account');
                done();
            });
        });
    });
}); */