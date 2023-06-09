// https://codesandbox.io/s/github/rjoxford/MatterJSGaltonBoard
// https://www.tylermw.com/plinko-statistics-insights-from-the-bean-machine/
// https://onlinestatbook.com/stat_sim/sampling_dist/

let width = 700;
let height = 700;
let x0 = width / 2;

let populationHeight = height * 0.4;
let sampleHeight = 50;
let samplingDistributionHeight = height - (populationHeight + sampleHeight);

// ball properties
const ballRadius = 5;
let generationSpeed = 1;
let nBalls = 500;

let sampleSize = d3.select("#sampleSize").property("value");
let distributionFunction = d3.select("#dist").value

let balls = [], means = [], currentMean;


let populationMean = x0;
let populationSd = width * 0.12;
let updatePopulationInterval;
let creationIntervalId;

let y = d3.scaleLinear()
    .domain([0, jStat.normal.pdf(x0, x0, 80 / Math.sqrt(sampleSize))])
    .range([samplingDistributionHeight, 0])



    
// ========================================================================== //
// Buttons and listeners
// ========================================================================== //

const sampleSizeInput = d3.select("#sampleSize")
    .on("change", function () {
        resetMeans();
        sampleSize = d3.select("#sampleSize").property("value");
        updateSamplingDistributionParams();
        updateSamplingDistributionDescriptives(true);
        updateSampleDescriptives();
        drawNormalDistribution(populationMean, populationSd / Math.sqrt(sampleSize));
    });

const distributionInput = d3.select("#dist")
    .on("change", function () {
        reset();
    });

function scaleCanvas() {
    var availableWidth = window.visualViewport.width;

    var scaleFactor = Math.min(1, availableWidth / (width * 1.02));
    d3.select("#container")
        .style("transform", `scale(${scaleFactor})`)
        // .style("width", `${width * scaleFactor}px`)
        .style("height", `${height * scaleFactor}px`);

    d3.select("#flex-container")
        .style("width", `${Math.ceil(width * scaleFactor)}px`)

    // d3.select("#container")
    //     .style("font-size", `${1/scaleFactor}em`)
}

// Update the canvas position when the window is resized
window.addEventListener('resize', function () {
    scaleCanvas();
});



// ========================================================================== //
// Physics
// ========================================================================== //

// physics properties
const populationDotParams = {
    label: "circle",
    restitution: 0,
    friction: 0.1,
    frictionAir: 0.045,
    frictionStatic: 1,
    slop: 0,
    mass: 0.1,
    density: 100,
    sleepThreshold: 15,
    collisionFilter: { group: 1 }
}

function populationDotColor() {
    return d3.schemeCategory10[Math.floor(Math.random() * 10)]
}

// let restitution = 0; // bounciness
let friction = Infinity;
// let frictionAir = 0.05;
let frictionStatic = Infinity;
// let slop = 0;
// let mass = 0.1;
// let density = 100;




showSleeping = false;

var { Engine, Render, Runner,
    Composite, Composites, Common,
    MouseConstraint, Mouse, Events,
    World, Bodies, Body } = Matter;

let engine, render, runner, world;

var pos, mouseX, mouseY;

function initialize() {

    // create engine
    engine = Engine.create({
        enableSleeping: true
    }),
        world = engine.world;

    // create renderer
    render = Render.create({
        element: document.getElementById("container"),
        engine: engine,
        options: {
            width: width,
            height: height,
            background: "transparent",
            wireframes: false,
            showSleeping: showSleeping
        }
    });
    Render.run(render);

    // engine.gravity.y = 1;
    // engine.timing.timeScale = 1;
    engine.positionIterations = 6;
    engine.velocityIterations = 8;

    // create runner
    runner = Runner.create();
    Runner.run(runner, engine);
    render.canvas.position = "absolute";

    drawDots();
}

function drawDots() {
    var isDrawing = false;
    function startDrawing(x, y) {
        isDrawing = true;
        resetMeans();
        Composite.add(world, makePopulationDot(x, y, ballRadius));
        creationIntervalId = setInterval(function () {
            if (pos.y > (populationHeight - 5)) {
                stopDrawing;
                return null;
            }
            Composite.add(world, makePopulationDot(pos.x, pos.y, ballRadius));
        }, generationSpeed);
        updatePopulationInterval = setInterval(updatePopulation, 1000 / 60);
    }
    function stopDrawing() {
        isDrawing = false;
        clearInterval(creationIntervalId);
    }

    // Add an event listener to the canvas to detect mouse clicks
    render.canvas.addEventListener('mousedown', function (event) {
        pos = getRelativeMousePosition(event, render.canvas);
        if (pos.y < (populationHeight - 5)) startDrawing(pos.x, pos.y);
    });
    render.canvas.addEventListener('touchstart', function (event) {
        pos = getRelativeMousePosition(event, render.canvas);
        if (pos.y < (populationHeight - 5)) startDrawing(pos.x, pos.y);
    });
    // Update the mouse position if it's moved
    render.canvas.addEventListener('mousemove', function (event) {
        pos = getRelativeMousePosition(event, render.canvas);
    });
    render.canvas.addEventListener('touchmove', function (event) {
        pos = getRelativeMousePosition(event, render.canvas);
    });


    // Stop generating balls when the mouse button is released
    render.canvas.addEventListener('mouseup', function (event) {
        if (isDrawing) {
            stopDrawing();
        }
    });
    render.canvas.addEventListener('mouseout', function (event) {
        if (isDrawing) {
            stopDrawing();
        }
    });
    render.canvas.addEventListener('touchend', function (event) {
        if (isDrawing) {
            stopDrawing();
        }
    });
}

const getRelativeMousePosition = (event, target) => {
    const bounds = target.getBoundingClientRect();
    const scaleX = target.width / bounds.width;
    const scaleY = target.height / bounds.height;
    const clientX = event.clientX || event.touches[0].clientX;
    const clientY = event.clientY || event.touches[0].clientY;
    return {
        x: (clientX - bounds.left) * scaleX,
        y: (clientY - bounds.top) * scaleY,
    };
};

// ========================================================================== //
//      Make the world
var panelRadius = [10, 10, 10, 10];
function makeGround() {
    // background of population
    Matter.Composite.add(
        world,
        Bodies.rectangle(x0, populationHeight * 0.5, width, populationHeight, {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: "dodgerblue", opacity: 0.3 },
            chamfer: { radius: panelRadius }
        })
    );

    // floor of population
    Matter.Composite.add(
        world,
        Bodies.rectangle(x0, populationHeight + 4, width * 2, 10, {
            isStatic: true,
            density: Infinity,
            collisionFilter: { group: 1, category: 1, mask: 0 },
            render: {
                fillStyle: "#000000",
                visible: false
            }
        })
    );

    // background of sample
    Matter.Composite.add(
        world,
        Bodies.rectangle(x0, populationHeight + sampleHeight * 0.5, width, sampleHeight - 10, {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: "#d3d8a9" },
            chamfer: { radius: panelRadius }
        })
    );
    // floor of sample
    Matter.Composite.add(
        world,
        Bodies.rectangle(x0, populationHeight + sampleHeight, width, 10, {
            friction, frictionStatic,
            density: Infinity, mass: Infinity,
            isStatic: true,
            collisionFilter: { group: 2, category: 4, mask: 2 },
            render: {
                fillStyle: "#000000",
                visible: false
            }
        })
    );

    // background of sampling distribution
    Matter.Composite.add(
        world,
        Bodies.rectangle(x0, height - samplingDistributionHeight * 0.5, width, samplingDistributionHeight, {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: "#d49fd4", opacity: 0.7 },
            chamfer: { radius: panelRadius }
        })
    );

    // floor of sampling distribution
    Matter.Composite.add(
        world,
        Bodies.rectangle(x0, height + 9, width, 20, {
            friction, frictionStatic,
            isStatic: true,
            collisionFilter: { group: 3, category: 8, mask: 6 },
            render: {
                fillStyle: "#000000",
                visible: false
            }
        })
    );
}



// ========================================================================== //
//      Generate population

let intervalId;

function makePopulation(distributionFunction) {

    clearInterval(intervalId);
    let total = nBalls;

    if (distributionFunction == "custom") { total = 0 };

    intervalId = setInterval(() => {

        if (total-- > 0) {

            let x = distributionFunction();
            let y = -500 + Math.random() * 500;

            let circle = makePopulationDot(x, y, ballRadius);
            Matter.Composite.add(world, circle);

        }
    }, generationSpeed);
}


function makePopulationDot(x, y, radius) {
    
    let dot = Matter.Bodies.circle(x, y, radius, populationDotParams);
    dot.render.fillStyle = populationDotColor();
    
    Events.on(dot, "sleepStart", function () {
        dot.isStatic = true;
        balls.push(dot);
        updateDescriptives();
    });

    return dot;
}


// ========================================================================== //
//      Update population
let existingBalls = () => {
    return world.bodies.filter((body) => (body.label === "circle" && !body.isStatic));
};

let populationInterval;

function checkStatic(body) {
    return body.isStatic;
}

let popChecks = 0;
function updatePopulation() {
    console.log("checking pop");
    popChecks++;
    let allBalls = world.bodies.filter((body) => (body.label === "circle"));

    // compute the population mean
    let total = 0;
    for (let i = 0; i < allBalls.length; i++) {
        total += allBalls[i].position.x;
    }
    populationMean = total / allBalls.length;

    let ss = 0;
    for (let i = 0; i < allBalls.length; i++) {
        ss += Math.pow(allBalls[i].position.x - populationMean, 2);
    }
    populationSd = Math.sqrt(ss / allBalls.length);
    // console.log(populationSd);
    drawNormalDistribution(populationMean, populationSd / Math.sqrt(sampleSize));
    updateSamplingDistributionParams();
    if (allBalls.every(checkStatic) || popChecks > 1000) {
        popChecks = 0;
        clearInterval(updatePopulationInterval);
    }
}

let existingMeans = () => {
    return world.bodies.filter((body) => (body.label === "mean"));
};

const makeStaticMeanInterval = setInterval(() => {
    existingMeans().forEach(function (mean) {
        let meanHeight = mean.position.y;
        let meanSpeed = mean.speed;
        // let minHeight = 10; // height - (floorHeight + wallHeight);
        let minHeight = populationHeight + sampleHeight + 50;
        if (meanHeight > minHeight && meanSpeed < 0.5) {
            // mean.render.fillStyle = "black";
            mean.isStatic = true;
            // mean.density = Infinity;
            //balls.push({ position: ball.position, fill: ball.render.fillStyle });
            //Body.setStatic(mean, true);
        }
    });
}, 10);


// ========================================================================== //
// Sampling
function logBalls() {
    let s = sample(sampleSize);
    // console.log(balls);
    // console.log(s);

    d3.select("#mean").html(currentMean);
}


// ========================================================================== //
//      Single sample

function sample(sampleSize, fast = false) {
    let arr = [];
    let sampleCircles = [];
    Composite.remove(world, world.bodies.filter((body) => (body.label === "sample")));
    Composite.remove(world, world.bodies.filter((body) => (body.label === "meanGhost")));

    for (let i = 0; i < sampleSize; i++) {
        let index = Math.floor(Math.random() * balls.length);
        let pos = balls[index].position;
        arr.push(pos.x);

        let yPos = pos.y;

        if (fast) yPos = populationHeight + sampleHeight - ballRadius;


        sampleCircles.push(Bodies.circle(pos.x, yPos, ballRadius, {
            label: "sample",
            restitution: 0.4, friction, frictionStatic,
            density: 1, mass: 1, slop: 0.05,
            sleepThreshold: Infinity,
            collisionFilter: { group: -1, category: 2, mask: 4 },
            render: { fillStyle: balls[index].render.fillStyle }
        }));
    };

    currentMean = mean(arr);
    means.push(currentMean);


    let binnedMean = Math.round(currentMean / (ballRadius * 2)) * (ballRadius * 2);

    const meanSquareBack = Bodies.rectangle(binnedMean, populationHeight + sampleHeight - ballRadius * 2, ballRadius * 2, ballRadius * 2, {
        label: "meanGhost",
        isStatic: true,
        isSensor: true,
        render: { fillStyle: "white" }
    });
    Composite.add(world, meanSquareBack);

    const meanSquare = Bodies.rectangle(binnedMean, populationHeight + sampleHeight - ballRadius * 2 - 1, ballRadius * 2, ballRadius * 2, {
        label: "mean",
        restitution: 0,
        friction,
        frictionStatic,
        frictionAir: 0.03,
        density: Infinity,
        mass: 0.000000000000001,
        slop: 0,
        collisionFilter: { group: 4, category: 6, mask: 8 },
        render: { fillStyle: "#d3d8a9", strokeStyle: "black", lineWidth: 1 }
    });
    Composite.add(world, meanSquare);

    Composite.add(world, sampleCircles);

    updateSampleDescriptives(sampleSize, f(currentMean), f(sd(arr, false)), false);
    updateSamplingDistributionDescriptives();
}

let sampleInterval;

function takeSamples() {
    sampleInterval = setInterval(() => {
        sample(sampleSize, true);
    }, 100);
}


function stopSamples() {
    clearInterval(sampleInterval);
}


// ========================================================================== //
//      Multiple samples
let meanCounts = {};
function takeNSamples(nSamples) {


    for (let i = 0; i < nSamples; i++) {

        let thisSample = [];

        for (let j = 0; j < sampleSize; j++) {
            let index = Math.floor(Math.random() * balls.length);
            thisSample.push(balls[index].position.x);
        }

        let thisSampleMean = mean(thisSample);
        means.push(thisSampleMean);

        let thisSampleMeanBinned = bin(thisSampleMean, ballRadius);

        if (meanCounts.hasOwnProperty(thisSampleMeanBinned)) {
            meanCounts[thisSampleMeanBinned]++;
        } else {
            meanCounts[thisSampleMeanBinned] = 1;
        }
    }

    updateSamplingDistributionDescriptives();
    let meanProportions = transformCountsToProportions(meanCounts, means.length);
    drawProportions(meanProportions);
}


// ========================================================================== //
//      Reset
function reset() {

    balls = [];
    means = [];

    clearInterval(updatePopulationInterval);
    clearInterval(intervalId);
    histogram.selectAll("rect").remove();
    curve.selectAll("path").remove();

    Composite.clear(world);
    Engine.clear(engine);
    Render.stop(render);
    Runner.stop(runner);
    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render.textures = {};
    // console.log('reset clicked');

    initialize();
    makeGround();
    makePopulation(eval(d3.select("#dist").node().value));
    updatePopulationInterval = setInterval(updatePopulation, 1000 / 60);

    updateSampleDescriptives(0, 0, 0, hidden = true);
    updateSamplingDistributionDescriptives(hidden = true);
}


function resetMeans() {
    means = [];
    meanCounts = {};
    histogram.selectAll("rect").remove();
    Composite.remove(world, world.bodies.filter((body) => (body.label === "mean" || body.label === "sample" || body.label === "meanGhost")));
    d3.select("#samplingDistStats").classed("hide", true);
    d3.select("#sampleStats").classed("hide", true);
}




// ========================================================================== //
// Overlay and panel labels
// ========================================================================== //

// ==================
//      Labels
var labels = [{ label: "Population", top: 0 },
{ label: "Sample", top: populationHeight + 5 },
{ label: "Distribution of sample means", top: populationHeight + sampleHeight }];

d3.select("#container").selectAll("span")
    .data(labels).enter().append("span")
    .classed("panel-label", true)
    .classed("labels", true)
    .style("position", "absolute").style("left", "0.1em")
    .style("top", d => d.top + "px")
    .text(d => d.label)

var labels2 = [{
    label: `<i>N</i> = <span id="n">0</span><br>
                         <i>μ</i> = <span id="mu"></span><br>
                         <i>σ</i> = <span id="sigma"></span>`,
    top: 0
},
{
    label: `<div id="sampleStats"><i>n</i> = <span id="sampleN"></span>;
              <i>M</i> = <span id="sampleM"></span>;
              <i>SD</i> = <span id="sampleSd"></span></div>`, top: populationHeight + 5
},
{
    label: `<div id="samplingDistParams">Predicted:<br>
              <i>μ<sub>m</sub></i> = <i>μ</i> = <span id="muM"></span><br>
              <i>σ<sub>m</sub></i> = <i>σ</i>/√<i>n</i>  = <span id="sigmaM"></span></div>
              <div id="samplingDistStats">Observed:<br><i>N<sub>m</sub></i> = <span id="distN"></span><br>
              <i>μ<sub>m</sub></i> = <span id="distM"></span><br>
              <i>σ<sub>m</sub></i> = <span id="distSd"></span></div>`, top: populationHeight + sampleHeight
}];

const overlay2 = d3.select("#container").append("div")
    .style("position", "absolute")
    .style("z-index", 13)
    .style("text-align", "right")

overlay2.selectAll("span")
    .data(labels2).enter().append("span")
    .style("width", width - 5 + "px")
    .style("z-index", 0)
    // .style("margin-right", "1em")
    .classed("panel-label", true)
    .classed("numbers", true)
    .style("top", d => d.top + "px")
    .html(d => d.label)

const f = d3.format(".1f");
const fComma = d3.format(",");

function updateDescriptives() {
    d3.select("#n").text(fComma(balls.length))
    d3.select("#mu").text(f(populationMean))
    d3.select("#sigma").text(f(populationSd))
}

function updateSampleDescriptives(n, m, sd, hidden = true) {
    d3.select("#sampleStats").classed("hide", hidden)
    d3.select("#sampleN").text(n)
    d3.select("#sampleM").text(f(m))
    d3.select("#sampleSd").text(f(sd));
}
function updateSamplingDistributionParams() {
    d3.select("#muM").text(f(populationMean))
    d3.select("#sigmaM").text(f(populationSd / Math.sqrt(sampleSize)));
}

function updateSamplingDistributionDescriptives(hidden = false) {
    d3.select("#samplingDistStats").classed("hide", hidden)
    d3.select("#distN").text(fComma(means.length));
    d3.select("#distM").text(f(mean(means)));
    d3.select("#distSd").text(f(sd(means)));
}



// ========================================================================== //
//      Normal distribution

// create svg overlay
const svg = d3.select("#container")
    .append("svg")
    .style("position", "absolute")
    .style("left", 0)
    .style("transform", `translateY(${height - samplingDistributionHeight}px)`)
    // .append("div")
    .style("z-index", 0)
    .attr("id", "samplingDistCanvas")
    // .style("left", 0)
    .attr("height", samplingDistributionHeight)
    .attr("width", width);

const histogram = svg.append("g");
const curve = svg.append("g");


function drawNormalDistribution(mean, sd) {

    // remove the old path
    curve.selectAll("path").remove();

    // reset the y-axis according to new population parameters
    y.domain([0, 1.1 * jStat.normal.pdf(populationMean, populationMean, populationSd / Math.sqrt(sampleSize))]);

    var values = jStat(0, width, 210)[0];

    let data = [];
    for (var i in values) {
        let value = values[i];
        let density = jStat.normal.pdf(value, mean, sd);
        data.push({ value: value, density: density });
    }

    const line = d3.line()
        .x(d => d.value)
        .y(d => y(d.density));

    // draw the new path
    curve.append("path")
        .attr("d", line(data))
        .attr("stroke", "grey")
        .attr("stroke-dasharray", [5, 5])
        .attr("stroke-width", 2)
        .attr("fill", "none");
}

// ========================================================================== //
//      Histogram
function drawProportions(proportions) {

    Composite.remove(world, world.bodies.filter((body) => (body.label === "mean")));
    histogram.selectAll("rect").remove();

    Object.entries(proportions).forEach(([key, value]) => {
        histogram.append("rect")
            .attr("fill", "#d3d8a9")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("x", key - ballRadius * 0.5)
            // .attr("y", 0)
            .attr("y", y(value * 0.2))
            .attr("width", 5)
            // .attr("height", samplingDistributionHeight * 2)
            .attr("height", samplingDistributionHeight - y(value * 0.2))
        // .transition().duration(value * 15000)
        //     .attr("y", y(value * 0.2))
        //     .attr("height", samplingDistributionHeight - y(value * 0.2))
    });
}




// ========================================================================== //
// Helper functions
// ========================================================================== //


// ========================================================================== //
//      Distribution functions

// functions to make skewed distribution
// see https://spin.atomicobject.com/2019/09/30/skew-normal-prng-javascript/
const randomNormals = (rng) => {
    let u1 = 0, u2 = 0;
    //Convert [0,1) to (0,1)
    while (u1 === 0) u1 = rng();
    while (u2 === 0) u2 = rng();
    const R = Math.sqrt(-2.0 * Math.log(u1));
    const Θ = 2.0 * Math.PI * u2;
    return [R * Math.cos(Θ), R * Math.sin(Θ)];
};


const randomSkewNormal = (rng, ξ = 0, ω = 1, α = 0) => {
    const [u0, v] = randomNormals(rng);
    if (α === 0) {
        return ξ + ω * u0;
    }
    const 𝛿 = α / Math.sqrt(1 + α * α);
    const u1 = 𝛿 * u0 + Math.sqrt(1 - 𝛿 * 𝛿) * v;
    const z = u0 >= 0 ? u1 : -u1;
    return ξ + ω * z;
};

// functions to generate single observations from those distributions
function normal() {
    return randomSkewNormal(Math.random, x0, width * 0.12, 0);
}
function negative() {
    return randomSkewNormal(Math.random, width * 0.9, width * 0.25, -10);
}
function positive() {
    return randomSkewNormal(Math.random, width * 0.1, width * 0.25, 10);
}
function uniform() {
    return x = (width * 0.05) + width * 0.9 * Math.random();
}

// ============================================================
//      Other low-level helper functions

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}


function bin(x, binWidth) {
    return Math.round(x / binWidth) * binWidth;
}


Array.prototype.max = function () {
    return Math.max.apply(null, this);
};


function transformCountsToProportions(counts, totalCount) {
    // let totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
    let proportions = {};

    for (let mean in counts) {
        if (counts.hasOwnProperty(mean)) {
            proportions[mean] = counts[mean] / totalCount;
        }
    }

    return proportions;
}



scaleCanvas();
initialize();
reset();