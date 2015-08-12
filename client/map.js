testArr = [];
if(Meteor.isClient){
    Template.mapTemplate.rendered = function(){
        this.node = this.find('#mapCanvas');
        //add leaflet pane
        var map = L.map("mapCanvas").setView([39.75, -104.95], 10);
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        //initiate d3 variables
        var drawZones = true;
        var centered;
        var mapById = d3.map();
        var svg = d3.select(map.getPanes().overlayPane).append("svg");
        var g = svg.append("g").attr("class", "leaflet-zoom-hide");
        var feature;
        var quantize = d3.scale.quantize()
            .range(d3.range(7).map(function(i){return "q" + i + "-7";}));

        //functional map variable
        var mapById = d3.map();

        //d3 "loop" that adds topojson to map
        function drawMap(zones){
            var pathString;
            var obj_name;
            var label_string;
            var geo_property;
            var geo_class;
            if(zones){
                pathString = "data/zonesGeo.json";
                obj_name="zones";
                label_string = "ZoneId: ";
                geo_property = "ZONE_ID";
                geo_class = "zones";

            }
            else{
                pathString = "data/county_web.json";
                obj_name="county_2014_web";
                label_string = "County: ";
                geo_property = "COUNTY";
                geo_class = "counties";
            }
            d3.json(pathString, function(zones){
                //console.log(zones);
                var shape = topojson.feature(zones, zones.objects[obj_name]);
                var transform = d3.geo.transform({point: projectPoint});
                var path = d3.geo.path().projection(transform);


                feature = g.selectAll("path")
                    .data(shape.features)
                    .enter()
                    .append("path")
                    .attr("class", "q0-7 " + geo_class);
                var title = feature.append("svg:title")
                    .attr("class", "pathTitle")
                    .text(function(d){return label_string + d.properties[geo_property];});



                //var feature = g.selectAll("path")
                //    .data(shape.features)
                //    .enter()
                //    .append("path")
                //    .attr("class", "q0-7 zones");

                map.on("viewreset", reset);
                reset();

                function reset(){
                    var bounds = path.bounds(shape),
                        topLeft = bounds[0],
                        bottomRight = bounds[1];

                    width = bottomRight[0] - topLeft[0];
                    height = bottomRight[1] - topLeft[1];

                    svg
                        .attr("width", bottomRight[0] - topLeft[0])
                        .attr("height", bottomRight[1] - topLeft[1])
                        .style("left", topLeft[0] + "px")
                        .style("top", topLeft[1] + "px");

                    g
                        .attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

                    feature.attr("d", path);




                }

                function projectPoint(x, y){
                    var point = map.latLngToLayerPoint(new L.LatLng(y,x));
                    this.stream.point(point.x, point.y);
                }

                function inverseProjectPoint(x, y){
                    var point = map.layerPointToLatLng([y,x]);
                    return point;
                }




            });
        }

        drawMap(drawZones);




        //Listener function that responds to a change in the zones collection
        //This function calls the setMap function which colors the map accordingly
        Tracker.autorun(function(){
            var data = zones.find({}).fetch();
            try{
                setMap(data, drawZones);
                }
            catch(err){
                    //console.log(data);
                console.log(err);
                }
        });

        //Listener function that responds to a change in the counties collection
        //This function calls the setMap function which colors the map accordingly

        Tracker.autorun(function(){
            var data = counties.find({}).fetch();
            try{
                setMap(data, drawZones);
            }
            catch(err){
                console.log(err);

            }
        });





        function setMap(data, pZones){
            var field;
            var id_prop;
            var geo_prop;

            if(pZones){
                field = $('#fieldSelect').val();
                id_prop = "zone_id";
                geo_prop = "ZONE_ID";
            }
            else{
                field = $('#fieldSelectCounty').val();
                id_prop = "county_name";
                geo_prop = "COUNTY";
            }



            var valArr = [];
            data.forEach(function(cv, index, arr){

                mapById.set(cv[id_prop], {
                    "val": cv[field]
                });
                valArr.push(cv[field]);
            });
            //console.log(valArr);
            var max = Math.max.apply(null, valArr);
            if(max){  //need this if statement because Meteor's reactive function autorun executes during mid-data subscribe
                quantize.domain([0,max]);
                var color = d3.scale.linear().domain([0, max]).range(["#eff3ff", "#084594"]); //color by scale
                //color by quantiles
                //feature.attr("class", function(d){
                //    return quantize(mapById.get(d.properties.ZONE_ID).val) + " zones";
                //});
                feature.style("fill", function(d){
                    if(mapById.get(d.properties[geo_prop])){
                        return color(mapById.get(d.properties[geo_prop]).val);
                    }

                });

                feature.on("click", function(d){
                    d3.select("#resultTable")
                        .style("display", "block");

                    if(pZones){
                        d3.select('#fieldHeader').text($('#fieldSelect option:selected').text());
                        d3.select('#idHeader').text('Zone ID');
                        d3.select('#tazIDData').text(d.properties.TAZ_ID);
                    }
                    else{
                        d3.select('#idHeader').text('County');
                        d3.select('#fieldHeaderCounty').text($('#fieldSelectCounty option:selected').text());
                        d3.select('#tazIDData').text("N/A");
                    }

                    d3.select('#zoneIdData').text(d.properties[geo_prop]);

                    if(mapById.get(d.properties[geo_prop])){
                        d3.select('#dataPoint').text(mapById.get(d.properties[geo_prop]).val);
                    }
                    else{
                        d3.select('#dataPoint').text("");
                    }




                });

                d3.selectAll('.pathTitle')
                    .text(function (d){
                        return "Zone ID: " + d.properties.ZONE_ID + "\n" +
                            field + ": " + mapById.get(d.properties.ZONE_ID).val
                    });





            }
        }

        d3.select('#county-tab').on("click", function(){
           Session.set('drawZones', false);
           d3.selectAll("path").remove();
           d3.select("#resultTable").style("display", "none");
           drawZones = false;
           drawMap(drawZones);
        });

        d3.select('#zone-tab').on("click", function() {
            Session.set('drawZones', true);
            d3.selectAll("path").remove();
            drawZones = true;
            drawMap(drawZones);
        });



        d3.select("#zoneFind").on("submit", function(){
            d3.event.preventDefault();
            console.log(this.zone.value);
            var dataPath = d3.selectAll("path");
            dataPath.each(findZone);
        });



        /* This function matches the user control input with the data in the topojson file.
           If the TAZ_ID or the ZONE_ID match the user control input, then the function will find the right
           path element and zoom in on it, centering on one coordinate in the polyline.
         */

        function findZone(d){
            if($('#zoneFind')[0].lastElementChild.value.length == 4){
                if(d.properties.ZONE_ID == $('#zoneFind')[0].lastElementChild.value){
                    //console.log(d.properties);
                    map.setView(new L.LatLng(d.geometry.coordinates[0][0][1], d.geometry.coordinates[0][0][0]), 13, {animate:true});
                    d3.select(this).attr("class", "foundZone q0-7 zones");
                }
                else{
                    d3.select(this).attr("class", "q0-7 zones");
                }
            }
            else if($('#zoneFind')[0].lastElementChild.value.length == 6){
                if(d.properties.TAZ_ID == $('#zoneFind')[0].lastElementChild.value){
                    //console.log(d.properties);
                    map.setView(new L.LatLng(d.geometry.coordinates[0][0][1], d.geometry.coordinates[0][0][0]), 13, {animate:true});
                    d3.select(this).attr("class", "foundZone q0-7 zones");
                }
                else{
                    d3.select(this).attr("class", "q0-7 zones");
                }
            }
            else{
                d3.select(this).attr("class", "q0-7 zones");
            }


        }
    }
}
