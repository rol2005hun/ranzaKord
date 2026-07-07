<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAuth } from '../../../auth/composables/useAuth';

const { currentUser, isAuthenticated, logout, fetchUser } = useAuth();
const toast = useToast();

const isPublicProfile = ref(true);
const showPlaylists = ref(true);

watch(
  () => currentUser.value,
  (user) => {
    if (user) {
      isPublicProfile.value = user.isPublicProfile ?? true;
      showPlaylists.value = user.showPlaylists ?? true;
    }
  },
  { immediate: true }
);

const updatePrivacySettings = async () => {
  try {
    await $fetch('/api/me/settings', {
      method: 'PATCH',
      body: {
        isPublicProfile: isPublicProfile.value,
        showPlaylists: showPlaylists.value
      }
    });
    await fetchUser();
    toast.success('Adatvédelmi beállítások elmentve');
  } catch {
    toast.danger('Hiba történt a mentés során');
  }
};
</script>

<template>
  <div class="settings-panel">
    <h2 class="settings-panel__title">{{ $t('settings.categories.account') }}</h2>

    <AppSettingsSection>
      <template v-if="isAuthenticated && currentUser">
        <div class="account-card">
          <img
            v-if="currentUser.picture"
            :src="currentUser.picture"
            alt="Avatar"
            class="account-card__avatar" />
          <div v-else class="account-card__avatar-placeholder">
            <AppIcon name="ph:user" />
          </div>
          <div class="account-card__info">
            <span class="account-card__label">{{ $t('settings.account.signedInAs') }}</span>
            <span class="account-card__name">{{ currentUser.name }}</span>
            <span class="account-card__email">{{ currentUser.email }}</span>
          </div>
          <AppButton variant="secondary" @click="logout">
            {{ $t('core.nav.signOut') }}
          </AppButton>
        </div>
      </template>

      <template v-else>
        <div class="account-empty">
          <AppIcon name="ph:user-circle" class="account-empty__icon" />
          <p class="account-empty__text">{{ $t('settings.account.noAccount') }}</p>
          <NuxtLink to="/login" class="account-empty__link">
            <AppButton variant="primary">
              {{ $t('nav.signIn') }}
            </AppButton>
          </NuxtLink>
        </div>
      </template>
    </AppSettingsSection>

    <template v-if="isAuthenticated && currentUser">
      <h2 class="settings-panel__title" style="margin-top: 2rem">Adatvédelem</h2>
      <AppSettingsSection>
        <AppSettingsItem
          title="Publikus profil"
          description="Mások megtekinthetik a profilodat és követhetnek téged">
          <AppToggle v-model="isPublicProfile" @update:model-value="updatePrivacySettings" />
        </AppSettingsItem>
        <AppSettingsItem
          title="Lejátszási listák mutatása"
          description="Mások láthatják a publikus lejátszási listáidat a profilodon">
          <AppToggle v-model="showPlaylists" @update:model-value="updatePrivacySettings" />
        </AppSettingsItem>
      </AppSettingsSection>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);

  &__title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-4);
  }
}

.account-card {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-6);

  &__avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
  }

  &__avatar-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: var(--color-surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);

    .icon {
      width: 32px;
      height: 32px;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  &__label {
    font-size: var(--text-xs);
    text-transform: uppercase;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-1);
    letter-spacing: 0.05em;
  }

  &__name {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }

  &__email {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
}

.account-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  gap: var(--space-4);
  text-align: center;

  &__icon {
    width: 64px;
    height: 64px;
    color: var(--color-text-secondary);
  }

  &__text {
    font-size: var(--text-base);
    color: var(--color-text-secondary);
  }

  &__link {
    text-decoration: none;
  }
}

@media (max-width: 768px) {
  .account-card {
    flex-direction: column;
    text-align: center;
    gap: var(--space-4);

    &__info {
      align-items: center;
    }
  }
}
</style>
