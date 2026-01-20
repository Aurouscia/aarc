export function enforceNoGesture(){
    window.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    });
    window.addEventListener('gesturechange', (e) => {
        e.preventDefault();
    })
    window.addEventListener('gestureend', (e) => {
        e.preventDefault();
    })
}