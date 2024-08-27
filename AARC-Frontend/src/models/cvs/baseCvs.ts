import { ref } from "vue";

export function useBaseCvs(){
    const cvs = ref<HTMLCanvasElement>()
    return { cvs }
}