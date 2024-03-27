<script lang="ts">
import type { Task } from '@shared/src/models/ITask';
import { getApplicationStatus } from '../../../pages/applications';
import type { ApplicationState } from '@shared/src/models/IApplicationState';
import StatusIcon from '../../StatusIcon.svelte';
import PodIcon from '../../images/PodIcon.svelte';
export let object: ApplicationState;
let task: Task | undefined = undefined;
</script>

<StatusIcon size="{22}" status="{getApplicationStatus(object)}" icon="{PodIcon}" />
