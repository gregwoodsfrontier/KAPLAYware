import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../../src/kaplayware";

const newGame: Minigame = {
	prompt: "transform",
	author: "ricjones",
	hue: 1,
	urlPrefix: "games/ricjones/assets",
	load(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
	},
	start(ctx) {
		const game = ctx.make([ctx.timer()]);

		const bean = game.add([
			ctx.sprite("bean"),
			ctx.pos(),
		]);

		return game;
	},
};

export default newGame;