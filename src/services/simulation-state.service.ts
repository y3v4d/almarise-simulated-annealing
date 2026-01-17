import { Injectable, signal } from '@angular/core';
import { MathFunction } from './simulated-annealing.service';

@Injectable()
export class SimulationStateService {
  readonly fn = signal<MathFunction>((x: number) => {
    return x;
  });
  
  readonly initialTemperature = signal(1000);
  readonly initialX = signal(0);
  readonly coolingRate = signal(0.995);
  readonly stepSize = signal(0.1);
  readonly xMin = signal(-3);
  readonly xMax = signal(2.5);
  
  readonly spacingX = signal(5);
  readonly spacingY = signal(2);
  readonly panX = signal(0);
  readonly panY = signal(0);

  readonly currentX = signal(0);
  readonly bestX = signal(0);
  readonly T = signal(0);
  readonly iterations = signal(0);
  readonly simulationRunning = signal(false);
}