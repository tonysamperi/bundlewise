import { Component, WritableSignal, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule, MatMiniFabButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
//
import { Bundlewise } from '../../shared/bundlewise.class';
import { Publint } from '../../shared/publint.class';

@Component({
  selector: 'app-bundlewise',
  standalone: true,
  imports: [
    FormsModule,
    JsonPipe,
    //
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatMiniFabButton,
    MatProgressSpinnerModule
  ],
  providers: [HttpClient],
  templateUrl: './bundlewise.component.html',
  styleUrls: ['./bundlewise.component.scss']
})
export class BundlewiseComponent {
  packageName = '';
  file?: File;
  loading: WritableSignal<boolean> = signal(false);
  result: WritableSignal<{ message: string; rawSize: number; gzippedSize: number; fileName: string; } | null> = signal(null);
  pkgJson: WritableSignal<any | null> = signal(null);
  publintIssues: WritableSignal<any[] | null> = signal(null);

  constructor(private http: HttpClient) { }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.file = input.files[0];
    }
  }

  async analyze() {
    if (!this.packageName && !this.file) {
      return;
    }
    this.loading.set(true);
    this.result.set(null);
    this.pkgJson.set(null);
    this.publintIssues.set(null);

    try {
      const { pkgJson, ...bundlewiseReport } = await new Bundlewise(this.file || this.packageName).run();
      this.result.set({
        message: `Analysis completed for ${this.packageName || this.file?.name}`,
        ...bundlewiseReport
      });
      this.pkgJson.set(pkgJson);
    }
    catch (e) {
      console.error("BUNDLEWISE ERROR", e);
      alert("Error!");
    }
    try {
      const publintResult = await new Publint(this.file || this.packageName).run();
      console.info("Publint result", publintResult);
      this.publintIssues.set(publintResult.messages);
    }
    catch (e) {
      console.error("PUBLINT ERROR", e);
      alert("Publint error!");
    }
    this.loading.set(false);

  }
}
