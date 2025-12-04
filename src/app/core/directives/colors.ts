import { Directive, ElementRef, input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appColors]'
})
export class Colors implements OnInit{

  color = input<string>('#6d2423');

  constructor( 
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    console.log('Color:', this.color());
  }

    ngOnInit(): void {
    this.renderer.setStyle(this.el.nativeElement, 'background-color', this.color());
  }
}

