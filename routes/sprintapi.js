var express = require('express');
var router = express.Router();
var mongoose = require( 'mongoose' );
var Sprint = mongoose.model('Sprint');
var Project=mongoose.model('Project');
var UserStory=mongoose.model('UserStory');
var Task=mongoose.model('Task');
var moment=require('moment');
var $rootUserStories="";

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
router.use('/check', isAuthenticated);
router.use('/addToSprint', isAuthenticated);
router.use('/sprintData', isAuthenticated);
router.use('/history', isAuthenticated);
router.use('/close', isAuthenticated);

function updateSprintStatus(Id,callback){
    Sprint.findOne({'projectId':Id,sprintStatus:"Running"},function(err,data){
        if (err){console.log('error: '+err);
            throw err;}
        if(data!=null){
            var a=moment(data.sprintEndDate);
            var b=moment(Date.now());
            if(a.diff(b)<0){
                Sprint.findOneAndUpdate({'projectId':Id,'sprintStatus':"Running"},{$set:{ 'sprintStatus':"Finished"}},{new:true},function(err,data) {
                    if (err) {
                        console.log('Some error: ' + err);
                        throw err;
                    }
                    else {
                        console.log("findandupdate" + data._id);
                        var sprintid = data._id;
                        UserStory.find({
                            'storyStarted_in_sprint': sprintid,
                            'storyStatus': "in progress"
                        }, function (err, data1) {
                            if (err) {
                                console.log('Some error: ' + err);
                                throw err;
                            }
                            else {
                                if (data1.length != 0) {
                                    console.log(" user stories", data1.length);
                                    console.log("data1", data1);
                                    for (var p = 0; p < data1.length; p++) {
                                        UserStory.update({
                                            'storyStarted_in_sprint': sprintid,
                                            'storyStatus': "in progress"
                                        }, {$set: {'storyStatus': "Already Started"}}, function (err, data) {
                                            if (err) {
                                                console.log('Some error: ' + err);
                                                throw err;
                                            }
                                            else {
                                                console.log("User story updated");
                                            }
                                        })
                                    }
                                }
                            }
                        })
                    }
                })
            }
            return callback(a.diff(b));
        }
        else{return callback(0);}
    });
}

//adds new sprint
router.route('/add')
    .put(function(req, res){

        Sprint.findOne({'projectId':req.body.projectId,'sprintStatus':"Running"},function(err,data){
            if (err){console.log('error: '+err);
                throw err;}
            if(data!=null){
                console.log("sprint already running");
                res.send({message:"101"});}
            if(data==null){
                var x=moment(req.body.sprintEndDate,"MM/DD,YYYY");
                var newSprint=new Sprint();
                newSprint.projectId=req.body.projectId;
                newSprint.projectName=req.body.projectName;
                newSprint.sprintName=req.body.sprintName;
                newSprint.sprintDescription=req.body.sprintDescription;
                newSprint.sprintEndDate=x;
                newSprint.sprintStatus="Running";
                newSprint.save(function(err){
                    if (err){console.log('Error in Saving sprint: '+err);
                        throw err;
                    }else{res.send({message:"100"});}
                })
            }
        });
    });

//check if sprint has expired or not,if then change sprint status to "Finished"
router.route('/check')
    .get(function(req, res){
       updateSprintStatus(req.param('projectId'),function(response){
           console.log("check time"+response);
       });
        res.send("");
    });

router.route('/addToSprint')
    .put(function(req, res){
        updateSprintStatus(req.body.projectId,function(response){//checks if sprint is valid
            if(response>0){
                Sprint.findOne({'projectId':req.body.projectId,sprintStatus:"Running",sprintStory:req.body.id},function(err,data1){//checks if story is already present in sprint
                    if(data1){res.send({message:"102"});console.log("story already exist");}
                    if(!data1){
                        //console.log("good to go and add new sprintStory");
                        Sprint.update({'projectId':req.body.projectId,'sprintStatus':"Running"},{$push:{sprintStory:req.body.id}},function(err,data){//adds story object to sprint
                            if(err){console.log('error: '+err);
                                throw err;}
                            if(data.nModified==1){
                                Sprint.findOne({'projectId':req.body.projectId,sprintStatus:"Running"},function(err,data2){//process to change the storyStatus to "in progress"
                                   if(data2){
                                       UserStory.update({'_id':req.body.id},{$set:{'storyStarted_in_sprint':data2._id,'storyStatus':"in progress"}},function(err,data3){
                                           if(data3.nModified==1){
                                               res.send({message:"103"});
                                           }
                                       });
                                   }
                                });
                            }
                        });
                    }
                });
            }
            else{res.send({message:"104"});}
        });
    });

router.route('/sprintData')
    .get(function(req, res){
        updateSprintStatus(req.param('projectId'),function(response){
            if(response>0){
                Sprint.findOne({'projectId':req.param('projectId'),sprintStatus:"Running"}).populate('sprintStory').exec(function(err,sprint){
                    if(err){console.log('error: '+err);throw err;}

                    if(sprint){res.json(sprint);}
                })
            }
            else{res.send({message:"104"});}
        });
    })
    //Cancels current sprint
    .delete(function(req,res){
        Sprint.findOne({'_id':req.param('id')},function(err,data){
            if(err){console.log('no sprint exist for deletion: '+err);throw err;}
            if(data){
                for(var i = 0; i < data.sprintStory.length; i++){

                    if(data.sprintStory[i]!=""){
                        UserStory.update({'_id':data.sprintStory[i],storyStarted_in_sprint:req.param('id')},
                        {$set:{storyStatus:"new",storyFinished_in_sprint:null,storyStarted_in_sprint:null}},
                        function(err,numAffected){
                            if(numAffected.nModified<=0){
                                UserStory.update({'_id':data.sprintStory[i],storyStarted_in_sprint:{$ne:req.param('id')}},
                                {$set:{storyStatus:"in progress",storyFinished_in_sprint:null}},
                                function(err,numAffected){})
                            }
                        });
                    }
                }
                Sprint.remove({'_id':req.param('id')},function(err,data){
                    if(err){console.log('sprint failed to delete: '+err);throw err;}
                    else{
                        Task.remove({'taskStarted_in_sprint':req.param('id')},function(err,data){
                            if(err){console.log('sprint deletion failure at task level : '+err);throw err;}
                        })
                    }
                })
            }
        });
    res.send("");
    });
//closes the sprint: sets sprint status to finished; sets sprint storyStatus to done; sets taskStatus to done
// as story can only be closed when all its stories are done and story can only be finished when all its tasks are done.
router.route('/close')
    .put(function(req, res){
        for(var i=0;i<req.body.entries.length;i++){
            if(req.body.entries[i].status=="Close"){
                UserStory.findOne({'_id':req.body.entries[i].id},function(err,data){
                    if(err){console.log('sprint failed to close: '+err);throw err;}
                  // console.log(data);
                    //console.log(data.storyTasks.length);
                    for(var j=0;j<data.storyTasks.length;j++){
                       // console.log(data.storyTasks[j]);
                        Task.update({'_id':data.storyTasks[j]},{$set:{'taskFinished_in_sprint':req.body.id,'taskStatus':"completed"}},function(err,data){
                            if(err){console.log('sprint failed to close;taskUpdate error: '+err);throw err;}
                        })
                    }
                });
                UserStory.update({'_id':req.body.entries[i].id},{$set:{storyFinished_in_sprint:req.body.id,'storyStatus':"done"}},function(err,data){
                    if(err){console.log('sprint failed to close;storyUpdate error: '+err);throw err;}
                })
            }
        }
        Sprint.update({'_id':req.body.id},{$set:{ sprintStatus:"Finished",'sprintEndDate':Date.now()}},function(err,data){
            if(err){console.log('sprint failed to close;sprintUpdate error: '+err);throw err;}
            else {
                //added to change status of user story to reopen
                $rootUserStories = req.body.id;
                console.log("Sprint ID",$rootUserStories);
                UserStory.find({'storyStarted_in_sprint': $rootUserStories,'storyStatus':"in progress"}, function (err, data1) {
                    if (err) {
                        console.log('Some error: ' + err);
                        throw err;
                    }
                    else {
                        if(data1.length != 0) {
                            console.log(" user stories",data1.length);
                            console.log("data1",data1);
                            for(var p=0;p<data1.length;p++) {
                                UserStory.update({
                                    'storyStarted_in_sprint': $rootUserStories,
                                    'storyStatus': "in progress"
                                }, {$set: {'storyStatus': "Already Started"}}, function (err, data) {
                                    if (err) {
                                        console.log('Some error: ' + err);
                                        throw err;
                                    }
                                    else {
                                        console.log("User story updated");
                                    }
                                })
                            }
                        }
                    }
                })
            }
        });
        res.send("hi");
    });

router.route('/history')
    .get(function(req, res){
        Sprint.find({'projectId':req.param('projectId'),sprintStatus:"Finished"}).exec(function(err,sprint){
            if(err){console.log('error: '+err);throw err;}
            if(sprint){res.json(sprint);}
        })
    });
router.route('/closeSprintStory')
    .get(function(req,res){
        closeflag=true;
        closeSprintStory(function(){
            if(closeflag==false){
                res.send({'status':"failure"});
            }
            else{
                UserStory.update({
                    '_id': req.param('storyID')
                }, {$set: {'storyFinished_in_sprint':req.param('sprintID'),'storyStatus': "done"}}, function (err, data) {
                    if (err) {
                        console.log('Some error: ' + err);
                        throw err;
                    }
                    else {

                        res.send({'status':"success"});
                    }
                })
            }
        });
        function closeSprintStory(callback) {

            console.log(req.param('storyID'));
            UserStory.find({'_id': req.param('storyID')}, function (err, data) {
                if (err) {
                    console.log('error: ' + err);
                    throw err;
                } else {
                    if (data.length != 0) {
                        var i=0;
                        var loopArray=function(arr) {
                            if (arr.length > 0) {
                                findCount(arr[i], function () {
                                    i++;
                                    if (i < arr.length) {
                                        loopArray(arr);
                                    }
                                    else {
                                        callback();
                                    }
                                });
                            } else {
                                callback();
                            }
                        }
                        function findCount(storyid,onincompletetasks){
                            Task.count({
                                '_id': storyid,
                                taskStatus: {$ne: "completed"}
                            }, function (err, count) {
                                if (err) {
                                    console.log('error: ' + err);
                                    throw err;
                                } else {
                                    if (count > 0) {
                                        closeflag = false;
                                    }

                                }
                                onincompletetasks();
                            })
                        }
                        loopArray(data[0].storyTasks)
                    }
                }
            })
        }
    });

module.exports = router;