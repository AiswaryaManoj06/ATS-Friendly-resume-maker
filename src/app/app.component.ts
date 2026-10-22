import { Component } from '@angular/core';
import { ResumeFormComponent } from './resume-form/resume-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ResumeFormComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class App {
  title = 'resume-builder';
}
