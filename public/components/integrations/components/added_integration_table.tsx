/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiInMemoryTable,
  EuiLink,
  EuiOverlayMask,
  EuiPageContent,
  EuiSpacer,
  EuiTableFieldDataColumnType,
  EuiText,
} from '@elastic/eui';
import truncate from 'lodash/truncate';
import React, { useState } from 'react';
import { INTEGRATIONS_BASE } from '../../../../common/constants/shared';
import { DeleteModal } from '../../../../public/components/common/helpers/delete_modal';
import { useToast } from '../../../../public/components/common/toast';
import {
  AddedIntegrationType,
  AddedIntegrationsTableProps,
} from './added_integration_overview_page';

export function AddedIntegrationsTable(props: AddedIntegrationsTableProps) {
  const { http, dataSourceEnabled } = props;

  const { setToast } = useToast();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLayout, setModalLayout] = useState(<EuiOverlayMask />);

  const tableColumns = [
    {
      field: 'name',
      name: 'Integration Name',
      sortable: true,
      truncateText: true,
      render: (value, record) => (
        <EuiLink data-test-subj={`${record.name}IntegrationLink`} href={`#/installed/${record.id}`}>
          {truncate(record.name, { length: 100 })}
        </EuiLink>
      ),
    },
    {
      field: 'source',
      name: 'Source',
      sortable: true,
      truncateText: true,
      render: (value, record) => (
        <EuiLink
          data-test-subj={`${record.templateName}IntegrationDescription`}
          href={`#/available/${record.templateName}`}
        >
          {truncate(record.templateName, { length: 100 })}
        </EuiLink>
      ),
    },
    {
      field: 'dateAdded',
      name: 'Date Added',
      sortable: true,
      truncateText: true,
      render: (value, record) => (
        <EuiText data-test-subj={`${record.templateName}IntegrationDescription`}>
          {truncate(record.creationDate, { length: 100 })}
        </EuiText>
      ),
    },
    {
      field: 'actions',
      name: 'Actions',
      sortable: true,
      truncateText: true,
      render: (value, record) => (
        <EuiIcon
          type={'trash'}
          onClick={() => {
            activateDeleteModal(record.id, record.name);
          }}
        />
      ),
    },
  ] as Array<EuiTableFieldDataColumnType<AddedIntegrationType>>;

  if (dataSourceEnabled) {
    tableColumns.splice(1, 0, {
      field: 'dataSourceName',
      name: 'Data Source Name',
      sortable: true,
      truncateText: true,
      render: (value, record) => (
        <EuiText data-test-subj={`${record.templateName}IntegrationDescription`}>
          {truncate(record.dataSourceMDSLabel || 'Local cluster', { length: 100 })}
        </EuiText>
      ),
    });
  }

  async function deleteAddedIntegration(integrationInstance: string, name: string) {
    http
      .delete(`${INTEGRATIONS_BASE}/store/${integrationInstance}`)
      .then(() => {
        setToast(`${name} integration successfully deleted!`, 'success');
        props.setData({
          hits: props.data.hits.filter((i) => i.id !== integrationInstance),
        });
      })
      .catch((_err) => {
        setToast(`Error deleting ${name} or its assets`, 'danger');
      })
      .finally(() => {
        window.location.hash = '#/installed';
      });
  }

  const activateDeleteModal = (integrationInstanceId: string, name: string) => {
    setModalLayout(
      <DeleteModal
        onConfirm={() => {
          setIsModalVisible(false);
          deleteAddedIntegration(integrationInstanceId, name);
        }}
        onCancel={() => {
          setIsModalVisible(false);
        }}
        title={`Delete Integration`}
        message={`Are you sure you want to delete the selected integration?`}
        prompt={name}
      />
    );
    setIsModalVisible(true);
  };
  const integTemplateNames = [...new Set(props.data.hits.map((i) => i.templateName))].sort();
  let mdsLabels;
  if (dataSourceEnabled) {
    mdsLabels = [
      ...new Set(
        props.data.hits.flatMap((hit) =>
          hit.references?.length > 0 ? hit.references.map((ref) => ref.name || 'Local cluster') : []
        )
      ),
    ].sort();
  }

  const search = {
    box: {
      incremental: true,
      compressed: true,
    },
    filters: [
      {
        type: 'field_value_selection' as const,
        field: 'templateName',
        name: 'Type',
        multiSelect: false,
        options: integTemplateNames.map((name) => ({
          name,
          value: name,
          view: name,
        })),
      },
      ...(dataSourceEnabled
        ? [
            {
              type: 'field_value_selection' as const,
              field: 'dataSourceMDSLabel',
              name: 'Data Source Name',
              multiSelect: false,
              options: mdsLabels?.map((name) => ({
                name,
                value: name,
                view: name,
              })),
            },
          ]
        : []),
    ].map((filter) => ({
      ...filter,
      compressed: true,
    })),
  };

  const entries = props.data.hits.map((integration) => {
    const id = integration.id;
    const templateName = integration.templateName;
    const creationDate = integration.creationDate;
    const name = integration.name;
    const dataSourceMDSLabel = integration.references
      ? integration.references[0].name
      : 'Local cluster';
    return {
      id,
      templateName,
      creationDate,
      name,
      data: { templateName, name },
      dataSourceMDSLabel,
    };
  });

  return (
    <EuiPageContent data-test-subj="addedIntegrationsArea">
      {entries && entries.length > 0 ? (
        <EuiInMemoryTable
          loading={props.loading}
          items={entries}
          itemId="id"
          columns={tableColumns}
          tableLayout="auto"
          pagination={{
            initialPageSize: 10,
            pageSizeOptions: [5, 10, 15],
          }}
          search={search}
          allowNeutralSort={false}
          isSelectable={true}
        />
      ) : (
        <>
          <EuiFlexGroup direction="column" alignItems="center">
            <EuiFlexItem grow={true}>
              <EuiIcon size="xxl" type="help" />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer />
          <EuiText textAlign="center" data-test-subj="no-added-integrations">
            <h2>
              There are currently no added integrations. Add them{' '}
              <EuiLink href={'#/available'}>here</EuiLink> to start using pre-canned assets!
            </h2>
          </EuiText>
          <EuiSpacer size="m" />
        </>
      )}
      {isModalVisible && modalLayout}
    </EuiPageContent>
  );
}
