testArr = [];
if(Meteor.isClient){
    Template.mapTemplate.rendered = function(){
        this.node = this.find('#mapCanvas');
        //add leaflet pane
        var map = L.map("mapCanvas").setView([39.75, -104.95], 10);
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        //initiate d3 variables
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
        d3.json("data/zonesGeo.json", function(zones){
            //console.log(zones);
            var shape = topojson.feature(zones, zones.objects.zones);
            var transform = d3.geo.transform({point: projectPoint});
            var inverseTransform = d3.geo.transform({point: inverseProjectPoint});
            var path = d3.geo.path().projection(transform);


            feature = g.selectAll("path")
                .data(shape.features)
                .enter()
                .append("path")
                .attr("class", "q0-7 zones");
            var title = feature.append("svg:title")
                .attr("class", "pathTitle")
                .text(function(d){return "ZoneID: " + d.properties.ZONE_ID;});



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




        Tracker.autorun(function(){
            var data = zones.find({}).fetch();
            if(data.length == 2804){
                //console.log(data);
                setMap(data);
            }
            //setMap(data);


        });



        function setMap(data){
            field = $('#fieldSelect').val();

            var valArr = [];
            data.forEach(function(cv, index, arr){

                mapById.set(cv.zone_id, {
                    "val": cv[field]
                });
                valArr.push(cv[field]);
            });
            console.log(valArr);
            var max = Math.max.apply(null, valArr);
            if(max){  //need this if statement because Meteor's reactive function autorun executes during mid-data subscribe
                quantize.domain([0,max]);
                var color = d3.scale.linear().domain([0, max]).range(["#eff3ff", "#084594"]); //color by scale
                //color by quantiles
                //feature.attr("class", function(d){
                //    return quantize(mapById.get(d.properties.ZONE_ID).val) + " zones";
                //});
                feature.style("fill", function(d){
                    return color(mapById.get(d.properties.ZONE_ID).val);
                });

                feature.on("click", function(d){
                    d3.select("#resultTable")
                        .style("display", "block");

                    d3.select('#fieldHeader').text($('#fieldSelect option:selected').text());



                    d3.select('#zoneIdData').text(d.properties.ZONE_ID);

                    d3.select('#dataPoint').text(mapById.get(d.properties.ZONE_ID).val);



                });

                d3.selectAll('.pathTitle')
                    .text(function (d){
                        return "Zone ID: " + d.properties.ZONE_ID + "\n" +
                            field + ": " + mapById.get(d.properties.ZONE_ID).val
                    });





            }
        }

        d3.select("#zoneFind").on("submit", function(){
            d3.event.preventDefault();
            console.log(this.zone.value);
            var dataPath = d3.selectAll("path");
            dataPath.each(findZone);
        });

        function findZone(d){
            //console.log($('#zoneFind')[0].lastElementChild.value);
            if(d.properties.zone_str == $('#zoneFind')[0].lastElementChild.value){
                console.log(d.geometry.coordinates[0][0]);
                map.setView(new L.LatLng(d.geometry.coordinates[0][0][1], d.geometry.coordinates[0][0][0]), 13, {animate:true});
                d3.select(this).attr("class", "foundZone q0-7 zones");
            }
            else{
                d3.select(this).attr("class", "q0-7 zones");
            }

        }
    }
}
