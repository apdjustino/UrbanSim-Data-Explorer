/**
 * Created by jmartinez on 7/8/2015.
 */
if(Meteor.isClient){
    var cdnUrl = [
        "http://code.jquery.com/jquery-1.10.2.min.js",
        "http://netdna.bootstrapcdn.com/bootstrap/3.0.0/js/bootstrap.min.js",
        "http://d3js.org/d3.v3.min.js",
        "http://d3js.org/queue.v1.min.js",
        "http://d3js.org/topojson.v1.min.js"
    ]


    cdnUrl.forEach(function(cv, index){
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', cv);
        document.getElementsByTagName('head')[0].appendChild(script);
    });

}
