import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import {
  MARKETPLACE_BACKGROUND,
  MARKETPLACE_ORANGE,
  MARKETPLACE_PNG_SIZE,
} from "./metadata";
import { localSvgPath, marketplacePngDir, marketplacePngPath, padShapeId } from "./paths";

function marketplaceSvg(source: string): string {
  const painted = source
    .replace(/\sfill="none"/gi, " fill-rule-keep-none")
    .replace(/\sfill="[^"]*"/gi, ` fill="${MARKETPLACE_ORANGE}"`)
    .replace(/fill-rule-keep-none/g, 'fill="none"');

  const inner = painted
    .replace(/<\?xml[^>]*>/, "")
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKETPLACE_PNG_SIZE}" height="${MARKETPLACE_PNG_SIZE}" viewBox="0 0 256 256">`,
    `<rect width="256" height="256" fill="${MARKETPLACE_BACKGROUND}"/>`,
    inner,
    "</svg>",
  ].join("");
}

function main() {
  mkdirSync(marketplacePngDir(), { recursive: true });
  const created: string[] = [];
  for (let id = 1; id <= 72; id += 1) {
    const svg = readFileSync(localSvgPath(id), "utf8");
    const renderer = new Resvg(marketplaceSvg(svg), {
      fitTo: { mode: "width", value: MARKETPLACE_PNG_SIZE },
      background: MARKETPLACE_BACKGROUND,
    });
    const png = renderer.render().asPng();
    writeFileSync(marketplacePngPath(id), png);
    created.push(padShapeId(id));
  }
  console.log(
    JSON.stringify(
      {
        count: created.length,
        size: `${MARKETPLACE_PNG_SIZE}x${MARKETPLACE_PNG_SIZE}`,
        fill: MARKETPLACE_ORANGE,
        background: MARKETPLACE_BACKGROUND,
        directory: "public/shapes/marketplace",
      },
      null,
      2,
    ),
  );
}

main();
