/**********************************************************************
 * Copyright (C) 2024-2025 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import { beforeEach, expect, test, vi } from 'vitest';
import { clearRpcChannelList, createRpcChannel, RpcBrowser } from '@shared/messages/MessageProxy';
import { RPCReadable } from './rpcReadable';
import { studioClient, rpcBrowser } from '../utils/client';
import type { ModelInfo } from '@shared/models/IModelInfo';

const mocks = vi.hoisted(() => {
  return {
    getModelsInfoMock: vi.fn().mockResolvedValue([]),
  };
});

vi.mock('../utils/client', async () => {
  const window = {
    addEventListener: (_: string, _f: (message: unknown) => void) => {},
  } as unknown as Window;

  const api = {
    postMessage: (message: unknown) => {
      if (message && typeof message === 'object' && 'channel' in message) {
        const f = rpcBrowser.subscribers.get(message.channel as string);
        f?.forEach(listener => listener(''));
      }
    },
  } as unknown as PodmanDesktopApi;

  const rpcBrowser = new RpcBrowser(window, api);

  return {
    rpcBrowser: rpcBrowser,
    studioClient: {
      getModelsInfo: mocks.getModelsInfoMock,
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

test('check updater is called once at subscription', async () => {
  const rpcChannel = createRpcChannel<string[]>('event1');
  const rpcWritable = RPCReadable<string[]>([], rpcChannel, async () => {
    await studioClient.getModelsInfo();
    return Promise.resolve(['']);
  });
  rpcWritable.subscribe(_ => {});
  expect(mocks.getModelsInfoMock).toHaveBeenCalledOnce();
});

test('check updater is called twice if there is one event fired', async () => {
  const channelModel = createRpcChannel<string[]>('event2');
  clearRpcChannelList();
  const channel = createRpcChannel<Update>('event2');
  type Update = {
    event: () => Promise<string[]>;
  };

  const rpcWritable = RPCReadable<string[]>([], channelModel, () => {
    console.log('being called');
    studioClient.getModelsInfo().catch((err: unknown) => console.error(err));
    return Promise.resolve(['']);
  });
  rpcWritable.subscribe(_ => {});

  // get proxy
  const proxy = rpcBrowser.getProxy<Update>(channel);

  proxy.event().catch((err: unknown) => console.error(err));
  // wait for the timeout in the debouncer
  await new Promise(resolve => setTimeout(resolve, 600));
  expect(mocks.getModelsInfoMock).toHaveBeenCalledTimes(2);
});

test('check updater is called only twice because of the debouncer if there is more than one event in a row', async () => {
  const channelModel = createRpcChannel<ModelInfo[]>('event3');
  clearRpcChannelList();
  const channel = createRpcChannel<Update>('event3');
  type Update = {
    event: () => Promise<string[]>;
  };

  const rpcWritable = RPCReadable<ModelInfo[]>([], channelModel, () => {
    return studioClient.getModelsInfo();
  });
  rpcWritable.subscribe(_ => {});

  // get proxy
  const proxy = rpcBrowser.getProxy<Update>(channel);

  proxy.event().catch((err: unknown) => console.error(err));
  proxy.event().catch((err: unknown) => console.error(err));
  proxy.event().catch((err: unknown) => console.error(err));
  proxy.event().catch((err: unknown) => console.error(err));
  // wait for the timeout in the debouncer
  await new Promise(resolve => setTimeout(resolve, 600));
  expect(mocks.getModelsInfoMock).toHaveBeenCalledTimes(2);
});
