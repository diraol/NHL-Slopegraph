var multislope = function(){
  var config = {
    settings: {
      graphWidth: 800,
      graphHeight: 600,
      teamBuffer: 15,
      transitionDuration: 750,
      fontSize: 12,
      fontFamily: 'Julius Sans One',
      numberOfDates: 3,
      leftMargin: 5,
    },
 };

  var init = function(){
    $.getJSON('static/data.json', function(data) {

      var dates = $.map(data,function(value,index){return value['date']});
      $.each(dates, function(key, value) {
        $('.dateSelector')
          .append($('<option>', { value : key })
          .text(value));
      });

      //callback for listening to when the date selects change
      var onSelectChanged = function(){
        var leftIndex = $('#leftDateSelect').val();
        var centerIndex = $('#centerDateSelect').val();
        var rightIndex = $('#rightDateSelect').val();
        if(parseInt(leftIndex) <= parseInt(centerIndex) && parseInt(centerIndex) <= parseInt(rightIndex)){
          var leftData = data[leftIndex];
          var centerData = data[centerIndex];
          var rightData = data[rightIndex];
          var conferenceKey = $('#conferenceSelect').val();
          var conferenceText = $("#conferenceSelect option:selected").text();

          selecteds = [leftData,centerData,rightData];
          renderStandings(chart,selecteds,{'key':conferenceKey,'title':conferenceText});
        }
      }

      $('#leftDateSelect').change(onSelectChanged);
      $('#rightDateSelect').change(onSelectChanged);
      $('#centerDateSelect').change(onSelectChanged);
      $('#conferenceSelect').change(onSelectChanged);

      //set the left select to initially be the lowest date
      $('#leftDateSelect').val(0);
      //set the center select to initially be the middle date
      $('#centerDateSelect').val(dates.length-2);
      //set the right select to initially be the highest date
      $('#rightDateSelect').val(dates.length-1);

      var leftData = data[0];
      var centerData = data[dates.length-2];
      var rightData = data[dates.length-1];

      //sets up the basic container for the visualization
      var chart = d3.select("#slopegraph").append("svg")
        .attr("width", config.settings.graphWidth)
        .attr("height", config.settings.graphHeight);

      //initial rendering of the graph
      selecteds = [leftData,centerData,rightData];
      renderStandings(chart,selecteds,{'key':'westernConference','title':'Western Conference'});
    });
  }

  function renderStandings(chart,selecteds,conferenceName){

    // Function that manages slope columns titles (add or update)
        // The ID is the column ID, starting at zero.
    function manageTitles(id, text) {
      title = chart.select("#title"+id);
      console.log(title.empty());
      if (title.empty()) {
        titleGroup.append('text')
          .attr('x', config.settings.leftMargin + id*300)
          .attr('y', 20)
          .attr('id', function(){return "title"+id;})
          .attr('class','singleTitle')
          .text(text);
      } else {
        title.text(text);
      }
    }

    var left = selecteds[0];
    var center = selecteds[1];
    var right = selecteds[2];
    var conference = conferenceName.key;
    var leftDate = left.date;
    var centerDate = center.date;
    var rightDate = right.date;

    var titleGroup = chart.select('.titleGroup')
    //add a title based on the conference and dates
    if(titleGroup.empty()){
      titleGroup = chart.append("g");
      titleGroup.attr('class','titleGroup');
    }

    manageTitles(0, leftDate);
    manageTitles(1, centerDate);
    manageTitles(2, rightDate);

    //  //left hand date
    //  titleGroup.append('text')
    //    .attr('x', 10)
    //    .attr('y', 20)
    //    .attr('font-family',config.settings.fontFamily)
    //    .attr('font-size',13)
    //    .attr('id','leftDate')
    //    .text(leftDate);

    //  //right hand date
    //  titleGroup.append('text')
    //    .attr('x', 700)
    //    .attr('y', 20)
    //    .attr('font-family',config.settings.fontFamily)
    //    .attr('font-size',13)
    //    .attr('id','rightDate')
    //    .text(rightDate);

    //get all the points into arrays
    var conferencePointsLeft = $.map(left[conference],function(value,index){
          return value['points'];
      });
    var conferencePointsCenter = $.map(center[conference],function(value,index){
        return value['points'];
    })
    var conferencePointsRight = $.map(right[conference],function(value,index){
            return value['points'];
        });

    //create an intial scale functions based on the points
    var leftY = d3.scale.linear()
            .domain([d3.min(conferencePointsLeft),d3.max(conferencePointsLeft)])
            .range([config.settings.graphHeight-300,60]);
    var centerY = d3.scale.linear()
            .domain([d3.min(conferencePointsCenter),d3.max(conferencePointsCenter)])
            .range([config.settings.graphHeight-300,60]);
    var rightY = d3.scale.linear()
            .domain([d3.min(conferencePointsRight),d3.max(conferencePointsRight)])
            .range([config.settings.graphHeight-300,60]);

    //setup the y coordinates for each data point
    for(var i=0;i<left[conference].length;i++){
      var val = left[conference][i];
      val.yCoord = leftY(val.points);
    }
    for(var i=0;i<center[conference].length;i++){
      var val = center[conference][i];
      val.yCoord = centerY(val.points);
    }
    for(var i=0;i<right[conference].length;i++){
      var val = right[conference][i];
      val.yCoord = rightY(val.points);
    }

    /* to account for the fact that it is highly likely that
    * teams can have the same number of points, and
    * that close point values might translate coords
    * that cause overlapping text, apply a simple
    * algorithm to adjust the positions to look nice
    */
      adjustYCoords(left[conference]);
      adjustYCoords(center[conference]);
      adjustYCoords(right[conference]);

    var leftGroup = chart.select('.leftGroup');
    if(leftGroup.empty()){
      leftGroup = chart.append("g");
      leftGroup.attr("class","leftGroup");
    }

    /* select any teams if there are any
    *
    * NOTE: the the function that is the argument to 'data'
    * is key for doing updates. This sets up a data key
    * so that when an update is performed, it can find existing elements
    *
    */
    var leftTeams = leftGroup.selectAll("text").data(left[conference],function(d) { return d.team; });

    //add teams if necessary
    leftTeams
        .enter().append("text")
      .attr("x",100)
      .attr('font-family',config.settings.fontFamily)
      .attr('font-size',config.settings.fontSize)
      .attr('y', function(d,i){return d.yCoord;})
      .text(function(d, i) { return d.team; });

    //update the y position and playoff coloring
    leftTeams
      .transition()
      .duration(config.settings.transitionDuration)
      .attr('y', function(d,i){return d.yCoord;});

    //remove teams if necessary
    leftTeams.exit().remove();

    //for all the other groups follow the same pattern as above: select, add/enter, update, exit/delete
    var leftPointsGroup = chart.select('.leftGroupPoints');
    if(leftPointsGroup.empty()){
      leftPointsGroup = chart.append("g");
      leftPointsGroup.attr("class","leftGroupPoints");
    }

    var leftPoints = leftPointsGroup.selectAll("text").data(left[conference],function(d) { return d.team; });
    leftPoints.enter().append("text")
      .attr("x",200)
      .attr('y', function(d,i){return d.yCoord})
      .attr('font-family',config.settings.fontFamily)
      .attr('font-size',config.settings.fontSize);

    leftPoints.text(function(d, i) { return d.points; })
      .transition()
      .duration(config.settings.transitionDuration)
      .attr('y', function(d,i){return d.yCoord});

    leftPoints.exit().remove();

    var centerGroup = chart.select('.centerGroup');
    if(centerGroup.empty()){
      centerGroup = chart.append("g");
      centerGroup.attr("class","centerGroup");
    }

    //setup the center side teams and points
    var centerTeams = centerGroup.selectAll("text").data(center[conference],function(d) { return d.team; });

    centerTeams.enter().append("text")
      .attr("x",400)
      .attr('font-family',config.settings.fontFamily)
      .attr('font-size',config.settings.fontSize)
      .attr('y', function(d,i){return d.yCoord;})
      .text(function(d, i) { return d.team; });

    centerTeams
      .transition()
      .duration(config.settings.transitionDuration)
      .attr('y', function(d,i){return d.yCoord;});

    centerTeams.exit().remove();

    var centerPointsGroup = chart.select('.centerGroupPoints');
      if(centerPointsGroup.empty()){
         centerPointsGroup = chart.append("g");
         centerPointsGroup.attr("class","centerGroupPoints");
       }

    var centerPoints = centerPointsGroup.selectAll("text").data(center[conference],function(d) { return d.team; });
      centerPoints.enter().append("text")
        .attr("x",350)
        .attr('y', function(d,i){return d.yCoord})
        .attr('font-family',config.settings.fontFamily)
        .attr('font-size',config.settings.fontSize);

     centerPoints.text(function(d, i) { return d.points; })
        .transition()
        .duration(config.settings.transitionDuration)
        .attr('y', function(d,i){return d.yCoord});

     centerPoints.exit().remove();

    var rightGroup = chart.select('.rightGroup');
    if(rightGroup.empty()){
      rightGroup = chart.append("g");
      rightGroup.attr("class","rightGroup");
    }

    //setup the right side teams and points
    var rightTeams = rightGroup.selectAll("text").data(right[conference],function(d) { return d.team; });

    rightTeams.enter().append("text")
      .attr("x",700)
      .attr('font-family',config.settings.fontFamily)
      .attr('font-size',config.settings.fontSize)
      .attr('y', function(d,i){return d.yCoord;})
      .text(function(d, i) { return d.team; });

    rightTeams
      .transition()
      .duration(config.settings.transitionDuration)
      .attr('y', function(d,i){return d.yCoord;});

    rightTeams.exit().remove();

    var rightPointsGroup = chart.select('.rightGroupPoints');
    if(rightPointsGroup.empty()){
      rightPointsGroup = chart.append("g");
      rightPointsGroup.attr("class","rightGroupPoints");
    }

    var rightPoints = rightPointsGroup.selectAll("text").data(right[conference],function(d) { return d.team; });
    rightPoints.enter().append("text")
      .attr("x",650)
      .attr('y', function(d,i){return d.yCoord})
      .attr('font-family',config.settings.fontFamily)
      .attr('font-size',config.settings.fontSize);

    rightPoints.text(function(d, i) { return d.points; })
      .transition()
      .duration(config.settings.transitionDuration)
      .attr('y', function(d,i){return d.yCoord});

    rightPoints.exit().remove();

    //combine the coord values for drawing the slopes
    var slopes = [];
    for(var i=0;i<left[conference].length;i++){
      var val = left[conference][i];
      var slope = {};
      slope.left = val.yCoord;
      for(var j=0;j<center[conference].length;j++){
        if(val.team === center[conference][j].team){
          slope.center = center[conference][j].yCoord;
          slope.team = center[conference][j].team;
          break;
        }
      }
      slopes.push(slope);
    }

    var slopeGroup = chart.select('.slopeGroup');
    if(slopeGroup.empty()){
      slopeGroup = chart.append("g");
      slopeGroup.attr("class","slopeGroup");
    }
    var slopeLines = slopeGroup.selectAll("line").data(slopes,function(d){return d.team});

    slopeLines.enter().append("line")
      .attr('x1', 220)
      .attr('x2', 345)
      .attr('y1',function(d,i){return d.left - (config.settings.teamBuffer/2);})
      .attr('y2',function(d,i){return d.center - (config.settings.teamBuffer/2);})
      .attr('opacity', .5)
      .attr('stroke', 'black');

    slopeLines.transition().duration(750)
      .attr('y1',function(d,i){return d.left - (config.settings.teamBuffer/2);})
      .attr('y2',function(d,i){return d.center - (config.settings.teamBuffer/2);});

    slopeLines.exit().remove();

    slopeLines.enter().append("line")
      .attr('x1', 220)
      .attr('x2', 345)
      .attr('y1',function(d,i){return d.left - (config.settings.teamBuffer/2);})
      .attr('y2',function(d,i){return d.center - (config.settings.teamBuffer/2);})
      .attr('opacity', .5)
      .attr('stroke', 'black');

    slopeLines.transition().duration(750)
      .attr('y1',function(d,i){return d.left - (config.settings.teamBuffer/2);})
      .attr('y2',function(d,i){return d.center - (config.settings.teamBuffer/2);});

    slopeLines.exit().remove();

    var leftEndPointGroup = chart.select('.leftEndPointsGroup');
    if(leftEndPointGroup.empty()){
      leftEndPointGroup = chart.append("g");
      leftEndPointGroup.attr("class","leftEndPointsGroup");
    }
    var leftEndPoints = leftEndPointGroup.selectAll("path").data(slopes,function(d){return d.team});

    leftEndPoints
      .enter().append("path")
      .attr("d", d3.svg.symbol()
      .size(function(d) { return 20; })
      .type(function(d) { return "circle"; }))
      .attr("transform", function(d) { return "translate(220," + (d.left-(config.settings.teamBuffer/2)) + ")"; });

    leftEndPoints.transition().duration(config.settings.transitionDuration).attr("transform", function(d) { return "translate(220," + (d.left-(config.settings.teamBuffer/2)) + ")"; });

    leftEndPoints.exit().remove();

    var centerEndPointGroup = chart.select('.centerEndPointsGroup');
    if(centerEndPointGroup.empty()){
      centerEndPointGroup = chart.append("g");
      centerEndPointGroup.attr("class","centerEndPointsGroup");
    }
    var centerEndPoints = centerEndPointGroup.selectAll("path").data(slopes,function(d){return d.team});

    centerEndPoints
      .enter().append("path")
      .attr("d", d3.svg.symbol()
      .size(function(d) { return 20; })
      .type(function(d) { return "circle"; }))
      .attr("transform", function(d) { return "translate(345," + (d.center-(config.settings.teamBuffer/2)) + ")"; });

    centerEndPoints.transition().duration(config.settings.transitionDuration).attr("transform", function(d) { return "translate(345," + (d.center-(config.settings.teamBuffer/2)) + ")"; });

    centerEndPoints.exit().remove();

    var slopes2 = [];
    for(var i=0;i<center[conference].length;i++){
      var val = center[conference][i];
      var slope2 = {};
      slope2.center = val.yCoord;
      for(var j=0;j<right[conference].length;j++){
        if(val.team === right[conference][j].team){
          slope2.right = right[conference][j].yCoord;
          slope2.team = right[conference][j].team;
          break;
        }
      }
      slopes2.push(slope2);
    }

    var slopeGroup2 = chart.select('.slopeGroup2');
    if(slopeGroup2.empty()){
      slopeGroup2 = chart.append("g");
      slopeGroup2.attr("class","slopeGroup2");
    }

    var slopeLines2 = slopeGroup2.selectAll("line").data(slopes2,function(d){return d.team});

    slopeLines2.enter().append("line")
      .attr('x1', 520)
      .attr('x2', 645)
      .attr('y1',function(d,i){return d.center - (config.settings.teamBuffer/2);})
      .attr('y2',function(d,i){return d.right - (config.settings.teamBuffer/2);})
      .attr('opacity', .5)
      .attr('stroke', 'black');

    slopeLines2.transition().duration(750)
      .attr('y1',function(d,i){return d.center - (config.settings.teamBuffer/2);})
      .attr('y2',function(d,i){return d.right - (config.settings.teamBuffer/2);});

    slopeLines2.exit().remove();

    slopeLines2.enter().append("line")
      .attr('x1', 520)
      .attr('x2', 645)
      .attr('y1',function(d,i){return d.center - (config.settings.teamBuffer/2);})
      .attr('y2',function(d,i){return d.right - (config.settings.teamBuffer/2);})
      .attr('opacity', .5)
      .attr('stroke', 'black');

    slopeLines2.transition().duration(750)
      .attr('y1',function(d,i){return d.center - (config.settings.teamBuffer/2);})
      .attr('y2',function(d,i){return d.right - (config.settings.teamBuffer/2);});

    slopeLines2.exit().remove();

    var centerEndPointGroup2 = chart.select('.centerEndPointsGroup2');
    if(centerEndPointGroup2.empty()){
      centerEndPointGroup2 = chart.append("g");
      centerEndPointGroup2.attr("class","centerEndPointsGroup2");
    }
    var centerEndPoints2 = centerEndPointGroup2.selectAll("path").data(slopes2,function(d){return d.team});

    centerEndPoints2
      .enter().append("path")
      .attr("d", d3.svg.symbol()
      .size(function(d) { return 20; })
      .type(function(d) { return "circle"; }))
      .attr("transform", function(d) { return "translate(520," + (d.center-(config.settings.teamBuffer/2)) + ")"; });

    centerEndPoints2.transition().duration(config.settings.transitionDuration).attr("transform", function(d) { return "translate(520," + (d.center-(config.settings.teamBuffer/2)) + ")"; });

    centerEndPoints2.exit().remove();

    var rightEndPointGroup = chart.select('.rightEndPointsGroup');
    if(rightEndPointGroup.empty()){
      rightEndPointGroup = chart.append("g");
      rightEndPointGroup.attr("class","rightEndPointsGroup");
    }
    var rightEndPoints = rightEndPointGroup.selectAll("path").data(slopes2,function(d){return d.team});

    rightEndPoints
      .enter().append("path")
      .attr("d", d3.svg.symbol()
      .size(function(d) { return 20; })
      .type(function(d) { return "circle"; }))
      .attr("transform", function(d) { return "translate(645," + (d.right-(config.settings.teamBuffer/2)) + ")"; });

    rightEndPoints.transition().duration(config.settings.transitionDuration).attr("transform", function(d) { return "translate(645," + (d.right-(config.settings.teamBuffer/2)) + ")"; });

    rightEndPoints.exit().remove();
  }

  function adjustYCoords(conference){
    //adjustment algorithm based on the one used in here: http://skedasis.com/d3/slopegraph/
    for(var i=0;i< conference.length;i++){
      var val = conference[i];
      if(i > 0){
        var previousVal = conference[i-1];
        if((val.yCoord - config.settings.teamBuffer) < previousVal.yCoord){
          val.yCoord = val.yCoord + config.settings.teamBuffer;
          for(var j=i;j<conference.length;j++){
            conference[j].yCoord = conference[j].yCoord + config.settings.teamBuffer;
          }
        }
      }
    }
  }

  return{init:init,config:config};
}();
