import Color from "color";
import { ColorProcBase } from "./colorProc";

export class ColorProcDownplay extends ColorProcBase{
    protected convertColor(inputColor: string): string {
        let c = new Color(inputColor)
        let [h, _, l] = c.hsl().array()
        let newL = l * 0.4 + 60 // 0～100 映射到 60～90
        c = Color.hsl(h, 0, newL)
        return c.hex()
    }
}