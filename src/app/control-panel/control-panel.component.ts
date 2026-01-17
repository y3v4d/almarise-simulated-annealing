import { Component, input, output, model, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, RefreshCcw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-angular';
import { SimulationStateService } from '../../services/simulation-state.service';

import * as mathjs from 'mathjs';

export interface SimulationParams {
  fnString: string;
  initialTemperature: number;
  initialX: number;
  coolingRate: number;
  stepSize: number;
}

export interface ChartSettings {
  spacingX: number;
  spacingY: number;
  panX: number;
  panY: number;
}

@Component({
  selector: 'app-control-panel',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.css']
})
export class ControlPanelComponent {
  readonly state = inject(SimulationStateService);

  readonly toggleSimulation = output<void>();
  readonly resetSimulation = output<void>();
  readonly stepForward = output<number>();
  readonly stepBackward = output<number>();

  protected fnString = model<string>("x^4 - 7x^2 + 5x");
  protected fnValid = signal(true);

  protected readonly ChevronLeft = ChevronLeft;
  protected readonly ChevronsLeft = ChevronsLeft;
  protected readonly ChevronRight = ChevronRight;
  protected readonly ChevronsRight = ChevronsRight;
  protected readonly Refresh = RefreshCcw;

  protected readonly canRun = computed(() => {
    return this.fnValid() && 
      this.state.initialTemperature() != null && 
      this.state.coolingRate() != null && 
      this.state.stepSize() != null && 
      this.state.initialX() != null &&
      this.state.xMin() != null &&
      this.state.xMax() != null;
  });

  constructor() {
    effect(() => {
      this.fnString();
      untracked(() => this._compileFunction());
    })
  }

  protected onToggle() {
    this.toggleSimulation.emit();
  }

  protected onReset() {
    this.resetSimulation.emit();
  }

  protected onStepBackward(steps: number = 1) {
    this.stepBackward.emit(steps);
  }

  protected onStepForward(steps: number = 1) {
    this.stepForward.emit(steps);
  }

  private _compileFunction() {
    try {
      const parsed = mathjs.parse(this.fnString());
      const symbols = new Set<string>();

      parsed.traverse((node, path) => {
        if (path === 'fn') return;
        if (node instanceof mathjs.SymbolNode) {
          symbols.add(node.name);
        }
      });

      if (symbols.size !== 1 || !symbols.has('x')) {
        throw new Error('Only "x" is allowed as a variable.');
      }

      const compiled = mathjs.compile(this.fnString());
      
      this.state.fn.set((x: number) => compiled.evaluate({ x }));
      this.fnValid.set(true);
    } catch (error) {
      console.warn('Error compiling function:', error);
      this.fnValid.set(false);
    }
  }
}