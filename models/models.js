var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var user123Schema = new mongoose.Schema({
    username: String,
    password: String, //hash created from password
    firstName: String,
    email: String,
    lastName: String,
    created_on: {type: Date, default: Date.now}
});

var projectSchema= new mongoose.Schema({
   projectName: String,
   projectDescription: String,
   projectStatus:[{status:String}],
   projectStoryType:[{types:String}],
   projectMembers:[{
       memberName:String,
       memberRole:String
   }]
});
var userStorySchema=new mongoose.Schema({
    projectId: String,
    projectName:String,
    storyName:String,
    storyStatus:String,
    storyDescription:String,
    storyType:String,
    storyPriority:String,
    storyCreated_on:{type: Date, default: Date.now},
    storyFinished_in_sprint:{type:Schema.Types.ObjectId,ref:'Sprint'},
    storyStarted_in_sprint:{type:Schema.Types.ObjectId,ref:'Sprint'},
    storyTasks:[{type:Schema.Types.ObjectId,ref:'Task'}]
});
var sprintSchema=new mongoose.Schema({
    projectId:String,
    projectName:String,
    sprintName:String,
    sprintDescription:String,
    sprintStartDate:{type:Date,default: Date.now},
    sprintEndDate:{type:Date},
    sprintStatus:String,
    sprintStory:[{type:Schema.Types.ObjectId,ref:'UserStory'}]
});
var taskSchema=new mongoose.Schema({
    projectId:String,
    taskName:String,
    taskDescription:String,
    taskStatus:String,
    taskFinished_in_sprint:String,
    taskStarted_in_sprint:String,
    taskAssigned_to:String,
    taskOf_story:{type:Schema.Types.ObjectId,ref:'UserStory'}
});

var chatSchema=new mongoose.Schema({

    room:String,
    username:String,
    message:String,
    created_on: {type: Date, default: Date.now},

});


mongoose.model('User', user123Schema);
mongoose.model('Project', projectSchema);
mongoose.model('UserStory',userStorySchema);
mongoose.model('Sprint', sprintSchema);
mongoose.model('Task', taskSchema);
mongoose.model('Chat', chatSchema);
