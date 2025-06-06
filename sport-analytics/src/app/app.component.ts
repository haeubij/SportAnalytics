import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';

/**
 * @author Janis Häubi
 * @version 1.0.0
 * @date 07.05.2024 (KW19)
 * @purpose Hauptkomponente der Angular-Anwendung
 * @description Root-Komponente, die das Grundlayout, die Navigation und den Einstiegspunkt der App bereitstellt.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, HeaderComponent, RouterOutlet]
})
export class AppComponent {}
