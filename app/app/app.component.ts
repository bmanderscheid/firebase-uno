import { Component, OnInit } from '@angular/core';
import { GameService } from './game.service';



@Component({
  selector: 'my-app',
  template: '<h1>My First Angular App</h1><game></game>'
})
export class AppComponent implements OnInit {

  constructor(private _gameService: GameService) { }

  ngOnInit(){
    this._gameService.init();
  }

}
