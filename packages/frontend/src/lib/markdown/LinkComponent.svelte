<script lang="ts">
import { studioClient } from '/@/utils/client.js';

export let href: string = '';
export let title: string | undefined = undefined;
export let text: string = '';

const onClick = (): void => {
  studioClient.openURL(href).catch(err => console.error(`Error opening link ${href}:`, err));
};
</script>

<!-- href set to void operator to avoid any redirect -->
<a href="javascript:void(0);" class="break-all" role="button" title={title} on:click={onClick}>{text}</a>
