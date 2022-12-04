import React, { useEffect, useState } from 'react';
import * as d3 from "d3";
import { Table, Accordion, Card  } from 'react-bootstrap';



function Graph(props) {

const radius = 2;

const legendLabels = ["OTC", "Prescription"]

const [nodes,setNodes] = useState([]);
const [links,setLinks] = useState({})




// Update margin once size ref is created
const margin = {top: 50, right: 20, bottom: 30, left: 30},
width = 700 - margin.right - margin.left,
height = 400 - (margin.top+margin.bottom);

const MIN_RADIUS = 1;
const MAX_RADIUS = 30;


useEffect(() => {




    d3.csv('./occs.csv')
    .then(text  => {
      setLinks(text)
      d3.csv('./characters.csv')
      .then(chars  => {
        setNodes(chars)
      }).catch(error => {
        console.log("Error reading nodes")
      });
    }).catch(error => {
      console.log("Error reading links")
    });


}, []);

useEffect(() => {
  genGraph()
}, [nodes])


    async function genGraph() {


    if(nodes === [] || links === {}) return;

    console.log(nodes)
    console.log(links)

    d3.select("#graph").select("svg").remove();

    const svg = d3.select("#graph")
    .append("svg")
    .attr("class", "svg-content-responsive svg-container")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .style("border", "1px solid black")
    //.style("position", "absolute")
    .attr("viewBox", "0 0 " + (width) + " " + (height))
    .on("click", (event, item) => {
        console.log(event.srcElement.tagName === "svg");

        if(event.srcElement.tagName === "svg") {
          node.attr("opacity", 1);
        }

    });

    const g = svg.append("g")
    .attr("class", "content");


    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .extent([[0, 0], [width, height]])
        .on("zoom", (d) => {
          g.attr("transform", d.transform)
        });
    
    svg.call(zoom);


    var forceX = d3.forceX().strength(0.5)
    var forceY = d3.forceY().strength(0.5);


    const simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody())
    .force("repel", d3.forceManyBody().strength(-30))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide(4))
    .force("link", d3.forceLink().id(d => d.id))
    .force("x", forceX)
    .force("y", forceY);

    const legendX = parseFloat(margin.left/2);
    const legendY = parseFloat(margin.top/2);
    const legend = svg.append("g")
    .attr("class", "legend");

    legend.selectAll("path")
    .data(legendLabels)
    .join("circle")
      // Manually add offset based on index of year
      // Oh boy is this some spaghetti
      // Note - 20 is the offset in this case, as each index is multiplied by 20
      .attr("transform", (d,idx) => "translate(" + parseFloat(legendX-5) + "," + parseFloat((legendY-2) + (idx * 10)) + ")")
      .attr("r", 2)
      .attr("fill", (d,idx) => d === "OTC" ? "red" : "rgba(70,130,180,0.8)");

    // Add legend text
    legend.selectAll("text")
    .data(legendLabels)
    .join("text")
      .text(d => d)
      .attr("font-size", "0.5em")
      .attr("font-weight", "lighter")
      .attr("x", legendX)
      // Manually added text offset - see above comment
      .attr("y", (d,idx) => parseFloat((legendY) + (idx * 10)));

    var node = g.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .enter().append("g");


    var link = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke", "rgba(211,211,211, 0.8)")
      .attr("width", 0.8)
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", function(d) { return (d.width+(0.2)); });


    node.append("circle")
    .attr("r", d => (d.count / d3.max(nodes, d=>d.count)*20))
    .attr("fill", d => ("rgba(70,130,180,0.8)")) // rgba is steelblue at 80% opacity
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));




    simulation
    .nodes(nodes)
    .on("tick", ticked);

    simulation.force("link")
    .links(links)

    node.append("text")
    .text((d) => d.id)
        .attr('x', 2)
        .style("cursor", "pointer")
        .style("font-weight", "bold")
        .style("font-size", "0.2em")
        .attr('y', 0);

  function dragstarted(d) {
    if (!d.active) simulation.alphaTarget(0.3).restart();
    d.subject.fx = d.x;
    d.subject.fy = d.y;
  }

  function dragged(d) {
    d.subject.fx = d.x;
    d.subject.fy = d.y;
  }

  function dragended(d) {
    if (!d.active) simulation.alphaTarget(0);
    d.subject.fx = null;
    d.subject.fy = null;
  }




    function ticked() {

        link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

        node
        .attr("transform", function(d) {
          return "translate(" + (d.x = Math.max(radius, Math.min(width - radius, d.x))) + "," + (d.y = Math.max(radius, Math.min(height - radius, d.y))) + ")"; 
        });

      }

      // Restart simulation
      simulation
      .alpha(0.2)
      .alphaTarget(0)
      .restart();
  }

  return (
    <>
    <div id={"graph"}>
      
    </div>
    </>
  );
}

export default Graph;
