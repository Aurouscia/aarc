import Color from "color";
import { ColorProcBase } from "./colorProc";

export class ColorProcInvBinary extends ColorProcBase{
    protected convertColor(inputColor: string): string {
        return new Color(inputColor).isDark() ? 'white':'black'
    }
}