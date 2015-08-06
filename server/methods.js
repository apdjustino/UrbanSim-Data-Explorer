/**
 * Created by jmartinez on 7/14/2015.
 */
Meteor.methods({
    addComment: function(zone, field, year, text){
        if(! Meteor.userId()){
            throw new Meteor.error("not-authorized");
        }

        comments.insert({
            owner: Meteor.userId(),
            createdAt: new Date(),
            username: Meteor.user().emails[0].address,
            zone: zone,
            field: field,
            year: year,
            text: text
        });
    },
    addNewUser: function(email, pass, role){
        id = Accounts.createUser({
            email: email,
            password: pass
        });
        Roles.addUsersToRoles(id, role)
    },
    checkAdmin: function(){
        var user = Meteor.user();
        var isAdmin = Roles.userIsInRole(user, ['admin']);
        console.log(isAdmin);
        return isAdmin;
    }
});

