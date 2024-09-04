/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimpleSavedObject } from '../../../../../../src/core/public';
import { SavedObjectDashboard } from '../../../../../../src/plugins/dashboard/public';
import { DashboardContainerInput } from '../../../../../../src/plugins/dashboard/public/application/embeddable/dashboard_container';

export const dashboardInput = (dashboardObject: SimpleSavedObject<SavedObjectDashboard>) => {
  const panels: DashboardContainerInput['panels'] = {};

  const references = dashboardObject.references;
  const savedObject = dashboardObject.attributes;
  if (savedObject.panelsJSON && typeof savedObject.panelsJSON === 'string') {
    const dashboardPanels = JSON.parse(savedObject.panelsJSON);
    if (Array.isArray(dashboardPanels)) {
      dashboardPanels.forEach((panel) => {
        if (!panel.panelRefName) {
          return;
        }
        const reference = references.find((ref) => ref.name === panel.panelRefName);
        if (reference) {
          panels[reference.id] = {
            gridData: { ...panel.gridData, i: reference.id },
            type: reference.type,
            explicitInput: {
              id: reference.id,
              savedObjectId: reference.id,
            },
          };
        }
      });
    }
  }

  const input: DashboardContainerInput = {
    panels,
    id: 'id',
    title: '',
    viewMode: 'view',
    useMargins: true,
    isFullScreenMode: false,
    filters: [],
    timeRange: {
      to: 'now',
      from: 'now-7d',
    },
    query: {
      query: '',
      language: 'kuery',
    },
    refreshConfig: {
      pause: true,
      value: 15,
    },
  };

  return input;
};
