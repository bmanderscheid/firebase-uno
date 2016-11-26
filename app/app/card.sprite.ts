import { CardModel } from '../app/card.model';

export class CardSprite extends PIXI.Sprite {

    private _cardModel: CardModel;

    constructor(cardModel: CardModel) {
        super();
        this._cardModel = cardModel;
    }

    render(): void {
        this.cardModel.spawned = true;
        if (this._cardModel.isWild && this._cardModel.color)
            if (this._cardModel.opponentDraw)
                this.texture = PIXI.Texture.fromFrame("wild-draw4-" + this._cardModel.color + ".png");
            else this.texture = PIXI.Texture.fromFrame("wild-" + this._cardModel.color + ".png");
        else this.texture = PIXI.Texture.fromFrame(this._cardModel.id + ".png");
    }

    updateForWild(color: string): void {
        this.cardModel.color = color;
        if (this._cardModel.opponentDraw)
            this.texture = PIXI.Texture.fromFrame("wild-draw4-" + this._cardModel.color + ".png");
        else this.texture = PIXI.Texture.fromFrame("wild-" + this._cardModel.color + ".png");
    }

    get cardModel(): CardModel {
        return this._cardModel;
    }
}