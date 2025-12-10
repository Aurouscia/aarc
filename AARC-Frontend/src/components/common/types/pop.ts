export type BoxType = "success"|"failed"|"warning"|"info"
export type PopCallback = (msg: string, type: BoxType) => void;