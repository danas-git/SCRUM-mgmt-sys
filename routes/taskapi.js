/**
 * Created by DELL on 1/15/2016.
 */
var express = require('express');
var router = express.Router();
var mongoose = require( 'mongoose' );
var Sprint = mongoose.model('Sprint');
var Project=mongoose.model('Project');
var UserStory=mongoose.model('UserStory');
var Task=mongoose.model('Task');
var moment=require('moment');

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
router.use('/data', isAuthenticated);
router.use('/add', isAuthenticated);
router.use('/update', isAuthenticated);
router.use('/delete', isAuthenticated);
router.use('/myTasks', isAuthenticated);

function updateSprintStatus(Id,callback){
    Sprint.findOne({'projectId':Id,sprintStatus:"Running"},function(err,data){
        if (err){console.log('error: '+err);
            throw err;}
        if(data!=null){
            var a=moment(data.sprintEndDate);
            var b=moment(Date.now());
            if(a.diff(b)<0){
                Sprint.findOneAndUpdate({'projectId':Id,'sprintStatus':"Running"},{$set:{ 'sprintStatus':"Finished"}},{new:true},function(err,data){
                    if (err){console.log('Some error: '+err);
                        throw err;}
                })
            }
            return callback(a.diff(b));
        }
        else{return callback(0);}
    });
}

//checks if sprint has expired or not,if then change sprint status to "Finished"
router.route('/data')
    .get(function(req, res){
        //console.log(req.param('projectId'));
        updateSprintStatus(req.param('projectId'),function(response){
            if(response>0){
                Sprint.findOne({'projectId':req.param('projectId'),sprintStatus:"Running"},function(err,data1) {
                    if(data1){
                        Sprint.findOne({'projectId':req.param('projectId'),sprintStatus:"Running"})
                            .populate({
                                path:'sprintStory',
                                populate:{
                                    path:'storyTasks',
                                    model:'Task'
                                   // match:{taskStarted_in_sprint:data1._id}
                                }
                            })
                            .exec(function(err,sprint){
                                if(err){console.log('error: '+err);throw err;}

                                if(sprint){res.json(sprint);}
                            })
                    }
                });
            }
            else{res.send({message:"104"});}
        });
    });

//adds new task and its reference in userStory
router.route('/add')
    .put(function(req, res) {
        updateSprintStatus(req.body.projectId,function(response){
            if(response>0){
                Sprint.findOne({'projectId':req.param('projectId'),sprintStatus:"Running"},function(err,data1) {
                    if(data1){
                        var newTask=new Task();
                        newTask.projectId=req.body.projectId;
                        newTask.taskName=req.body.taskName;
                        newTask.taskDescription=req.body.taskDescription;
                        newTask.taskStarted_in_sprint=data1._id;
                        newTask.taskStatus="not started";
                        newTask.taskAssigned_to="not assigned";
                        newTask.save(function(err,object){
                            if (err){console.log('Error in adding Task: '+err);
                                throw err;
                            }
                            Task.findOne({'_id':object._id},function(err,data2){
                                if(data2){
                                    UserStory.update({'_id':req.body.storyId},{$push:{'storyTasks':data2._id}},function(err,data){
                                        if (err){console.log('Error in adding task to story collection: '+err);
                                            throw err;}
                                        if(data){
                                            console.log("taskAdded Successfully");
                                            res.send({message:"task Created"});
                                        }
                                    });
                                }
                            });
                        })
                    }
                });
            }
            else{res.send({message:"104"});}
        });
    });

//updates the task.
router.route('/update')
    .post(function(req, res) {
                Task.update({'_id':req.body.taskId},{$set:{'taskName':req.body.taskName,'taskDescription':req.body.taskDescription,'taskStatus':req.body.taskStatus,'taskAssigned_to':req.body.taskAssigned_to,taskFinished_in_sprint:null}},function(err,data){
                    if (err){console.log('Error in updating Task: '+err);
                        throw err;
                    }else(res.send("success"));console.log("success");
                })

    });
//gets My task Data
router.route('/myTasks')
    .get(function(req, res){
       // console.log(req.param('projectId'));
        updateSprintStatus(req.param('projectId'),function(response){
            if(response>0){
                Sprint.findOne({'projectId':req.param('projectId'),sprintStatus:"Running"},function(err,data1) {
                    if(data1){
                        Sprint.findOne({'projectId':req.param('projectId'),sprintStatus:"Running"})
                            .populate({
                                path:'sprintStory',
                                populate:{
                                    path:'storyTasks',
                                    model:'Task',
                                    match:{taskAssigned_to:req.param('userName')}
                                }
                            })
                            .exec(function(err,sprint){
                                if(err){console.log('error: '+err);throw err;}

                                if(sprint){res.json(sprint);}
                            })
                    }
                });
            }
            else{res.send({message:"104"});}
        });
    })

    // completes the task by setting the status to completed and set current sprint id in "finished in sprint"
    .put(function(req, res) {
       // console.log(req.body.taskId);
        Task.update({'_id':req.body.taskId},{$set:{'taskFinished_in_sprint':req.body.sprintId,'taskStatus':"completed"}},function(err,data){
            if (err){console.log('Error in completing task: '+err);
                throw err;}
            res.send("");
        })
    })
    //saves edited status to task collection
    .post(function(req, res) {
        Task.update({'_id':req.body.id},{$set:{'taskStatus':req.body.status,'taskFinished_in_sprint':null}},function(err,data){
            if (err){console.log('Error in editing task status: '+err);
                throw err;}
            res.send("");
        })
    });

//removes task from task collection as well as its reference from userStory
router.route('/delete')
    .post(function(req, res) {
            Task.remove({'_id':req.body.taskId},function(err,data){
                if (err){console.log('Partial Error in deleting task: '+err);
                    throw err;}
                UserStory.update({'_id':req.body.storyId},{$pull:{storyTasks:req.body.taskId}},function(err,data){
                    if (err){console.log('Error in deleting task: '+err);
                        throw err;}
                        res.send("success");
                    });
                });
    });

module.exports = router;