// https://codesandbox.io/s/github/rjoxford/MatterJSGaltonBoard
// https://www.tylermw.com/plinko-statistics-insights-from-the-bean-machine/


let width = 700;
let height = 600;
let x0 = x_start = width / 2;

let populationHeight = height * 0.4;
let sampleHeight = 50;
let samplingDistributionHeight = height - (populationHeight + sampleHeight);

// ball properties
const ballRadius = size = 5;
let generationSpeed = 1;
let nBalls = 600;
let nBallsCreated = 0;

let sampleSize = 10;

let balls = [];
let currentMean;
let means = [];

// physics properties
let restitution = 0; // bounciness
let friction = Infinity;
let frictionAir = 0.045;
let frictionStatic = Infinity;
let slop = 0.01;
let mass = 0.0000000001;
let density = Infinity;


let intervalId;


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
    // engine.positionIterations = 4;
    // engine.velocityIterations = 1000;

    // create runner
    runner = Runner.create();
    Runner.run(runner, engine);
    // render.canvas.addEventListener("mousedown", reset);
    render.canvas.position = "absolute";

    var creationIntervalId;
    // Add an event listener to the canvas to detect mouse clicks
    render.canvas.addEventListener('mousedown', function (event) {
        // Generate the first circle at the mouse location
        createCircle(event.clientX, event.clientY);

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
        mouseX = event.clientX;
        mouseY = event.clientY;
    });
}






function make_balls() {

    let total = nBalls;
    clearInterval(intervalId);

    intervalId = setInterval(() => {

        if (total-- > 0) {
            // let x = jStat.normal.sample(x0, width * 0.1);

            // uniform
            //let x = (width * 0.05) + width * 0.9 * Math.random();

            // positive skew
            // let x = width * 0.125 + Math.pow(Math.random(), 4) * width * 0.75;
            //let x = randomSkewNormal(Math.random, width * 0.1, width * 0.25, 10);

            // negative skew
            //let x = randomSkewNormal(Math.random, width * 0.9, width * 0.25, -10);

            // normal
            let x = randomSkewNormal(Math.random, x0, width * 0.12, 0);
            
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

let existingBalls = () => {
    return world.bodies.filter((body) => (body.label === "circle" && !body.isStatic));
};

let populationInterval;
let populationMean = 0;

const updatePopulationInterval = setInterval(() => {
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

    drawNormalDistribution(populationMean, populationSd / Math.sqrt(sampleSize));

}, 1000);

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


function logBalls() {
    let s = sample(sampleSize);
    // console.log(balls);
    // console.log(s);

    d3.select("#mean").html(currentMean);
}



function sample(sampleSize) {
    // engine.velocityIterations = 100;
    let arr = [];
    Composite.remove(world, world.bodies.filter((body) => (body.label === "sample")));

    for (let i = 0; i < sampleSize; i++) {
        let index = Math.floor(Math.random() * balls.length);
        let pos = balls[index].position;
        arr.push(pos.x);


        Composite.add(world, Bodies.circle(pos.x, pos.y, ballRadius, {
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

    const meanSquare = Bodies.rectangle(binnedMean, populationHeight + sampleHeight, ballRadius * 2, ballRadius * 2, {
        label: "mean",
        restitution: 0, 
        friction, 
        frictionStatic, 
        frictionAir: 0.03,
        density: Infinity,
        mass: 0.000000000000001,
        slop: 0,
        collisionFilter: { group: 4, category: 6, mask: 8 },
        render: { fillStyle: "black", strokeStyle: "white", lineWidth: 1 }
    });
    Composite.add(world, meanSquare);

    return arr;
}

let sampleInterval;

function takeSamples() {
    sampleInterval = setInterval(() => {
        logBalls();
    }, 100);
}


function stopSamples() {
    clearInterval(sampleInterval);
}

function makeGround() {

    // background of population
    Matter.Composite.add(
        world,
        Bodies.rectangle(x0, populationHeight * 0.5, width, populationHeight, {
            isStatic: true,
            isSensor: true,
            render: {fillStyle: "dodgerblue", opacity: 0.3},
            chamfer: {radius: [10, 10, 10, 10]}
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
                render: {fillStyle: "#ededed"},
                chamfer: {radius: [10, 10, 10, 10]}
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
            render: {fillStyle: "plum", opacity: 0.3},
            chamfer: {radius: [10, 10, 10, 10]}
        })
    );

    // floor of sampling distribution
    Matter.Composite.add(
        world,
        Bodies.rectangle(x0, height + 10, width, 20, {
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



// label the panels
d3.select("#container")
.append("span").style("position", "absolute")
.attr("id", "samplingDistributionOverlay")
// .style("top", `${populationHeight + sampleHeight}px`)
.style("z-index", 12)
.text("Population")
d3.select("#container")
.append("span").style("position", "absolute")
.attr("id", "samplingDistributionOverlay")
.style("top", `${populationHeight + 5}px`)
.style("z-index", 12)
.text("Sample")
d3.select("#container")
.append("span").style("position", "absolute")
.attr("id", "samplingDistributionOverlay")
.style("top", `${populationHeight + sampleHeight}px`)
.style("z-index", 12)
.text("Distribution of sample means")

// drawing the normal distribution overlay
const curve = d3.select("#container")
.append("svg")
.style("position", "absolute")
// .attr("margin-top", )
.style("transform", `translateY(${height - samplingDistributionHeight}px)`)
// .append("div")
.style("z-index", 11)
.attr("id", "samplingDistCanvas")
// .style("left", 0)
.attr("height", samplingDistributionHeight)
.attr("width", width)


const line = d3.line()
    .x(d => d.value)
    .y(d => samplingDistributionHeight - d.density * 20000 - 1);

function drawNormalDistribution(mean, sd) {

    // remove the old path
    curve.selectAll("path").remove();

    let yMultiplier = 20000;
    var values = jStat(0, width, 210)[0];

    let data = [];
    for (var i in values) {
        let value = values[i];
        let density = jStat.normal.pdf(value, mean, sd);
        data.push({value: value, density: density});
    }

    // draw the new path
    curve.append("path")
        .attr("d", line(data))
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("fill", "none");
}

function reset() {

    balls = [];

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
    make_balls();
}


//

initialize();
makeGround();
drawNormalDistribution();
make_balls();









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