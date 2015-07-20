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
    }
});

