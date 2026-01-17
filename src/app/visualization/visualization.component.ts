import { Component, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SimulationStateService } from '../../services/simulation-state.service';

export interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'app-visualization',
  imports: [DecimalPipe],
  templateUrl: './visualization.component.html',
  styleUrls: ['./visualization.component.css']
})
export class VisualizationComponent {
  readonly state = inject(SimulationStateService);

  protected readonly transform = computed(() => 
    `scale(1,-1) translate(${-this.state.panX()}, ${-this.state.panY()})`
  );

  protected readonly currentY = computed(() => this.state.fn()(this.state.currentX()));
  protected readonly bestY = computed(() => this.state.fn()(this.state.bestX()));

  protected readonly svgPolyline = computed(() => this.generatePolylinePoints(this.state.xMin(), this.state.xMax(), 0.1));
  protected readonly svgCurrentPoint = computed(() => this.toSvgPoint(this.state.currentX(), this.currentY()));
  protected readonly svgBestPoint = computed(() => this.toSvgPoint(this.state.bestX(), this.bestY()));
  protected readonly svgMinX = computed(() => this.state.xMin() * this.state.spacingX());
  protected readonly svgMaxX = computed(() => this.state.xMax() * this.state.spacingX());

  private generatePolylinePoints(minX: number, maxX: number, step: number) {
    let points = '';
    
    for (let x = minX; x <= maxX; x += step) {
      const y = this.state.fn()(x);
      points += `${x * this.state.spacingX()} ${y * this.state.spacingY()} `;
    }
    
    return points.trim();
  }

  private toSvgPoint(x: number, y: number): Point {
    return {
      x: x * this.state.spacingX(),
      y: y * this.state.spacingY()
    };
  }
}