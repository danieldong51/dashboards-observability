/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimpleSavedObject } from '../../../../src/core/public';
import { SavedObjectDashboard } from '../../../../src/plugins/dashboard/public';

export interface DashboardState {
  startDate: string;
  endDate: string;
  dashboardTitle: string;
  dashboardId: string;
}

export interface DashboardSavedObjectsType {
  [key: string]: {
    value: string;
    label: string;
    startDate: string;
    endDate: string;
    references: SimpleSavedObject<SavedObjectDashboard>;
  };
}
