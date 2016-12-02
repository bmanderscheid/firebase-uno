import { CardModel } from '../app/card.model';
import { MoveType } from '../app/game-values';

export class GameStateChange {
    moveType: MoveType;
    cardAddedToHand: CardModel;
    cardInPlay: CardModel;
    playerHandCounts: Object;
}
