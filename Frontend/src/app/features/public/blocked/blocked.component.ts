import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-blocked',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './blocked.component.html',
  styleUrl: './blocked.component.css'
})
export class BlockedComponent {
  qrId = '';

  constructor(private route: ActivatedRoute) {
    this.qrId = this.route.snapshot.paramMap.get('qrId') || '';
  }
}