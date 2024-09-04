/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCard, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { coreRefs } from '../../../framework/core_refs';
import { alertsPluginID, anomalyPluginID } from '../../../../common/constants/overview';
import { cardConfigs } from './card_configs';

export const Cards = () => {
  const [alertsPluginExists, setAlertsPluginExists] = useState(false);
  const [anomalyPluginExists, setAnomalyPluginExists] = useState(false);
  const [loading, setLoading] = useState(true); // For loading state

  useEffect(() => {
    const registerCards = async () => {
      try {
        const res = await coreRefs.http?.get('/api/status');
        if (res) {
          for (const status of res.status.statuses) {
            if (status.id.includes(alertsPluginID)) {
              setAlertsPluginExists(true);
            }
            if (status.id.includes(anomalyPluginID)) {
              setAnomalyPluginExists(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking plugin installation status:', error);
      } finally {
        setLoading(false); // Set loading to false once the request is complete
      }
    };
    registerCards();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <EuiFlexGroup wrap={false} style={{ overflowX: 'auto' }}>
      {cardConfigs
        .filter((card) => {
          if (card.id === 'alerts') {
            return alertsPluginExists;
          } else if (card.id === 'anomaly') {
            return anomalyPluginExists;
          }
          return true;
        })
        .map((card, index) => (
          <EuiFlexItem key={index} style={{ minWidth: 200 }}>
            <EuiCard
              title={card.title}
              description={card.description}
              onClick={() => coreRefs.application?.navigateToApp(card.url, { path: '#/' })}
              footer={
                <EuiText textAlign="center" size="s">
                  {card.footer}
                </EuiText>
              }
              titleElement="h4"
              titleSize="s"
              textAlign="left"
            />
          </EuiFlexItem>
        ))}
    </EuiFlexGroup>
  );
};
