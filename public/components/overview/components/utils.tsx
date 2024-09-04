/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { observabilityDashboardsKey } from '../../../../common/constants/overview';
import { uiSettingsService } from '../../../../common/utils';
import { DashboardStart } from '../../../../../../src/plugins/dashboard/public/plugin';
import { DashboardContainerInput } from '../../../../../../src/plugins/dashboard/public/application/embeddable/dashboard_container';

export const getObservabilityDashboardsId = () => {
  return uiSettingsService.get(observabilityDashboardsKey);
};

export const setObservabilityDashboardsId = (id: string | null) => {
  return uiSettingsService.set(observabilityDashboardsKey, id);
};

export const DashboardEmbeddableByValue = ({
  DashboardContainerByValueRenderer,
  initialInput,
}: {
  DashboardContainerByValueRenderer: DashboardStart['DashboardContainerByValueRenderer'];
  initialInput: DashboardContainerInput;
}) => {
  const [input, setInput] = useState(initialInput);

  return (
    <>
      <DashboardContainerByValueRenderer input={input} onInputUpdated={setInput} />
    </>
  );
};
