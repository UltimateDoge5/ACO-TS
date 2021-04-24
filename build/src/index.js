"use strict";
const canvas = document.querySelector("canvas");
const ctx = canvas?.getContext("2d", { alpha: false });
const worker = new SharedWorker("./build/worker.js");
const progressBar = document.querySelector("progress");
const iterationsText = document.querySelector("#iterationsText");
const table = document.querySelector("table");
const runButton = document.querySelector("#run");
const generateButton = document.querySelector("#generate");
const ants = document.querySelector("#ants");
const nodes = document.querySelector("#nodes");
const iterations = document.querySelector("iterations");
const alpha = document.querySelector("#alpha");
const beta = document.querySelector("#beta");
const pher = document.querySelector("#pher");
const pho = document.querySelector("#pho");
const Q = document.querySelector("#Q");
runButton.addEventListener("click", function () {
    this.disabled = true;
    generateButton.disabled = true;
});
generateButton.addEventListener("click", function () {
    this.disabled = true;
    progressBar.value = 0;
    table.children[0].innerHTML = '<tr><th>Iteration</th><th>Time</th><th>Path cost</th></tr>';
    this.disabled = false;
});
document.querySelectorAll("input[type='number']").forEach((input) => {
    input.addEventListener("change", function () {
        if (isNaN(parseFloat(this.value)) == false) {
        }
    });
});
worker.port.onmessage = event => {
    const data = event.data;
    switch (data.event) {
        case "draw":
            drawPaths(data.payload.graph, data.payload.optimalPath);
            break;
        case "iteration":
            progressBar.value = data.payload.iterations;
            break;
        case "table":
            const row = table?.insertRow();
            const iteration = row.insertCell();
            const time = row?.insertCell();
            const cost = row?.insertCell();
            iteration.innerText = data.payload.iterations + "";
            time.innerText = `${((performance.now() - data.payload.timeStart) / 1000).toFixed(4)}s`;
            cost.innerText = data.payload.optimalPathCost + "";
            break;
        default:
            console.log(data);
            break;
    }
};
const drawPaths = (graph, optimalPath) => {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.height, canvas.width);
    ctx.fillStyle = "black";
    graph.nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    });
    if (optimalPath.length == 0) {
        return false;
    }
    let nodeBuffer = optimalPath[0];
    optimalPath.forEach(node => {
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.moveTo(nodeBuffer.x, nodeBuffer.y);
        ctx.lineTo(node.x, node.y);
        nodeBuffer = node;
        ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(nodeBuffer.x, nodeBuffer.y);
    ctx.lineTo(optimalPath[0].x, optimalPath[0].y);
    ctx.stroke();
};
worker.port.postMessage({ event: "ping" });
//# sourceMappingURL=index.js.map