/**********************************************************************
 * Copyright (C) 2024 Red Hat, Inc.
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

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ApiServer } from './apiServer';
import request from 'supertest';
import type * as podmanDesktopApi from '@podman-desktop/api';
import path from 'path';
import type { Server } from 'http';

class TestApiServer extends ApiServer {
  public override getListener(): Server | undefined {
    return super.getListener();
  }
}

const extensionContext = {} as unknown as podmanDesktopApi.ExtensionContext;

let server: TestApiServer;

beforeEach(async () => {
  server = new TestApiServer(extensionContext);
  vi.spyOn(server, 'displayApiInfo').mockReturnValue();
  vi.spyOn(server, 'getSpecFile').mockReturnValue(path.join(__dirname, '../../../../api/openapi.yaml'));
  vi.spyOn(server, 'getPackageFile').mockReturnValue(path.join(__dirname, '../../../../package.json'));
  await server.init();
});

afterEach(() => {
  server.dispose();
});

test('/spec endpoint', async () => {
  expect(server.getListener()).toBeDefined();
  const res = await request(server.getListener()!)
    .get('/spec')
    .expect(200)
    .expect('Content-Type', 'application/yaml; charset=utf-8');
  expect(res.text).toMatch(/^openapi:/);
});

test('/spec endpoint when spec file is not found', async () => {
  expect(server.getListener()).toBeDefined();
  vi.spyOn(server, 'getSpecFile').mockReturnValue(path.join(__dirname, '../../../../api/openapi-notfound.yaml'));
  const res = await request(server.getListener()!).get('/spec').expect(500);
  expect(res.body.message).toEqual('unable to get spec');
});

test('/spec endpoint when getting spec file fails', async () => {
  expect(server.getListener()).toBeDefined();
  vi.spyOn(server, 'getSpecFile').mockImplementation(() => {
    throw 'an error getting spec file';
  });
  const res = await request(server.getListener()!).get('/spec').expect(500);
  expect(res.body.message).toEqual('unable to get spec');
  expect(res.body.errors[0]).toEqual('an error getting spec file');
});

test('/api/version endpoint', async () => {
  expect(server.getListener()).toBeDefined();
  const res = await request(server.getListener()!)
    .get('/api/version')
    .expect(200)
    .expect('Content-Type', 'application/json; charset=utf-8');
  expect(res.body.version).toBeDefined();
});

test('/api/version endpoint when package.json file is not found', async () => {
  expect(server.getListener()).toBeDefined();
  vi.spyOn(server, 'getPackageFile').mockReturnValue(path.join(__dirname, '../../../../package-notfound.json'));
  const res = await request(server.getListener()!).get('/api/version').expect(500);
  expect(res.body.message).toEqual('unable to get version');
});

test('/api/version endpoint when getting package.json file fails', async () => {
  expect(server.getListener()).toBeDefined();
  vi.spyOn(server, 'getPackageFile').mockImplementation(() => {
    throw 'an error getting package file';
  });
  const res = await request(server.getListener()!).get('/api/version').expect(500);
  expect(res.body.message).toEqual('unable to get version');
  expect(res.body.errors[0]).toEqual('an error getting package file');
});

test('/api/wrongEndpoint', async () => {
  expect(server.getListener()).toBeDefined();
  await request(server.getListener()!).get('/api/wrongEndpoint').expect(404);
});
