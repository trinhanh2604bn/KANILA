import { Component } from '@angular/core';
import { Header } from '../header/header';
import { RouterOutlet } from '@angular/router';
import { Footer } from "../footer/footer";
import { GlobalToastComponent } from '../global-toast/global-toast';
import { ScrollToTop } from '../scroll-to-top/scroll-to-top';

@Component({
  selector: 'app-client-layout',
  imports: [Header, RouterOutlet, Footer, GlobalToastComponent, ScrollToTop],
  templateUrl: './client-layout.html',
  styleUrl: './client-layout.css',
})
export class ClientLayout {

}
