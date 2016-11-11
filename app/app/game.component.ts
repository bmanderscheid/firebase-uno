import { Component, OnInit } from '@angular/core';
import { GameService } from '../app/game.service';

@Component({
  selector: 'game',
  template: '<h1></h1>'
})
export class GameComponent implements OnInit {

  constructor(private gameService: GameService) { }

  ngOnInit() {
    //this.gameService.auth();
  }

}