zones = new Mongo.Collection("zones");
fields = new Mongo.Collection("fields");
comments = new Mongo.Collection("comments");
zone_map = true;

//routing code
Router.configure({
    layoutTemplate: 'main'
});
Router.route('/', {
    name: 'home',
    template: 'login'
});

Router.map(function(){
    this.route('results', {
        path: '/results',

        onBeforeAction: function(){
            if(!Meteor.user()){
                this.render('login')
            }else{
                this.next();
            }
        }
    });
});

Router.map(function(){
   this.route('admin', {
       path: '/admin',
       onBeforeAction: function(){
           if(!Meteor.user()){
               this.render('login')
           }else{
               var user = Meteor.user();
               if(Roles.userIsInRole(user, ['admin'])){
                   this.next();
               }
               else{
                   alert('Not authorized to access this page');
                   this.render('results');
                   throw new Meteor.Error(403, "Not authorized to access this page");

               }

           }
       }
   });
});


//client side code
if(Meteor.isClient) {


    Session.set('addNewUser', true);
    Meteor.subscribe("fields");
    //events section
    Template.register.events({
        'submit form': function(event){
            event.preventDefault();
            var email= $('[name=email]').val();
            var password = $('[name=password]').val();

            id = Accounts.createUser({
                email: email,
                password: password
            });

            Router.go('home');
        }
    });

    Template.login.events({
        'submit form': function(event){
            event.preventDefault();
            var email = $('[name=email]').val();
            var password = $('[name=password]').val();
            Meteor.loginWithPassword(email, password, function(error){
                if(error){
                    console.log(error);
                }
                else{
                    Router.go('results')
                }

            });

        }
    });

    Template.main.events({
        'click .logout': function(event){
            event.preventDefault();
            Meteor.logout();
            Router.go('home');
        },
        'click #adminLink': function(event){
            event.preventDefault();
            Router.go('admin');
        }
    });

    //variable to check if there is an existing subscription
    var yearHandler = false;
    Template.results.events({
        'click #queryButton': function (event, template) {
            //var selectedYear = parseInt(template.find('#yearSelect').value);
            //var selectedField = template.find("#fieldSelect").value;

            var selectedYear = parseInt($('#yearSelect').val());
            var selectedField = $('#fieldSelect').val();

            //var parameters = [selectedField, selectedYear];
            var newYearHandler = Meteor.subscribe("zones", selectedField, selectedYear);

            //var newYearHandler = Meteor.subscribe("zones", parameters);
            if (yearHandler) {
                yearHandler.stop();
            }
            yearHandler = newYearHandler;
            $('#resultTable').css("display", "none");
            $('#downloadLink').css("display", "inline");
        }

    });

    Template.resultTable.events({
        'click #addComment': function(event, target){
            var field = $('#fieldSelect option:selected').text();
            var zone = $('#zoneIdData').text();
            var text = $('#comment').val();
            var year = $('#yearSelect option:selected').text();

            Meteor.call("addComment", zone, field, year, text);
            $('#comment').val('');
            alert('Comment has been added to the database.');


        }
    });

    Template.admin.events({
        'click #changePassword': function(event, template){
            Session.set('changePassword', true);
            Session.set('addNewUser', false);
            Session.set('editRole', false);
            Session.set('deleteUser', false);
            $('li').removeClass("active");
            $(event.currentTarget).addClass('active');

        },
        'click #addNewUser': function(event){
            Session.set('addNewUser', true);
            Session.set('changePassword', false);
            Session.set('editRole', false);
            Session.set('deleteUser', false);
            $('li').removeClass("active");
            $(event.currentTarget).addClass('active');
        },
        'click #editRole': function(event){
            Session.set('editRole', true);
            Session.set('addNewUser', false);
            Session.set('changePassword', false);
            Session.set('deleteUser', false);
            $('li').removeClass("active");
            $(event.currentTarget).addClass('active');
        },
        'click #deleteUser': function(event){
            Session.set('editRole', false);
            Session.set('addNewUser', false);
            Session.set('changePassword', false);
            Session.set('deleteUser', true);
            $('li').removeClass("active");
            $(event.currentTarget).addClass('active');
        }

    });

    Template.addNewUserTemplate.events({
       'click #btnAddUser': function(event, template){
           event.preventDefault();
           var email = template.firstNode.lastElementChild[0].value;
           var pass1 = template.firstNode.lastElementChild[1].value;
           var pass2 = template.firstNode.lastElementChild[2].value;
           var role = template.firstNode.lastElementChild[3].value;

           if(pass1 === pass2){
               Meteor.call("addNewUser", email, pass1, role)
               template.firstNode.lastElementChild[0].value = "";
               template.firstNode.lastElementChild[1].value = "";
               template.firstNode.lastElementChild[2].value = "";
               template.firstNode.lastElementChild[3].value = "";
               alert('New user added to database');
           }
           else{
               alert("Passwords do not match");
           }


       }
    });


    //helpers section

    Template.adminMenu.helpers({
        changePassword: function(){return Session.get('changePassword');},
        addNewUser: function(){return Session.get('addNewUser');},
        editRole: function(){return Session.get('editRole');},
        deleteUser: function(){return Session.get('deleteUser');}
    });

    Template.results.helpers({
        field: function(){return fields.find({});},
        year: function(){
            var years = [];
            for(var i=2011; i<2041; i++){
                var year = {sim_year: i};
                years.push(year);
            }
            return years;
        },
        link: function(){
            var data = zones.find({}).fetch();
            data = Papa.unparse(data);
            return encodeURIComponent(data);
        }



    });

    Template.main.helpers({
        adminuser: function(){
            var user = Meteor.user();
            var isAdmin = Meteor.call("checkAdmin", user);
            return isAdmin;
        }
    });



}

//server code for publishing
if (Meteor.isServer){
    Meteor.publish("fields", function(){

        if(Roles.userIsInRole(this.userId, ['admin'])){
            return fields.find({});
        }
        else if(Roles.userIsInRole(this.userId, ['drcog'])){
            var fieldList = ['pop_base', 'hh_base', 'emp_base','emp1_base','emp2_base','emp3_base','emp4_base','emp5_base','emp6_base','pop_sim','hh_sim','emp_sim','emp1_sim','emp2_sim','emp3_sim','emp4_sim','emp5_sim','emp6_sim','pop_diff','hh_diff','emp_diff','emp1_diff','emp2_diff','emp3_diff','emp4_diff','emp5_diff','emp6_diff'];
            return fields.find({field:{$in:fieldList}});
        }
        else{
            return fields.find({});
        }




    });

    Meteor.publish("zones", function(selectedField, selectedYear){
        var dict = {};
        var newField = selectedField;
        dict["zone_id"] = 1;
        dict[newField] = 1;
        return zones.find({sim_year:selectedYear}, {fields:dict});
    });

}








/**
 * Created by jmartinez on 7/9/2015.
 */
