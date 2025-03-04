import { Component, WritableSignal, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-bundlewise',
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './bundlewise.component.html',
  styleUrls: ['./bundlewise.component.scss']
})
export class BundlewiseComponent {
  packageName = '';
  file?: File;
  loading: WritableSignal<boolean> = signal(false);
  result: WritableSignal<string | null> = signal(null);

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.file = input.files[0];
    }
  }

  analyze() {
    if (!this.packageName && !this.file) {
      return;
    }
    this.loading.set(true);
    this.result.set(null);
    
    // Placeholder logic for handling analysis
    setTimeout(() => {
      this.loading.set(false);
      this.result.set(`Analysis completed for ${this.packageName || this.file?.name}`);
    }, 2000);
  }
}
