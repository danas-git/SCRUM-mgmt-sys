var app = angular.module('registration', ['ui.router', 'ngResource',"xeditable","chart.js"]).run(function($rootScope,$http,$location,$window,editableOptions){

    $rootScope.authenticated=false;
    $rootScope.current_user="";
    $rootScope.projectTitle="";
    $rootScope.projectTitleOld="";
    $rootScope.role="";
    $rootScope.ChatAuthenticated=false;
    editableOptions.theme = 'bs3';
        $rootScope.signout = function(){
        $http.get('auth/signout');
        $rootScope.authenticated = false;
        $rootScope.current_user = '';
        $window.location.assign('/');
    };
});

app.config(function($stateProvider,$urlRouterProvider,$httpProvider,ChartJsProvider){
    // Configure all charts
    ChartJsProvider.setOptions({
        colours: ['#FF5252', '#FF8A80'],
        responsive: false,
        scaleBeginAtZero: true
    });
    // Configure all line charts
    ChartJsProvider.setOptions('Line', {
        datasetFill: false
    });
    var checkLoggedin = function($q, $timeout, $http, $location, $rootScope){
        var deferred = $q.defer();
        $http.get('auth/loggedin').success(function(user){
            if (user !== '0') {
                $rootScope.authenticated= true;
                $rootScope.current_user = user.username;
                deferred.resolve();}
            else {$rootScope.authenticated= false;
                deferred.reject();
                $location.url('/login');}
        });
        return deferred.promise;
    };
    $httpProvider.interceptors.push(function($q, $location) {
        return {response: function(response) {
                // do something on success
                return response;},
            responseError: function(response) {
                if (response.status === 401)
                    $location.url('/login');
                return $q.reject(response);}};
    });

    $urlRouterProvider.otherwise('/project');
    $stateProvider.state('login', {
            url: '/login',                               /////////Fixed///////////
            templateUrl: 'Login.html',
            controller: 'loginController'
        }).state('mainpage',{
        url: '',                                    /////////Fixed///////////
        templateUrl: 'main.html'
        }).state('productBacklogD',{
        url: '/productBacklog',//////////////////////////////////////////////////fixed
        templateUrl: 'ProductBackLogTabforDeveloper.html',
        controller:'productBacklogD',
        resolve:{
            loggedin:checkLoggedin
        }
        }).state('productBacklogPO',{
        url: '/ProductBacklog',//////////////////////////////////////////////////fixed
        templateUrl: 'ProductBacklogTab.html',
        controller:'productBacklogPO',
        resolve:{
            loggedin:checkLoggedin
        }
        }).state('projectPage',{
        params:{userrole:null},
        url: '/project',                                    /////////Fixed///////////
        templateUrl: 'main.html',
        controller: 'ProjectDetails',
        resolve:{
            loggedin:checkLoggedin
        }
        }).state('projectPage3',{
        params:{userrole:null},
        url: '/project',                                    /////////Fixed///////////
        templateUrl: 'ProjectTab.html',
        controller: 'projectDetailsSidebarPO',
        resolve:{
            loggedin:checkLoggedin
        }
        }).state('projectPage4',{
        params:{userrole:null},
        url: '/project',                                    /////////Fixed///////////
        templateUrl: 'ProjectTabDeveloper.html',
        controller: 'projectDetailsSidebarD',
        resolve:{
                loggedin:checkLoggedin
            }
        }).state('taskBoard',{
        url: '/taskBoard',
        templateUrl: 'TaskBoard.html',
        controller: 'taskBoardController',
        resolve:{
            loggedin:checkLoggedin
        }
        }).state('sprintOptions',{
        url: '/sprint',
        templateUrl: 'SprintOptions.html',
        controller: 'sprintOptionsController',
        resolve:{
            loggedin:checkLoggedin
        }
        }).state('pastSprints',{
        url: '/pastSprints',
        templateUrl: 'PastSprints.html',
        controller: 'pastSprintsController',
        resolve:{
            loggedin:checkLoggedin
        }
        }).state('myTasks',{
        url: '/myTasks',
        templateUrl: 'MyTasks.html',
        controller: 'myTasksController',
        resolve:{
            loggedin:checkLoggedin
        }
        })
        .state('sprintBacklog',{
        url: '/sprintBacklog',                              /////////Fixed///////////
        templateUrl: 'SprintBacklog.html',
        controller: 'sprintBacklogController',
        resolve:{
            loggedin:checkLoggedin
        }
        }).state('Registration',{
        url: '/register',                                    /////////Fixed///////////
        templateUrl: 'RegistrationPage.html',
        controller: 'regController'
        }).state('Account',{
        url: '/myAccount',                                    /////////Fixed///////////
        templateUrl: 'ProfileTab.html',
        controller: 'myAccountController',
        resolve:{
        loggedin:checkLoggedin}
         })
        .state('Chat',{
            url: '/Chat',                                    /////////Fixed///////////
            templateUrl: 'Chat.html',
            controller: 'ChatController',
            resolve:{
                loggedin:checkLoggedin}
        })
        .state('Graph',{
            url: '/Graph',
            templateUrl: 'Graph.html',
            controller: 'GraphController',
            resolve:{
                loggedin:checkLoggedin
            }
        });
});

app.factory('projectReference', function () {
    var projectName={};
    var projectRole={};
    var UserName={};
    var projectId={};
    return {
        getProjectRole: function () {
            return projectRole;},
        setProjectRole: function (value1) {
            projectRole = value1;},
        getProjectName: function () {
            return projectName;},
        setProjectName: function (value) {
            projectName = value;},
        getUserName: function () {
            return UserName;},
        setUserName: function (value) {
            UserName = value;},
        getProjectId: function () {
            return projectId;},
        setProjectId: function (value) {
            projectId = value;}
    };
});

//gets lists of projects for project Drop-down/////////////Called directly on Page-load/////////////////////
app.controller('projectListDropdownController',function($scope,$http,$rootScope,projectReference,$location,$state){
    $scope.projectLists=[];
    $http.get('auth/loggedin').success(function(user){
        if (user !== '0') {
            $rootScope.authenticated= true;
            $rootScope.current_user = user.username;
            $http.get('/project/add',{params: {username:$rootScope.current_user}}).success(function(data){
                $scope.projectLists=data;
            });
        }
    });
    $scope.selectProject=function(name){
        ///for chat/////
        $rootScope.ChatAuthenticated=true;
        ///for chat////
        $rootScope.projectTitle=name;
        $scope.role=[];
        $http.get('/project/role',{params:{username:$rootScope.current_user,projectName:name}}).success(function(data){
           $scope.role=data;
         //   console.log(data);
         //   console.log(data.projectMembers[0].memberRole);
            if(data.projectMembers[0].memberRole=="ProductOwner"){
                projectReference.setProjectRole(data.projectMembers[0].memberRole);
                projectReference.setProjectName(name);
                projectReference.setUserName($rootScope.current_user);
                projectReference.setProjectId(data._id);
                $rootScope.role=data.projectMembers[0].memberRole;
               $state.go('projectPage3', {}, {reload: true});//,{name:name,username:$rootScope.current_user,userrole:data[0].projectMembers.memberRole});
            }
            else{
                projectReference.setProjectRole(data.projectMembers[0].memberRole);
                $rootScope.role=data.projectMembers[0].memberRole;
                projectReference.setProjectName(name);
                projectReference.setUserName($rootScope.current_user);
                projectReference.setProjectId(data._id);
                $state.go('projectPage4', {}, {reload: true});
            }
        });
    };
});

//checks whether sprint is running
app.factory('checkSprintStatus',function($http,projectReference){
    var factory={};
    factory.getData=function(){
        return $http.get('/sprint/check',{params:{'projectId':projectReference.getProjectId()}});
    };
    return factory;
});
//gets userStories from server
app.factory('storyDataService', function($http,projectReference){
    var factory={};
    factory.getData=function(){
        return $http.get('/backlog/story',{params:{'projectId':projectReference.getProjectId()}});
    };
    return factory;
});
//product backlog for developer
app.controller('productBacklogD',function($scope,$rootScope,$stateParams,projectReference,storyDataService,$state,$http,checkSprintStatus){
    $scope.message="";
    $scope.message1="";
    $scope.sprintData={projectId:projectReference.getProjectId(),projectName:projectReference.getProjectName(),sprintName:"",sprintDescription:"",sprintEndDate:""};
    $scope.userStories=[];
    storyDataService.getData().success(function(data){
        $scope.userStories=data;
        console.log($scope.userStories);
    });
    $scope.addToSprint=function(id){
        $scope.ids={'id':id,projectId:projectReference.getProjectId()};
        $http.put('/sprint/addToSprint',$scope.ids).success(function(data){
            if(data.message=="102"){$scope.message1="Story already exist in current Sprint";}
            if(data.message=="103"){$scope.message1="successfully added";
                $state.go('productBacklogD', {}, {reload: true});}
            if(data.message=="104"){$scope.message1="Failed to add: no sprint in progress";}
        })
    };
    $scope.hideMessage=function(){
        $scope.message="";
        $scope.message1="";
    };
    checkSprintStatus.getData().success(function(data){
     //   console.log(data.timer);
    });

    $scope.createSprint=function(){

        $scope.sprintData.sprintEndDate=$('input[name="date"]').val();
        $http.put('/sprint/add',$scope.sprintData).success(function(data){
            if(data.message=="101"){$scope.message="Sprint already in progress: can't create another!!";
                $scope.sprintData.sprintName="";$scope.sprintData.sprintDescription="";$scope.sprintData.sprintEndDate="";}
            if(data.message=="100"){$scope.message="Sprint Successfully created!!";
            $scope.sprintData.sprintName="";$scope.sprintData.sprintDescription="";$scope.sprintData.sprintEndDate="";}
        })
    }
});

//product backlog for Product Owner
app.controller('productBacklogPO',function($scope,$rootScope,$stateParams,$http,projectReference,$state,projectDataService,storyDataService){
    $scope.userStory={projectName:projectReference.getProjectName(),projectId:projectReference.getProjectId(),name:"",description:"",type:"",status:"",priority:""};
    $scope.projectData=[];$scope.userStories=[];
    $scope.statuses=[];
    $scope.types=[];
    $scope.editedStory=[];
    $scope.priorities=["Realtime","High","Moderate","Low"];
    // this section fetches status and types from project data and stores it into statuses and types array respectively.
    projectDataService.getData().success(function(data){
       // console.log(data);
        $scope.projectData=data;
        angular.forEach($scope.projectData,function(projectData,index){
            angular.forEach(projectData.projectStatus,function(status,index){
                angular.forEach(status,function(value,index){
                    delete status._id;
                        $scope.statuses.push(value);
                });
            });
            angular.forEach(projectData.projectStoryType,function(type,index){
                angular.forEach(type,function(value,index){
                    delete type._id;
                    $scope.types.push(value)
                })
            });
        });
    });
    //gets lists of all userStories From database
    storyDataService.getData().success(function(data){
        //console.log(data);
        $scope.userStories=data;
    });
    //edits userStory on Product Backlog Page.
    $scope.saveUser = function(id) {

        for (var i = 0; i < $scope.userStories.length; i++) {
            if($scope.userStories[i]._id==id){
                $scope.editedStory=$scope.userStories[i];

            }
        }
        //updates edited story
        $http.post('/backlog/story',$scope.editedStory ).success(function(err,data){
        });
    };
    $scope.removeStory=function(id){
      $http.delete('/backlog/story',{params:{'id':id}}).success(function(err,data){
         //console.log("story deleted");
          $state.go('productBacklogPO', {}, {reload: true});
      })};

    $scope.addUserStory=function(){
       // console.log($scope.userStory);
        $http.put('/backlog/story',$scope.userStory).success(function(err,data){
           console.log("success");
            $state.go('productBacklogPO', {}, {reload: true});
        });
    }
});
//////////////////////////Invoked when clicked on Product Backlog: does routing////////////////////////////////////////////////////
app.controller('productBacklogNav',function($scope,projectReference,$state){
    $scope.productBacklogNav=function(){
        if(projectReference.getProjectRole()=="ProductOwner"){
            $state.go('productBacklogPO');
        }
        if(projectReference.getProjectRole()=="Developer"||projectReference.getProjectRole()=="ScrumMaster"){
            $state.go('productBacklogD');
        }
    }
});
//////////////////////////Invoked when clicked on Product Backlog: does routing////////////////////////////////////////////////////


/////////////////////////////////////////Called From sprintBacklog on sidebar/////////////////////////////////////////////////
app.controller('sprintBacklogController',function($scope,projectReference,$http){
    $scope.message="";
    $scope.sprint=[];
    $scope.hideMessage=function(){$scope.message="";};
    $scope.closeSprintStory=function(sprintid,storyid){

        $http.get('/sprint/closeSprintStory',{params:{'sprintID':sprintid,'storyID':storyid}}).success(function(data){

            if(data.status=="failure"){
                $scope.message="There are tasks pending to be completed";
            }
            else{
                $scope.message="Story completed successfully";
            }
        });
        $http.get('/sprint/sprintData',{params:{'projectId':projectReference.getProjectId()}}).success(function(data) {
            if(data.message=="104"){$scope.message="No sprint in progress";}
            else{
                $scope.sprint=data;
            }
        });

    }
    $http.get('/sprint/sprintData',{params:{'projectId':projectReference.getProjectId()}}).success(function(data) {
       if(data.message=="104"){$scope.message="No sprint in progress";}
       else{
           $scope.sprint=data;
       }
   });
});
/////////////////////////////////////////Called From sprintBacklog on sidebar/////////////////////////////////////////////////

/////////////////////////////////////////Called From taskBoard on sidebar/////////////////////////////////////////////////////
app.controller('taskBoardController',function($scope,projectReference,$http,$state,projectDataService){
    $scope.message="";
    $scope.sprint=[];$scope.projectData=[];
    $scope.members=[];
    $scope.taskStatus=["not started","in progress","ready for test"];
    $scope.task={projectId:projectReference.getProjectId(),storyId:"",taskName:"",taskDescription:""};
    $http.get('task/data',{params:{'projectId':projectReference.getProjectId()}}).success(function(data) {
        $scope.sprint=data;
       // console.log($scope.sprint);
    });
//this part populates the list of project members in members array which will be shown in dropdown list.
    projectDataService.getData().success(function(data){
        $scope.projectData=data;
     //   console.log($scope.projectData);
        angular.forEach($scope.projectData,function(projectData,index){
            angular.forEach(projectData.projectMembers,function(memberName,index){
                angular.forEach(memberName,function(value,index){
                    delete memberName._id;
                    if(memberName.memberRole!="ProductOwner" && memberName.memberRole!="ScrumMaster"){
                        delete memberName.memberRole;
                    $scope.members.push(value);}
                });
            });
        });
    });
    //adds a new task in the story
    $scope.addTask=function(id){
        $scope.task.storyId=id;
        $http.put('/task/add',$scope.task).success(function(data){
           // console.log(data);
           if(data){
               $scope.task.taskName="";$scope.task.taskDescription="";
               $state.go('taskBoard', {}, {reload: true});
           }
        })
    };
    //removes a task from story
    $scope.removeTask=function(sid,tid){
        $scope.ids={storyId:sid,taskId:tid};
        $http.post('/task/delete',$scope.ids).success(function(data){
            if(data){
            $state.go('taskBoard', {}, {reload: true});}
        })
    };
    //edit the task
    $scope.saveTask=function(data,id1){
        $scope.taskData={taskId:id1,taskName:data.taskName,taskDescription:data.taskDescription,taskStatus:data.taskStatus,taskAssigned_to:data.taskAssigned_to};
      //  console.log($scope.taskData);
        $http.post('/task/update',$scope.taskData).success(function(data){
        })
    };
});

/////////////////////////////////////////Called From pastSprints on sidebar/////////////////////////////////////////////////
app.controller('pastSprintsController',function($scope,projectReference,$http){

    $scope.sprints=[];
    $http.get('/sprint/history',{params:{'projectId':projectReference.getProjectId()}}).success(function(data) {
        $scope.sprints=data;
    });
});
/////////////////////////////////////////Called From pastSprints on sidebar/////////////////////////////////////////////////

/////////////////////////////////////////Called From sprintOptions on sidebar///////////////////////////////////////////////
app.controller('sprintOptionsController',function($scope,projectReference,$http,$state){

    $scope.message="";
    $scope.sprint1=[];
    $scope.Status=["Close","no change"];
    $scope.StatusforClose=[];
    $scope.hideMessage=function(){$scope.message="";};
    $http.get('/sprint/sprintData',{params:{'projectId':projectReference.getProjectId()}}).success(function(data) {
        if(data.message=="104"){$scope.message="No sprint in progress";}
        else{
            $scope.sprint1=data;
        }
    });
    $scope.cancelSprint=function(id){
        $http.delete('/sprint/sprintData',{params:{'id':id}}).success(function(data){
            $state.go('sprintOptions', {}, {reload: true});
        });
    };
    $scope.saveStatus=function(status,id){
        var b={'id':id,'status':status.storyStatus};
        $scope.StatusforClose.push(b);
       // console.log($scope.StatusforClose);
    };

    $scope.closeSprint=function(id){
        $scope.dataClose={'id':id,'entries':$scope.StatusforClose};
     //   console.log( $scope.dataClose);
        $http.put('/sprint/close',$scope.dataClose).success(function(data){
            console.log("success");
        });
        $state.go('sprintOptions', {}, {reload: true});
    }
});
/////////////////////////////////////////Called From sprintOptions on sidebar///////////////////////////////////////////////

/////////////////////////////////////////Called From MyTasks on sidebar/////////////////////////////////////////////////
app.controller('myTasksController',function($scope,projectReference,$http,$state){
    $scope.taskStatus=["not started","in progress","ready for test"];
    $scope.tasks=[];
    $scope.task = {status: "in progress"};
    $http.get('task/myTasks',{params:{'projectId':projectReference.getProjectId(),userName:projectReference.getUserName()}}).success(function(data) {
        $scope.tasks=data;
       // console.log($scope.tasks);
    });
    $scope.taskCompleted=function(id){
        $scope.comp={taskId:id,sprintId:$scope.tasks._id};
        $http.put('task/myTasks',$scope.comp).success(function(data){
            $state.go('myTasks', {}, {reload: true});
        })
    };
    $scope.saveStatus=function(id,data){
        $scope.status={id:id,status:data};
      //  console.log($scope.status);
        $http.post('task/myTasks',$scope.status).success(function(data){
            $state.go('myTasks', {}, {reload: true});
        })

    }

});
////////////////////////////////////////////Called From pastSprints on sidebar/////////////////////////////////////////////////

/////////////////////////////////////////////////Controller for Product Owner /////////////////////////////////////////////////
app.factory('projectDataService', function($http,projectReference){
    var factory={};
    factory.getData=function(){
        return $http.get('/project/data',{params:{username:projectReference.getUserName(),projectName:projectReference.getProjectName()}});
    };
    return factory;
});
app.controller('projectDetailsSidebarPO',function($scope,$rootScope,projectReference,$state,$http,projectDataService,$filter){
    $scope.projects=[];$scope.search="";$scope.userRole="";
    $scope.members = [];$scope.searched=[];
    $scope.stat={status:"",projectName:projectReference.getProjectName()};
    $scope.typ={type:"",projectName:projectReference.getProjectName()};


    projectDataService.getData().success(function(data){
        $scope.projects=data;
    });

    $scope.nameSearch=function(){
        $scope.message="";
        if($scope.search===""){
            $scope.searched="";
        }else {
            $http.get('/project/member', {params: {username: $scope.search}}).success(function (data) {
                $scope.searched = data;
            });
        }
    };

    $scope.addMember=function() {
        var addmembertodb = false;
        if ($scope.search === "") {
            $scope.message = "Please enter Name";
        }
        else if ($scope.userRole === "") {
            $scope.message = "Please select role";
        }
        else {
            ($scope.searched).forEach(function (validmember) {
                if ($scope.search == validmember.username) {
                    addmembertodb = true;
                }
            });
            if (addmembertodb == true) {

                $scope.memberDetails = {
                    'username': $scope.search,
                    'userRole': $scope.userRole,
                    'projectName': projectReference.getProjectName()
                };
                $http.post('/project/member', $scope.memberDetails).success(function (data) {
                    if (data.message == "exists") {
                        $scope.message = "User is already a member in this Project";
                        console.log("user already member");
                    }
                    else {
                        $state.go('projectPage3', {}, {reload: true});
                    }
                });
            }
            else{
                $scope.message = "Not a valid user";
            }
        }

    };
    $scope.removeMember=function(id){
        $http.delete('/project/member',{params:{'id':id,'projectName':projectReference.getProjectName()}}).success(function(data){
            $state.go('projectPage3', {}, {reload: true});
        });
    };
    /////////////////////////////inline editing//////////////////////////////////////
    $scope.updateStatus = function(status,value) {
        $scope.types={projectName:projectReference.getProjectName(),type:status,id:value};
        $http.put('/project/status',$scope.types).success(function(err,data){
        });
    };
    $scope.deleteStatus=function(status,value){
        $http.delete('/project/status',{params:{'projectName':projectReference.getProjectName(),'id':value,type:status}}).success(function(data){
            $state.go('projectPage3', {}, {reload: true});
        });

    };
    $scope.addStatus=function(){
        console.log($scope.stat);
        $http.post('/project/status',$scope.stat).success(function(err,data){
            $state.go('projectPage3', {}, {reload: true});
        });
    };
    $scope.updateTypes = function(types,id) {
        $scope.types={projectName:projectReference.getProjectName(),type:types,id:id};
        $http.put('/project/types',$scope.types).success(function(err,data){
        });
    };
    $scope.deleteType=function(types,id){
        $http.delete('/project/types',{params:{'projectName':projectReference.getProjectName(),'id':id,type:types}}).success(function(data){
            $state.go('projectPage3', {}, {reload: true});
        });
    };
    $scope.addType=function(){
       // console.log($scope.typ);
        $http.post('/project/types',$scope.typ).success(function(err,data){
            $state.go('projectPage3', {}, {reload: true});
        });
    };
    /////////////////////////////inline editing//////////////////////////////////////
});
/////////////////////////////////////////////////Controller for Product Owner /////////////////////////////////////////////////


/////////////////////////////////////////Controller for Developer or Scrum Master/////////////////////////////////////////////
app.controller('projectDetailsSidebarD',function($scope,$rootScope,projectReference,$state,$http,projectDataService){
    $scope.projects=[];
    $scope.members = [];
    projectDataService.getData().success(function(data){
        $scope.projects=data;
    });

});
/////////////////////////////////////////Controller for Developer or Scrum Master/////////////////////////////////////////////

/////////////////////////////////////////Does routing based on user Role/////////////////////////////////////////////////
app.controller('ProjectDetails',function($scope,$rootScope,$location,$stateParams,$state,projectReference,projectDataService){
    $scope.project=[];
    if(projectReference.getProjectRole()=="ProductOwner"){
        $state.go('projectPage3');
    }
    if(projectReference.getProjectRole()=="Developer"){
        $state.go('projectPage4');
    }
    if(projectReference.getProjectRole()=="ScrumMaster"){
        $state.go('projectPage4');
    }
});
/////////////////////////////////////////Does routing based on user Role/////////////////////////////////////////////////

///////////////////////////////////////////////////For inline editing/////////////////////////////////////////////////////////////////
app.directive('onEsc', function() {
    return function(scope, elm, attr) {
        elm.bind('keydown', function(e) {
            if (e.keyCode === 27) {
                scope.$apply(attr.onEsc);}});};});
// On enter event
app.directive('onEnter', function() {
    return function (scope, elm, attr) {
        elm.bind('keypress', function (e) {
            if (e.keyCode === 13) {
                scope.$apply(attr.onEnter);}});};});
// Inline edit directive
app.directive('inlineEdit', function($timeout) {
    return {
        scope: {model: '=inlineEdit', handleSave: '&onSave', handleCancel: '&onCancel',handleDelete: '&onDelete'}, link: function(scope, elm, attr) {var previousValue;
            scope.edit = function() {scope.editMode = true;previousValue = scope.model;$timeout(function() {elm.find('input')[0].focus();}, 0, false);};
            scope.save = function() {scope.editMode = false;scope.handleSave({value: scope.model});};
            scope.delete=function(){scope.handleDelete({value: scope.model});};
            scope.cancel = function() {scope.editMode = false;scope.model = previousValue;scope.handleCancel({value: scope.model});};}, templateUrl: 'inline-edit.html'};});
///////////////////////////////////////////////////For inline editing/////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////// does login///////////////////////////////////////////////////////////////
app.controller('loginController', function($scope, $rootScope,$http, $location,$window ) {
    $scope.user = {username: '', password: ''};
    $scope.resp_message = '';
    $scope.login = function(){
        $http.post('auth/login',$scope.user).success(function(data){
            if(data.state == "failure"){
                $scope.resp_message=data.message;
                console.log($scope.resp_message);
                $scope.user = {username: $scope.user.username, password: ''};}
            else
                $rootScope.current_user= data.user.username;
            $rootScope.authenticated= true;
            $location.url('/home');
            $window.location.reload();
        })
    };
});
///////////////////////////////////////////////////////////////// does login///////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////does user registration//////////////////////////////////////////////////////////
app.controller('regController', function($scope, $rootScope,$http, $location ){
    $scope.user = {username: '',email: '', password: ''};
    $scope.resp_message = '';
    $scope.register = function(){
        $http.post('auth/signup',$scope.user).success(function(data){
            if(data.state == "failure") {
                $scope.resp_message=data.message +" "+ $scope.user._id ;
                $scope.user = {username: ''};}
            else
                $rootScope.current_user= data.user.username;
            $rootScope.authenticated= true;
            $location.url('/');
        })
    };
});
///////////////////////////////////////////////////////////does user registration//////////////////////////////////////////////////////////


///////////////////////////////////////////////////adds new project in db as product owner/////////////////////////////////////////////////
app.controller('addProjectController', function($scope,$rootScope,$http,$window){
    $scope.project = {projectName: '', projectDescription: '',current_user:''};
    $scope.message="";
    $scope.projectName1="";
    $scope.newProject=function(){
        $http.get('auth/loggedin').success(function(user){
            // Authenticated
            if (user !== '0') {
                $rootScope.authenticated= true;
                $rootScope.current_user = user.username;}
            else {$rootScope.authenticated= false;}
        });
        $scope.project.current_user=$rootScope.current_user;
        $http.put('/project/add',$scope.project).success(function(data){
            $scope.message=data.message;$scope.project.projectName="";$scope.project.projectDescription="";
            $window.location.reload();
        })
    }
});
///////////////////////////////////////////////////adds new project in db as product owner/////////////////////////////////////////////////


///////////////////////////////////////////////////Populates and updates my account details////////////////////////////////////////////////
app.factory('profileDataService', function($http,$rootScope){
    var factory={};
    factory.getData=function(){
      //  console.log($rootScope.current_user);
       return $http.get('/api/posts',{params: {username: $rootScope.current_user}});
    };
    return factory;
});//Populates and updates my account details
app.controller('myAccountController',function($scope,profileDataService,$http){
    $scope.userProfile=[];
    $scope.message="";
    $scope.successMessage="";
    $scope.disabled3 =true; $scope.disabled2 =true; $scope.disabled1 =true;
   profileDataService.getData().success(function(data){
       $scope.userProfile = data;
    //   console.log($scope.userProfile);
    //   console.log($scope.userProfile.email);
   });
    $scope.editEmail= function(){
        $scope.disabled3=false;
    };
    $scope.editLastName= function(){
            $scope.disabled2=false;
    };
    $scope.editFirstName= function(){
            $scope.disabled1=false;
    };
    $scope.updateProfile=function(){
     $http.put('/api/posts/' +$scope.userProfile._id, $scope.userProfile).success(function(data){
         profileDataService.getData().success(function(data){
             $scope.userProfile = data;
             $scope.disabled3 =true; $scope.disabled2 =true; $scope.disabled1 =true;
         });
     })
    };
    $scope.pass={currentPassword:"",newPassword:"",repeatPassword: ""};
    $scope.updatePassword=function(){
        if($scope.pass.newPassword==$scope.pass.repeatPassword){
            $http.put('/api/posts/1/' +$scope.userProfile._id ,$scope.pass).success(function(data){
                if(data.message=="0"){ $scope.message="Invalid Password";$scope.pass.currentPassword= "";$scope.successMessage="";}
                else{$scope.successMessage=data.message;
                    $scope.message="";
                    $scope.pass={currentPassword:"",newPassword:"",repeatPassword: ""}}
            })
        }
        else{
            $scope.successMessage="";
            $scope.message="**New, Re-typed passwords must be same**";
            $scope.pass.repeatPassword= "";
        }
    }
});
///////////////////////////////////////////////////Populates and updates my account details////////////////////////////////////////////////
app.controller('ChatController',function($scope,$rootScope,projectReference,$state){
  //  console.log("In controller3");

    $scope.ChatClick=function(){
      //  console.log("Title:", $rootScope.projectTitle);
        if($rootScope.projectTitle != "") {
            $state.go('Chat');
        }
       // console.log("In click function");
    }

});
app.controller('sendChatController',function($scope,$rootScope,projectReference,$state){
    //console.log("In controller sendchat");

    var socket = io.connect();
    var room = $rootScope.projectTitle;
    var roomold = $rootScope.projectTitleOld;

    var username = $rootScope.current_user;
    socket.on('connect',function(){
        socket.emit('room', {room:room,roomold:roomold});
        $rootScope.projectTitleOld=room;
    });
    $scope.SendChat=function(){

        var msg;

        //  var chat = $('#chat');
        msg  = $scope.chatmessage;
        socket.emit('send message', {room:room,username:username,msg:msg});
        $scope.chatmessage= null;

    }
    socket.on('new message', function(data) {

        if ($rootScope.projectTitle == data.room) {
           angular.element($('#chat').append("<strong style='color:red'>" + data.username + ": </strong> <span>" + data.msg + "</span> </br>"));
        }
    });
    socket.on('oldmessage', function(data) {

        for(var i = (data.length-1); i >= 0; i--) {
            angular.element($('#chat').append("<strong style='color:red'>" + data[i].username + ": </strong> <span>" + data[i].message + "</span> </br>"));
        }
    });
});
/////////////////////added for enter keypress in chat///////////////////////////

app.directive('ngEnter', function() {

    return function (scope, elm, attr) {
        elm.bind('keypress', function (e) {
            if (e.keyCode === 13) {
                scope.$apply(attr.ngEnter);
                //scope.SendChat();
            }});};});

//////////////////////////////added for enter keypress in chat//////////////

app.controller('GraphController',function($scope,$http,$timeout,$rootScope,projectReference,$state){
    console.log("In GraphController");

    $scope.series = ['Sprint Burn-Down Chart'];
    var graphdata=[];
    var graphlabel=[];
    $http.get('/project/graphdata', {params: {'projectName':projectReference.getProjectName()}}).success(function (data) {

        for(i=0;i<data.length;i++){
            graphlabel.push(data[i].sprintnumber);
            graphdata.push(data[i].stories);
        }
    });


    $scope.data = [
        graphdata
    ];
    $scope.labels = graphlabel;
    $scope.onClick = function (points, evt) {
      //  console.log(points, evt);
    };


});
