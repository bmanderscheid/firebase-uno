import { Component, OnInit } from '@angular/core';
import { GameService } from './game.service';



@Component({
  selector: 'my-app',
  template: '<game></game>'
})
export class AppComponent implements OnInit {

  constructor(private _gameService: GameService) { }

  ngOnInit(){
    
  }

}
