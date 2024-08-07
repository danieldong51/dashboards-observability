/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { HashRouter, RouteComponentProps, Switch, Route } from 'react-router-dom';
import { EuiText, EuiComboBoxOptionOption } from '@elastic/eui';
import moment from 'moment';
import { TraceAnalyticsCoreDeps } from '../trace_analytics/home';
import { ChromeBreadcrumb } from '../../../../../src/core/public';
import { coreRefs } from '../../framework/core_refs';
import { ContentManagementPluginStart } from '../../../../../src/plugins/content_management/public';
import { HOME_CONTENT_AREAS, HOME_PAGE_ID } from '../../plugin_helpers/plugin_overview';
import { cardConfigs, GettingStartedConfig } from './components/card_configs';
import { uiSettingsService } from '../../../common/utils';
import { AddDashboardCallout } from './components/add_dashboard_callout';
import { DatePicker } from './components/date_picker';
import { SelectDashboardModal } from './components/select_dashboard_modal';

// Plugin IDs
const alertsPluginID = 'alerting';
const anomalyPluginID = 'anomalyDetection';

export type AppAnalyticsCoreDeps = TraceAnalyticsCoreDeps;

interface HomeProps extends RouteComponentProps, AppAnalyticsCoreDeps {
  parentBreadcrumbs: ChromeBreadcrumb[];
  contentManagement: ContentManagementPluginStart;
}

let showModal;
let dashboardSelected;
let startDate;
let setStartDate;

coreRefs.contentManagement?.registerContentProvider({
  id: 'custom_content',
  getContent: () => ({
    id: 'custom_content',
    kind: 'custom',
    order: 1500,
    render: () =>
      dashboardSelected ? (
        <DatePicker startDate={startDate} setStartDate={setStartDate} showModal={showModal} />
      ) : (
        <AddDashboardCallout showModal={showModal} />
      ),
  }),
  getTargetArea: () => HOME_CONTENT_AREAS.SELECTOR,
});

export const Home = ({ ..._props }: HomeProps) => {
  const homepage = coreRefs.contentManagement?.renderPage(HOME_PAGE_ID);
  const [_, setIsRegistered] = useState(false);

  const [dashboardIds, setDashboardIds] = useState<Array<{ value: string; label: string }>>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOptionsState, setSelectedOptionsState] = useState<EuiComboBoxOptionOption[]>([]);
  [startDate, setStartDate] = useState(moment().toISOString());

  showModal = () => setIsModalVisible(true);
  closeModal = () => setIsModalVisible(false);

  const navigateToApp = (appId: string, path: string) => {
    coreRefs?.application!.navigateToApp(appId, {
      path: `${path}`,
    });
  };

  const onComboBoxChange = (options: EuiComboBoxOptionOption[]) => {
    setSelectedOptionsState(options);
  };

  const onClickAdd = () => {
    if (selectedOptionsState.length > 0) {
      dashboardSelected = true;
      uiSettingsService
        .set('observability:defaultDashboard', selectedOptionsState[0].value)
        .then(registerDashboard);
    }
    setIsModalVisible(false);
  };

  const registerCards = async () => {
    let alertsPluginExists = false;
    let anomalyPluginExists = false;

    try {
      const response = await fetch('../api/status', {
        headers: {
          'Content-Type': 'application/json',
          'osd-xsrf': 'true',
          'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,zh-TW;q=0.6',
          pragma: 'no-cache',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
        },
        method: 'GET',
        referrerPolicy: 'strict-origin-when-cross-origin',
        mode: 'cors',
        credentials: 'include',
      });
      const data = await response.json();

      for (const status of data.status.statuses) {
        if (status.id.includes(alertsPluginID)) {
          alertsPluginExists = true;
        }
        if (status.id.includes(anomalyPluginID)) {
          anomalyPluginExists = true;
        }
      }
    } catch (error) {
      console.error('Error checking plugin installation status:', error);
    }

    cardConfigs
      .filter((card) => {
        if (card.id === 'alerts') {
          return alertsPluginExists;
        } else if (card.id === 'anomaly') {
          return anomalyPluginExists;
        }
        return true;
      })
      .forEach((card: GettingStartedConfig) => {
        coreRefs.contentManagement?.registerContentProvider({
          id: card.id,
          getContent: () => ({
            id: card.id,
            kind: 'card',
            order: card.order,
            description: card.description,
            title: card.title,
            onClick: () => navigateToApp(card.url, '#/'),
            getIcon: () => {},
            getFooter: () => {
              return (
                <EuiText size="s" textAlign="left">
                  {card.footer}
                </EuiText>
              );
            },
          }),
          getTargetArea: () => HOME_CONTENT_AREAS.GET_STARTED,
        });
      });
  };

  const registerDashboard = () => {
    coreRefs.contentManagement?.registerContentProvider({
      id: 'dashboard_content',
      getContent: () => ({
        id: 'dashboard_content',
        kind: 'dashboard',
        order: 1000,
        input: {
          kind: 'dynamic',
          get: () => Promise.resolve(uiSettingsService.get('observability:defaultDashboard')),
        },
      }),
      getTargetArea: () => HOME_CONTENT_AREAS.DASHBOARD,
    });
    setIsRegistered(true);
  };

  useEffect(() => {
    registerCards();
    if (uiSettingsService.get('observability:defaultDashboard')) {
      dashboardSelected = true;
      registerDashboard();
    }
  }, []);

  useEffect(() => {
    coreRefs.savedObjectsClient
      ?.find({
        type: 'dashboard',
      })
      .then((response) => {
        const dashboards = response.savedObjects.map((dashboard) => ({
          value: dashboard.id.toString(),
          text: dashboard.get('title').toString(),
          label: dashboard.attributes.title,
        }));
        setDashboardIds(dashboards);
      })
      .catch((error) => {
        console.error('Error fetching dashboards:', error);
      });
  }, []);

  const modal = isModalVisible && (
    <SelectDashboardModal
      closeModal={() => setIsModalVisible(false)}
      dashboardSelected={dashboardSelected}
      dashboardIds={dashboardIds}
      selectedOptionsState={selectedOptionsState}
      onComboBoxChange={onComboBoxChange}
      onClickAdd={onClickAdd}
    />
  );

  return (
    <div>
      <HashRouter>
        <Switch>
          <Route exact path="/">
            {homepage}
            {modal}
          </Route>
        </Switch>
      </HashRouter>
    </div>
  );
};
