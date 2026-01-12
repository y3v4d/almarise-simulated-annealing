import { Injectable } from "@angular/core";

export type MathFunction = (x: number) => number;

interface State {
    x: number;
    bestX: number;

    T: number;
    cooling: number;
}

@Injectable()
export class SimulatedAnnealingService {
    fn: MathFunction = (x: number) => x * x;

    T: number = 1000;

    step: number = 0.1;
    cooling: number = 0.95;

    currentX: number = 0;
    bestX: number = 0;

    history: State[] = [];

    setup(fn: MathFunction, T: number = 1000, cooling: number = 0.995, step: number = 0.1, initialX: number = 0) {
        this.history = [];

        this.fn = fn;

        this.T = T;
        this.cooling = cooling;
        this.step = step;
        this.currentX = initialX;
    }

    iterate(): void {
        this.saveState();

        const direction = Math.random() < 0.5 ? -1 : 1;
        const newX = this.currentX + direction * this.step;

        const currentValue = this.fn(this.currentX);
        const newValue = this.fn(newX);

        const deltaE = newValue - currentValue;

        if(deltaE < 0 || Math.random() < Math.exp(-deltaE / this.T)) {
            this.currentX = newX;
        }

        if(this.fn(this.currentX) < this.fn(this.bestX)) {
            this.bestX = this.currentX;
        }

        this.T *= this.cooling;
    }

    revert(): void {
        if(this.history.length < 1) {
            return;
        }

        this.loadState();
    }

    get value() {
        return this.fn(this.currentX);
    }

    private saveState() {
        this.history.push({
            x: this.currentX,
            bestX: this.bestX,
            T: this.T,
            cooling: this.cooling
        });
    }

    private loadState() {
        const prevState = this.history.pop();
        if(prevState) {
            this.currentX = prevState.x;
            this.bestX = prevState.bestX;

            this.T = prevState.T;
            this.cooling = prevState.cooling;
        }
    }
}