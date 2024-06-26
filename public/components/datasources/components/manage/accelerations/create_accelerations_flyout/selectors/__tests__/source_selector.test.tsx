/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/dom';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import toJson from 'enzyme-to-json';
import React from 'react';
import { coreMock } from '../../../../../../../../../../../src/core/public/mocks';
import { CreateAccelerationForm } from '../../../../../../../../../common/types/data_connections';
import {
  createAccelerationEmptyDataMock,
  mockDatasourcesQuery,
} from '../../../../../../../../../test/accelerations';
import { DataSourceSelector } from '../source_selector';

const coreStartMock = coreMock.createStart();

describe('Source selector components', () => {
  configure({ adapter: new Adapter() });

  it('renders source selector with default options', async () => {
    const accelerationFormData = createAccelerationEmptyDataMock;
    const selectedDatasource = 'my_glue';
    const setAccelerationFormData = jest.fn();
    const client = coreStartMock.http;
    client.get = jest.fn().mockResolvedValue(mockDatasourcesQuery);

    const wrapper = mount(
      <DataSourceSelector
        http={client}
        selectedDatasource={selectedDatasource}
        dataSourceFormProps={{
          formType: 'CreateAcceleration',
          dataSourceFormData: accelerationFormData,
          setDataSourceFormData: setAccelerationFormData,
        }}
        dataSourcesPreselected={false}
        tableFieldsLoading={false}
      />
    );
    wrapper.update();
    await waitFor(() => {
      expect(
        toJson(wrapper, {
          noKey: false,
          mode: 'deep',
        })
      ).toMatchSnapshot();
    });
  });

  it('renders source selector with different options', async () => {
    const selectedDatasource = 'ds';
    const accelerationFormData: CreateAccelerationForm = {
      ...createAccelerationEmptyDataMock,
      dataSource: 'ds',
      database: 'db',
      dataTable: 'tb',
    };
    const setAccelerationFormData = jest.fn();
    const client = coreStartMock.http;
    client.get = jest.fn().mockResolvedValue(mockDatasourcesQuery);
    client.post = jest.fn().mockResolvedValue([]);
    const wrapper = mount(
      <DataSourceSelector
        selectedDatasource={selectedDatasource}
        http={client}
        dataSourceFormProps={{
          formType: 'CreateAcceleration',
          dataSourceFormData: accelerationFormData,
          setDataSourceFormData: setAccelerationFormData,
        }}
        dataSourcesPreselected={true}
        tableFieldsLoading={false}
      />
    );
    wrapper.update();
    await waitFor(() => {
      expect(
        toJson(wrapper, {
          noKey: false,
          mode: 'deep',
        })
      ).toMatchSnapshot();
    });
  });
});
