export type AllFuncsReturnTypeOptional<T> = {
    [K in keyof T]: T[K] extends (...args: infer Args) => infer Rt
    ? (...args: Args) => 
        Rt extends Promise<infer PRt> 
        ? Promise<PRt|undefined>
        : Rt|undefined
    : T[K];
};

//以下为试验用

// type A = {
//     f1: ()=>undefined|string
//     f2: (a:number, b:string)=>string
//     f3: (c:number, d:object)=>RegExp
//     f4: (e:boolean)=>boolean
//     f3a: (c:number, d:object)=>Promise<RegExp>
//     f4a: (e:boolean)=>Promise<boolean>
//     str: string
//     bool: boolean
// }
// type B = AllFuncReturnTypeOptional<A>
// type F3aRt = ReturnType<B['f3a']>