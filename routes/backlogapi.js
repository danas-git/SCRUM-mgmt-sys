var express = require('express');
var router = express.Router();
var mongoose = require( 'mongoose' );
var User = mongoose.model('User');
var Project=mongoose.model('Project');
var UserStory=mongoose.model('UserStory');


//Used for routes that must be authenticated.
function isAuthenticated (req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects
    if (req.isAuthenticated()){
        return next();
    }
    res.send('401');
}
router.use('/story', isAuthenticated);

router.route('/story')
    .put(function(req, res){
      //  console.log(req);
        var newUserStory=new UserStory();
            newUserStory.projectId=req.body.projectId;
            newUserStory.projectName=req.body.projectName;
            newUserStory.storyName=req.body.name;
            newUserStory.storyStatus=req.body.status;
            newUserStory.storyDescription=req.body.description;
            newUserStory.storyType=req.body.type;
            newUserStory.storyPriority=req.body.priority;
            newUserStory.save(function(err){
                if (err){
                    console.log('Error in Saving USerStory: '+err);
                    throw err;
                }else{
                    //console.log("UserStory successfully created");
                    res.send({message: "userStory successfully created"});
                }
            });
    })
    .get(function(req,res){

        UserStory.find({'projectId':req.param('projectId')},function(err,body){
            if(err){}
            else{res.json(body);}
        });
    })
    .post(function(req,res){
       // console.log(req.body.projectName);//'storyType':req.body.storyType,'storyPriority':req.body.storyPriority,'storyStatus':req.body.storyStatus
        UserStory.update({'_id':req.body._id},{$set:{'storyName':req.body.storyName,'storyDescription':req.body.storyDescription,'storyType':req.body.storyType,'storyPriority':req.body.storyPriority}},function(err,body){
            if(err){}
            else{res.json(body);}
       });
    })
    .delete(function(req,res){
      //  console.log(req.param('id'));//'storyType':req.body.storyType,'storyPriority':req.body.storyPriority,'storyStatus':req.body.storyStatus
        UserStory.remove({'_id':req.param('id')},function(err,body){
            if(err){}
            else{console.log("success");res.json(body);}
        });
    });

module.exports = router;