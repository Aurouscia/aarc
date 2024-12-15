import Color from "color";
import { ColorProcBase } from "./colorProc";

//用 WCAG luminosity 找到该颜色的相反二元色（黑或白）确保高对比度
export class ColorProcInvBinary extends ColorProcBase{
    protected convertColor(inputColor: string): string {
        const l = new Color(inputColor).luminosity()
        return l < 0.7 ? 'white':'black'
    }
}