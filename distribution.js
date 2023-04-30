// https://codesandbox.io/s/github/rjoxford/MatterJSGaltonBoard
// https://www.tylermw.com/plinko-statistics-insights-from-the-bean-machine/
// https://onlinestatbook.com/stat_sim/sampling_dist/

let width = 700;
let height = 600;
let x0 = x_start = width / 2;

let populationHeight = height * 0.4;
let sampleHeight = 50;
let samplingDistributionHeight = height - (populationHeight + sampleHeight);

// ball properties
const ballRadius = size = 5;
let generationSpeed = 1;
let nBalls = 500;
let nBallsCreated = 0;

let sampleSize = d3.select("#sampleSize").property("value");

let balls = [];
let currentMean;
let means = [];


let distributionFunction = d3.select("#dist").value
console.log(distributionFunction)


let populationMean = x0;
let populationSd = width * 0.12;
let updatePopulationInterval;

var canvasPosition;

let y = d3.scaleLinear()
    .domain([0, jStat.normal.pdf(x0, x0, 80 / Math.sqrt(sampleSize))])
    .range([samplingDistributionHeight, 0])


const sampleSizeInput = d3.select("#sampleSize")
    .on("change", function () {
        sampleSize = d3.select("#sampleSize").property("value");
    })

// ========================================================================== //
// Physics
// ========================================================================== //

// physics properties
let restitution = 0; // bounciness
let friction = Infinity;
let frictionAir = 0.05;
let frictionStatic = Infinity;
let slop = 0;
let mass = 0.00000000000000000000001;
let density = Infinity;


var { Engine, Render, Runner,
    Composite, Composites, Common,
    MouseConstraint, Mouse, Events,
    World, Bodies, Body } = Matter;

let engine, render, runner, world;

var mouseX, mouseY;

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
            background: "#ffffff",
            wireframes: false,
            showSleeping: false
        }
    });
    Render.run(render);

    // engine.gravity.y = 1;
    // engine.timing.timeScale = 1;
    engine.positionIterations = 10;
    engine.velocityIterations = 50;

    // create runner
    runner = Runner.create();
    Runner.run(runner, engine);
    // render.canvas.addEventListener("mousedown", reset);
    render.canvas.position = "absolute";

    canvasPosition = getPosition(render.canvas);

    var creationIntervalId;
    // Add an event listener to the canvas to detect mouse clicks
    render.canvas.addEventListener('mousedown', function (event) {
        // Generate the first circle at the mouse location
        createCircle(event.clientX - canvasPosition.x, event.clientY - canvasPosition.y);

        // Generate balls at a constant rate and update their position if the mouse is moved
        creationIntervalId = setInterval(function () {
            createCircle(mouseX, mouseY);
        }, generationSpeed);
    });

    // Stop generating balls when the mouse button is released
    render.canvas.addEventListener('mouseup', function (event) {
        clearInterval(creationIntervalId);
    });

    // Update the mouse position if it's moved
    render.canvas.addEventListener('mousemove', function (event) {
        mouseX = event.clientX - canvasPosition.x;
        mouseY = event.clientY - canvasPosition.y;
    });
}

// Update the canvas position when the window is resized
window.addEventListener('resize', function () {
    canvasPosition = getPosition(render.canvas);
});

function getPosition(element) {
    var xPosition = 0;
    var yPosition = 0;

    while (element) {
        xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
        element = element.offsetParent;
    }

    return { x: xPosition, y: yPosition };
}

// Make the world
function makeGround() {
    // background of population
    Matter.Composite.add(
        world,
        Bodies.rectangle(x0, populationHeight * 0.5, width, populationHeight, {
            isStatic: true,
            isSensor: true,
            render: { fillStyle: "dodgerblue", opacity: 0.3 },
            chamfer: { radius: [10, 10, 10, 10] }
        })
    );

    // floor of population
    Matter.Composite.add(
        world,
        Bodies.rectangle(x0, populationHeight + 4, width, 10, {
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
            chamfer: { radius: [10, 10, 10, 10] }
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
            chamfer: { radius: [10, 10, 10, 10] }
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


// Create a new circle with random properties
function createCircle(x, y) {
    nBallsCreated++;
    var radius = ballRadius;
    var circle = Matter.Bodies.circle(x + Math.random() * 10, y + Math.random() * 10, radius, {
        label: "circle",
        restitution,
        friction,
        frictionAir,
        frictionStatic,
        slop,
        mass,
        density,
        collisionFilter: { group: 1 },
        render: { fillStyle: d3.schemeCategory10[nBallsCreated % 10] }
    });
    Matter.World.add(world, circle);
}



let intervalId;

function makeBalls(distributionFunction) {

    let total = nBalls;

    if (distributionFunction == "custom") { total = 0 };
    clearInterval(intervalId);

    intervalId = setInterval(() => {

        if (total-- > 0) {

            let x = distributionFunction();

            const circle = Bodies.circle(x, -20, size, {
                label: "circle",
                friction: 1,
                frictionStatic: 1,
                restitution: 0.1,
                mass: 0.00000000000000001,
                slop: 0.01,
                density: Infinity,
                frictionAir,
                // sleepThreshold: Infinity,
                collisionFilter: { group: 1 },
                render: {
                    fillStyle: d3.schemeCategory10[total % 10]
                }
            });



            Matter.Composite.add(world, circle);
        }
    }, generationSpeed);
}


// Create a new circle with random properties
function createCircle(x, y) {
    nBallsCreated++;
    var radius = ballRadius;
    var circle = Matter.Bodies.circle(x + Math.random() * 10, y + Math.random() * 10, radius, {
        label: "circle",
        restitution,
        friction,
        frictionAir,
        frictionStatic,
        slop,
        mass,
        density,
        collisionFilter: { group: 1 },
        render: { fillStyle: d3.schemeCategory10[nBallsCreated % 10] }
    });
    Matter.World.add(world, circle);
}

// ========================================================================== //
//      Distribution functions
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


// ========================================================================== //
//      Update population
let existingBalls = () => {
    return world.bodies.filter((body) => (body.label === "circle" && !body.isStatic));
};

let populationInterval;

function checkStatic(body) {
    return body.isStatic;
}

function updatePopulation() {
    console.log("checking pop");
    let allBalls = world.bodies.filter((body) => (body.label === "circle"));

    if (allBalls.every(checkStatic)) {
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
        console.log(populationSd);
        drawNormalDistribution(populationMean, populationSd / Math.sqrt(sampleSize));
        clearInterval(updatePopulationInterval);
    }
}


// ========================================================================== //
//      Freeze balls after creation
const makeStaticInterval = setInterval(() => {
    existingBalls().forEach(function (ball) {
        let ballHeight = ball.position.y;
        let ballSpeed = ball.speed;
        let minHeight = 10; // height - (floorHeight + wallHeight);
        //let minHeight = mouseY + 10;
        if (ballHeight > minHeight && ballSpeed < 0.1) {
            // ball.render.opacity = 0.5;
            balls.push({ position: ball.position, fill: ball.render.fillStyle });
            Body.setStatic(ball, true);

            let newPopulationSum = populationMean * (balls.length - 1) + ball.position.x;
            populationMean = newPopulationSum / balls.length;
        }

    });
}, 1500);

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
//      Create and show samples
function logBalls() {
    let s = sample(sampleSize);
    // console.log(balls);
    // console.log(s);

    d3.select("#mean").html(currentMean);
}



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
            render: { fillStyle: balls[index].fill }
        }));
    };

    currentMean = mean(arr);
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
//      Reset
function reset() {

    balls = [];

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
    makeBalls(eval(d3.select("#dist").node().value));
    updatePopulationInterval = setInterval(updatePopulation, 1000);
}







// ========================================================================== //
// Overlay and panel labels
// ========================================================================== //


// label the panels
var labels = [{ label: "Population", top: 0 },
{ label: "Sample", top: populationHeight + 5 },
{ label: "Distribution of sample means", top: populationHeight + sampleHeight }];

d3.select("#container").selectAll("span")
    .data(labels).enter().append("span").attr("class", "panel-label")
    .style("position", "absolute").style("left", "0.1em")
    .style("top", d => d.top + "px")
    .text(d => d.label)


// drawing the normal distribution overlay

// create svg overlay
const svg = d3.select("#container")
    .append("svg")
    .style("position", "absolute")
    .style("left", 0)
    .style("transform", `translateY(${height - samplingDistributionHeight}px)`)
    // .append("div")
    .style("z-index", 11)
    .attr("id", "samplingDistCanvas")
    // .style("left", 0)
    .attr("height", samplingDistributionHeight)
    .attr("width", width);

const histogram = svg.append("g");
const curve = svg.append("g");

// ========================================================================== //
//      Normal distribution
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

    // let yMax = jStat.normal.pdf(mean, mean, sd);
    // let yMultiplier = 0.9 * samplingDistributionHeight / yMax;
    // let yMultiplier = 10000;

    const line = d3.line()
        .x(d => d.value)
        .y(d => y(d.density));

    // draw the new path
    curve.append("path")
        .attr("d", line(data))
        .attr("stroke", "grey")
        .attr("stroke-width", 2)
        .attr("fill", "none");
}

// ========================================================================== //
//      Histogram
function drawProportions(proportions) {
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

// other low-level helper functions

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function mean(arr) {
    let total = 0;
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        total += arr[i];
    }
    return total / n;
}

function sd(arr) {
    let mean = mean(arr);

    let ss = 0;

    for (let i = 0; i < arr.length; i++) {
        ss += Math.pow(arr[i] - mean, 2);
    }

    return Math.sqrt(ss / arr.length);
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


function takeNSamples(nSamples) {
    let meanCounts = {};

    for (let i = 0; i < nSamples; i++) {

        let thisSample = [];

        for (let j = 0; j < sampleSize; j++) {
            let index = Math.floor(Math.random() * balls.length);
            thisSample.push(balls[index].position.x);
        }
        let thisSampleMean = bin(mean(thisSample), ballRadius);

        if (meanCounts.hasOwnProperty(thisSampleMean)) {
            meanCounts[thisSampleMean]++;
        } else {
            meanCounts[thisSampleMean] = 1;
        }
    }

    let meanProportions = transformCountsToProportions(meanCounts, nSamples);
    drawProportions(meanProportions);

    let curveMax = jStat.normal.pdf(populationMean, populationMean, populationSd / Math.sqrt(sampleSize));
    console.log(curveMax);
    console.log(meanProportions);
}





initialize();
reset();