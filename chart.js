//set the margins
var margin = { top: 30, right: 160, bottom: 30, left: 60 },
width = 900 - margin.left - margin.right,
height = 500 - margin.top - margin.bottom;
height2 = 300 - margin.top - margin.bottom;

d3.select("body").style("width", width + margin.left + margin.right + "px").style("background-color", "#FFF4D5")

//write out your source text here
var sourcetext = "B. Edil | Source: SIPRI";

// set the type of number here, n is a number with a comma, .2% will get you a percent, .2f will get you 2 decimal points
var NumbType = d3.format(".2f");

// color array
var orangescale = ["#EA6903", "#F2A568", "#8C3F02", "#007DBA"];
var colors = ["#EA6903", "#F2A568"];
//color function pulls from array of colors stored in color.js
var color = d3.scale.ordinal().range(orangescale);
//define the approx. number of x scale ticks
var xscaleticks = 8;
//define number of top suppliers to show
var topsuppliers = 7;
//define Nan countries
var noData = ["African Union**","Bahamas","Bhutan","Hamas Palestine*",	"Huthi rebels Yemen*", "Kiribati",	"Marshall Islands",	"Micronesia",	"NATO**",	"OSCE**",	"Palau",	"PKK Turkey*",	"PRC Israel*Palestine*",	"Samoa",	"Solomon Islands",	"Suriname",	"Syria rebels*",	"Tonga",	"Tuvalu",	"Ukraine Rebels*",	"United Nations**",	"Vanuatu",	"Western Sahara"];


//define your year format here, first for the x scale, then if the date is displayed in tooltips
var parseDate = d3.time.format("%m/%d/%y").parse;
var formatDate = d3.time.format("%b %d, '%y");

//create an SVGs
var svg = d3
.select("#graphic")
.style("width", width + margin.left + margin.right + "px")
.append("svg")
.style("background-color", "#FFF4D5")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//make a rectangle so there is something to click on
svg
.append("svg:rect")
.attr("width", width)
.attr("height", height)
.attr("class", "plot");

var svg2 = d3
.select("#graphic2")
.style("width", width + margin.left + margin.right + "px")
.append("svg")
.style("background-color", "#FFF4D5") // Brushing context box container
.attr("width", width + margin.left + margin.right + 20)
.attr("height", height2 + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + (margin.left - 20) + "," + margin.top + ")");

svg2
.append("svg:rect")
.attr("width", width)
.attr("height", height2)
.attr("class", "plot");

var legend2 = svg2.selectAll(".legend2").data(colors);
var legendEnter2 = legend2
.enter()
.append("g")
.attr("class", "legend")
.attr("transform", function(d, i) {
  return "translate(30," + (i * 19 + 10) + ")";
});

legendEnter2
.append("circle")
.attr("cx", width - 10.5)
.attr("r", 7)
.style("fill", function(d, i) {
  return colors.slice()[i];
});

legendEnter2
.append("text")
.attr("x", width + 5)
.attr("dy", ".35em")
.style("text-anchor", "start")
.text(function(d, i) {
  switch (i) {
    case 0:
      return "Delievered";
    case 1:
      return "Delievery planned";
  }
});

//make a clip path for the graph
var clip = svg
.append("svg:clipPath")
.attr("id", "clip")
.append("svg:rect")
.attr("x", 0)
.attr("y", 0)
.attr("width", width)
.attr("height", height);

var clip2 = svg2
.append("svg:clipPath")
.attr("id", "clip2")
.append("svg:rect")
.attr("x", 0)
.attr("y", 0)
.attr("width", width)
.attr("height", height2);

function removeDuplicates(originalArray, prop) {
var newArray = [];
var lookupObject = {};

for (var i in originalArray) {
  lookupObject[originalArray[i][prop]] = originalArray[i];
}

for (i in lookupObject) {
  newArray.push(lookupObject[i]);
}
return newArray;
}

async function loadData() {
await d3.csv("top_suppliers.csv", d => {
  suppliers = d;
});
await d3.csv("military_expenses.csv", d => {
  formatted = d;
  var menuitems = removeDuplicates(d, "Country");
  var selectoption = d3.select("#selectoption");

  selectoption
    .selectAll("option")
    .data(menuitems)
    .enter()
    .append("option")
    .attr("value", d => d.Country)
    .append("span")
    .attr("id", d => "choice-" + d.Country)
    .text(d => d.Country);
});
await new Promise((resolve, reject) => {
  setTimeout(resolve, 400);
});
return redraw();
}
loadData();

//suck in the data, store it in a value called formatted, run the redraw function

// force data to update when menu is changed
var menu = d3.select("#selectoption").style("background-color", "#FFF4D5").on("change", change);

d3.select(window)
.on("keydown", function() {
  altKey = d3.event.altKey;
})
.on("keyup", function() {
  altKey = false;
});
var altKey;

// set terms of transition that will take place
// when a new economic indicator is chosen
function change() {
d3.transition()
  .duration(altKey ? 7500 : 1500)
  .each(redraw);
}

// define visible props
var isVisible = {
USA: false,
China: false,
Russia: false,
millions: true
};

// all the meat goes in the redraw function
function redraw() {
// create data nests based on economic indicator (series)
var nested = d3
  .nest()
  .key(function(d) {
    return d.Country;
  })
  .map(formatted);
var nested2 = d3
  .nest()
  .key(function(d) {
    return d.Recipent;
  })
  .map(suppliers);

// get value from menu selection
// the option values are set in HTML and correspond
//to the [type] value we used to nest the data
var series = menu.property("value");

// only retrieve data from the selected series, using the nest we just created
var data = nested[series];

var data2 = nested2[series];
data2 == undefined ? (data2 = nested2["No data"]) : null;
// for object constancy we will need to set "keys", one for each type of data (column name) exclude all others.
color.domain(
  d3.keys(data[0]).filter(function(key) {
    return data[0].Country == "China" || "Russia" || "USA"
      ? key !== "date" && key !== "Country" && key !== data[0].Country
      : key !== "date" && key !== "Country";
  })
);
var linedata = color.domain().map(function(name) {
  return {
    name: name == "millions" ? data[0].Country : name,
    visible: isVisible[name],
    values: data.map(function(d) {
      return {
        name: name == "millions" ? data[0].Country : name,
        date: d.date,
        value: parseFloat(d[name], 10)
      };
    })
  };
});

var mainbardata = linedata.slice(0, 1);
var linedata2 = linedata.slice(1);
bardata = data2
  .map(d => {
    return {
      supplier: d.Supplier,
      total: parseFloat(d.total, 10),
      delievered: parseFloat(d.delievered, 10),
      delievery_planned: parseFloat(d.delievery_planned, 10)
    };
  })
  .slice(0, topsuppliers);

// Transpose the data into layers
var transbardata = bardata.map((d, i) => {
  return {
    x: "supplier" + i,
    y: d.delievery_planned,
    y0: d.delievered,
    z: d.supplier
  };
});

var totalvalue = linedata[0].values
  .reduce((acc, curr) => acc + (isNaN(curr.value) ? 0 : curr.value), 0)
  .toFixed(1);

noData.includes(linedata[0].name)
? d3
.select("#total")
.text("No data for this country")
: d3
.select("#total")
.text(" spent " + totalvalue + "$ millions on millitary in 5 years");

var totalunits;
(data2 == undefined)
?null
:totalunits = data2
.reduce((acc, curr) => acc + (isNaN(parseFloat(curr.total)) ? 0 : parseFloat(curr.total)), 0)
  .toFixed(0);

totalunits == 0
?d3.select("#dec")
.text("No data for this country")
.style("margin-top", "5pt")
:d3.select("#dec")
.text(linedata[0].name + " ordered and received at least " + totalunits + " military units from other countries(2014-2018)")
.style("margin-top", "5pt");

d3.select("#dek")
.text("Top suppliers")
.style("font-family", "SourceSansPro-Bold")
.style("font-size", "25pt")
.style("margin-top", "15pt");



//make an empty variable to stash the last values into so i can sort the legend
var lastvalues = [];
var dates = data.map(d => d.date);
//setup the x and y scales
var x = d3.scale
  .ordinal()
  .domain(dates.reverse())
  .rangeRoundBands([0, width], 0.6);

var y2 = d3.scale
  .ordinal()
  .domain(
    bardata.map(function(d, i) {
      return "supplier" + i;
    })
  )
  .rangeRoundBands([0, height2], 0.3);

var maxy = findMaxY(linedata);
var y = d3.scale
  .linear()
  .domain([0, maxy + maxy * 0.15])
  .range([height, 0]);

var maxx2 = findMaxX2(bardata);
var x2 = d3.scale
  .linear()
  .domain([0, maxx2 + maxx2 * 0.25])
  .range([0, width]);

//create and draw the x axis
var xAxis = d3.svg
  .axis()
  .scale(x)
  .orient("bottom")
  .tickPadding(8);

svg.append("svg:g").attr("class", "x axis");

var yAxis2 = d3.svg
  .axis()
  .scale(y2)
  .orient("left")
  .tickSize(0);

svg2.append("svg:g").attr("class", "y axis2");

//create and draw the y axis
var yAxis = d3.svg
  .axis()
  .scale(y)
  .orient("left")
  .tickSize(0 - width)
  .tickPadding(8);

svg.append("svg:g").attr("class", "y axis");

var xAxis2 = d3.svg
  .axis()
  .scale(x2)
  .orient("top")
  .tickSize(0 - height);

svg2
  .append("svg:g")
  .attr("class", "x axis2");
  //.style("stroke-dasharray", "5 5"); // add dashes to axis

//will draw the line
var line = d3.svg
  .line()
  .x(function(d) {
    return x(d.date) + x.rangeBand() * 0.5;
  })
  .y(function(d) {
    return y(d.value);
  });

var bar = svg2.selectAll("g.bar").data(transbardata);
var barEnter = bar
  .enter()
  .append("g")
  .attr("class", "bar");
barEnter
  .append("rect")
  .attr("id", "delivered")
  .attr("y", function(d) {
    return y2(d.x);
  })
  .attr("height", 25.2)
  .attr("x", x2(0))
  .attr("width", function(d) {
    return x2(d.y0);
  })
  .style("fill", orangescale[0])
  .on("mouseover", d => {
    d3.select(".delievered-value-" + d.x)
    .attr("display", "true")
  })
  .on("mouseout", d => {
    d3.select(".delievered-value-" + d.x)
    .attr("display", "none")
  });
barEnter
  .append("rect")
  .attr("id", "planned")
  .attr("y", function(d) {
    return y2(d.x);
  })
  .attr("height", 25.2)
  .attr("x", function(d) {
    return x2(d.y0);
  })
  .attr("width", function(d) {
    return x2(d.y);
  })
  .style("fill", orangescale[1])
  .on("mouseover", d => {
    d3.select(".planned-value-" + d.x)
    .attr("display", "true")
  })
  .on("mouseout", d => {
    d3.select(".planned-value-" + d.x)
    .attr("display", "none")
  });

barEnter
  .append("text")
  .attr("class", "legend")
  .attr("x", function(d) {
    return x2(d.y0 + d.y);
  })
  .attr("y", function(d) {
    return y2(d.x);
  })
  .attr("dx", "1em")
  .attr("dy", "1.2em")
  .text(function(d) {
    return d.z;
  });

  barEnter
  .append("text")
  .attr("class", d => "delievered-value-" + d.x + " delbarvalue")
  .attr("display", "none")
  .attr("x", function(d) {
    return x2(d.y0);
  })
  .attr("y", function(d) {
    return y2(d.x);
  })
  .attr("dx", "-2em")
  .attr("dy", "1.2em")
  .text(function(d) {
    return d.y0;
  });

  barEnter
  .append("text")
  .attr("class", d => "planned-value-" + d.x + " planbarvalue")
  .attr("display", "none")
  .attr("x", function(d) {
    return x2(d.y0);
  })
  .attr("y", function(d) {
    return y2(d.x);
  })
  .attr("dx", "-2.2em")
  .attr("dy", "1.2em")
  .text(function(d) {
    return d.y;
  });

//add last prop delete
d3.selection.prototype.last = function() {
  var last = this.size() - 1;
  return d3.select(this[0][last]);
};
d3.selection.prototype.prelast = function() {
  var prelast = this.size() - 2;
  return d3.select(this[0][prelast]);
};
var count = svg2.selectAll(".bar")[0].length - bar[0].length;
for (var i = 0; i < count; i++) {
  var deleteBars = svg2.selectAll(".bar");
  deleteBars.last().remove();
}

var barUpdate = d3.transition(bar);
barUpdate
  .selectAll("#delivered")
  .attr("y", function(d) {
    return y2(d.x);
  })
  .attr("height", 25.2)
  .attr("x", x2(0))
  .attr("width", function(d, i) {
    return x2(transbardata.filter(c => c.x == d.x)[0].y0);
  });
barUpdate
  .selectAll("#planned")
  .attr("y", function(d) {
    return y2(d.x);
  })
  .attr("height", 25.2)
  .attr("x", function(d) {
    return x2(transbardata.filter(c => c.x == d.x)[0].y0);
  })
  .attr("width", function(d) {
    return x2(transbardata.filter(c => c.x == d.x)[0].y);
  });
barUpdate
  .selectAll("text")
  .attr("x", function(d) {
    return x2(
      transbardata.filter(c => c.x == d.x)[0].y0 +
        transbardata.filter(c => c.x == d.x)[0].y
    );
  })
  .attr("y", function(d) {
    return y2(transbardata.filter(c => c.x == d.x)[0].x);
  })
  .text(function(d) {
    return transbardata.filter(c => c.x == d.x)[0].z;
  });

  barUpdate
  .selectAll(".delbarvalue")
  .attr("x", function(d) {
    return x2(
      transbardata.filter(c => c.x == d.x)[0].y0
    );
  })
  .attr("y", function(d) {
    return y2(transbardata.filter(c => c.x == d.x)[0].x);
  })
  .text(function(d) {
    return transbardata.filter(c => c.x == d.x)[0].y0;
  });

  barUpdate
  .selectAll(".planbarvalue")
  .attr("x", function(d) {
    return x2(
      transbardata.filter(c => c.x == d.x)[0].y0 +
        transbardata.filter(c => c.x == d.x)[0].y
    );
  })
  .attr("y", function(d) {
    return y2(transbardata.filter(c => c.x == d.x)[0].x);
  })
  .text(function(d) {
    return (transbardata.filter(c => c.x == d.x)[0].y) == 0 ? null : transbardata.filter(c => c.x == d.x)[0].y;
  });


// append bar for main country
var mainbardatarect = mainbardata[0].values;
var mainbar = svg.selectAll(".mainbar").data(mainbardatarect);

var mainbarEnter = mainbar
  .enter()
  .append("g")
  .attr("id", mainbardatarect.name + "-bar")
  .attr("class", "mainbar");
mainbarEnter
  .append("rect")
  .attr("class", "mainrect")
  .attr("y", function(d) {
    return y(d.value);
  })
  .attr("height", d => {
    return height - y(d.value);
  })
  .attr("x", function(d) {
    return x(d.date);
  })
  .attr("width", 50)
  .attr("fill", orangescale[0]);

mainbarEnter
  .append("text")
  .attr("class", "barvalue")
  .attr("x", function(d) {
    return x(d.date);
  })
  .attr("y", function(d) {
    return y(d.value);
  })
  .attr("dx", "-1em")
  .attr("dy", "-0.5em")
  .attr("display", "true")
  .text(d => (isNaN(d.value) ? "no data" : d.value));

var mainbarUpdate = d3.transition(mainbar);
mainbarUpdate
  .attr("id", function(d) {
    return d.name + "-bar";
  })
  .select(".mainrect")
  .attr("y", function(d) {
    return y(d.value);
  })
  .attr("height", function(d) {
    return height - y(d.value);
  })
  .attr("x", function(d, i) {
    return x(d.date);
  });
mainbarUpdate
  .select(".barvalue")
  .attr("x", function(d) {
    return x(d.date) + x.rangeBand() * 0.5;
  })
  .attr("y", d => (isNaN(d.value) ? height - 3 : y(d.value)))
  .attr("display", "true")
  .text(d => (isNaN(d.value) ? "no data" : d.value));

//bind the data
var thegraph = svg.selectAll(".thegraph").data(linedata2);

//append a g tag for each line and set of tooltip circles and give it a unique ID based on the column name of the data
var thegraphEnter = thegraph
  .enter()
  .append("g")
  .attr("clip-path", "url(#clip)")
  .attr("class", "thegraph")
  .attr("id", function(d) {
    return d.name + "-line";
  })
  .style("stroke-width", 2.5)
  .on("mouseover", function(d) {
    d3.select(this) //on mouseover of each line, give it a nice thick stroke
      .style("stroke-width", "4px")
      .selectAll(".tipcircle")
      .attr("r", 7);
    d3.select(this)
      .selectAll(".barvalue")
      .attr("display", "true");
    var selectthegraphs = $(".thegraph").not(this); //select all the rest of the lines, except the one you are hovering on and drop their opacity
    d3.selectAll(selectthegraphs).style("opacity", 0.2);

    var getname = document.getElementById(d.name); //use get element cause the ID names have spaces in them
    var selectlegend = $(".legend").not(getname); //grab all the legend items that match the line you are on, except the one you are hovering on
    d3.select(getname).attr("class", "legend-select"); //change the class on the legend name that corresponds to hovered line to be bolder
  })
  .on("mouseout", function(d) {
    //undo everything on the mouseout
    d3.select(this)
      .style("stroke-width", "2.5px")
      .selectAll(".tipcircle")
      .attr("r", 5);
    d3.select(this)
      .selectAll(".barvalue")
      .attr("display", "none");

    var selectthegraphs = $(".thegraph").not(this);
    d3.selectAll(selectthegraphs).style("opacity", 1);

    var getname = document.getElementById(d.name);
    var getname2 = $('.legend[fakeclass="fakelegend"]');
    var selectlegend = $(".legend")
      .not(getname2)
      .not(getname);

    d3.selectAll(selectlegend).style("opacity", 1);

    d3.select(getname).attr("class", "legend");
  });

//actually append the line to the graph
thegraphEnter
  .append("path")
  .attr("class", "line")
  .style("stroke", function(d) {
    return color(d.name);
  })
  .attr("d", function(d) {
    return line(d.values[0]);
  });
//then append some 'nearly' invisible circles at each data point
thegraph
  .selectAll("circle")
  .data(d => d.values)
  .enter()
  .append("circle")
  .attr("class", "tipcircle")
  .attr("cx", function(d, i) {
    return x(d.date) + x.rangeBand() * 0.5;
  })
  .attr("cy", function(d, i) {
    return y(d.value);
  })
  .attr("r", 5)
  .attr("opacity", 1)
  .attr("fill", d => color(d.name));
thegraph
  .selectAll("text")
  .data(d => d.values)
  .enter()
  .append("text")
  .attr("class", "barvalue")
  .attr("x", function(d, i) {
    return x(d.date) + x.rangeBand() * 0.5;
  })
  .attr("y", function(d, i) {
    return y(d.value);
  })
  .text(d => d.value);

//append the legend

var legend = svg.selectAll(".legend").data(linedata);

var legendEnter = legend
  .enter()
  .append("g")
  .attr("class", "legend")
  .attr("id", function(d) {
    return d.name;
  });

//create a scale to pass the legend items through
var legendscale = d3.scale
  .ordinal()
  .domain(lastvalues)
  .range([0, 30, 60, 90, 120, 150, 180, 210]);

//actually add the circles to the created legend container
legendEnter
  .append("circle")
  .attr("id", d => "circle-" + d.name)
  .attr("cx", width + 20)
  .attr("cy", function(d) {
    return legendscale(d.values[d.values.length - 1].value);
  })
  .attr("r", 8)
  .attr("fill", function(d) {
    return d.visible ? color(d.name) : "#FFFFFF";
  })
  .attr("stroke", "#BDC2C6")
  .attr("stroke-width", "0.5")
  .on("mouseover", d => {
    d3.select("#circle-" + d.name)
    .attr("fill", d => (d.visible) ? color(d.name) : "#9DA4A9");;
  })
  .on("mouseout", d => {
    d3.select("#circle-" + d.name)
    .attr("fill", d => (d.visible) ? color(d.name) : "#FFFFFF");
  })
  .on("click", d => {
    isVisible[d.name] = !isVisible[d.name];
    change();
  });

//add the legend text
legendEnter
  .append("text")
  .attr("id", d => "legend-" + d.name)
  .attr("x", width + 35)
  .attr("y", function(d) {
    return legendscale(d.values[d.values.length - 1].value);
  })
  .text(function(d) {
    return d.name;
  });

// set variable for updating visualization

var thegraphUpdate = d3.transition(thegraph);

thegraphUpdate.attr("id", function(d) {
  return d.name + "-line";
});
// change values of path and then the circles to those of the new series
thegraphUpdate.select("path").attr("d", function(d) {
  return d.visible ? line(d.values) : null;
});

thegraphUpdate
  .selectAll("circle")
  .attr("cy", (d, i) => {
    return y(d.value);
  })
  .attr("cx", d => x(d.date) + x.rangeBand() * 0.5)
  .attr("display", d =>
    linedata2.filter(c => c.name == d.name)[0].visible ? "true" : "none"
  );
thegraphUpdate
  .selectAll("text")
  .attr("x", function(d, i) {
    return x(d.date) + x.rangeBand() * 0.5;
  })
  .attr("y", function(d, i) {
    return y(d.value) - 20;
  })
  .text(d => d.value)
  .attr("display", "none");

// and now for legend items
var legendUpdate = d3.transition(legend);

var deletelast = svg.selectAll(".legend");
svg.selectAll(".legend")[0].length - legend[0].length === 1
  ? deletelast.last().remove()
  : null; //delete last element if China or USA or Russia is choosen
legendUpdate.attr("class", "legend").attr("id", function(d) {
  return d.name;
});

legendUpdate
  .select("circle")
  .attr("fill", function(d) {
    return d.visible ? color(d.name) : "#FFFFFF";
  })
  .attr("cy", function(d, i) {
    return legendscale(d.values[d.values.length - 1].value);
  });

var selectedLegend = legendUpdate
  .select("text")
  .attr("id", d => {
    return "legend-" + d.name;
  })
  .attr("y", function(d) {
    return legendscale(d.values[d.values.length - 1].value);
  })
  .text(function(d) {
    return d.name;
  });

//update width of menu based on value
//var bbox = legend.node().getBBox();
//var newSelectWidth = bbox.width;

//console.log('width', newSelectWidth);
//console.log(d3.select("#selectoption"));
//d3.select('select')
//.style("width", newSelectWidth + "px");

// update the axes,
d3.transition(svg)
  .select(".y.axis")
  .call(yAxis);

d3.transition(svg)
  .select(".x.axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);

d3.transition(svg2)
  .select(".y.axis2")
  .call(yAxis2);

d3.transition(svg2)
  .select(".x.axis2")
  .attr("transform", "translate(0," + 0 + ")")
  .call(xAxis2);

//end of the redraw function
}

function findMaxY(data) {
// Define function "findMaxY"
var maxYValues = data.map(function(d) {
  if (d.visible) {
    return d3.max(d.values, function(value) {
      // Return max rating value
      return value.value;
    });
  }
});
return d3.max(maxYValues);
}
function findMaxX2(data) {
// Define function "findMaxY"
var maxYValues = data.map(function(d) {
  return d.total;
});
return d3.max(maxYValues);
}
svg2
.append("svg:image")
.attr("x", width + 20)
.attr("y", height2 - margin.bottom - 10)
.attr("xlink:href", "rferllogo.png")
.attr("class", "logo");
svg2
.append("svg:text")
.attr("text-anchor", "end")
.attr("x", width + margin.right )
.attr("y", height2 + margin.bottom - 10)
.text(sourcetext)
.attr("class", "source");
