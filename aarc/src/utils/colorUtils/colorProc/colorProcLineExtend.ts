import Color from "color";
import { ColorProcBase } from "./colorProc";

export class ColorProcLineExtend extends ColorProcBase{
    protected convertColor(inputColor: string): string {
        let c = new Color(inputColor)
        if(c.saturationl() >= 50){
            c = c.saturationl(50)
        }
        c = c.lightness(80)
        return c.string()
    }
}