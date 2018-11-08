import React, { Component } from "react";
import { knuthShuffle } from "knuth-shuffle";
import "./App.css";

export default class extends Component {
  state = {
    points: [],
    population: [],
    fitnesses: [],
    bestChromosome: [],
    bestFitness: 0,
    height: 700,
    width: 700,
    pointsToAdd: 10,
    runAlgorithm: false,
    epoch: 0,
    mutationRate: 0.2,
    crossOverRate: 0.75
  };
  componentDidMount() {
    this.addXPoints();
    setInterval(this.getNextGeneration, 30);
  }
  crossover = (chromosome1, chromosome2) => {
    if (Math.random() < this.state.crossOverRate) {
      let rand1 = Math.floor(Math.random() * chromosome1.length);
      let rand2 = Math.floor(Math.random() * chromosome1.length);
      while (rand1 === rand2) {
        rand1 = Math.floor(Math.random() * chromosome1.length);
        rand2 = Math.floor(Math.random() * chromosome1.length);
      }
      let start = Math.min(rand1, rand2);
      let end = Math.max(rand1, rand2);
      let chromosome = chromosome1.slice(start, end);

      chromosome2.forEach(city => {
        if (!chromosome.includes(city)) {
          chromosome.push(city);
        }
      });

      return chromosome;
    }
  };
  getNextGeneration = () => {
    if (this.state.runAlgorithm) {
      console.log("Hello");

      let { epoch } = this.state;
      const population = [];
      for (let i = 0; i < this.state.population.length; i++) {
        let chromosome1 = this.pickOne();
        let chromosome2 = this.pickOne();
        let chromosome =
          this.crossover(chromosome1, chromosome2) || Math.random() < 0.5
            ? chromosome1
            : chromosome2;
        this.mutate(chromosome);
        population.push(chromosome);
      }
      epoch++;
      this.setState({ population, epoch }, () =>
        this.calulateNormalizedFitness()
      );
    }
  };
  pickOne = () => {
    let rand = Math.random();
    let index = 0;

    while (rand > 0) {
      rand -= this.state.fitnesses[index];
      index++;
    }
    index--;
    return this.state.population[index].slice();
  };
  mutate = chromosome => {
    if (Math.random() < this.state.mutationRate) {
      var indexA = Math.floor(Math.random() * chromosome.length);
      var indexB = Math.floor(Math.random() * chromosome.length);
      let temp = chromosome[indexA];
      chromosome[indexA] = chromosome[indexB];
      chromosome[indexB] = temp;
    }
  };

  calulateNormalizedFitness = () => {
    let fitnesses = [];
    let sum = 0;
    let { bestFitness, bestChromosome } = this.state;
    const { points } = this.state;

    this.state.population.forEach(chromosome => {
      let distance = 0;

      chromosome.forEach((point1, i) => {
        const point2 = chromosome[(i + 1) % chromosome.length];

        distance +=
          (points[point1][0] - points[point2][0]) ** 2 +
          (points[point1][1] - points[point2][1]) ** 2;
      });
      const fitness = 1 / (distance + 1);
      if (fitness > bestFitness) {
        bestFitness = fitness;
        bestChromosome = chromosome.slice();
      }
      sum += fitness;
      fitnesses.push(fitness);
    });

    fitnesses = fitnesses.map(value => value / sum);

    this.setState({ fitnesses, bestFitness, bestChromosome }, () => {
      this.drawSolution();
      // alert(`Population of size ${this.state.population.length} created`);
    });
  };
  drawSolution = () => {
    this.drawPoints();
    const canvas = this.refs.canvas;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "red";
    ctx.lineWidth = 0.4;
    this.state.bestChromosome.forEach((pointIndex, i) => {
      const point1 = this.state.points[pointIndex];
      const point2 = this.state.points[
        this.state.bestChromosome[(i + 1) % this.state.bestChromosome.length]
      ];
      ctx.moveTo(...point1);
      ctx.lineTo(...point2);
    });
    ctx.stroke();
  };
  createPopulation = multiplier => {
    const chromosome = [...Array(this.state.points.length).keys()];
    const population = [];
    for (let i = 0; i < this.state.points.length * multiplier; i++) {
      population.push(knuthShuffle(chromosome.slice()));
    }
    this.setState(
      { population, bestChromosome: [], bestFitness: 0, epoch: 0 },
      () => this.calulateNormalizedFitness()
    );
  };

  addXPoints = () => {
    const { height, width } = this.state;
    const points = this.state.points.slice();
    for (let i = 0; i < this.state.pointsToAdd; i++) {
      const point = [Math.random() * width, Math.random() * height];
      points.push(point);
    }
    this.setState(
      {
        points,
        bestChromosome: [],
        bestFitness: 0,
        epoch: 0,
        population: [],
        runAlgorithm: false
      },
      () => {
        this.drawPoints();
      }
    );
  };

  drawPoints = () => {
    const canvas = this.refs.canvas;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, this.state.width, this.state.height);
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    this.state.points.forEach((point, i) => {
      ctx.fillRect(...point, 5, 5);
      // ctx.strokeText(i, ...point);
    });
    ctx.stroke();
  };
  render() {
    return (
      <div>
        <div id="controls" width={this.state.width}>
          <button onClick={() => this.addXPoints()}>
            Add {this.state.pointsToAdd} Points
          </button>
          <button onClick={() => this.createPopulation(1)}>1x</button>
          <button onClick={() => this.createPopulation(5)}>5x</button>
          <button onClick={() => this.createPopulation(10)}>10x</button>
          <button onClick={() => this.createPopulation(20)}>20x</button>
          <button
            onClick={() => this.setState({ runAlgorithm: true })}
            disabled={
              this.state.population.length === 0 || this.state.runAlgorithm
            }
          >
            Start
          </button>
          <button
            onClick={() => this.setState({ runAlgorithm: false })}
            disabled={
              this.state.population.length === 0 || !this.state.runAlgorithm
            }
          >
            Stop
          </button>
        </div>
        <br />
        <p>
          #Points: {this.state.points.length} | Fitness:{this.state.bestFitness}{" "}
          | Epoch: {this.state.epoch} | State:{" "}
          {this.state.runAlgorithm ? "Running" : "Stopped"}
        </p>
        <br />
        <canvas
          ref="canvas"
          width={this.state.width}
          height={this.state.height}
        />
      </div>
    );
  }
}
