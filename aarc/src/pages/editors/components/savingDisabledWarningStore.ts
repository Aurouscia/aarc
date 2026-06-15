import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSavingDisabledWarningStore = defineStore('savingDisabledWarning', () => {
    const warning = ref<string>()
    const hide = ref<boolean>()
    const needToWarn = ref<boolean>()
    const notLogin = ref<boolean>()
    const editingUserId = ref<number>()

    function setWarning(msg: string, deferred = false) {
        warning.value = msg
        if (deferred) {
            hide.value = true
            needToWarn.value = true
        } else {
            hide.value = false
            needToWarn.value = false
        }
    }

    function clearWarning() {
        warning.value = undefined
        hide.value = undefined
        needToWarn.value = undefined
        notLogin.value = undefined
        editingUserId.value = undefined
    }

    function onFirstEdit() {
        if (needToWarn.value) {
            hide.value = false
            needToWarn.value = false
        }
    }

    function dismiss() {
        hide.value = true
    }

    return {
        warning, hide, needToWarn, notLogin, editingUserId,
        setWarning, clearWarning, onFirstEdit, dismiss
    }
})
