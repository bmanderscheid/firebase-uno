import { CardModel } from '../app/card.model';

export class GameState{
    hand:CardModel[];
    players:Object;
    discard:any[];
}