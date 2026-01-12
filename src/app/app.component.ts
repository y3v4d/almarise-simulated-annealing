import { Component, computed, effect, inject, model, OnDestroy, OnInit, signal, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SimulatedAnnealingService } from '../services/simulated-annealing.service';
import { DecimalPipe, NgClass } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, LucideAngularModule, RefreshCcw } from 'lucide-angular';
import * as mathjs from 'mathjs';

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
  imports: [
    RouterOutlet, 
    DecimalPipe, 
    FormsModule,
    LucideAngularModule
  ],
  providers: [SimulatedAnnealingService],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly simulatedAnnealingService = inject(SimulatedAnnealingService);

  readonly ChevronLeft = ChevronLeft;
  readonly ChevronsLeft = ChevronsLeft;
  readonly ChevronRight = ChevronRight;
  readonly ChevronsRight = ChevronsRight;
  readonly Refresh = RefreshCcw;

  protected tick = signal(0);
  protected fn_string = model('x^4 - 7x^2 + 5x');
  protected initialTemperature = model(1000);
  protected initialX = model(0);
  protected coolingRate = model(0.995);
  protected stepSize = model(0.1);
  protected fn_valid = signal(true);

  protected currentX = signal(0);
  protected currentY = computed(() => {
    this.paramTrackingContext();
    return this.simulatedAnnealingService.fn(this.currentX())
  });

  protected bestX = signal(0);
  protected bestY = computed(() => {
    this.paramTrackingContext();
    return this.simulatedAnnealingService.fn(this.bestX());
  });

  protected prevX = signal(0);

  protected svgPoint = computed(() => {
    if(!this.simulationRunning()) {
      return this.generateCirclePoint(this.currentX(), this.currentY());
    }

    const t = (this.tick() % 6) / 6;
    const x = mixin(this.prevX(), this.currentX(), t);

    return this.generateCirclePoint(x, this.simulatedAnnealingService.fn(x));
  });

  protected svgBestPoint = computed(() => {
    return this.generateCirclePoint(this.bestX(), this.bestY());
  });

  protected panX = signal(0);
  protected panY = signal(0);
  protected spacingX = signal(5);
  protected spacingY = signal(2);

  protected simulationRunning = signal(false);
  protected iterations = signal(0);

  private simulationInterval: Subscription | null = null;

  constructor() {
    effect(() => {
      this.fn_string();
      untracked(() => this.compileCurrentFunction());
    });

    effect(() => {
      this.updateSimulationParameters();
      untracked(() => this.resetSimulation());
    })
  }

  ngOnInit() {
    this.updateSimulationParameters();
    this.compileCurrentFunction();
    this.resetSimulation();
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

  resetSimulation() {
    this.stopSimulation();
    this.simulatedAnnealingService.reset();

    this.prevX.set(this.simulatedAnnealingService.x);
    this.currentX.set(this.simulatedAnnealingService.x);
    this.bestX.set(this.simulatedAnnealingService.bestX);

    this.iterations.set(this.simulatedAnnealingService.history.length);
  }

  toggleSimulation() {
    if(this.simulationRunning()) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  nextPoint(steps: number = 1) {
    for(let i = 0; i < steps; i++) {
      this.simulatedAnnealingService.iterate();
    }

    this.prevX.set(this.currentX());
    this.currentX.set(this.simulatedAnnealingService.x);
    this.bestX.set(this.simulatedAnnealingService.bestX);

    this.iterations.set(this.simulatedAnnealingService.history.length);
  }

  prevPoint(steps: number = 1) {
    for(let i = 0; i < steps; i++) {
      this.simulatedAnnealingService.revert();
    }

    this.prevX.set(this.currentX());
    this.currentX.set(this.simulatedAnnealingService.x);
    this.bestX.set(this.simulatedAnnealingService.bestX);

    this.iterations.set(this.simulatedAnnealingService.history.length);
  }

  generatePolylinePoints(minX: number, maxX: number, step: number): string {
    let str = "";
    for(let x = minX; x <= maxX; x += step) {
      const y = this.simulatedAnnealingService.fn(x);
      str += `${(x * this.spacingX())} ${(y * this.spacingY())} `;
    }

    return str.trim();
  }

  generateCirclePoint(x: number, y: number): Point {
    return {
      x: x * this.spacingX(),
      y: y * this.spacingY()
    }
  }

  canRun() {
    return this.fn_valid() && this.initialTemperature() != null && this.coolingRate() != null && this.stepSize() != null && this.initialX() != null;
  }

  private paramTrackingContext() {
    this.initialTemperature();
    this.coolingRate();
    this.stepSize();
    this.initialX();
    this.fn_string();
  }

  private updateSimulationParameters(): void {
    this.simulatedAnnealingService.setParams(
      this.initialTemperature() ?? 1000,
      this.coolingRate() ?? 0.995,
      this.stepSize() ?? 0.1,
      this.initialX() ?? 0
    );
  }

  private compileCurrentFunction(): void {
    this.resetSimulation();

    try {
      const parsed = mathjs.parse(this.fn_string());
      const symbols = new Set<string>();

      parsed.traverse(function(node, path, parent) {
        if(path === "fn") {
          return;
        }

        if(node instanceof mathjs.SymbolNode) {
          symbols.add(node.name);
        }
      });

      if(symbols.size != 1 || (!symbols.has('x'))) {
        throw new Error('Only "x" is allowed as a variable.');
      }

      const compiled = mathjs.compile(this.fn_string());
      const fn = (x: number) => {
        return compiled.evaluate({ x });
      };

      this.simulatedAnnealingService.fn = fn;
      this.fn_valid.set(true);
    } catch(error) {
      console.warn('Error compiling function:', error);
      this.fn_valid.set(false);
    }
  }
}
