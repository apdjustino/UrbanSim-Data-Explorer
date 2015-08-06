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
    getRoles: function(email){
        var user = users.find({emails:{$elemMatch:{address:email}}}).fetch();
        var roles =  Roles.getRolesForUser(user[0]);
        var output = [];
        roles.forEach(function(cv, index, arr){
            var dict = {roleName: cv};
            output.push(dict);
        });
        return output;
    },
    deleteRole: function(email, role){
        var user = users.find({emails:{$elemMatch:{address:email}}}).fetch();
        Roles.removeUsersFromRoles(user[0], role);
    },
    addRole: function(email, role){
        var user = users.find({emails:{$elemMatch:{address:email}}}).fetch();
        Roles.addUsersToRoles(user[0], role);
    },
    newPass: function(email, newPass){
        var user = users.find({emails:{$elemMatch:{address:email}}}).fetch();
        Accounts.setPassword(user[0]._id, newPass);
    },
    deleteUser: function(email){
        users.remove({emails:{$elemMatch:{address:email}}});
    },
    sendEmail: function(email, role){
        var accountId = Accounts.createUser({
            'email': email
        });
        Roles.addUsersToRoles(accountId, role);
        Accounts.sendEnrollmentEmail(accountId);
    }
});

