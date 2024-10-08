<script lang="ts">
import { faFolderOpen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { getDisplayName } from '/@/utils/versionControlUtils';
import Fa from 'svelte-fa';
import { studioClient } from '/@/utils/client';
import { catalog } from '/@/stores/catalog';
import VSCodeIcon from '/@/lib/images/VSCodeIcon.svelte';
import { localRepositories } from '../stores/localRepositories';
import { findLocalRepositoryByRecipeId } from '/@/utils/localRepositoriesUtils';
import { Button } from '@podman-desktop/ui-svelte';

export let recipeId: string;

$: recipe = $catalog.recipes.find(r => r.id === recipeId);

$: localPath = findLocalRepositoryByRecipeId($localRepositories, recipeId);

const onClickRepository = (): void => {
  if (!recipe) return;

  studioClient.openURL(recipe.repository).catch((err: unknown) => {
    console.error('Something went wrong while opening url', err);
  });
};

const openVSCode = (): void => {
  if (localPath) {
    studioClient.openVSCode(localPath.sourcePath, recipe?.id).catch(err => console.error('Error opening VSCode:', err));
  }
};

const openLocalClone = (): void => {
  if (localPath) {
    studioClient.openFile(localPath.path).catch(err => console.error('Error opening local clone:', err));
  }
};

const deleteLocalClone = (): void => {
  if (localPath) {
    studioClient
      .requestDeleteLocalRepository(localPath.path)
      .catch(err => console.error(`Error deleting local repository ${localPath.path}:`, err));
  }
};
</script>

<div class="flex flex-col w-full space-y-4 rounded-md bg-[var(--pd-content-bg)] p-4">
  <div class="flex flex-col w-full space-y-2 w-[45px]">
    <div class="text-lg">Repository</div>
    <div class="cursor-pointer flex flex-col w-full space-y-2 text-nowrap">
      <button on:click={onClickRepository}>
        <div class="flex flex-row p-0 m-0 bg-transparent items-center space-x-2">
          <Fa size="lg" icon={faGithub} />
          <span>{getDisplayName(recipe?.repository)}</span>
        </div>
      </button>
      {#if localPath}
        <div class="flex flex-row w-full justify-between">
          <button on:click={openLocalClone} aria-label="Local clone">
            <div class="flex flex-row p-0 m-0 bg-transparent items-center space-x-2">
              <Fa size="lg" icon={faFolderOpen} />
              <span>Local clone</span>
            </div>
          </button>
          <Button title="Delete local clone" class="text-sm" on:click={deleteLocalClone} icon={faTrash} />
        </div>
      {/if}
    </div>
  </div>
  {#if localPath}
    <Button type="secondary" on:click={openVSCode} title="Open in VS Code Desktop" icon={VSCodeIcon}
      >Open in VSCode</Button>
  {/if}
</div>
