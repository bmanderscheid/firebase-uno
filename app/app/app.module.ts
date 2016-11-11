import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent }   from './app.component';
import { GameComponent }   from './game.component';
import {GameService} from './game.service';
import {FirebaseService} from './firebase.service';

@NgModule({
  imports:      [ BrowserModule ],
  declarations: [ AppComponent, GameComponent ],
  bootstrap:    [ AppComponent ],
  providers:[GameService, FirebaseService]
})
export class AppModule { }
