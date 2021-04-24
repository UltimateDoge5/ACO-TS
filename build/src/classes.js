"use strict";
class Ant {
    constructor(colony, nodes, currNode, alpha, beta, Q) {
        this.toVisit = [];
        this.path = [];
        this.pathCost = 0;
        this.alpha = 1;
        this.beta = 2;
        this.Q = 1;
        this.move = () => {
            while (this.toVisit.length != 0) {
                const node = this.pickNode();
                this.path.push(this.toVisit.splice(this.toVisit.indexOf(node), 1)[0]);
                this.currentNode = node;
            }
            for (let i = 1; i < this.path.length; i++) {
                this.pathCost += this.colony.graph.distances[this.path[i - 1].index][this.path[i].index];
            }
        };
        this.pickNode = () => {
            const graph = this.colony.graph;
            let sumDesirabilty = 0;
            this.toVisit.forEach(node => {
                sumDesirabilty += graph.getDesirability(this.currentNode, node, this.alpha, this.beta);
            });
            const probs = [];
            this.toVisit.forEach(node => {
                if (node == this.currentNode) {
                    return;
                }
                const mul = graph.getDesirability(this.currentNode, node, this.alpha, this.beta);
                probs.push(mul / sumDesirabilty);
            });
            let rnd = Math.random();
            let x = 0;
            let tally = probs[x];
            while (rnd > tally && x < probs.length - 1) {
                tally += probs[++x];
            }
            return this.toVisit[x];
        };
        this.layPheromones = () => {
            const graph = this.colony.graph;
            for (let i = 1; i < this.path.length; i++) {
                graph.pheromones[this.path[i - 1].index][this.path[i].index] += (1 / this.pathCost) * this.Q;
                graph.pheromones[this.path[i].index][this.path[i - 1].index] += (1 / this.pathCost) * this.Q;
            }
        };
        this.colony = colony;
        this.toVisit = [...nodes];
        this.nodes = [...nodes];
        this.currentNode = this.toVisit[currNode];
        this.initialNode = this.toVisit[currNode];
        this.toVisit.splice(currNode, 1);
        this.alpha = alpha;
        this.beta = beta;
        this.Q = Q;
    }
    reset() {
        this.toVisit = [...this.nodes];
        this.currentNode = this.initialNode;
        this.pathCost = 0;
        this.path = [];
    }
}
class Graph {
    constructor(nodesCount, pher, pho, height, width) {
        this.pheromones = [];
        this.distances = [];
        this.nodes = [];
        this.getPheromones = (node, targetNode) => {
            return this.pheromones[node.index][targetNode.index];
        };
        this.getDistance = (node, targetNode) => {
            return this.distances[node.index][targetNode.index];
        };
        this.getEta = (node, targetNode) => {
            return 1.0 / this.getDistance(node, targetNode);
        };
        this.getDesirability = (node, targetNode, alpha, beta) => {
            return Math.pow(this.getPheromones(node, targetNode), alpha) * Math.pow(this.getEta(node, targetNode), beta);
        };
        this.evaporatePheromones = () => {
            for (let x = 0; x < this.pheromones.length; x++) {
                for (let y = 0; y < this.pheromones.length; y++) {
                    if (x !== y) {
                        this.pheromones[x][y] = (1 - this.pho) * this.pheromones[x][y];
                    }
                }
            }
        };
        this.pho = pho;
        for (let i = 0; i < nodesCount; i++) {
            const random = Math.random() * (height * width);
            const x = Math.floor(random % height) || width;
            const y = Math.ceil(random / height);
            const node = new GraphNode(x, y, i);
            this.nodes.push(node);
        }
        for (let x = 0; x < this.nodes.length; x++) {
            this.pheromones[x] = [];
            for (let y = 0; y < this.nodes.length; y++) {
                if (x !== y) {
                    this.pheromones[x][y] = pher;
                }
            }
        }
        for (let x = 0; x < this.nodes.length; x++) {
            this.distances[x] = [];
            for (let y = 0; y < this.nodes.length; y++) {
                if (x !== y) {
                    this.distances[x][y] = this.nodes[x].distanceToNode(this.nodes[y]);
                }
            }
        }
    }
}
class GraphNode {
    constructor(x, y, index) {
        this.distanceToNode = (targetNode) => {
            const x = (targetNode.x - this.x);
            const y = (targetNode.y - this.y);
            return Math.floor(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
        };
        this.x = x;
        this.y = y;
        this.index = index;
    }
}
class Colony {
    constructor(nodesAmnt, antsAmmount) {
        this.ants = [];
        this.iterations = 200;
        this.iterationsDone = 0;
        this.totalIterations = 0;
        this.optimalPath = [];
        this.interval = 0;
        this.timeStart = 0;
        this.didValsChange = false;
        this.alpha = 1;
        this.beta = 2;
        this.pher = 1.0;
        this.pho = 0.1;
        this.Q = 1;
        this.callIteration = () => {
            this.iterationsDone++;
            iterationsText.innerText = `${this.iterationsDone} / ${this.iterations} iterations`;
            progressBar.value = this.iterationsDone;
            this.ants.forEach(ant => {
                ant.reset();
                ant.move();
            });
            this.graph.evaporatePheromones();
            this.ants.forEach(ant => {
                if (this.optimalPathCost == undefined || ant.pathCost < this.optimalPathCost) {
                    this.optimalPath = [];
                    this.optimalPath = ant.path;
                    this.optimalPathCost = ant.pathCost;
                    postMessage({ event: "table", payload: {} }, "*");
                    postMessage({ event: "draw", payload: { graph: this.graph, optimalPath: this.optimalPath } }, "*");
                }
                ant.layPheromones();
            });
            postMessage({ event: "iteration", payload: { iterations: this.iterations } }, "*");
        };
        this.iterateFull = () => {
            this.iterationsDone = 0;
            this.timeStart = performance.now();
            for (let i = 0; i < this.iterations; i++) {
                this.callIteration();
            }
            return true;
        };
        this.constructNewGraph = () => {
            this.graph = new Graph(this.nodesAmount, this.pher, this.pho, 750, 750);
            this.optimalPath = [];
            this.optimalPathCost = undefined;
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, 750, 750);
            ctx.fillStyle = "black";
            this.graph.nodes.forEach(node => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            });
            this.createNewAnts();
        };
        this.createNewAnts = () => {
            this.ants = [];
            for (let i = 0; i < this.antsAmount; i++) {
                const nodeIndex = Math.floor(Math.random() * (this.graph.nodes.length - 1 + 1)) + 0;
                this.ants.push(new Ant(this, this.graph.nodes, nodeIndex, this.alpha, this.beta, this.Q));
            }
        };
        this.nodesAmount = nodesAmnt;
        this.antsAmount = antsAmmount;
        this.graph = new Graph(this.nodesAmount, this.pher, this.pho, 750, 750);
        for (let i = 0; i < this.antsAmount; i++) {
            const nodeIndex = Math.floor(Math.random() * (this.graph.nodes.length - 1 + 1)) + 0;
            this.ants.push(new Ant(this, this.graph.nodes, nodeIndex, this.alpha, this.beta, this.Q));
        }
    }
}
//# sourceMappingURL=classes.js.map