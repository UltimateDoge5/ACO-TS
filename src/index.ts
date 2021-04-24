const canvas = document.querySelector("canvas");
const ctx = canvas?.getContext("2d") as CanvasRenderingContext2D;
const worker = new SharedWorker("./build/worker.js")

const progressBar = document.querySelector("progress") as HTMLProgressElement;
const iterationsText = document.querySelector("#iterationsText") as HTMLParagraphElement;
const table = document.querySelector("table") as HTMLTableElement;
const runButton = document.querySelector("#run") as HTMLButtonElement;
const generateButton = document.querySelector("#generate") as HTMLButtonElement;
//inputs
const ants = document.querySelector("#ants");
const nodes = document.querySelector("#nodes");
const iterations = document.querySelector("iterations");

const alpha = document.querySelector("#alpha");
const beta = document.querySelector("#beta");
const pher = document.querySelector("#pher");
const pho = document.querySelector("#pho");
const Q = document.querySelector("#Q");

runButton.addEventListener("click", function (this: HTMLButtonElement) {
    this.disabled = true;
    generateButton.disabled = true;
    document.querySelectorAll("input").forEach((input) => {
        (input as HTMLInputElement).disabled = true;
    });
    worker.port.postMessage({ event: "run" })
})

generateButton.addEventListener("click", function (this: HTMLButtonElement) {
    this.disabled = true;
    progressBar!.value = 0;
    worker.port.postMessage({event:"graph"})
    table.children[0].innerHTML = '<tr><th>Iteration</th><th>Time</th><th>Path cost</th></tr>';
    this.disabled = false;
})

document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", function (this: HTMLInputElement) {
        if (isNaN(parseFloat(this.value)) == false) {
            if(this.id == "nodes") table.children[0].innerHTML = '<tr><th>Iteration</th><th>Time</th><th>Path cost</th></tr>';
            worker.port.postMessage({ event: "update", payload: { id: this.id, value: this.value } } as eventData);
        }
    });
});

worker.port.onmessage = event => {
    //Data form worker to the main thread has to by stringified, because of some weird errors with cloning
    const data = JSON.parse(event.data) as eventData;
    switch (data.event) {
        case "draw":
            drawPaths(data.payload.graph, data.payload.optimalPath);
            break;
        case "iteration":
            progressBar.max = data.payload.iterations;
            progressBar.value = data.payload.iterationsDone;
            iterationsText.innerText = `${data.payload.iterationsDone} / ${data.payload.iterations} iterations`;
            break;
        case "table":
            const row = table?.insertRow();
            const iteration = row!.insertCell();
            const time = row?.insertCell();
            const cost = row?.insertCell();
            iteration.innerText = data.payload.iterations + "";
            time.innerText = `${((performance.now() - data.payload.timeStart) / 1000).toFixed(4)}s`
            cost.innerText = data.payload.optimalPathCost + "";
            break;
        case "done":
            runButton.disabled = false;
            generateButton.disabled = false;
            document.querySelectorAll("input").forEach((input) => {
                (input as HTMLInputElement).disabled = false;
            });
        break;
    }
}

const drawPaths = (graph: Graph, optimalPath: GraphNode[]) => {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas!.height, canvas!.width);

    ctx.fillStyle = "black"
    graph.nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI);
        ctx.fill()
        ctx.stroke();
    })

    if (optimalPath.length == 0) { return false }
    let nodeBuffer = optimalPath[0];

    optimalPath.forEach(node => {
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.moveTo(nodeBuffer.x, nodeBuffer.y);
        ctx.lineTo(node.x, node.y);
        nodeBuffer = node;
        ctx.stroke();
    })

    ctx.beginPath();
    ctx.moveTo(nodeBuffer.x, nodeBuffer.y);
    ctx.lineTo(optimalPath[0].x, optimalPath[0].y);
    ctx.stroke();
}