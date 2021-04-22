# 🐜 ACO-TS
Ant colony optimization algorithm wrote in typescript. You can see the demo in action [here](https://ultimatedoge5.github.io/ACO-TS/).

## About
ACO (Ant colony optimization) algorithm was invented to search for the (probabilistic) optimal path on a weighted graph and to solve the [travelling salesman problem](https://en.wikipedia.org/wiki/Travelling_salesman_problem).

## Algorithm
There are multiple [extensions](https://en.wikipedia.org/wiki/Ant_colony_optimization_algorithms#Common_extensions) of the ant system, but I decided to implement the first and original one. This algorithm is heuristic which means that it will most likely give a better solution with more iterations.

### Control variables
In the ACO  algorithm, we need five variables to control the behaviour of our ants:
* Alpha - states how much impact the pheromones have on the final score of an edge
* Beta - determines how much influence the distance has on the final score of an edge
* Pher - initial value of pheromones
* Pho - defines the rate at which pheromones will evaporate
* Q - indicates the number of pheromones

Using other values than the default will change the behaviour of ants and their ability to determine paths.

## Sources
[Ant colony optimization](https://en.wikipedia.org/wiki/Ant_colony_optimization_algorithms)