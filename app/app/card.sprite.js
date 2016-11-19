"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var CardSprite = (function (_super) {
    __extends(CardSprite, _super);
    function CardSprite(cardModel) {
        _super.call(this);
        this._cardModel = cardModel;
    }
    CardSprite.prototype.render = function () {
        this.cardModel.rendered = true;
        this.cardModel.spawned = true;
        this.texture = PIXI.Texture.fromFrame(this._cardModel.id + ".png");
    };
    Object.defineProperty(CardSprite.prototype, "cardModel", {
        get: function () {
            return this._cardModel;
        },
        enumerable: true,
        configurable: true
    });
    return CardSprite;
}(PIXI.Sprite));
exports.CardSprite = CardSprite;
//# sourceMappingURL=card.sprite.js.map