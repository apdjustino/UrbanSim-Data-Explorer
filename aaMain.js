zones = new Mongo.Collection("zones");
fields = new Mongo.Collection("fields");
comments = new Mongo.Collection("comments");
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

if(Meteor.isClient) {



    Meteor.subscribe("fields");
    //events section
    Template.register.events({
        'submit form': function(event){
            event.preventDefault();
            var email= $('[name=email]').val();
            var password = $('[name=password]').val();
            Accounts.createUser({
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
        }
    });

    //variable to check if there is an existing subscription
    var yearHandler = false;
    Template.results.events({
        'click #queryButton': function (event, template) {
            var selectedYear = parseInt(template.find('#yearSelect').value);
            var selectedField = template.find("#fieldSelect").value;

            var parameters = [selectedField, selectedYear];

            var newYearHandler = Meteor.subscribe("zones", parameters);
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


    //helpers section

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

}
if (Meteor.isServer){
    Meteor.publish("fields", function(){
        return fields.find({});
    });

    Meteor.publish("zones", function(parameters){
        var fieldObj = {};
        var test = [];
        fieldObj["zone_id"] = 1;
        fieldObj[parameters[0]] = 1;
        //zones.find({sim_year: parameters[1]}, fieldObj).forEach(function(doc){
        //    test.push(doc);
        //});

        return zones.find({sim_year: {$eq: parameters[1]}}, {fields: fieldObj});
    })

}









/**
 * Created by jmartinez on 7/9/2015.
 */
