import { Injectable } from "@angular/core";

export type MathFunction = (x: number) => number;

interface HistoryState {
    x: number;
    bestX: number;

    T: number;
    cooling: number;
}

@Injectable()
export class SimulatedAnnealingService {
    fn: MathFunction = (x: number) => x * x;

    T0: number = 1000;
    x0: number = 0;
    xMin: number = -3;
    xMax: number = 2.5;
    step: number = 0.1;
    cooling: number = 0.95;

    T: number = 1000;
    x: number = 0;
    bestX: number = 0;

    history: HistoryState[] = [];

    setParams(T0: number = 1000, cooling: number = 0.995, step: number = 0.1, x0: number = 0, xMin: number = -3, xMax: number = 2.5) {
        this.T = T0;
        this.T0 = T0;
        this.cooling = cooling;
        this.step = step;

        this.x = x0;
        this.x0 = x0;
        this.bestX = x0;

        this.xMin = xMin;
        this.xMax = xMax;
    }

    reset() {
        this.history = [];

        this.x = this.x0;
        this.bestX = this.x0;

        this.T = this.T0;
    }

    iterate(): void {
        this.saveState();

        const sign = Math.random() < 0.5 ? -1 : 1;
        const newX = this.x + this.step * Math.sqrt(this.T / this.T0) * sign;

        if(newX < this.xMin || newX > this.xMax) {
            this.T *= this.cooling;
            return;
        }

        const currentValue = this.fn(this.x);
        const newValue = this.fn(newX);

        const deltaE = newValue - currentValue;

        if(deltaE < 0 || Math.random() < Math.exp(-deltaE / this.T)) {
            this.x = newX;
        }

        if(this.fn(this.x) < this.fn(this.bestX)) {
            this.bestX = this.x;
        }

        this.T *= this.cooling;
    }

    revert(): void {
        if(this.history.length < 1) {
            return;
        }

        this.loadState();
    }

    private saveState() {
        this.history.push({
            x: this.x,
            bestX: this.bestX,
            T: this.T,
            cooling: this.cooling
        });
    }

    private loadState() {
        const prevState = this.history.pop();
        if(prevState) {
            this.x = prevState.x;
            this.bestX = prevState.bestX;

            this.T = prevState.T;
            this.cooling = prevState.cooling;
        }
    }
}