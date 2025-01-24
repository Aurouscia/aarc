import Color from "color"
import { ColorProcBase } from "./colorProc"

export class ColorProcTerrainTag extends ColorProcBase{
    protected convertColor(inputColor: string): string {
        const l = new Color(inputColor).luminosity()
        return l > 0.9 ? '#999' : 'white'
    }
}