"use strict";
const canvas = document.querySelector("canvas");
const ctx = canvas?.getContext("2d", { alpha: false });
const colony = new Colony(50, 100, ctx);
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
    if (colony.didValsChange == true) {
        colony.didValsChange = false;
        colony.createNewAnts();
    }
    colony.iterateFull();
});
generateButton.addEventListener("click", function () {
    this.disabled = true;
    colony.constructNewGraph();
    progressBar.value = 0;
    colony.totalIterations = 0;
    table.children[0].innerHTML = '<tr><th>Iteration</th><th>Time</th><th>Path cost</th></tr>';
    this.disabled = false;
});
document.querySelectorAll("input[type='number']").forEach((input) => {
    input.addEventListener("change", function () {
        if (isNaN(parseFloat(this.value)) == false) {
            console.log(this.value);
            switch (this.id) {
                case "ants":
                    colony.antsAmount = parseFloat(this.value);
                    break;
                case "nodes":
                    colony.nodesAmount = parseFloat(this.value);
                    colony.constructNewGraph();
                    break;
                case "iterations":
                    colony.iterations = parseFloat(this.value);
                    break;
                case "alpha":
                    colony.alpha = parseFloat(this.value);
                    break;
                case "beta":
                    colony.beta = parseFloat(this.value);
                case "pher":
                    colony.pher = parseFloat(this.value);
                    break;
                case "pho":
                    colony.pho = parseFloat(this.value);
                    break;
                case "Q":
                    colony.Q = parseFloat(this.value);
                    break;
            }
            colony.didValsChange = true;
        }
    });
});
//# sourceMappingURL=index.js.map