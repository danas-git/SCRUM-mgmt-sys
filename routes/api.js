var express = require('express');
var router = express.Router();
var mongoose = require( 'mongoose' );
var User = mongoose.model('User');
var bCrypt = require('bcrypt-nodejs');

//Used for routes that must be authenticated.
function isAuthenticated (req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler 
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects
    if (req.isAuthenticated()){
        return next();
    }
    res.send('401');
};
router.use('/posts', isAuthenticated);

router.route('/posts')
    .get(function(req, res){
      //  console.log(req.param('username') +"inside req username1");
        User.findOne({'username':req.param('username')}, function(err, post){
            if(err){
                res.send(err);
            }
            res.json(post);
        });
    });
//For Password Update
router.route('/posts/1/:id')
    .put(function(req, res){
        var id=req.params.id;
        User.findById(id,function(err,value){
            if(err){
                res.send(err);
            }
            if(isValidPassword(value,req.body.currentPassword)){
                User.findByIdAndUpdate(id, {$set:{password: createHash(req.body.newPassword)}},function(err,back){
                    if(err){
                        res.send(err);
                    }else
                    res.send({message: "Password Changed Successfully"});
                })
            }
            else{
                res.send({message: "0"});
            }
        })
    });
//For User Credentials Update
router.route('/posts/:id')
    .put(function(req, res){
        var id=req.params.id;
        User.findByIdAndUpdate(id,{ $set:{ email: req.body.email,lastName:req.body.lastName,firstName:req.body.firstName}},function(err,back){
           if(err){
               res.send(err);
           }
            else
           res.json(back);
        });
    })
    .delete(function(req, res) {

    });

var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};
var isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.password);
};

module.exports = router;