<script setup lang="ts">
import { computed, ref } from 'vue';
import { UserFavoriteType } from '@/app/com/apiGenerated';
import iconStarSolid from '@/assets/ui/starSolid.svg';
import iconStarHollow from '@/assets/ui/starHollow.svg';
import UserFavoriteGroupPrompt from './UserFavoriteGroupPrompt.vue';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { storeToRefs } from 'pinia';

const props = defineProps<{
    type: UserFavoriteType,
    objectId: number,
    isFavorited?: boolean
}>()

const emit = defineEmits<{
    (e: 'updated', isFavorited: boolean): void
}>()

const { userInfo } = storeToRefs(useUserInfoStore())
const showPrompt = ref(false)
const override = ref<boolean | undefined>(undefined)
const displayFavorited = computed(() => override.value ?? props.isFavorited ?? false)

function handleUpdated(newIsFavorited: boolean) {
    override.value = newIsFavorited
    emit('updated', newIsFavorited)
}
</script>

<template>
    <span v-if="userInfo.id" class="user-favorite-star-wrap">
        <img
            class="user-favorite-star"
            :src="displayFavorited ? iconStarSolid : iconStarHollow"
            @click.stop="showPrompt = true"
        />
        <UserFavoriteGroupPrompt
            v-if="showPrompt"
            :type="type"
            :objectId="objectId"
            :show="showPrompt"
            @close="showPrompt = false"
            @updated="handleUpdated"
        />
    </span>
</template>

<style lang="scss" scoped>
.user-favorite-star-wrap{
    display: inline-block;
    line-height: 0;
}
.user-favorite-star{
    width: 20px;
    height: 20px;
    padding: 6px;
    object-fit: contain;
    cursor: pointer;
    &:hover{
        filter: brightness(0.7);
    }
}
</style>
