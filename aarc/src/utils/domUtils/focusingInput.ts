export function isFocusingInput(){
    const ael = document.activeElement
    const focusingText = ael instanceof HTMLInputElement || ael instanceof HTMLTextAreaElement
    return focusingText
}