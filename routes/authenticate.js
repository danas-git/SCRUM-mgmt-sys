var express = require('express');
var router = express.Router();

module.exports = function(passport){
    //sends successful login state back to angular
    router.get('/success', function(req, res){
        res.send({state: 'success', user: req.user ? req.user : null});
    });

    //sends failure login state back to angular
    router.get('/failure1', function(req, res){
        res.send({state: 'failure', user: null, message: "Invalid username or password:Please try again"});
    });
    router.get('/failure2', function(req, res){
        res.send({state: 'failure', user: null, message:  "User already exists with username" });
    });

    //log in
    router.post('/login', passport.authenticate('login', {
        successRedirect: '/auth/success',
        failureRedirect: '/auth/failure1'
    }));

    //sign up
    router.post('/signup', passport.authenticate('signup', {
        successRedirect: '/auth/success',
        failureRedirect: '/auth/failure2'
    }));

    router.get('/loggedin', function(req,res) {
        res.send(req.isAuthenticated() ? req.user : '0');
    });

    //log out
    router.get('/signout', function(req, res) {
        req.logout();
        res.send('200');
    });

    return router;

}