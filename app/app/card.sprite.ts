import { CardModel } from '../app/card.model';

export class CardSprite extends PIXI.Sprite {
    
    private _cardModel: CardModel;            

    constructor(cardModel:CardModel) {
        super();
        this._cardModel = cardModel;                
    }

    render(): void {  
        this.cardModel.rendered = true;      
        this.texture = PIXI.Texture.fromFrame(this._cardModel.id + ".png");        
    }

    get cardModel():CardModel{
        return this._cardModel;
    }
}