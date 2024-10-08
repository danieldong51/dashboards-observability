/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiAccordion,
  EuiSmallButton,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import {
  queryWorkbenchPluginCheck,
  queryWorkbenchPluginID,
} from '../../../../../../../../common/constants/shared';
import { CreateAccelerationForm } from '../../../../../../../../common/types/data_connections';
import { coreRefs } from '../../../../../../../framework/core_refs';
import { useToast } from '../../../../../../common/toast';
import { formValidator, hasError } from '../create/utils';
import { accelerationQueryBuilder } from '../visual_editors/query_builder';

interface PreviewSQLDefinitionProps {
  accelerationFormData: CreateAccelerationForm;
  setAccelerationFormData: React.Dispatch<React.SetStateAction<CreateAccelerationForm>>;
  resetFlyout: () => void;
}

export const PreviewSQLDefinition = ({
  accelerationFormData,
  setAccelerationFormData,
  resetFlyout,
}: PreviewSQLDefinitionProps) => {
  const { setToast } = useToast();
  const [isPreviewStale, setIsPreviewStale] = useState(false);
  const [isPreviewTriggered, setIsPreviewTriggered] = useState(false);
  const [sqlCode, setSQLcode] = useState('');
  const [sqlWorkbenchPLuginExists, setSQLWorkbenchPluginExists] = useState(false);

  const checkForErrors = () => {
    const errors = formValidator(accelerationFormData);
    if (hasError(errors)) {
      setAccelerationFormData({ ...accelerationFormData, formErrors: errors });
      return true;
    } else return false;
  };

  const onClickPreview = () => {
    if (checkForErrors()) {
      return;
    }
    setSQLcode(accelerationQueryBuilder(accelerationFormData));
    setIsPreviewStale(false);
    setIsPreviewTriggered(true);
  };

  const checkIfSQLWorkbenchPluginIsInstalled = () => {
    fetch('../api/status', {
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
    })
      .then(function (response) {
        return response.json();
      })
      .then((data) => {
        for (let i = 0; i < data.status.statuses.length; ++i) {
          if (data.status.statuses[i].id.includes(queryWorkbenchPluginCheck)) {
            setSQLWorkbenchPluginExists(true);
          }
        }
      })
      .catch((error) => {
        setToast('Error checking Query Workbench Plugin Installation status.', 'danger');
        console.error(error);
      });
  };

  const openInWorkbench = () => {
    if (!checkForErrors()) {
      coreRefs?.application!.navigateToApp(queryWorkbenchPluginID, {
        path: `#/${accelerationFormData.dataSource}`,
        state: {
          language: 'sql',
          queryToRun: accelerationQueryBuilder(accelerationFormData),
        },
      });
      resetFlyout();
    }
  };

  const queryWorkbenchButton = sqlWorkbenchPLuginExists ? (
    <EuiSmallButton iconSide="right" onClick={openInWorkbench}>
      Edit in Query Workbench
    </EuiSmallButton>
  ) : (
    <></>
  );

  useEffect(() => {
    setIsPreviewStale(true);
  }, [accelerationFormData]);

  useEffect(() => {
    checkIfSQLWorkbenchPluginIsInstalled();
  }, []);

  return (
    <>
      <EuiAccordion
        id="accordion1"
        buttonContent={
          <EuiText data-test-subj="preview-sql-header">
            <h3>Preview SQL definition</h3>
          </EuiText>
        }
        paddingSize="l"
      >
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            {isPreviewStale && isPreviewTriggered ? (
              <EuiSmallButton
                iconType="kqlFunction"
                iconSide="left"
                color="success"
                onClick={onClickPreview}
              >
                Update preview
              </EuiSmallButton>
            ) : (
              <EuiSmallButton color="success" onClick={onClickPreview}>
                Generate preview
              </EuiSmallButton>
            )}
          </EuiFlexItem>
          <EuiFlexItem grow={false}>{queryWorkbenchButton}</EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="l" />
        <EuiCodeBlock language="sql" fontSize="m" paddingSize="m" isCopyable>
          {sqlCode}
        </EuiCodeBlock>
      </EuiAccordion>
    </>
  );
};
