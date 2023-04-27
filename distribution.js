// https://codesandbox.io/s/github/rjoxford/MatterJSGaltonBoard
// https://www.tylermw.com/plinko-statistics-insights-from-the-bean-machine/


let width = 700;
let height = 300;
let x0 = x_start = width / 2;

// ball properties
const ballRadius = size = 4;
let y_start = 0;

let generation_speed = 5;
let nBalls = _total = 900;
let nBallsCreated = 0;

let balls = [];

// peg board properties
let rows = 20;
let y_peg_start = 20;
let pegGap = 6.5 * ballRadius;
let pegRadius = 0.5 * ballRadius;
let xGap = pegGap;
let yGap = 0.6 * xGap;
let pegAngle = 0; // Math.PI / 4;
let gap_between_pegs_and_buckets = 0;

// funnel properties
const funnelTostartGap = yGap;
const funnelWallLength = 600;
const funnelAngle = Math.PI / 3;
const funnelOpening = 5 * ballRadius;

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
        }, generation_speed);
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

    let total = _total;
    clearInterval(intervalId);

    intervalId = setInterval(() => {

        if (total-- > 0) {
            // let x = jStat.normal.sample(x0, width * 0.1);
            // let x = width * 0.125 + Math.pow(Math.random(), 4) * width * 0.75;
            let x = randomSkewNormal(Math.random, width * 0.9, width * 0.25, -10);
            const circle = Bodies.circle(x, -20, size, {
                label: "circle",
                friction: 1,
                frictionStatic: 1,
                restitution: 0.1,
                mass: 0.00000000000000001,
                slop: 0.01,
                density: Infinity,
                frictionAir,
                sleepThreshold: Infinity,
                render: {
                    fillStyle: d3.schemeCategory10[total % 10]
                }
            });

            

            Matter.Composite.add(world, circle);
        }
    }, 5);
}

let existingBalls = () => {
    return world.bodies.filter((body) => (body.label === "circle" && !body.isStatic));
};

const makeStaticInterval = setInterval(() => {
    existingBalls().forEach(function (ball) {
        let ballHeight = ball.position.y;
        let ballSpeed = ball.speed;
        // let minHeight = 10; // height - (floorHeight + wallHeight);
        let minHeight = mouseY + 10;
        if (ballHeight > minHeight && ballSpeed < 0.1) {
            // ball.render.opacity = 0.5;
            balls.push({x: ball.position.x, fill: ball.render.fillStyle});
            Body.setStatic(ball, true);
        }
    });
}, 1500);


function logBalls() {
    let s = sample(10);
    console.log(balls);
    console.log(s);
}


function sample(sampleSize) {
    let arr = [];
    Composite.remove(world, world.bodies.filter((body) => (body.label === "sample")));
    
    for (let i = 0; i < sampleSize; i++) {
        let index = Math.floor(Math.random() * balls.length);
        let x = balls[index].x;
        arr.push(x);


        Composite.add(world, Bodies.circle(x, height - 10, ballRadius, {
            label: "sample",
            isStatic: true,
            render: {fillStyle: balls[index].fill}
        }));
    }
    return arr;
}

function makeGround() {
    Matter.Composite.add(
        world,
        Bodies.rectangle(x0, height - 20, width, 3, {
            isStatic: true,
            render: {
                fillStyle: "#000000",
                visible: true
            }
        })
    );
}

function drawNormalDistribution() {

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, height - 5);

    let yMultiplier = (height - (y_peg_start + rows * yGap));
    var values = jStat(-4, 4, 210)[0]


    for (var i in values) {
        let value = values[i];
        let density = jStat.normal.pdf(value, 0, 0.9);
        ctx.lineTo((value + 4) * (width / 8), height - (density * 2.2 * yMultiplier) - 5);
        ctx.stroke();
    }
}

function reset() {
    Composite.clear(world);
    Engine.clear(engine);
    Render.stop(render);
    Runner.stop(runner);
    render.canvas.remove();
    render.canvas = null;
    render.context = null;
    render.textures = {};
    console.log('reset clicked');

    initialize();
    makeGround();
    make_balls();
}


//

initialize();
makeGround();






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
        render: {fillStyle: d3.schemeCategory10[nBallsCreated % 10]}
    });
    Matter.World.add(world, circle);
}



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