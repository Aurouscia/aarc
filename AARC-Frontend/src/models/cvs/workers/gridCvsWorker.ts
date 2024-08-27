import { simpleGrid } from "@/utils/grid";

export function useGridCvsWorker(){
    function renderGrid(ctx:CanvasRenderingContext2D){
        simpleGrid(ctx)
    }
    return { renderGrid }
}