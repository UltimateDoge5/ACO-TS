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
        //this.path.push(this.initialNode)
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

        let rnd = Math.random();
        let x = 0;
        let tally = probs[x];
        while (rnd > tally && x < probs.length - 1) {
            tally += probs[++x];
        }

        return this.toVisit[x];
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

class Colony{
    [k: string]: any;
    ants: Ant[] = []
    nodesAmount: number;
    graph: Graph;
    iterations = 200;
    iterationsDone = 0;
    totalIterations = 0;
    ctx: CanvasRenderingContext2D;
    antsAmount: number;
    optimalPathCost: number | undefined;
    optimalPath: GraphNode[] = []
    interval: number = 0;
    timeStart = 0;
    timeStop = 0;
    didValsChange = false;
    //Control values
    alpha = 1;
    beta = 2;
    pher = 1.0;
    pho = 0.1;
    Q = 1;

    constructor(nodesAmnt: number, antsAmmount: number, ctx: CanvasRenderingContext2D) {
        this.nodesAmount = nodesAmnt;
        this.antsAmount = antsAmmount
        this.ctx = ctx;
        this.graph = new Graph(this.nodesAmount, this.pher, this.pho, canvas!.height, canvas!.width);

        for (let i = 0; i < this.antsAmount; i++) {
            const nodeIndex = Math.floor(Math.random() * (this.graph.nodes.length - 1 + 1)) + 0;
            this.ants.push(new Ant(this, this.graph.nodes, nodeIndex, this.alpha, this.beta, this.Q));
        }

        this.ctx.fillStyle = "white"
        this.ctx.fillRect(0, 0, canvas!.height, canvas!.width);

        this.ctx.fillStyle = "black"
        this.graph.nodes.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        })
    }

    callIteration = () => {
        this.iterationsDone++;
        //console.log(this.iterationsDone)
        if (this.iterationsDone > this.iterations) {
            clearInterval(this.interval);
            this.timeStop = performance.now();
            runButton.disabled = false;
            generateButton.disabled = false;
            this.totalIterations += this.iterationsDone - 1;
            return true;
        }

        iterationsText.innerText = `${this.iterationsDone} / ${this.iterations} iterations`;
        progressBar!.value = this.iterationsDone;
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
                const row = table?.insertRow();
                const iteration = row!.insertCell();
                const time = row?.insertCell();
                const cost = row?.insertCell();
                iteration.innerText = this.iterationsDone + this.totalIterations + "";
                time.innerText = `${(performance.now() - this.timeStart) / 1000}s`
                cost.innerText = this.optimalPathCost + "";
                this.drawPaths();
            }
            ant.layPheromones();
        })
    }

    drawPaths = () => {
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = "black";
        this.ctx.fillStyle = "white"
        this.ctx.fillRect(0, 0, canvas!.height, canvas!.width);

        this.ctx.fillStyle = "black"
        this.graph.nodes.forEach(node => {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI);
            this.ctx.fill()
            this.ctx.stroke();
        })

        let nodeBuffer = this.optimalPath[0];

        this.optimalPath.forEach(node => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = "blue";
            this.ctx.lineWidth = 2;
            this.ctx.moveTo(nodeBuffer.x, nodeBuffer.y);
            this.ctx.lineTo(node.x, node.y);
            nodeBuffer = node;
            this.ctx.stroke();
        })

        this.ctx.beginPath();
        this.ctx.moveTo(nodeBuffer.x, nodeBuffer.y);
        this.ctx.lineTo(this.optimalPath[0].x, this.optimalPath[0].y);
        this.ctx.stroke();
    }

    iterateFull = () => {
        this.iterationsDone = 0;
        progressBar!.value = 0;
        progressBar!.max = this.iterations;
        this.timeStart = performance.now()
        this.interval = setInterval(this.callIteration, 1)
    }

    constructNewGraph = () => {
        this.graph = new Graph(this.nodesAmount, this.pher, this.pho, canvas!.height, canvas!.width);
        this.optimalPath = [];
        this.optimalPathCost = undefined;
        this.ctx.fillStyle = "white"
        this.ctx.fillRect(0, 0, canvas!.height, canvas!.width);

        this.ctx.fillStyle = "black"
        this.graph.nodes.forEach(node => {
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI);
            this.ctx.fill()
            this.ctx.stroke();
        })

        this.createNewAnts()
    }

    createNewAnts = () => {
        this.ants = [];
        for (let i = 0; i < this.antsAmount; i++) {
            const nodeIndex = Math.floor(Math.random() * (this.graph.nodes.length - 1 + 1)) + 0;
            this.ants.push(new Ant(this, this.graph.nodes, nodeIndex, this.alpha, this.beta, this.Q));
        }
    }
}