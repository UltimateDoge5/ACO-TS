importScripts('./colony.js');

self.onconnect = function(e) {
    var port = e.ports[0];
    const colony = new Colony(50, 100, port);

    port.postMessage(JSON.stringify({ event: "draw", payload: { graph: colony.graph, optimalPath: colony.optimalPath } }))

    port.onmessage = function(event) {
        const data = event.data;
        switch (data.event) {
            case "update":
                switch (data.payload.id) {
                    case "ants":
                        colony.antsAmount = parseFloat(data.payload.value);
                        break;
                    case "nodes":
                        colony.nodesAmount = parseFloat(data.payload.value);
                        colony.constructNewGraph()
                        break;
                    case "iterations":
                        colony.iterations = parseFloat(data.payload.value);
                        break;
                    case "alpha":
                        colony.alpha = parseFloat(data.payload.value);
                        break;
                    case "beta":
                        colony.beta = parseFloat(data.payload.value);
                    case "pher":
                        colony.pher = parseFloat(data.payload.value);
                        break;
                    case "pho":
                        colony.pho = parseFloat(data.payload.value);
                        break;
                    case "Q":
                        colony.Q = parseFloat(data.payload.value);
                        break;
                }

                colony.didValsChange = true;
                break;
            case "run":
                if (colony.didValsChange == true) {
                    colony.didValsChange = false;
                    colony.createNewAnts()
                }
                colony.iterateFull();
                break;
            case "graph":
                colony.constructNewGraph()
                break;
        }
    }
}