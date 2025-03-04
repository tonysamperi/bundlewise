import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BundlewiseComponent } from './components/bundlewise/bundlewise.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BundlewiseComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'bundlewise';
}
