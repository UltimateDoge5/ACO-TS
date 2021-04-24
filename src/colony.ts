class Ant {
    colony: Colony;
    initialNode: GraphNode;
    currentNode: GraphNode;
    toVisit: GraphNode[] = [];
    nodes: GraphNode[];
    path: GraphNode[] = [];
    pathCost = 0;
    //control values
    alpha = 1
    beta = 2;
    Q = 1;

    constructor(colony: Colony, nodes: GraphNode[], currNode: number, alpha: number, beta: number, Q: number) {
        this.colony = colony;
        this.toVisit = [...nodes];
        this.nodes = [...nodes];
        this.currentNode = this.toVisit[currNode];
        this.initialNode = this.toVisit[currNode];
        this.toVisit.splice(currNode, 1)
        this.alpha = alpha;
        this.beta = beta;
        this.Q = Q;
    }

    move = () => {
        while (this.toVisit.length != 0) {
            const node = this.pickNode();

            this.path.push(this.toVisit.splice(this.toVisit.indexOf(node), 1)[0])
            this.currentNode = node!;
        }
        for (let i = 1; i < this.path.length; i++) {
            this.pathCost += this.colony.graph.distances[this.path[i - 1].index][this.path[i].index];
        }
    }

    private pickNode = () => {
        const graph = this.colony.graph;
        let sumDesirabilty = 0;

        this.toVisit.forEach(node => {
            sumDesirabilty += graph.getDesirability(this.currentNode, node, this.alpha, this.beta)
        })

        const probs: number[] = [];
        this.toVisit.forEach(node => {
            if (node == this.currentNode) { return }
            const mul = graph.getDesirability(this.currentNode, node, this.alpha, this.beta)
            probs.push(mul / sumDesirabilty);
        });

        const random = Math.random();
        let nodeIndex = 0;
        let tally = probs[nodeIndex];
        while (random > tally && nodeIndex < probs.length - 1) {
            tally += probs[++nodeIndex];
        }

        return this.toVisit[nodeIndex];
    }

    layPheromones = () => {
        const graph = this.colony.graph;
        for (let i = 1; i < this.path.length; i++) {
            graph.pheromones[this.path[i - 1].index][this.path[i].index] += (1 / this.pathCost) * this.Q
            graph.pheromones[this.path[i].index][this.path[i - 1].index] += (1 / this.pathCost) * this.Q;
        }
    }

    reset() {
        this.toVisit = [...this.nodes];
        this.currentNode = this.initialNode;
        this.pathCost = 0;
        this.path = [];
    }
}

class Graph {
    pheromones: number[][] = [];
    distances: number[][] = [];
    nodes: GraphNode[] = [];
    pho: number;

    constructor(nodesCount: number, pher: number, pho: number, height: number, width: number) {
        this.pho = pho;

        for (let i = 0; i < nodesCount; i++) {
            const random = Math.random() * (height * width);
            const x = Math.floor(random % height) || width;
            const y = Math.ceil(random / height);
            const node = new GraphNode(x, y, i)
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

    getPheromones = (node: GraphNode, targetNode: GraphNode) => {
        return this.pheromones[node.index][targetNode.index];
    }

    getDistance = (node: GraphNode, targetNode: GraphNode) => {
        return this.distances[node.index][targetNode.index];
    }

    getEta = (node: GraphNode, targetNode: GraphNode) => {
        return 1.0 / this.getDistance(node, targetNode);
    }

    getDesirability = (node: GraphNode, targetNode: GraphNode, alpha: number, beta: number) => {
        return Math.pow(this.getPheromones(node, targetNode), alpha) * Math.pow(this.getEta(node, targetNode), beta);
    }

    evaporatePheromones = () => {
        for (let x = 0; x < this.pheromones.length; x++) {
            for (let y = 0; y < this.pheromones.length; y++) {
                if (x !== y) {
                    this.pheromones[x][y] = (1 - this.pho) * this.pheromones[x][y];
                }
            }
        }
    }
}

class GraphNode {
    x: number;
    y: number;
    index: number;

    constructor(x: number, y: number, index: number) {
        this.x = x;
        this.y = y;
        this.index = index;
    }

    distanceToNode = (targetNode: GraphNode) => {
        const x = (targetNode.x - this.x);
        const y = (targetNode.y - this.y);
        return Math.floor(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
    }
}

class Colony {
    ants: Ant[] = []
    nodesAmount: number;
    graph: Graph;
    iterations = 200;
    iterationsDone = 0;
    totalIterations = 0;
    antsAmount: number;
    optimalPathCost: number | undefined;
    optimalPath: GraphNode[] = []
    timeStart = 0;
    didValsChange = false;
    port: MessagePort;
    //Control values
    alpha = 1;
    beta = 2;
    pher = 1.0;
    pho = 0.1;
    Q = 1;

    constructor(nodesAmnt: number, antsAmmount: number, workerPort: MessagePort) {
        this.nodesAmount = nodesAmnt;
        this.antsAmount = antsAmmount
        this.port = workerPort;

        this.graph = new Graph(this.nodesAmount, this.pher, this.pho, 750, 750);

        for (let i = 0; i < this.antsAmount; i++) {
            const nodeIndex = Math.floor(Math.random() * (this.graph.nodes.length - 1 + 1)) + 0;
            this.ants.push(new Ant(this, this.graph.nodes, nodeIndex, this.alpha, this.beta, this.Q));
        }
    }

    callIteration = () => {
        this.iterationsDone++;

        this.ants.forEach(ant => {
            ant.reset()
            ant.move();
        })

        //After iteration ends
        this.graph.evaporatePheromones();
        this.ants.forEach(ant => {
            if (this.optimalPathCost == undefined || ant.pathCost < this.optimalPathCost!) {
                this.optimalPath = [];
                this.optimalPath = ant.path;
                this.optimalPathCost = ant.pathCost;

                this.port.postMessage(JSON.stringify({
                    event: "table", payload: {
                        iterations: this.iterationsDone + this.totalIterations,
                        timeStart: this.timeStart,
                        optimalPathCost: this.optimalPathCost
                    }
                }));
                this.port.postMessage(JSON.stringify({ event: "draw", payload: { graph: this.graph, optimalPath: this.optimalPath } }));
            }
            ant.layPheromones();
        })
        this.port.postMessage(JSON.stringify({ event: "iteration", payload: { iterationsDone: this.iterationsDone, iterations: this.iterations } }));
    }

    iterateFull = () => {
        this.iterationsDone = 0;
        if (this.timeStart == 0) this.timeStart = performance.now();

        for (let i = 0; i < this.iterations; i++) {
            this.callIteration()
        }

        this.totalIterations += this.iterationsDone;
        this.port.postMessage(JSON.stringify({ event: "done" }))
    }

    constructNewGraph = () => {
        this.graph = new Graph(this.nodesAmount, this.pher, this.pho, 750, 750);
        this.optimalPath = [];
        this.optimalPathCost = undefined;
        this.timeStart = 0;

        this.createNewAnts()
        this.totalIterations = 0;
        this.port.postMessage(JSON.stringify({ event: "draw", payload: { graph: this.graph, optimalPath: this.optimalPath } }));
    }

    createNewAnts = () => {
        this.ants = [];
        for (let i = 0; i < this.antsAmount; i++) {
            const nodeIndex = Math.floor(Math.random() * (this.graph.nodes.length - 1 + 1)) + 0;
            this.ants.push(new Ant(this, this.graph.nodes, nodeIndex, this.alpha, this.beta, this.Q));
        }
    }
}