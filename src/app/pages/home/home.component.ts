import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterModule], 
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],  
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('1s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('mapCanvas') mapCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('particleCanvas') particleCanvas!: ElementRef<HTMLCanvasElement>;

  private particles: Array<{x: number; y: number; speed: number; size: number}> = [];

  ngOnInit() {
    this.initializeParticles();
  }

  ngAfterViewInit() {
    this.setupBackground();
    this.animateParticles();
  }

  private initializeParticles() {
    for (let i = 0; i < 100; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        speed: 0.5 + Math.random() * 1,
        size: 1 + Math.random() * 2
      });
    }
  }

  private setupBackground() {
    const canvas = this.mapCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create subtle moving map effect
    let offset = 0;
    const animate = () => {
      ctx.fillStyle = 'rgba(57, 58, 85, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw map-like grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0)';
      ctx.beginPath();
      for (let x = -offset; x < canvas.width; x += 50) {
        for (let y = 0; y < canvas.height; y += 50) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + 30, y);
        }
      }
      ctx.stroke();
      
      offset = (offset + 0.5) % 50;
      requestAnimationFrame(animate);
    };
    animate();
  }

  private animateParticles() {
    const canvas = this.particleCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      this.particles.forEach(particle => {
        particle.y -= particle.speed;
        if (particle.y < 0) {
          particle.y = canvas.height;
          particle.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };
    animate();
  }

  onButtonHover(event: MouseEvent) {
    const button = event.target as HTMLElement;
    button.style.transform = 'scale(1.05)';
  }

  onButtonLeave(event: MouseEvent) {
    const button = event.target as HTMLElement;
    button.style.transform = 'scale(1)';
  }
}