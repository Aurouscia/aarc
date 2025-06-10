//苹果系统：meta标签无法阻止缩放行为，只能通过各种preventDefault阻止
export function enforceNoScale(){
    document.addEventListener('touchstart', (event)=>{
        if (event.touches.length > 1) {
            event.preventDefault()
            console.log('阻止双指触摸')
        }
    })
    document.addEventListener('gesturestart', (event)=>{
        event.preventDefault()
        console.log('阻止手势')
    })
    var lastTouchEnd=0;
    document.addEventListener('touchend', (event)=>{
        var now = Date.now()
        if(now-lastTouchEnd <= 300){
            event.preventDefault();
            console.log('阻止触摸双击')
        }
        lastTouchEnd=now;
    }, false)
}