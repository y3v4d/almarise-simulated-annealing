import { Component, effect, inject, OnDestroy, OnInit, signal, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { interval, Subscription } from 'rxjs';

import { SimulatedAnnealingService } from '../services/simulated-annealing.service';
import { ControlPanelComponent } from './control-panel/control-panel.component';
import { VisualizationComponent } from './visualization/visualization.component';
import { SimulationStateService } from '../services/simulation-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ControlPanelComponent, VisualizationComponent],
  providers: [SimulationStateService, SimulatedAnnealingService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  protected readonly service = inject(SimulatedAnnealingService);
  protected readonly state = inject(SimulationStateService);

  private simulationInterval: Subscription | null = null;

  constructor() {
    effect(() => {
      this.updateServiceFromState();

      untracked(() => {
        this.resetSimulation();
      });
    });
  }

  ngOnInit() {
    this.updateServiceFromState();
    this.resetSimulation();
  }

  ngOnDestroy() {
    this.stopSimulation();
  }

  protected startSimulation() {
    if (this.state.simulationRunning()) return;

    this.simulationInterval = interval(1000 / 10).subscribe(() => {
      this.stepForward(1);
    });

    this.state.simulationRunning.set(true);
  }

  protected toggleSimulation() {
    if (this.state.simulationRunning()) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  protected stopSimulation() {
    this.simulationInterval?.unsubscribe();
    this.simulationInterval = null;

    this.state.simulationRunning.set(false);
  }

  protected resetSimulation() {
    this.stopSimulation();
    this.service.reset();
    
    this.updateStateFromService();
  }

  protected stepForward(steps: number) {
    for(let i = 0; i < steps; i++) {
      this.service.iterate();
    }

    this.updateStateFromService();
  }

  protected stepBackward(steps: number) {
    for(let i = 0; i < steps; i++) {
      this.service.revert();
    }

    this.updateStateFromService();
  }

  private updateStateFromService() {
    this.state.currentX.set(this.service.x);
    this.state.bestX.set(this.service.bestX);
    this.state.iterations.set(this.service.history.length);
    this.state.T.set(this.service.T);
  }

  private updateServiceFromState() {
    this.service.setParams(
      this.state.initialTemperature(),
      this.state.coolingRate(),
      this.state.stepSize(),
      this.state.initialX(),
      this.state.xMin(),
      this.state.xMax()
    );

    this.service.fn = this.state.fn();
  }
}