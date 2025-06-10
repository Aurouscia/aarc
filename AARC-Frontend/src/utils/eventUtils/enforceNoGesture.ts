export function enforceNoGesture(){
    document.addEventListener('gesturestart', (event)=>{
        event.preventDefault()
        console.log('阻止手势')
    })
}