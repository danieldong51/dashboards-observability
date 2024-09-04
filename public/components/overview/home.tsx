/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiText } from '@elastic/eui';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';
import { alertsPluginID, anomalyPluginID } from '../../../common/constants/overview';
import { DashboardSavedObjectsType } from '../../../common/types/overview';
import { setNavBreadCrumbs } from '../../../common/utils/set_nav_bread_crumbs';
import { coreRefs } from '../../framework/core_refs';
import { HOME_CONTENT_AREAS, HOME_PAGE_ID } from '../../plugin_helpers/plugin_overview';
import { cardConfigs, GettingStartedConfig } from './components/card_configs';
import { DashboardControls } from './components/dashboard_controls';
import { ObsDashboardStateManager } from './components/obs_dashboard_state_manager';
import { SelectDashboardFlyout } from './components/select_dashboard_flyout';
import { getObservabilityDashboardsId, setObservabilityDashboardsId } from './components/utils';
import './index.scss';
import { EmbeddableInput, EmbeddableRenderer } from '../../../../../src/plugins/embeddable/public';
import { dashboardInput } from './components/dashboard_input';

export const Home = () => {
  const [homePage, setHomePage] = useState<ReactNode>(<></>);
  const [dashboardsSavedObjects, setDashboardsSavedObjects] = useState<DashboardSavedObjectsType>(
    {}
  );
  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  ObsDashboardStateManager.showFlyout$.next(() => () => setIsFlyoutVisible(true));

  const loadHomePage = () => {
    setHomePage(coreRefs.contentManagement?.renderPage(HOME_PAGE_ID));
  };

  const registerCards = async () => {
    let alertsPluginExists = false;
    let anomalyPluginExists = false;
    try {
      const res = await coreRefs.http?.get('/api/status');
      if (res) {
        for (const status of res.status.statuses) {
          if (status.id.includes(alertsPluginID)) {
            alertsPluginExists = true;
          }
          if (status.id.includes(anomalyPluginID)) {
            anomalyPluginExists = true;
          }
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
            onClick: () => coreRefs.application?.navigateToApp(card.url, { path: '#/' }),
            getFooter: () => {
              return (
                <EuiText size="s" textAlign="center">
                  {card.footer}
                </EuiText>
              );
            },
          }),
          getTargetArea: () => HOME_CONTENT_AREAS.GET_STARTED,
        });
      });
  };

  const registerDashboardsControl = () => {
    coreRefs.contentManagement?.registerContentProvider({
      id: 'dashboards_controls',
      getContent: () => ({
        id: 'dashboards_controls',
        kind: 'custom',
        order: 1000,
        render: () => <DashboardControls />,
      }),
      getTargetArea: () => HOME_CONTENT_AREAS.SELECTOR,
    });
  };

  const loadDashboardsState = () => {
    coreRefs.savedObjectsClient
      ?.find({
        type: 'dashboard',
      })
      .then((response) => {
        console.log(response);
        const savedDashboards = response.savedObjects.reduce((acc, savedDashboard) => {
          const dashboardAttributes = savedDashboard.attributes as {
            title: string;
            timeFrom: string;
            timeTo: string;
          };
          const id = savedDashboard.id.toString();
          acc[id] = {
            value: id,
            label: dashboardAttributes.title,
            startDate: dashboardAttributes.timeFrom,
            endDate: dashboardAttributes.timeTo,
            references: savedDashboard,
          };
          return acc;
        }, {} as DashboardSavedObjectsType);

        setDashboardsSavedObjects(savedDashboards);
        const defaultDashboard = getObservabilityDashboardsId();

        if (defaultDashboard in savedDashboards) {
          ObsDashboardStateManager.dashboardState$.next({
            dashboardTitle: savedDashboards[defaultDashboard].label,
            dashboardId: defaultDashboard,
            startDate: savedDashboards[defaultDashboard].startDate ?? 'now-7d',
            endDate: savedDashboards[defaultDashboard].endDate ?? 'now',
          });
          ObsDashboardStateManager.isDashboardSelected$.next(true);
        } else {
          setObservabilityDashboardsId(null);
          ObsDashboardStateManager.dashboardState$.next({
            startDate: '',
            endDate: '',
            dashboardTitle: '',
            dashboardId: '',
          });
          ObsDashboardStateManager.isDashboardSelected$.next(false);
        }
      })
      .catch((error) => {
        console.error('Error fetching dashboards:', error);
      });
  };

  const flyout = isFlyoutVisible && (
    <SelectDashboardFlyout
      closeFlyout={() => setIsFlyoutVisible(false)}
      dashboardsSavedObjects={dashboardsSavedObjects}
      reloadPage={loadDashboardsState}
    />
  );

  useEffect(() => {
    registerCards();
    registerDashboardsControl();
    loadHomePage();
    loadDashboard();
  }, [dashboardsSavedObjects]);

  useEffect(() => {
    setNavBreadCrumbs(
      [],
      [
        {
          text: 'Observability overview',
          href: '#/',
        },
      ]
    );
    loadDashboardsState();
  }, []);

  const ref = useRef(false);
  const [embeddable, setEmbeddable] = useState<EmbeddableInput | undefined>(undefined);

  const loadDashboard = () => {
    ref.current = true;
    if (!embeddable) {
      const id = getObservabilityDashboardsId();
      if (!dashboardsSavedObjects[id]) {
        return;
      }
      console.log(id);
      console.log(dashboardsSavedObjects[id]);

      setEmbeddable(dashboardInput(dashboardsSavedObjects[id].references));

      // @ts-ignore
      // const promise = coreRefs.embeddable
      //   ?.getEmbeddableFactory('dashboard')
      //   .create(dashboardsSavedObjects[id].references);
      //
      // if (promise) {
      //   promise.then((e) => {
      //     console.log(e);
      //     if (ref.current) {
      //       setEmbeddable(e);
      //     }
      //   });
      // }
    }
    return () => {
      ref.current = false;
    };
  };

  return (
    <div>
      <HashRouter>
        <Switch>
          <Route exact path="/">
            <div>
              {homePage}
              {coreRefs.embeddable && embeddable && (
                <EmbeddableRenderer
                  factory={coreRefs.embeddable.getEmbeddableFactory('dashboard')}
                  input={embeddable}
                />
              )}
              {flyout}
            </div>
          </Route>
        </Switch>
      </HashRouter>
    </div>
  );
};
