/**
 * Created by omega on 2/8/17.
 */
$(function() {
    var coef = 0.95,
        width = coef * $('body').width(),
        height =  coef * $('body').height();
    var diameter =  coef * $('body').height();
    var duration = 350;

    var pubs = {
            "name": "AUT-1",
            "children": [
                {
                    "name": "PUB-1","children": [
                    {"name": "AUT-11","children": [
                        {"name": "AFF-111"},
                        {"name": "AFF-112"}
                    ]},
                    {"name": "AUT-12","children": [
                        {"name": "AFF-121"}
                    ]},
                    {"name": "AUT-13","children": [
                        {"name": "AFF-131"},
                        {"name": "AFF-132"}
                    ]},
                    {"name": "AUT-14","children": [
                        {"name": "AFF-141"}
                    ]}
                ]
                },
                {
                    "name": "PUB-2","children": [
                    {"name": "AUT-21"},
                    {"name": "AUT-22"},
                    {"name": "AUT-23"},
                    {"name": "AUT-24"},
                    {"name": "AUT-25"},
                    {"name": "AUT-26"},
                    {"name": "AUT-27"},
                    {"name": "AUT-28","children":[
                        {"name": "AFF-281"},
                        {"name": "AFF-282"},
                        {"name": "AFF-283"},
                        {"name": "AFF-284"},
                        {"name": "AFF-285"},
                        {"name": "AFF-286"}
                    ]}
                ]
                },
                {"name": "PUB-3"},
                {
                    "name": "PUB-4","children": [
                    {"name": "AUT-41"},
                    {"name": "AUT-42"},
                    {"name": "AUT-43","children": [
                        {"name": "AFF-431"},
                        {"name": "AFF-432"},
                        {"name": "AFF-433"},
                        {"name": "AFF-434","children":[
                            {"name": "ADD-4341"},
                            {"name": "ADD-4342"},
                        ]}
                    ]},
                    {"name": "AUT-44"}
                ]
                },
                {
                    "name": "PUB-5","children": [
                    {"name": "AUT-51","children":[
                        {"name": "AFF-511"},
                        {"name": "AFF-512"},
                        {"name": "AFF-513"},
                        {"name": "AFF-514"},
                        {"name": "AFF-515"},
                        {"name": "AFF-516"}
                    ]},
                    {"name": "AUT-52"},
                    {"name": "AUT-53"},
                    {"name": "AUT-54"},
                    {"name": "AUT-55","children":[
                        {"name": "AFF-551"},
                        {"name": "AFF-552"},
                        {"name": "AFF-553"},
                        {"name": "AFF-554"}
                    ]},
                    {"name": "AUT-56"},
                    {"name": "AUT-57"},
                    {"name": "AUT-58"},
                    {"name": "AUT-59"},
                    {"name": "AUT-591"},
                    {"name": "AUT-592"},
                    {"name": "AUT-593"},
                    {"name": "AUT-594"},
                    {"name": "AUT-595"},
                    {"name": "AUT-596"}
                ]
                },
                {
                    "name": "PUB-6","children": [
                    {"name": "AUT-61","children":[
                        {"name": "AFF-611"},
                        {"name": "AFF-612"},
                        {"name": "AFF-613"},
                        {"name": "AFF-614","children":[
                            {"name": "ADD-6141"},
                            {"name": "ADD-6142"},
                        ]}
                    ]},
                    {"name": "AUT-62"},
                    {"name": "AUT-63"},
                    {"name": "AUT-64"},
                    {"name": "AUT-65"},
                    {"name": "AUT-66"},
                    {"name": "AUT-67"},
                    {"name": "AUT-68"},
                    {"name": "AUT-69"}
                ]
                }
            ]
        };

    var i = 0,
        root,
        _link,
        _node;


    d3.selectAll("input").on("change", change);

    function change() {
        if (this.value === "radialtree")
            transitionToRadialTree();
        else if (this.value === "radialcluster")
            transitionToRadialCluster();
        else if (this.value === "tree")
            transitionToTree();
        else
            transitionToCluster();
    };

    function transitionToRadialTree() {

        var nodes = tree.nodes(root), // recalculate layout
            links = tree.links(nodes),
            link = d3.selectAll("path.link"),
            node = d3.selectAll("g.node");

        svg.transition().duration(duration)
            .attr("transform", "translate(" + (width/2) + "," +
                (height/2) + ")");
        // set appropriate translation (origin in middle of svg)

        link.data(links)
            .transition()
            .duration(duration)
            .style("stroke", "#fc8d62")
            .attr("d", radialDiagonal); //get the new radial path

        node.data(nodes)
            .transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
            });

        node.select("circle")
            .transition()
            .duration(duration)
            .style("stroke", "#984ea3");

    };

    function transitionToRadialCluster() {

        var nodes = radialCluster.nodes(root), // recalculate layout
            links = radialCluster.links(nodes);

        svg.transition().duration(duration)
            .attr("transform", "translate(" + (width/2) + "," +
                (height/2) + ")");
        // set appropriate translation (origin in middle of svg)

        _link.data(links)
            .transition()
            .duration(duration)
            .style("stroke", "#66c2a5")
            .attr("d", radialDiagonal); //get the new radial path

        _node.data(nodes)
            .transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
            });

        _node.select("circle")
            .transition()
            .duration(duration)
            .style("stroke", "#4daf4a");

    };

    function transitionToTree() {

        var nodes = radialTree.nodes(root), //recalculate layout
            links = radialTree.links(nodes);

        svg.transition().duration(duration)
            .attr("transform", "translate(40,0)");

        _link.data(links)
            .transition()
            .duration(duration)
            .style("stroke", "#e78ac3")
            .attr("d", diagonalcluster); // get the new tree path

        _node.data(nodes)
            .transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        _node.select("text")
            .transition()
            .duration(duration)
            .attr("transform", function () {
                return "rotate(0)";
            });

        _node.select("circle")
            .transition()
            .duration(duration)
            .style("stroke", "#377eb8");

    };

    function transitionToCluster() {

        var nodes = cluster.nodes(root), //recalculate layout
            links = cluster.links(nodes);

        svg.transition().duration(duration)
            .attr("transform", "translate(40,0)");

        _link.data(links)
            .transition()
            .duration(duration)
            .style("stroke", "#8da0cb")
            .attr("d", diagonalcluster); //get the new cluster path

        _node.data(nodes)
            .transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        _node.select("text")
            .transition()
            .duration(duration)
            .attr("transform", function () {
                return "rotate(0)";
            });

        _node.select("circle")
            .transition()
            .duration(duration)
            .style("stroke", "#e41a1c");

    };


    var tree = d3.layout.tree()
        .size([360, diameter / 2 - 10])
        .separation(function(a, b) { return (a.parent == b.parent ? 1 : 10) / a.depth; });

    var diagonal = d3.svg.diagonal.radial()
        .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

    var diagonalcluster = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        });

    var cluster = d3.layout.cluster()
        .size([height, width-160]);

    var radialTree = d3.layout.tree()
        .size([height, width-160]);

    var radialCluster = d3.layout.cluster()
        .size([360, diameter / 2 ])
        .separation(function(a, b) {
            return (a.parent == b.parent ? 1 : 2) / a.depth;
        });

    var radialDiagonal = d3.svg.diagonal.radial()
        .projection(function(d) {
            return [d.y, d.x / 180 * Math.PI];
        });

    var svg = d3.select("body").append("svg")
        .attr("width", width )
        .attr("height", height )
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    root = pubs;
    root.x0 = height / 2;
    root.y0 = width/2;

//root.children.forEach(collapse); // start with all children collapsed
    update(root);

    function update(source) {

        // Compute the new tree layout.
        var nodes = tree.nodes(root),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) { d.y = d.depth * 80; });

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

        var nodeExit = node.exit().remove();
        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            //.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
            .on("click", click);

        nodeEnter.append("circle")
            .attr("r", 4.5)
            .style("fill", function(d) { return d._children ? "blue" : "#fff"; });

        nodeEnter.append("text")
            .attr("x", 10)
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            //.attr("transform", function(d) { return d.x < 180 ? "translate(0)" : "rotate(180)translate(-" + (d.name.length * 8.5)  + ")"; })
            .text(function(d) { return d.name; })
            .style("fill-opacity", 1);


        // Update the links…
        var link = svg.selectAll("path.link")
            .data(links, function(d) { return d.target.id; });

        var linkExit = link.exit().remove();
        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {x: source.x0, y: source.y0};
                return diagonalcluster({source: o, target: o});
            });


        _link = link;
        _node = node;

        var form = $("input:checked").val();

        if (form === "radialtree")
            transitionToRadialTree();
        else if (form === "radialcluster")
            transitionToRadialCluster();
        else if (form === "tree")
            transitionToTree();
        else
            transitionToCluster();
    }

// Toggle children on click.
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }

        update(d);
    }

// Collapse nodes
    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(
            );
            d.children = null;
        }
    }
});