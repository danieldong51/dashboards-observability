/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiComboBox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
} from '@elastic/eui';
import React from 'react';

interface Props {
  closeModal: () => void;
  dashboardIds: Array<{ value: string; label: string }>;
  selectedOptionsState: any[];
}
export function SelectDashboardModal({}: Props) {
  return (
    <EuiModal onClose={closeModal}>
      <EuiModalHeader>
        <div>Select Dashboard</div>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiComboBox
          placeholder="Select a dashboard"
          singleSelection={{ asPlainText: true }}
          options={dashboardIds}
          selectedOptions={selectedOptionsState}
          onChange={onComboBoxChange}
        />
      </EuiModalBody>
      <EuiModalFooter>
        <EuiFlexGroup justifyContent="center" gutterSize="m">
          <EuiFlexItem grow={false}>
            <EuiButton onClick={closeModal}>Cancel</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton onClick={onClickAdd} fill>
              Add
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiModalFooter>
    </EuiModal>
  );
}
