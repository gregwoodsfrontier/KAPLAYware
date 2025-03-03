import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../../src/types";

const tGame: Minigame = {
  prompt: "transform",
  author: "ricjones",
  hue: 1,
  urlPrefix: "",
  load(ctx) {
    ctx.loadSprite("bean", assets.bean.sprite);
  },
  start(ctx) {
		const game = ctx.make([ctx.timer()]);

    const bean = game.add([ctx.sprite("bean"), ctx.pos(100, 100)]);

    const checkArea = game.add([
      ctx.rect(200, 100),
      ctx.pos(ctx.width() * 0.5, ctx.height() * 0.45),
      ctx.outline(5),
      ctx.color(255, 0, 0),
    ]);

    return game;
  },
};

export default tGame;
