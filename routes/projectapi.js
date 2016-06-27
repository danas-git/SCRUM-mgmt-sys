var express = require('express');
var router = express.Router();
var mongoose = require( 'mongoose' );
var User = mongoose.model('User');
var Project=mongoose.model('Project');
var UserStory=mongoose.model('UserStory');
var Sprint = mongoose.model('Sprint');


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
router.use('/add', isAuthenticated);
router.use('/role', isAuthenticated);
router.use('/data', isAuthenticated);
router.use('/member', isAuthenticated);
router.use('/types', isAuthenticated);
router.use('/graphdata', isAuthenticated);

//it adds new project to the database making user a the product owner "PO"
router.route('/add')
    .put(function(req, res){
        Project.findOne({'projectName': req.body.projectName},function(err,body){
            if(err){res.send(err);}
            if(body){res.send({message:"Project name already exist"})}
            else{var newProject = new Project();
                newProject.projectName=req.body.projectName;
                newProject.projectDescription=req.body.projectDescription;
                newProject.projectMembers=[{'memberName':req.body.current_user,'memberRole':"ProductOwner"}];
                newProject.projectStatus=[{'status':"new"},{'status':"in progress"},{'status':"done"}];
                newProject.projectStoryType=[{'types':"fix"},{'types':"enhancement"},{'types':"feature"}];
                newProject.save(function(err) {
                    if (err){
                        console.log('Error in Saving Project: '+err);
                        throw err;
                    }else{
                        console.log("Project successfully created");
                        res.send({message: "Project successfully created"});
                    }
                });
            }
        });
    })
    //this method gets the list of projects which the user is part of
    .get(function(req,res){
       console.log(req.param('username'));
        Project.find({'projectMembers.memberName':req.param('username')},function(err,body){
          if(err){
              res.send("Some error: try again later ");
          }else
           res.json(body);
        });
    });

//This route fetches the role of the user for the project which was selected 1project-dropdown
router.route('/role')
    .get(function(req,res){
      //  console.log(req.param('username'),req.param('projectName'));
       // Project.findOne({'projectName':req.param('projectName'),'projectMembers.memberName': req.param('username')},{'projectMembers.memberRole':1},function(err,body){
         Project.findOne({'projectName': req.param('projectName')},{projectMembers:{$elemMatch:{memberName:req.param('username')}}},function(err,body){
           if(err){
               res.send("Some error: try again later ");
           }else
           res.json(body);
        });
    });

//fetches the data
router.route('/data')
    .get(function(req,res){
      //  console.log("heheh"+req.param('username'),req.param('projectName'));
        Project.find({projectName:req.param('projectName')},function(err,body){
            if (err) {
                res.send({message: "Some error: try again later"});
            } else {
             //   console.log(body);
                res.json(body);
            }
        });
    });

//Does Dynamic search for user on ProjectPage...///adds member to project /////// deletes member
router.route('/member')
    .get(function(req,res){

       // var query={username: new RegExp('^'+req.param('username')+'i')};
        //User.find(query),{'username':1}.limit( 5 ),function(err,body){
          User.find({username: new RegExp('^' +req.param('username') ,'i' )},function(err,body){
            if (err) {
                res.send({message: "Some error: try again later"});
            } else {
                console.log("success12");
                res.json(body);
            }
        });
    })
    .post(function(req,res){
        Project.findOne({'projectName':req.body.projectName},{projectMembers:{$elemMatch:{memberName:req.body.username}}},function(err,data1) {//checks if story is already present in sprint
            if (data1) {
                if (data1.projectMembers.length != 0) {
                    res.send({message:"exists"});
                }
                else{
                    Project.update({projectName:req.body.projectName},{$push:{projectMembers:{$each:[{memberName:req.body.username,memberRole:req.body.userRole}]}}},function(err,body){
                        if(err){
                            res.send(err);
                        }else
                            res.send({message:"Added Successfully"});
                    });
                }
            }
        });

    })
    .delete(function(req,res){

        Project.update({projectName:req.param('projectName')},{$pull:{projectMembers:{_id:req.param('id')}}},function(err,body){
            if(err){
                res.send(err);
            }else
                res.send({message:"Deleted Successfully"});
        });
    });

////Edit types to the db////Adds new type
router.route('/types')
    .put(function(req,res){

        Project.update({'projectName':req.body.projectName,'projectStoryType':{$elemMatch:{_id:req.body.id}}},{$set:{'projectStoryType.$.types':req.body.type}},function(err,body){
           if(err){res.send(err);}else res.send(body);
        });
    })
    .post(function(req,res){

        Project.update({'projectName':req.body.projectName},{$push:{projectStoryType:{$each:[{types:req.body.type}]}}},function(err,body){
            if(err){res.send(err)}else res.send(body)
        });
    })
    .delete(function(req,res){
        Project.update({projectName:req.param('projectName')},{$pull:{projectStoryType:{_id:req.param('id')}}},function(err,body){
            if(err){res.send(err)}else res.send(body)
        });
    });

//Edit status to the db///adds new status
router.route('/status')
    .put(function(req,res){

        Project.update({'projectName':req.body.projectName,'projectStatus':{$elemMatch:{_id:req.body.id}}},{$set:{'projectStatus.$.status':req.body.type}},function(err,body){
            if(err){
                res.send(err);
            }else
                res.send(body);
        });
    })
   .post(function(req,res){
        Project.update({'projectName':req.body.projectName},{$push:{projectStatus:{$each:[{status:req.body.status}]}}},function(err,body){
        if(err){res.send(err)}else res.send(body)
        });
    })
    .delete(function(req,res){
        Project.update({projectName:req.param('projectName')},{$pull:{projectStatus:{_id:req.param('id')}}},function(err,body){
            if(err){res.send(err)}else res.send(body)
        });
    });

router.route('/graphdata')
    .get(function(req,res){
        var graphresp=[];
        var totalstories;
        var temp=0;

        var sendjsondata = function(){
            getgraphdata(function(){
               res.json(graphresp);
            });
        }
        function getgraphdata(resultcallback){
            UserStory.find({projectName:req.param('projectName')},function(err,body){
                if (err) {
                    res.send({message: "Some error: try again later"});
                } else {
                    totalstories=body.length;
                    graphresp.push({"sprintnumber":"Sprint0","stories":totalstories});

                    Sprint.find({projectName:req.param('projectName')},function(err,sprintrecords){
                        if (err) {
                            res.send({message: "Some error: try again later"});
                        } else {
                            var i=0;
                            var j=0;
                            var loopArray=function(arr){
                                if(arr.length>0) {
                                    findCount(arr[i]._id, function () {
                                        i++;
                                        if (i < arr.length) {
                                            loopArray(arr);
                                        }
                                        else {
                                            resultcallback();
                                        }
                                    });
                                }else{
                                    resultcallback();
                                }
                            }
                            function findCount(sprintId,callback){

                                UserStory.count({storyFinished_in_sprint:sprintId},function(err,count){
                                    if (err) {
                                        //     console.log("erroruserstory"+err);
                                        res.send({message: "Some error: try again later"});
                                    }
                                    else{
                                        j=j+1;
                                        respcount=count;
                                        temp= totalstories-respcount;
                                        totalstories=temp;
                                        var tempsprint="sprint"+j;
                                        graphresp.push({"sprintnumber":tempsprint,"stories":temp});
                                    }
                                    callback();
                                });
                            }
                            loopArray(sprintrecords);
                        }
                    }).sort({sprintEndDate:1});

                }

            });
        }
        sendjsondata();

    });


module.exports = router;