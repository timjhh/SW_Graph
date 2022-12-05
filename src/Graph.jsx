import React, { useEffect, useState } from 'react';
import * as d3 from "d3";
import { Table, Accordion, Card  } from 'react-bootstrap';



function Graph(props) {

const radius = 2;

const legendLabels = ["OTC", "Prescription"]
const linkClr = "rgb(211,211,211)"
const linkOpacity = 0.4


const [nodes,setNodes] = useState([]);
const [links,setLinks] = useState({});
const [selected, setSelected] = useState(null);
const [generated, setGenerated] = useState(false);
const [linkMatrix, setLinkMatrix] = useState({});
const [pictures, setPictures] = useState([])

// Update margin once size ref is created
const margin = {top: 50, right: 20, bottom: 30, left: 30},
width = 700 - margin.right - margin.left,
height = 400 - (margin.top+margin.bottom);

  // Update node(s) on highlight
  useEffect(() => {

    let node = d3.select(".content").selectAll(".nodes").selectAll("circle");
    let link = d3.select(".content").selectAll(".links").selectAll("line");

    link.attr("stroke", linkClr);

    let sel = selected;
    if(sel) {

      let connected = link.filter(g => g.source.id === sel.id || g.target.id === sel.id);
      let connNodes = node.filter(d => linkMatrix[sel.id].includes(d))
  
      link.attr("stroke-opacity", d => d.source.id === sel.id || d.target.id === sel.id ? 1 : 0.1);

      connected.attr("stroke", "red")
      connNodes.attr("opacity", 1)

      node.attr("opacity", d => {
        return linkMatrix[sel.id].includes(d) || sel.id === d.id ? 1 : 0.2
      })

      node.attr("stroke", d => d.id === sel.id ? "red" : "black")
      node.attr("stroke-width", d => d.id === sel.id ? 2 : 0.5)

    } else {
      node.attr("opacity", 1);
      node.selectAll("circle").attr("stroke", "black")
      node.attr("stroke", "black")
      node.attr("stroke-width", 0.5)
      link.attr("stroke-opacity", linkOpacity);
      link.attr("stroke", linkClr)
    }

  }, [selected])


useEffect(() => {

    d3.csv('./occs.csv')
    .then(text  => {
      setLinks(text)

      d3.csv("./pictures.csv")
      .then(pics => {
        var pcs = {}
        pics.forEach(d => {
          pcs[d.id] = d.link
        })
        setPictures(pcs)


      d3.csv('./characters.csv')
      .then(chars => {
          var matrix = {}
          chars.forEach(d => {
            matrix[d.id] = []
          })
          text.forEach(d => {
            if(matrix[d.source.id]) {
              matrix[d.source.id].push(d.target)
            }
            if(matrix[d.target.id]) {
              matrix[d.target.id].push(d.source)
            }
          })
        setLinkMatrix(matrix)
        setNodes(chars)
      }).catch(error => {
        console.log(error)
        console.log("Error reading nodes")
      })
    }).catch(error => {
        console.log(error)
        console.log("Error reading pictures")
      })
    }).catch(error => {
      console.log("Error reading links")
    });


}, []);

useEffect(() => {
  if(nodes.length !== 0 && links.length !== 0 && !generated) {
    genGraph()
  }
}, [nodes])

    async function genGraph() {

    setGenerated(true)

    const svg = d3.select("#graph").append("svg")
    .attr("class", "svg-content-responsive svg-container")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .style("border", "1px solid black")
    .style("position", "absolute")
    .attr("viewBox", "0 0 " + (width) + " " + (height))
    //.attr("viewBox", [-width / 2, -height / 2, width, height])
    //.attr("style", "max-width: 100%; height: auto; height: intrinsic;")
    .on("click", (event, item) => {
        if(event.srcElement.tagName === "svg") {
          setSelected(null)
        }
    });

    const g = svg.append("g")
    .attr("class", "content");


    const defs = svg.append('svg:defs');

    Object.entries(pictures).forEach(d => {
      defs.append("svg:pattern")
      .attr("id", (d[0].replace(" ",""))+"img")
      .attr("width", 64) 
      .attr("height", 64)
      .attr("patternUnits", "userSpaceOnUse")
      .append("svg:image")
      .attr("xlink:href", d[1])
      .attr("width", 64)
      .attr("height", 64)
      .attr("x", 0)
      .attr("y", 0);
  
    })


    const zoom = d3.zoom()
        .scaleExtent([0.75, 8])
        .extent([[0, 0], [width, height]])
        .on("zoom", (d) => {
          g.attr("transform", d.transform)
        });
    
    svg.call(zoom);


    const simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody())
   // .force("repel", d3.forceManyBody())
    .force("center", d3.forceCenter(width/2,height/2))
   // .force("collision", d3.forceCollide(1))
    .force("link", d3.forceLink().id(d => d.id))

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


    var link = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke", linkClr)
      .attr("width", 0.8)
      .attr("stroke-opacity", linkOpacity)
      .attr("stroke-width", function(d) { return (d.total*0.05); });


    // var node = g.append("g")
    // .attr("class", "nodes")
    // .selectAll("g")
    // .data(nodes)
    // .join("g")
    // .on("click", (e,d) => setSelected(d));

    // node.append("circle")
    //   .attr("r", d => (d.count / d3.max(nodes, d=>d.count)*10))
    //   .attr("fill", "rgba(70,130,180,0.8)")
    //   .attr("stroke", "black")
    //   .attr("stroke-opacity", 0.6)
    //   .attr("stroke-width", 0.5)
    //   .call(d3.drag()
    //   .on("start", dragstarted)
    //   .on("drag", dragged)
    //   .on("end", dragended));

    var node = g.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .on("click", (e,d) => setSelected(d))
    .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));



    // node.append("image")
    //   .attr("xlink:href", d => pictures[d.id] ? pictures[d.id] : "https://github.com/favicon.ico")
    //   .attr("x", -8)
    //   .attr("y", -8)
    //   .attr("width", d => (d.count / d3.max(nodes, d=>d.count)*10))
    //   .attr("height", d =>  (d.count / d3.max(nodes, d=>d.count)*10))
    //   .attr("stroke", "black")
    //   .attr("stroke-opacity", 0.6)
    //   .attr("stroke-width", 0.5);

    node.append("circle")
      // .attr("transform", "translate(" + d.posx + "," + d.posy + ")")
      //.attr("cx", 64 / 2)
      //.attr("cy", 64 / 2)
      .attr("r", d => (d.count / d3.max(nodes, d=>d.count)*10))
      // .style("fill", "#fff")
      .style("fill", d => pictures[d.id] ? ("url(#" + (d.id.replace(" ",""))+"img)") : "steelblue")
          //   .attr("r", d => (d.count / d3.max(nodes, d=>d.count)*10))
    //   .attr("fill", "rgba(70,130,180,0.8)")
    //   .attr("stroke", "black")
    //   .attr("stroke-opacity", 0.6)
    //   .attr("stroke-width", 0.5)
    //   .call(d3.drag()
    //   .on("start", dragstarted)
    //   .on("drag", dragged)
    //   .on("end", dragended));



    node.append("text")
    .text((d) => d.id)
        .attr('x', d => (d.count / d3.max(nodes, d=>d.count)*10) + 2)
        .style("cursor", "pointer")
        .style("font-weight", "bold")
        .style("font-size", "0.2em")
        .attr('y', 0);
        
    simulation
    .nodes(nodes)
    .on("tick", ticked);

    simulation.force("link")
    .links(links)


  //function drag(simulation) {

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

    // return d3.drag()
    //   .on("start", dragstarted)
    //   .on("drag", dragged)
    //   .on("end", dragended);

  //}




    function ticked() {

        link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

        // node
        // .attr("cx", d => d.x)
        // .attr("cy", d => d.y);

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
