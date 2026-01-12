import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SimulatedAnnealingService } from '../services/simulated-annealing.service';
import { DecimalPipe, NgClass } from '@angular/common';
import { interval, Subscription } from 'rxjs';

interface Point {
  x: number;
  y: number;
}

function mixin(x0: number, x1: number, t: number): number {
  t = Math.max(0, Math.min(1, t));
  return x0 * (1 - t) + x1 * t;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DecimalPipe],
  providers: [SimulatedAnnealingService],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly simulatedAnnealingService = inject(SimulatedAnnealingService);

  protected tick = signal(0);

  protected currentX = signal(0);
  protected currentY = computed(() => this.simulatedAnnealingService.fn(this.currentX()));
  protected bestX = signal(0);
  protected bestY = computed(() => this.simulatedAnnealingService.fn(this.bestX()));

  protected prevX = signal(0);

  protected svgPoint = computed(() => {
    if(!this.simulationRunning()) {
      return this.generateCirclePoint(this.currentX(), this.currentY());
    }

    const t = (this.tick() % 6) / 6;
    const x = mixin(this.prevX(), this.currentX(), t);

    return this.generateCirclePoint(x, this.simulatedAnnealingService.fn(x));
  });

  protected spacingX = signal(10);
  protected spacingY = signal(2);

  protected simulationRunning = signal(false);
  protected iterations = signal(0);

  private simulationInterval: Subscription | null = null;

  ngOnInit() {
    this.simulatedAnnealingService.setup(
      (x: number) => x**4 - 4 * x**3 + 5,
      1000,
      0.95,
      0.1,
      0
    );

    this.currentX.set(this.simulatedAnnealingService.currentX);
    this.prevX.set(this.currentX());
  }

  ngOnDestroy() {
    this.simulationInterval?.unsubscribe();
  }

  startSimulation() {
    if(this.simulationRunning()) {
      return;
    }

    this.simulationInterval = interval(1000 / 60).subscribe(() => {
      this.tick.update(n => n + 1);
      if(this.tick() % 6 === 0) {
        this.nextPoint();
      }
    });

    this.simulationRunning.set(true);
  }

  stopSimulation() {
    this.simulationInterval?.unsubscribe();
    this.simulationInterval = null;
    this.simulationRunning.set(false);
  }

  toggleSimulation() {
    console.log('Toggling simulation');
    if(this.simulationRunning()) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  prevPoint() {
    if(this.iterations() === 0) {
      return;
    }

    this.simulatedAnnealingService.revert();

    this.prevX.set(this.currentX());
    this.currentX.set(this.simulatedAnnealingService.currentX);
    this.bestX.set(this.simulatedAnnealingService.bestX);

    this.iterations.update(n => n - 1);
  }

  nextPoint() {
    this.simulatedAnnealingService.iterate();

    this.prevX.set(this.currentX());
    this.currentX.set(this.simulatedAnnealingService.currentX);
    this.bestX.set(this.simulatedAnnealingService.bestX);

    this.iterations.update(n => n + 1);
  }

  generatePolylinePoints(minX: number, maxX: number, step: number): string {
    let str = "";
    for(let x = minX; x <= maxX; x += step) {
      const y = this.simulatedAnnealingService.fn(x);
      str += `${x * this.spacingX()} ${y * this.spacingY()} `;
    }

    return str.trim();
  }

  generateCirclePoint(x: number, y: number): Point {
    return {
      x: x * this.spacingX(),
      y: y * this.spacingY()
    }
  }
}
